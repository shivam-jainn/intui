'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Container, Title, Text, Group, Stack, Center, Progress, SimpleGrid, Paper } from '@mantine/core';
import { DuckBadge } from '@/components/DuckBadge';
import { BadgeType } from '@prisma/client';
import { authClient } from '@/lib/auth-client';
import PixelLoader from '@/components/PixelLoader';

const STREAK_MILESTONES = [1, 3, 5, 10, 15, 30, 60, 90, 120, 150, 180, 270, 365];

export default function AchievementsPage() {
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  
  const { data: profileData, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const res = await fetch('/api/user/profile');
      if (!res.ok) {
        let errText = 'Unknown error';
        try {
          errText = await res.text();
        } catch(e) {}
        throw new Error(`Failed to fetch profile: ${res.status} - ${errText}`);
      }
      return res.json();
    },
    enabled: !!session?.user, // Only run query if authenticated
  });

  const isLoading = sessionLoading || profileLoading;

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '4rem 0' }}>
        <Center py={100}>
          <Stack align="center" gap="md">
            <PixelLoader text="SYNCING ACCOLADES..." />
          </Stack>
        </Center>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '4rem 0' }}>
        <Container size="md">
          <Paper className="pixel-border" style={{ padding: '4rem 2rem', background: 'var(--surface-default)', textAlign: 'center' }}>
            <Title className="pixel-font" c="var(--primary-red)" mb="md">ACCESS DENIED</Title>
            <Text className="pixel-font" c="dimmed">
              PLEASE INITIALIZE A SESSION TO VIEW YOUR INVENTORY AND STREAKS.
            </Text>
          </Paper>
        </Container>
      </div>
    );
  }

  // Calculate Streak Progress
  const currentStreak = profileData?.currentStreak || 0;
  const longestStreak = profileData?.longestStreak || 0;
  
  const nextMilestone = STREAK_MILESTONES.find(m => m > currentStreak) || STREAK_MILESTONES[STREAK_MILESTONES.length - 1];
  const previousMilestone = [...STREAK_MILESTONES].reverse().find(m => m <= currentStreak) || 0;
  
  // Calculate percentage within the current tier
  const progressPercent = currentStreak >= 365 
    ? 100 
    : ((currentStreak - previousMilestone) / (nextMilestone - previousMilestone)) * 100;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '4rem 0' }}>
      <Container size="md">
        <Stack gap="xl">
          {/* HEADER */}
          <div className="pixel-border" style={{ padding: '2rem', background: 'var(--surface-default)' }}>
            <Title className="pixel-font" style={{ color: 'var(--primary-red)', marginBottom: '1rem' }}>
              ACHIEVEMENTS DIRECTORY
            </Title>
            <Text className="pixel-font" style={{ color: 'var(--text-secondary)' }}>
              VIEW YOUR STREAKS AND BADGES EARNED THROUGH RESOLVING INCIDENTS AND QUESTIONS.
            </Text>
          </div>

          {profileData ? (
            <Stack gap="xl">
              {/* STREAK DASHBOARD */}
              <div className="pixel-border" style={{ padding: '2rem', background: 'var(--surface-raised)' }}>
                <Title order={3} className="pixel-font" style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
                  OPERATIVE STREAK
                </Title>
                
                <Stack gap="md" mb="xl">
                  <Group justify="space-between">
                    <Text className="pixel-font" size="sm" c="var(--text-secondary)">
                      TIER {previousMilestone} 🔥
                    </Text>
                    <Text className="pixel-font" size="sm" c="var(--primary-red)" fw="bold">
                      {currentStreak >= 365 ? 'MAX LEVEL' : `NEXT: ${nextMilestone} DAYS`}
                    </Text>
                  </Group>
                  <Progress 
                    value={progressPercent} 
                    size="xl" 
                    radius="xs"
                    color="var(--primary-red)"
                    striped
                    animated
                    style={{ border: '2px solid var(--border-subtle)', background: 'var(--bg-inset)' }}
                  />
                  <Text className="pixel-font" size="xs" ta="center" c="dimmed">
                    {currentStreak >= 365 ? 'LEGENDARY STREAK MAINTAINED' : `${nextMilestone - currentStreak} DAYS UNTIL NEXT BADGE`}
                  </Text>
                </Stack>

                <Group gap="xl" justify="center" mt="md">
                  <div style={{ textAlign: 'center' }}>
                    <Text className="pixel-font" size="xl" fw="bold" c="var(--primary-red)">{currentStreak} 🔥</Text>
                    <Text className="pixel-font" size="xs" c="dimmed" mt={4}>CURRENT</Text>
                  </div>
                  <div style={{ width: '2px', height: '40px', background: 'var(--border-subtle)' }} />
                  <div style={{ textAlign: 'center' }}>
                    <Text className="pixel-font" size="xl" fw="bold" c="var(--text-primary)">{longestStreak} 👑</Text>
                    <Text className="pixel-font" size="xs" c="dimmed" mt={4}>MAXIMUM</Text>
                  </div>
                </Group>
              </div>

              {/* TROPHY ROOM */}
              <div className="pixel-border" style={{ padding: '2rem', background: 'var(--surface-raised)' }}>
                <Title order={3} className="pixel-font" style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
                  INVENTORY & TROPHIES
                </Title>
                {profileData.badges && profileData.badges.length > 0 ? (
                  <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
                    {profileData.badges.map((b: any) => (
                      <Paper
                        key={b.badgeType + (b.customLabel || '')}
                        className="pixel-border"
                        style={{ 
                          padding: '1.5rem 1rem', 
                          background: 'var(--bg-inset)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '1rem',
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                          cursor: 'default',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-5px)';
                          e.currentTarget.style.boxShadow = '0 8px 0 var(--border-subtle)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <DuckBadge
                          badgeType={b.badgeType as BadgeType}
                          size={64}
                          customColor={b.customColor}
                          customAccessory={b.customAccessory}
                          customLabel={b.customLabel}
                        />
                        <Text className="pixel-font" size="xs" ta="center" c="var(--text-primary)">
                          {b.customLabel || b.badgeType.replace(/_/g, ' ')}
                        </Text>
                      </Paper>
                    ))}
                  </SimpleGrid>
                ) : (
                  <Paper className="pixel-border" style={{ padding: '3rem', background: 'var(--bg-inset)', textAlign: 'center' }}>
                    <Text className="pixel-font" c="dimmed">INVENTORY EMPTY. INITIATE MISSIONS TO EARN ACCOLADES.</Text>
                  </Paper>
                )}
              </div>
            </Stack>
          ) : (
            <Paper className="pixel-border" style={{ padding: '2rem', background: 'var(--surface-raised)' }}>
               <Text className="pixel-font" c="red">SYSTEM ERROR: FAILED TO LOAD RECORDS.</Text>
               {profileError && (
                 <Text c="dimmed" mt="md" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                   {profileError.message}
                 </Text>
               )}
            </Paper>
          )}
        </Stack>
      </Container>
    </div>
  );
}
