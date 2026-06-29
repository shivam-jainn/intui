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

    const { email, sessionId } = await request.json();

    const referredUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!referredUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (referredUser.id === session.user.id) {
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
