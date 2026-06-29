import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/mixer/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: id, verified: true }),
    });

    if (!response.ok) {
      throw new Error('Verification failed');
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Verification error:', error);
    return new NextResponse('Verification failed', { status: 500 });
  }
}
