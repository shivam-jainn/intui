import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/prisma/db';

export async function POST(req: NextRequest) {
  try {
    const { userId, difficulty, duration } = await req.json();

    if (!userId || !difficulty || !duration) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const run = await prisma.mixerRun.create({
      data: {
        userId,
        difficulty,
        duration,
        status: 'running',
      },
    });

    return NextResponse.json({ runId: run.id, status: run.status });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to start mixer run' }, { status: 500 });
  }
}
