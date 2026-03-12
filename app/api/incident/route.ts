import { NextRequest, NextResponse } from "next/server";
import { GoogleAuth } from "google-auth-library";
import { executorService } from "@/lib/executor-config";

export async function POST(req: NextRequest) {
  const { incident_slug, code, language, entryFile } = await req.json();

  if (!incident_slug) {
    return NextResponse.json(
      { message: "Cannot run incident without the incident slug" },
      { status: 400 }
    );
  }

  if (!language) {
    return NextResponse.json(
      { message: "Cannot run incident without any language selected" },
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

  const { incidentUrl, isDevelopment, targetAudience } = executorService.getConfig();

  const requestBody = {
    incidentName: incident_slug,
    userCode: code,
    language,
    entryFile,
  };

  try {
    const headers: Record<string, string> = {
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

    const response = await fetch(incidentUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        `Incident Execution Error: ${data?.error || "Unknown error"} (HTTP ${response.status})`
      );
    }

    const responseBody = {
      incidentName: data.incidentName,
      status: data.status,
      passed: data.passed,
      output: data.output,
      error: data.error,
    };

    return NextResponse.json(responseBody, { status: response.status });
  } catch (error: any) {
    console.error("Incident execution error:", error.message);
    return NextResponse.json(
      { message: "Some error occurred. Please try again later." },
      { status: 500 }
    );
  }
}