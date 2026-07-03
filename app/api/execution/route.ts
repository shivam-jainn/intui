import { NextRequest, NextResponse } from "next/server";
import { GoogleAuth } from "google-auth-library";
import { executorService } from "@/lib/executor-config";

export async function POST(req: NextRequest) {
  const { question_slug, code, language } = await req.json();

  if (!question_slug) {
    return NextResponse.json(
      { message: "Missing question information. Please refresh the page and try again." },
      { status: 400 }
    );
  }
  if (!language) {
    return NextResponse.json(
      { message: "Please select a programming language before running your code." },
      { status: 400 }
    );
  }
  if (!code || typeof code !== "string" || code.length < 10) {
    return NextResponse.json(
      { message: "Your code is empty or too short. Please write some code before running." },
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

  console.log("url is ", url);

  const requestBody = {
    questionName: question_slug,
    userCode: code,
    language: language,
    isSubmission: false,
  };

  console.log("Request body:", requestBody);

  try {
    let headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (!isDevelopment) {
      console.log("Constructing headers ...");
      // IMPORTANT: Set the target audience to the base Cloud Run URL (without tags)
      if (!targetAudience) {
          throw new Error("Target audience must be defined for production execution authentication.");
      }

      const auth = new GoogleAuth({
        credentials: {
          client_email: process.env.EXEC_CLIENT_EMAIL,
          private_key: process.env.EXEC_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }      });

      // Use getIdTokenClient to obtain an ID token with the proper audience.
      const idTokenClient = await auth.getIdTokenClient(targetAudience);
      const idToken = await idTokenClient.idTokenProvider.fetchIdToken(targetAudience);

      headers["Authorization"] = `Bearer ${idToken}`;
      console.log("Headers done ...");
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    console.log("Response received from executor:", response);

    const data = await response.json();
    console.log(data)
    if (!response.ok) {
      throw new Error(
        `Execution Error: ${data?.error || "Unknown error"} (HTTP ${response.status})`
      );
    }

    return NextResponse.json(
      { 
        results: data.results,
        status: data.status,
        error: data.error
      },
      { status: response.status }
    );
  } catch (error: any) {
    console.error("Execution error:", error.message);
    if (error.message?.includes("Target audience")) {
      return NextResponse.json(
        { message: "Service configuration error. Please contact support." },
        { status: 500 }
      );
    } else if (error.message?.includes("fetch")) {
      return NextResponse.json(
        { message: "Unable to reach the execution service. Please try again later." },
        { status: 500 }
      );
    } else if (error.message?.includes("Execution Error:")) {
      const executionErrorMsg = error.message.replace("Execution Error: ", "").replace(/ \(HTTP \d+\)$/, "");
      return NextResponse.json(
        { message: executionErrorMsg },
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        { message: "An unexpected error occurred while running your code. Please try again." },
        { status: 500 }
      );
    }
  }
}
