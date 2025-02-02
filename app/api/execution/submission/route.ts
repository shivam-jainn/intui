import { NextRequest, NextResponse } from "next/server";

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

  const gcr_url = `${process.env.GCR_Host}/execute`;
  const local_executor_url = `http://127.0.0.1:8080/execute`;
  const requestBody = {
    questionName: question_name,
    userCode: code,
    language: language,
    isSubmission : false
  };

  try {
    const response = await fetch(process.env.ENV_MODE === "development"?local_executor_url:gcr_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (process.env.ENV_MODE === "development") {
      console.log(data);
    }

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
    if (process.env.ENV_MODE === "development") {
      console.error("Execution error:", error.message);
    }
    return NextResponse.json(
      { message: "Some error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
