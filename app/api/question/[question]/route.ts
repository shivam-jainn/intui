import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/prisma/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ question: string }> }) {
  const { question } = await params;

  const questionObject = await prisma.question.findUnique({
    where: {
      slug: question,
    },
    include: {
      topics: {
        include: {
          topic: true,
        },
      },
      Submission: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  return NextResponse.json(questionObject);
}
