import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/prisma/db';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, verified } = await request.json();

    if (!sessionId || !verified) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    await prisma.mixerConsequence.updateMany({
      where: {
        sessionId,
        appliedAt: null,
      },
      data: {
        appliedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mixer verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
