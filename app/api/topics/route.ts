import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/prisma/db';

// GET /api/topics — returns all topics with their question count
export async function GET(req: NextRequest) {
  try {
    const topics = await prisma.topic.findMany({
      include: {
        questions: {
          include: {
            question: {
              select: {
                id: true,
                name: true,
                difficulty: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Annotate each topic with question counts per status
    const enriched = topics.map((t) => ({
      id: t.id,
      name: t.name,
      questionCount: t.questions.length,
      todo: t.questions.filter((q) => q.question.status === 'TODO').length,
      inProgress: t.questions.filter((q) => q.question.status === 'IN_PROGRESS').length,
      done: t.questions.filter((q) => q.question.status === 'DONE').length,
    }));

    return NextResponse.json(enriched);
  } catch (error: any) {
    console.warn('prisma: failed to fetch topics:', error?.message?.split('\n')[0]);
    return NextResponse.json([]);
  }
}
