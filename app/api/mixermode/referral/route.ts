import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/prisma/db';

export async function POST(req: NextRequest) {
  try {
    const { action, userId, referralCode } = await req.json();

    if (action === 'generate') {
      const existing = await prisma.referral.findFirst({
        where: { referrerId: userId },
      });
      if (existing) {
        return NextResponse.json({ code: existing.code });
      }
      const code = `ref_${userId.slice(0, 8)}_${Date.now().toString(36)}`;
      await prisma.referral.create({
        data: { code, referrerId: userId },
      });
      return NextResponse.json({ code });
    }

    if (action === 'use') {
      if (!referralCode || !userId) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
      }

      const referral = await prisma.referral.findUnique({
        where: { code: referralCode },
      });
      if (!referral) {
        return NextResponse.json({ error: 'Invalid code' }, { status: 404 });
      }
      if (referral.referrerId === userId) {
        return NextResponse.json({ error: 'Cannot use own code' }, { status: 400 });
      }
      if (referral.usedAt) {
        return NextResponse.json({ error: 'Already used' }, { status: 400 });
      }

      const shadowban = await prisma.shadowban.findUnique({
        where: { userId },
      });
      if (!shadowban || shadowban.unlockedAt) {
        return NextResponse.json({ error: 'Not banned or already unlocked' }, { status: 400 });
      }

      await prisma.$transaction([
        prisma.shadowban.update({
          where: { userId },
          data: { unlockedBy: referralCode, unlockedAt: new Date() },
        }),
        prisma.referral.update({
          where: { code: referralCode },
          data: { referredId: userId, usedAt: new Date() },
        }),
      ]);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const ban = await prisma.shadowban.findUnique({ where: { userId } });
    if (!ban || ban.unlockedAt) {
      return NextResponse.json({ banned: false });
    }
    return NextResponse.json({
      banned: true,
      referralCode: ban.referralCode,
      reason: ban.reason,
    });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
