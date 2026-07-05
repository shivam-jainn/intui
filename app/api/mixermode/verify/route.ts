import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/prisma/db';

export async function POST(req: NextRequest) {
  try {
    const { uuid, userId } = await req.json();
    if (!uuid) {
      return NextResponse.json({ error: 'Missing uuid' }, { status: 400 });
    }

    const existing = await prisma.mixerVerification.findUnique({
      where: { uuid },
    });

    if (existing) {
      return NextResponse.json({ verified: true, message: 'Already verified' });
    }

    await prisma.mixerVerification.create({
      data: { uuid, userId: userId || null, verifiedAt: new Date() },
    });

    return NextResponse.json({ verified: true });
  } catch {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const uuid = searchParams.get('uuid');
    const userId = searchParams.get('userId');

    if (uuid) {
      const record = await prisma.mixerVerification.findUnique({
        where: { uuid },
      });
      return NextResponse.json({ verified: !!record });
    }

    if (userId) {
      const record = await prisma.mixerVerification.findFirst({
        where: { userId },
      });
      return NextResponse.json({ verified: !!record });
    }

    return NextResponse.json({ verified: false });
  } catch {
    return NextResponse.json({ verified: false });
  }
}
