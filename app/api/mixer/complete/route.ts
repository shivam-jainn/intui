import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/prisma/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await request.json();

    const mixerSession = await prisma.mixerSession.findUnique({
      where: { id: sessionId },
    });

    if (!mixerSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (mixerSession.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updatedSession = await prisma.mixerSession.update({
      where: { id: sessionId },
      data: {
        status: 'cleared',
        streak: { increment: 1 },
      },
    });

    await prisma.mixerConsequence.updateMany({
      where: { sessionId },
      data: { revertedAt: new Date() },
    });

    return NextResponse.json({ session: updatedSession });
  } catch (error) {
    console.error('Mixer complete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
