import { BadgeType } from '@prisma/client';
import { checkSpeedBadges, updateStreakAndCheckBadges } from './badges';
import { prisma } from '../prisma/db';

jest.mock('../prisma/db', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    userBadge: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe('Streak and Badges Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateStreakAndCheckBadges', () => {
    it('should increment streak if submitted on the next day', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        currentStreak: 1,
        longestStreak: 1,
        lastActivityAt: yesterday,
      });

      await updateStreakAndCheckBadges('user-1');

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: expect.objectContaining({
            currentStreak: 2,
            longestStreak: 2,
          }),
        })
      );
    });

    it('should keep streak if submitted on the same day', async () => {
      const today = new Date();

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        currentStreak: 2,
        longestStreak: 2,
        lastActivityAt: today,
      });

      await updateStreakAndCheckBadges('user-1');

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            currentStreak: 2,
          }),
        })
      );
    });

    it('should reset streak if more than a day passed', async () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        currentStreak: 5,
        longestStreak: 5,
        lastActivityAt: twoDaysAgo,
      });

      await updateStreakAndCheckBadges('user-1');

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            currentStreak: 1,
            longestStreak: 5,
          }),
        })
      );
    });
  });

  describe('checkSpeedBadges', () => {
    it('should award SPEED_P0_1M for 50s P0 submission', async () => {
      (prisma.userBadge.findUnique as jest.Mock).mockResolvedValue(null);

      await checkSpeedBadges('user-1', 50);

      expect(prisma.userBadge.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            badgeType: BadgeType.SPEED_P0_1M,
          }),
        })
      );
    });

    it('should award SPEED_P0_15M for 900s P0 submission', async () => {
      (prisma.userBadge.findUnique as jest.Mock).mockResolvedValue(null);

      await checkSpeedBadges('user-1', 900);

      expect(prisma.userBadge.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            badgeType: BadgeType.SPEED_P0_15M,
          }),
        })
      );
    });

    it('should not award badge for >15m submission', async () => {
      await checkSpeedBadges('user-1', 901);
      expect(prisma.userBadge.create).not.toHaveBeenCalled();
    });
  });
});
