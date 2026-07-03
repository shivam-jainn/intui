import { NextRequest, NextResponse } from "next/server";
import { GoogleAuth } from "google-auth-library";
import { executorService } from "@/lib/executor-config";
import { prisma } from "@/prisma/db";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });

  const { question_slug, code, language } = await req.json();

  if (!question_slug) {
    return NextResponse.json(
      { message: "Missing question information. Please refresh the page and try again." },
      { status: 400 }
    );
  }
  if (!language) {
    return NextResponse.json(
      { message: "Please select a programming language before submitting your code." },
      { status: 400 }
    );
  }
  if (!code || typeof code !== "string" || code.length < 10) {
    return NextResponse.json(
      { message: "Your code is empty or too short. Please write some code before submitting." },
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

    // Save submission to DB if user is authenticated
    if (session?.user?.id) {
      try {
        const question = await prisma.question.findUnique({
          where: { slug: question_slug },
          select: { id: true }
        });

        if (question) {
          await prisma.submission.create({
            data: {
              questionId: question.id,
              userId: session.user.id,
              code,
              language,
              status: data.status || "Unknown",
              timeTaken: data.timeTaken ?? null,
              spaceTaken: data.memoryUsedKB ?? null,
            }
          });
        }
      } catch (dbError) {
        console.error("Failed to save submission to DB:", dbError);
      }
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
        { message: "An unexpected error occurred while submitting your code. Please try again." },
        { status: 500 }
      );
    }
  }
}
