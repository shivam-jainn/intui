'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Container, Title, Text, Group, Stack, Center } from '@mantine/core';
import { DuckBadge } from '@/components/DuckBadge';
import { BadgeType } from '@prisma/client';

export default function AchievementsPage() {
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const res = await fetch('/api/user/profile');
      if (!res.ok) throw new Error('Failed to fetch profile');
      return res.json();
    },
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '4rem 0' }}>
      <Container size="md">
        <Stack gap="xl">
          <div className="pixel-border" style={{ padding: '2rem', background: 'var(--surface-default)' }}>
            <Title className="pixel-font" style={{ color: 'var(--primary-red)', marginBottom: '1rem' }}>
              ACHIEVEMENTS DIRECTORY
            </Title>
            <Text className="pixel-font" style={{ color: 'var(--text-secondary)' }}>
              VIEW YOUR STREAKS AND BADGES EARNED THROUGH RESOLVING INCIDENTS AND QUESTIONS.
            </Text>
          </div>

          {isLoading ? (
            <Center py={100}>
              <Text className="pixel-font" style={{ color: 'var(--primary-red)' }}>LOADING RECORDS...</Text>
            </Center>
          ) : profileData ? (
            <Stack gap="xl">
              <div className="pixel-border" style={{ padding: '2rem', background: 'var(--surface-raised)' }}>
                <Title order={3} className="pixel-font" style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
                  OPERATIVE STREAK
                </Title>
                <Group gap="xl">
                  <div style={{ textAlign: 'center' }}>
                    <Text className="pixel-font" size="xl" fw="bold" c="var(--primary-red)">{profileData.currentStreak} 🔥</Text>
                    <Text className="pixel-font" size="sm" c="dimmed">CURRENT</Text>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <Text className="pixel-font" size="xl" fw="bold" c="var(--text-primary)">{profileData.longestStreak} 👑</Text>
                    <Text className="pixel-font" size="sm" c="dimmed">MAXIMUM</Text>
                  </div>
                </Group>
              </div>

              <div className="pixel-border" style={{ padding: '2rem', background: 'var(--surface-raised)' }}>
                <Title order={3} className="pixel-font" style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
                  EARNED BADGES
                </Title>
                {profileData.badges && profileData.badges.length > 0 ? (
                  <Group gap="xl">
                    {profileData.badges.map((b: any) => (
                      <div key={b.badgeType} style={{ textAlign: 'center' }}>
                        <DuckBadge badgeType={b.badgeType as BadgeType} size={64} />
                        <Text className="pixel-font" size="xs" mt="xs" c="var(--text-secondary)">
                          {b.badgeType.replace(/_/g, ' ')}
                        </Text>
                      </div>
                    ))}
                  </Group>
                ) : (
                  <Text className="pixel-font" c="dimmed">NO BADGES EARNED YET. KEEP RESOLVING INCIDENTS!</Text>
                )}
              </div>
            </Stack>
          ) : (
            <Text className="pixel-font" c="red">FAILED TO LOAD RECORDS.</Text>
          )}
        </Stack>
      </Container>
    </div>
  );
}
