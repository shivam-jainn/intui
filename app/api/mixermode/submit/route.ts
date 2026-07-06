import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/prisma/db';
import { auth } from '@/lib/auth';
import { checkAndAwardMixerBadge } from '@/lib/badges';

export async function POST(req: NextRequest) {
  try {
    const { runId, userId, questionSlug } = await req.json();

    if (!runId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const run = await prisma.mixerRun.findUnique({ where: { id: runId } });

    if (!run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    // Resolve the real authenticated user ID if possible
    const session = await auth.api.getSession({ headers: req.headers });
    const realUserId = session?.user?.id || run.userId;

    const updated = await prisma.mixerRun.update({
      where: { id: runId },
      data: {
        status: 'submitted',
        submittedAt: new Date(),
        endedAt: new Date(),
      },
    });

    // Award custom mixer badge if we have a questionSlug and an authenticated user
    if (questionSlug && session?.user?.id) {
      const question = await prisma.question.findUnique({
        where: { slug: questionSlug },
        select: { name: true },
      });
      if (question) {
        await checkAndAwardMixerBadge(session.user.id, question.name);
      }
    }

    return NextResponse.json({ runId: updated.id, status: updated.status });
  } catch (error: any) {
    console.error("MIXER SUBMIT ROUTE ERROR:", error);
    return NextResponse.json({ error: 'Failed to submit mixer run' }, { status: 500 });
  }
}
