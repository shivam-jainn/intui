import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/prisma/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await prisma.mixerSession.findUnique({
      where: { id: params.id },
      include: {
        consequences: true,
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const consequenceApplied = session.consequences.some(
      (c) => c.appliedAt !== null
    );

    return NextResponse.json({
      session: {
        ...session,
        consequenceApplied,
        deviceVerified: session.macMasked !== null,
      },
    });
  } catch (error) {
    console.error('Session status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
