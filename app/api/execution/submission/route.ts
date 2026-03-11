import { NextRequest, NextResponse } from "next/server";
import { GoogleAuth } from "google-auth-library";
import { executorService } from "@/lib/executor-config";

export async function POST(req: NextRequest) {
  const { question_slug, code, language } = await req.json();

  if (!question_slug) {
    return NextResponse.json(
      { message: "Cannot run code without the question slug" },
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

  const { valid, message } = executorService.validateConfig();
  if (!valid) {
    return NextResponse.json(
      { message: message || "Configuration error." },
      { status: 500 }
    );
  }

  const { url, isDevelopment, targetAudience } = executorService.getConfig();

  const requestBody = {
    questionName: question_slug,
    userCode: code,
    language: language,
    isSubmission : true
  };

  try {
    let headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (!isDevelopment) {
      if (!targetAudience) {
          throw new Error("Target audience must be defined for production execution authentication.");
      }

      const auth = new GoogleAuth({
        credentials: {
          client_email: process.env.EXEC_CLIENT_EMAIL,
          private_key: process.env.EXEC_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }
      });

      const idTokenClient = await auth.getIdTokenClient(targetAudience);
      const idToken = await idTokenClient.idTokenProvider.fetchIdToken(targetAudience);

      headers["Authorization"] = `Bearer ${idToken}`;
    }

    const response = await fetch(url, {
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
        status: data.status,
        timeTaken : data.timeTaken,
        memoryUsed : data.memoryUsedKB
      },
      { status: response.status }
    );
  } catch (error: any) {
    console.error("Submission error:", error.message);
    return NextResponse.json(
      { message: error.message || "Some error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
