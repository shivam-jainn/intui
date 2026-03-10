import { NextRequest, NextResponse } from "next/server";
import { GoogleAuth } from "google-auth-library";

function resolveExecutorUrl() {
  const configured = process.env.EXECUTOR_BASE_URL ?? process.env.GCR_Host;
  const localDefault = "http://127.0.0.1:8080";
  const base = process.env.NODE_ENV === "development" ? (configured ?? localDefault) : configured;

  if (!base) {
    return { error: "Configuration error: EXECUTOR_BASE_URL is not defined." };
  }

  return {
    base,
    executeUrl: `${base.replace(/\/$/, "")}/execute`,
  };
}

export async function POST(req: NextRequest) {
  const { question_name, code, language } = await req.json();

  if (!question_name) {
    return NextResponse.json(
      { message: "Cannot run code without the question name" },
      { status: 400 }
    );
  }

  if (!language) {
    return NextResponse.json(
      { message: "Cannot run code without any language selected" },
      { status: 400 }
    );
  }

  if (!code || typeof code !== "string" || code.length < 10) {
    return NextResponse.json(
      { message: "No valid code exists." },
      { status: 400 }
    );
  }

  const resolved = resolveExecutorUrl();
  if ("error" in resolved) {
    return NextResponse.json({ message: resolved.error }, { status: 500 });
  }

  const requestBody = {
    questionName: question_name,
    userCode: code,
    language: language,
    isSubmission: true,
  };

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (process.env.NODE_ENV !== "development") {
      if (!process.env.EXEC_CLIENT_EMAIL || !process.env.EXEC_PRIVATE_KEY) {
        return NextResponse.json(
          {
            message:
              "Configuration error: EXEC_CLIENT_EMAIL and EXEC_PRIVATE_KEY are required in production.",
          },
          { status: 500 }
        );
      }

      const targetAudience = resolved.base;
      const auth = new GoogleAuth({
        credentials: {
          client_email: process.env.EXEC_CLIENT_EMAIL,
          private_key: process.env.EXEC_PRIVATE_KEY.replace(/\\n/g, "\n"),
        },
      });
      const idTokenClient = await auth.getIdTokenClient(targetAudience);
      const idToken = await idTokenClient.idTokenProvider.fetchIdToken(targetAudience);
      headers["Authorization"] = `Bearer ${idToken}`;
    }

    const response = await fetch(resolved.executeUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
        const errorMessage = data?.error || "Unknown error occurred";
        throw new Error(`Execution Error: ${errorMessage} (HTTP ${response.status})`);
    }

    return NextResponse.json(
      { 
        message: data.message,
        results : data.results,
        timeTaken : data.timeTaken,
        memoryUsed : data.memoryUsedKB
      },
      { status: response.status }
    );
  } catch (error: any) {
    console.error("Execution error:", error.message);
    return NextResponse.json(
      { message: "Some error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
