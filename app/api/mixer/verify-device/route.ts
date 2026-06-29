import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/prisma/db';

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session');
  const fingerprint = request.nextUrl.searchParams.get('fingerprint');

  if (!sessionId) {
    return new NextResponse('Missing session', { status: 400 });
  }

  try {
    await prisma.mixerSession.update({
      where: { id: sessionId },
      data: {
        macMasked: 'verified',
        deviceFingerprint: fingerprint || null,
      },
    });

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Verify device error:', error);
    return new NextResponse('Error', { status: 500 });
  }
}
