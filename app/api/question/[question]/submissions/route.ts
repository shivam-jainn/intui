import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/prisma/db';
import { auth } from '@/lib/auth/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { question: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user?.id) {
      return NextResponse.json([]);
    }

    const question = await prisma.question.findUnique({
      where: { name: params.question },
      select: { id: true },
    });

    if (!question) {
      return NextResponse.json([]);
    }

    const submissions = await prisma.submission.findMany({
      where: {
        questionId: question.id,
        userId: session.user.id,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        language: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json(submissions);
  } catch {
    return NextResponse.json(
      { message: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}
