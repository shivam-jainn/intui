import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/prisma/db';

import fs from 'fs';

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: headers() });

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Check and award login/activity badges
    const { handleLoginActivity } = await import('@/lib/badges');
    await handleLoginActivity(userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        currentStreak: true,
        longestStreak: true,
        badges: {
          select: {
            badgeType: true,
            earnedAt: true,
            customColor: true,
            customAccessory: true,
            customLabel: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    fs.appendFileSync('/tmp/profile-error.log', `PROFILE API ERROR: ${error.message}\n${error.stack}\n\n`);
    console.error("PROFILE API ERROR:", error);
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
