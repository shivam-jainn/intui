import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/prisma/db";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const questionSlug = searchParams.get("questionSlug");
  const incidentSlug = searchParams.get("incidentSlug");

  if (!questionSlug && !incidentSlug) {
    return NextResponse.json(
      { message: "Missing questionSlug or incidentSlug" },
      { status: 400 }
    );
  }

  try {
    let questionId: number | undefined;

    if (questionSlug) {
      const question = await prisma.question.findUnique({
        where: { slug: questionSlug },
      });
      if (question) {
        questionId = question.id;
      } else {
        return NextResponse.json({ submissions: [] });
      }
    }

    const submissions = await prisma.submission.findMany({
      where: {
        userId: session.user.id,
        ...(questionId ? { questionId } : {}),
        ...(incidentSlug ? { incidentSlug } : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });

    return NextResponse.json({ submissions });
  } catch (error: any) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { message: "Failed to fetch submissions." },
      { status: 500 }
    );
  }
}
