import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/prisma/db';

export async function GET(
  req: NextRequest,
) {
  try {
    const { searchParams } = new URL(req.url);
    const topic = searchParams.get('topic');

    const questionObject = await prisma.question.findMany({
      where: topic
        ? { topics: { some: { topic: { name: topic } } } }
        : undefined,
      include: {
        topics: { include: { topic: true } },
        companies: { include: { company: true } },
      },
      orderBy: { id: 'asc' },
    });

    return NextResponse.json(questionObject);
  } catch (error: any) {
    console.warn('prisma: failed to fetch questions — returning empty list. Reason:', (error && error.message) ? error.message.split('\n')[0] : error);
    return NextResponse.json([]);
  }
}
