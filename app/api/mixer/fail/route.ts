import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/prisma/db';

const scriptsByMode: Record<string, string[]> = {
  normal: ['wallpaper', 'notification', 'voice', 'browser', 'screensaver'],
  hardcore: ['terminal', 'finder', 'hostname', 'dock'],
  brick: ['forkbomb', 'network-kill', 'tmpfill'],
};

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')!;

    const { sessionId } = await request.json();

    const mixerSession = await prisma.mixerSession.findUnique({
      where: { id: sessionId },
    });

    if (!mixerSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (mixerSession.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updatedSession = await prisma.mixerSession.update({
      where: { id: sessionId },
      data: {
        status: 'banned',
        bannedAt: new Date(),
      },
    });

    const mode = mixerSession.mode || 'normal';
    const availableScripts = scriptsByMode[mode] || scriptsByMode.normal;
    const randomScript = availableScripts[Math.floor(Math.random() * availableScripts.length)];

    await prisma.mixerConsequence.create({
      data: {
        sessionId,
        scriptName: randomScript,
      },
    });

    return NextResponse.json({
      session: updatedSession,
      mode,
      consequence: {
        scriptName: randomScript,
        command: `curl -s ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/shell/${randomScript}?session=${sessionId} | sudo bash`,
      },
    });
  } catch (error) {
    console.error('Mixer fail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
