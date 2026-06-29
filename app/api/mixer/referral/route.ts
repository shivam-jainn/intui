import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/prisma/db';

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')!;

    const { email, sessionId } = await request.json();

    const referredUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!referredUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (referredUser.id === userId) {
      return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 });
    }

    if (sessionId) {
      await prisma.mixerSession.update({
        where: { id: sessionId },
        data: {
          status: 'cleared',
          referredById: referredUser.id,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mixer referral error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
