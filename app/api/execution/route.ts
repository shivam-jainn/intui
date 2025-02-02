import { NextRequest, NextResponse } from "next/server";
import { GoogleAuth } from "google-auth-library";

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
  if (!process.env.GCR_Host) {
    return NextResponse.json(
      { message: "Configuration error: GCR Host is not defined." },
      { status: 500 }
    );
  }

  // Use Cloud Run URL for production; local URL for development.
  const gcr_url = `${process.env.GCR_Host}/execute`;
  const local_executor_url = `http://127.0.0.1:8080/execute`;
  const url = process.env.ENV_MODE === "development" ? local_executor_url : gcr_url;

  const requestBody = {
    questionName: question_name,
    userCode: code,
    language: language,
    isSubmission: false,
  };
  
  try {
    let headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (process.env.ENV_MODE !== "development") {
      console.log("Constructing headers ...");
      // IMPORTANT: Set the target audience to the base Cloud Run URL (without tags)
      const targetAudience = process.env.GCR_Host;

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

    const data = await response.json();
    console.log(data)
    if (!response.ok) {
      throw new Error(
        `Execution Error: ${data?.error || "Unknown error"} (HTTP ${response.status})`
      );
    }

    return NextResponse.json(
      { results: data.results },
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
