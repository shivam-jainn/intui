import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/prisma/db";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  const questionSlug = req.nextUrl.searchParams.get("question");

  if (!questionSlug) {
    return NextResponse.json({ message: "question is required" }, { status: 400 });
  }

  const session = await auth.api.getSession({
    headers: headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const question = await prisma.question.findUnique({
    where: { slug: questionSlug },
    select: { id: true },
  });

  if (!question) {
    return NextResponse.json({ message: "Question not found" }, { status: 404 });
  }

  const submissions = await prisma.submission.findMany({
    where: {
      questionId: question.id,
      userId: session.user.id,
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return NextResponse.json({ submissions });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const questionSlug = body?.question_slug;
  const code = body?.code;
  const language = body?.language;
  const status = body?.status;

  if (!questionSlug || !code || !language || !status) {
    return NextResponse.json(
      { message: "question_slug, code, language, and status are required" },
      { status: 400 }
    );
  }

  const session = await auth.api.getSession({
    headers: headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const question = await prisma.question.findUnique({
    where: { slug: questionSlug },
    select: { id: true },
  });

  if (!question) {
    return NextResponse.json({ message: "Question not found" }, { status: 404 });
  }

  const submission = await prisma.submission.create({
    data: {
      questionId: question.id,
      userId: session.user.id,
      code,
      language,
      status,
    },
  });

  return NextResponse.json({ submission }, { status: 201 });
}
