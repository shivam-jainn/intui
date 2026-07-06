import { BadgeType } from '@prisma/client';
import { prisma } from '../prisma/db';
import { generateMixerBadge } from './badgeGenerator';

export async function handleLoginActivity(userId: string): Promise<void> {
  // 1. Award first time login badge
  await awardBadge(userId, BadgeType.FIRST_LOGIN);

  // 2. Award daily login badge
  await awardBadge(userId, BadgeType.DAILY_LOGIN);

  // 3. Update streak
  await updateStreakAndCheckBadges(userId);
}

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

async function awardBadge(
  userId: string,
  badgeType: BadgeType,
  customColor?: string,
  customAccessory?: string,
  customLabel?: string
): Promise<void> {
  const existing = await prisma.userBadge.findUnique({
    where: {
      userId_badgeType_customLabel: {
        userId,
        badgeType,
        customLabel: customLabel || "",
      },
    },
  });

  if (!existing) {
    await prisma.userBadge.create({
      data: {
        userId,
        badgeType,
        customColor: customColor || null,
        customAccessory: customAccessory || null,
        customLabel: customLabel || "",
      },
    });
  }
}

async function checkStreakBadges(userId: string, streak: number): Promise<void> {
  if (streak >= 1) await awardBadge(userId, BadgeType.STREAK_1);
  if (streak >= 3) await awardBadge(userId, BadgeType.STREAK_3);
  if (streak >= 5) await awardBadge(userId, BadgeType.STREAK_5);
  if (streak >= 10) await awardBadge(userId, BadgeType.STREAK_10);
  if (streak >= 15) await awardBadge(userId, BadgeType.STREAK_15);
  if (streak >= 30) await awardBadge(userId, BadgeType.STREAK_30);
  if (streak >= 60) await awardBadge(userId, BadgeType.STREAK_60);
  if (streak >= 90) await awardBadge(userId, BadgeType.STREAK_90);
  if (streak >= 120) await awardBadge(userId, BadgeType.STREAK_120);
  if (streak >= 150) await awardBadge(userId, BadgeType.STREAK_150);
  if (streak >= 180) await awardBadge(userId, BadgeType.STREAK_180);
  if (streak >= 270) await awardBadge(userId, BadgeType.STREAK_270);
  if (streak >= 365) await awardBadge(userId, BadgeType.STREAK_365);
}

export async function checkSpeedBadges(userId: string, timeTakenSeconds: number): Promise<void> {
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
    }
  }
}

export async function checkAndAwardMixerBadge(userId: string, questionName: string): Promise<void> {
  const { color, accessory, label } = generateMixerBadge(questionName);
  await awardBadge(userId, BadgeType.MIXER_AWARD, color, accessory, label);
}
