import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/prisma/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mixerSession = await prisma.mixerSession.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ['active', 'banned'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalWins = await prisma.mixerSession.count({
      where: {
        userId: session.user.id,
        status: 'cleared',
      },
    });

    return NextResponse.json({
      session: mixerSession,
      stats: {
        totalWins,
        currentStreak: mixerSession?.streak || 0,
      },
    });
  } catch (error) {
    console.error('Mixer status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
