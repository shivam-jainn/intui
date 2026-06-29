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

    const { questionId, incidentSlug, macMasked, mode } = await request.json();

    const existingSession = await prisma.mixerSession.findFirst({
      where: {
        userId: session.user.id,
        status: 'banned',
      },
    });

    if (existingSession) {
      return NextResponse.json({ error: 'User is banned from Mixer mode' }, { status: 403 });
    }

    let incidentId: number | null = null;
    if (incidentSlug) {
      const incident = await prisma.incident.findUnique({
        where: { slug: incidentSlug },
        select: { id: true },
      });
      incidentId = incident?.id ?? null;
    }

    const validModes = ['normal', 'hardcore', 'brick'];
    const sessionMode = validModes.includes(mode) ? mode : 'normal';

    const previousVerifiedSession = await prisma.mixerSession.findFirst({
      where: {
        userId: session.user.id,
        macMasked: { not: null },
      },
      select: {
        macMasked: true,
        deviceFingerprint: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const newSession = await prisma.mixerSession.create({
      data: {
        userId: session.user.id,
        questionId: questionId ? Number(questionId) : null,
        incidentId,
        status: 'active',
        mode: sessionMode as 'normal' | 'hardcore' | 'brick',
        macMasked: previousVerifiedSession?.macMasked ?? null,
        deviceFingerprint: previousVerifiedSession?.deviceFingerprint ?? null,
      },
    });

    return NextResponse.json({
      session: newSession,
      deviceAlreadyVerified: !!previousVerifiedSession,
    });
  } catch (error) {
    console.error('Mixer start error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
