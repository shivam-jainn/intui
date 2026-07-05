import { BadgeType } from '@prisma/client';
import { prisma } from '../prisma/db';

export async function updateStreakAndCheckBadges(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) return;

  const now = new Date();
  let currentStreak = user.currentStreak || 0;
  let longestStreak = user.longestStreak || 0;

  if (user.lastActivityAt) {
    const lastActivityDate = new Date(user.lastActivityAt);
    
    // Normalize to start of day for comparison
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfLastActivity = new Date(lastActivityDate.getFullYear(), lastActivityDate.getMonth(), lastActivityDate.getDate());
    
    const diffTime = Math.abs(startOfToday.getTime() - startOfLastActivity.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      currentStreak += 1;
    } else if (diffDays > 1) {
      currentStreak = 1;
    }
  } else {
    currentStreak = 1;
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      currentStreak,
      longestStreak,
      lastActivityAt: now,
    },
  });

  await checkStreakBadges(userId, currentStreak);
}

async function awardBadge(userId: string, badgeType: BadgeType): Promise<void> {
  const existing = await prisma.userBadge.findUnique({
    where: {
      userId_badgeType: {
        userId,
        badgeType,
      },
    },
  });

  if (!existing) {
    await prisma.userBadge.create({
      data: {
        userId,
        badgeType,
      },
    });
  }
}

async function checkStreakBadges(userId: string, streak: number): Promise<void> {
  if (streak >= 1) await awardBadge(userId, BadgeType.STREAK_1);
  if (streak >= 5) await awardBadge(userId, BadgeType.STREAK_5);
  if (streak >= 10) await awardBadge(userId, BadgeType.STREAK_10);
}

export async function checkSpeedBadges(userId: string, timeTakenSeconds: number): Promise<void> {
  // Check conditions
  const thresholds = [
    { maxTime: 60, badge: BadgeType.SPEED_P0_1M },
    { maxTime: 180, badge: BadgeType.SPEED_P0_3M },
    { maxTime: 300, badge: BadgeType.SPEED_P0_5M },
    { maxTime: 600, badge: BadgeType.SPEED_P0_10M },
    { maxTime: 900, badge: BadgeType.SPEED_P0_15M },
  ];

  for (const threshold of thresholds) {
    if (timeTakenSeconds <= threshold.maxTime) {
      await awardBadge(userId, threshold.badge);
      // We can break early if we only want to award the best badge, 
      // but usually users get all badges they qualify for. Let's award all.
    }
  }
}
