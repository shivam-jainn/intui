import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/prisma/db';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')!;

    const mixerSession = await prisma.mixerSession.findFirst({
      where: {
        userId,
        status: { in: ['active', 'banned'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalWins = await prisma.mixerSession.count({
      where: {
        userId,
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
