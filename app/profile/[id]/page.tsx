import { prisma } from '@/prisma/db';
import { notFound } from 'next/navigation';
import { DuckBadge } from '@/components/DuckBadge';
import { ShareButton } from '@/components/ShareButton';
import { Title, Text, Group, Stack, Badge, Paper, Card, Button } from '@mantine/core';
import styles from './page.module.css';

export default async function ProfilePage({ params }: { params: { id: string } }) {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      badges: true,
      Submission: {
        select: {
          timeTaken: true,
          status: true,
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  // Calculate stats
  const successfulSubmissions = user.Submission.filter(s => s.status === 'success' || s.status === 'Accepted');
  const avgTimeTaken = successfulSubmissions.length > 0
    ? successfulSubmissions.reduce((acc, curr) => acc + (curr.timeTaken || 0), 0) / successfulSubmissions.length
    : 0;

  return (
    <div className={styles.scrapbookContainer}>
      <div className={styles.pageBackground}>
        <div className={styles.header}>
          <Title order={1} className={styles.title}>{user.name}'s Scrapbook</Title>
          <Text size="lg" color="dimmed" className={styles.subtitle}>
            Joined {new Date(user.createdAt).toLocaleDateString()}
          </Text>
        </div>

        <Group align="flex-start" justify="center" gap="xl" className={styles.content}>
          <Paper shadow="xl" p="xl" radius="md" className={styles.polaroid}>
            <Title order={3} mb="md">Stats</Title>
            <Stack gap="sm">
              <Group justify="space-between">
                <Text fw={500}>Longest Streak:</Text>
                <Badge color="orange" size="lg">{user.longestStreak} Days</Badge>
              </Group>
              <Group justify="space-between">
                <Text fw={500}>Current Streak:</Text>
                <Badge color="green" size="lg">{user.currentStreak} Days</Badge>
              </Group>
              <Group justify="space-between">
                <Text fw={500}>Solutions:</Text>
                <Badge color="blue" size="lg">{successfulSubmissions.length}</Badge>
              </Group>
              <Group justify="space-between">
                <Text fw={500}>Avg Time:</Text>
                <Badge color="grape" size="lg">{avgTimeTaken > 0 ? `${(avgTimeTaken / 60).toFixed(1)} mins` : 'N/A'}</Badge>
              </Group>
            </Stack>
            <ShareButton url={`https://intui.dev/profile/${user.id}`} />
          </Paper>

          <div className={styles.stickersBoard}>
            <Title order={2} className={styles.stickersTitle}>My Stickers</Title>
            {user.badges.length === 0 ? (
              <Text c="dimmed">No stickers yet! Start solving to earn some.</Text>
            ) : (
              <div className={styles.stickersGrid}>
                {user.badges.map((badge, index) => (
                  <div 
                    key={badge.id} 
                    className={styles.stickerWrapper}
                    style={{
                      transform: `rotate(${Math.random() * 20 - 10}deg)`,
                      marginTop: `${Math.random() * 20}px`
                    }}
                  >
                    <DuckBadge 
                      badgeType={badge.badgeType} 
                      customColor={badge.customColor}
                      customLabel={badge.customLabel}
                      size={100}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </Group>
      </div>
    </div>
  );
}
