'use client';

import React, { useState } from 'react';
import { Container, Title, Text, Group, Stack, Center, Progress, SimpleGrid, Paper, Modal, Button, ActionIcon } from '@mantine/core';
import { DuckBadge } from '@/components/DuckBadge';
import { BadgeType } from '@prisma/client';
import { authClient } from '@/lib/auth-client';
import { useUserProfile } from '@/lib/hooks/useSession';
import PixelLoader from '@/components/PixelLoader';

const STREAK_MILESTONES = [1, 3, 5, 10, 15, 30, 60, 90, 120, 150, 180, 270, 365];

export default function AchievementsPage() {
  const [selectedBadge, setSelectedBadge] = useState<any | null>(null);
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  
  const { data: profileData, isLoading: profileLoading, error: profileError } = useUserProfile();

  const isLoading = sessionLoading || profileLoading;

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: 'clamp(2rem, 5vw, 4rem) 1rem' }}>
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
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: 'clamp(2rem, 5vw, 4rem) 1rem' }}>
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

  const handleShare = async () => {
    try {
      const badgeName = selectedBadge?.customLabel || selectedBadge?.badgeType.replace(/_/g, ' ');
      const text = `I just unlocked the [${badgeName}] badge on Intui! 🦆\n\nCan you beat my streak?`;
      const url = `${window.location.origin}/share/badge/${selectedBadge?.badgeType}`;

      // Fetch the generated OG image as a Blob
      const res = await fetch(`/api/og/badge?type=${selectedBadge?.badgeType}`);
      const blob = await res.blob();
      const file = new File([blob], 'achievement.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Intui Achievement',
          text: text,
          url: url,
          files: [file],
        });
      } else if (navigator.share) {
        // Fallback to sharing just the URL if files aren't supported
        await navigator.share({
          title: 'Intui Achievement',
          text: text,
          url: url,
        });
      } else {
        // Fallback to clipboard
        navigator.clipboard.writeText(`${text} ${url}`);
        alert('Copied link to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const handleDownload = async () => {
    try {
      const res = await fetch(`/api/og/badge?type=${selectedBadge?.badgeType}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedBadge?.badgeType || 'badge'}-achievement.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error('Error downloading:', err);
    }
  };

  const shareToTwitter = () => {
    const badgeName = selectedBadge?.customLabel || selectedBadge?.badgeType.replace(/_/g, ' ');
    const url = `${window.location.origin}/share/badge/${selectedBadge?.badgeType}`;
    const text = encodeURIComponent(`I just unlocked the [${badgeName}] badge on Intui! 🦆\n\nCan you beat my streak?`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`, '_blank');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: 'clamp(2rem, 5vw, 4rem) 1rem' }}>
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
                        onClick={() => setSelectedBadge(b)}
                        style={{ 
                          padding: '1.5rem 1rem', 
                          background: 'var(--bg-inset)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '1rem',
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)';
                          e.currentTarget.style.boxShadow = '0 8px 0 var(--border-subtle), 0 15px 30px rgba(0,0,0,0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0) scale(1)';
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
      
      {/* BADGE DETAILS MODAL */}
      <Modal
        opened={!!selectedBadge}
        onClose={() => setSelectedBadge(null)}
        withCloseButton={false}
        centered
        size="md"
        overlayProps={{
          backgroundOpacity: 0.85,
          blur: 10,
        }}
        styles={{
          content: {
            background: 'transparent',
            boxShadow: 'none',
          }
        }}
      >
        {selectedBadge && (
          <Stack align="center" gap="xl">
            {/* HOLOGRAPHIC CARD */}
            <div 
              className="pixel-border"
              style={{
                background: 'linear-gradient(135deg, var(--surface-default) 0%, var(--surface-raised) 100%)',
                padding: '3rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5), inset 0 0 0 4px var(--primary-red)',
                animation: 'float 6s ease-in-out infinite'
              }}
            >
              {/* Shine effect overlay */}
              <div style={{
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: 'linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%)',
                transform: 'rotate(30deg)',
                animation: 'shine 4s linear infinite',
                pointerEvents: 'none',
              }} />

              <Title className="pixel-font" c="var(--text-secondary)" size="sm" mb="xl" style={{ letterSpacing: '2px' }}>
                INTUI COLLECTIBLE
              </Title>

              <div style={{ 
                marginBottom: '2rem'
              }}>
                <DuckBadge
                  badgeType={selectedBadge.badgeType as BadgeType}
                  size={120}
                  customColor={selectedBadge.customColor}
                  customAccessory={selectedBadge.customAccessory}
                  customLabel={selectedBadge.customLabel}
                />
              </div>

              <Title className="pixel-font" c="var(--primary-red)" ta="center" size="h2" mb="sm">
                {selectedBadge.customLabel || selectedBadge.badgeType.replace(/_/g, ' ')}
              </Title>
              
              <Text className="pixel-font" c="dimmed" ta="center" size="sm">
                EARNED BY {session?.user?.name?.toUpperCase() || 'AGENT'}
              </Text>
            </div>

            <Group w="100%" grow>
              <button 
                className="pixel-btn" 
                onClick={shareToTwitter}
                style={{ 
                  background: '#1DA1F2', 
                  color: 'white', 
                  borderColor: '#1a91da',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                SHARE ON X
              </button>
              <button 
                className="pixel-btn-ghost" 
                onClick={handleShare}
                style={{ padding: '1rem' }}
              >
                NATIVE SHARE
              </button>
            </Group>

            <button 
              className="pixel-btn-ghost" 
              onClick={handleDownload}
              style={{ width: '100%', padding: '0.5rem', marginTop: '-1rem' }}
            >
              DOWNLOAD IMAGE
            </button>
            
            <button 
              className="pixel-btn-ghost" 
              onClick={() => setSelectedBadge(null)}
              style={{ fontSize: '0.8rem', opacity: 0.7 }}
            >
              CLOSE
            </button>
          </Stack>
        )}
      </Modal>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(1deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes shine {
          0% { transform: translateX(-100%) rotate(30deg); }
          20% { transform: translateX(100%) rotate(30deg); }
          100% { transform: translateX(100%) rotate(30deg); }
        }
      `}} />
    </div>
  );
}
