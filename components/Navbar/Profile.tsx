'use client';

import React from 'react';
import { Avatar, Popover, Stack, Text, Group } from '@mantine/core';
import { signOut } from '@/lib/auth-client';
import { useInvalidateSession } from '@/lib/hooks/useSession';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { DuckBadge } from '../DuckBadge';
import { BadgeType } from '@prisma/client';

export default function Profile({ avatar, name }: { avatar: string; name?: string }) {
  const [opened, setOpened] = React.useState(false);
  const [isSigningOut, setIsSigningOut] = React.useState(false);
  const invalidateSession = useInvalidateSession();
  const router = useRouter();

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    invalidateSession();
    setIsSigningOut(false);
  };

  const { data: profileData } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const res = await fetch('/api/user/profile');
      if (!res.ok) throw new Error('Failed to fetch profile');
      return res.json();
    },
  });

  return (
    <Popover
      width={200}
      position="bottom-end"
      offset={8}
      shadow="lg"
      opened={opened}
      onChange={setOpened}
      zIndex={20000}
    >
      <Popover.Target>
        <Avatar
          src={avatar}
          alt="User"
          radius="0"
          style={{ cursor: 'pointer', border: '2px solid var(--primary-red)' }}
          onClick={() => setOpened((o) => !o)}
        />
      </Popover.Target>

      <Popover.Dropdown p="sm" style={{ background: 'var(--surface-default)', border: '1px solid var(--primary-red)' }}>
        <Stack gap="xs">
          {name && (
            <Text fw={500} size="sm" c="var(--text-primary)" className="pixel-font" style={{ fontSize: '0.6rem' }}>
              {name}
            </Text>
          )}
          <button
            className="pixel-btn-ghost"
            style={{ fontSize: '0.6rem', padding: '0.5rem', width: '100%', textAlign: 'left', marginBottom: '8px' }}
            onClick={() => {
              setOpened(false);
              router.push('/achievements');
            }}
          >
            ACHIEVEMENTS
          </button>
          <button
            disabled={isSigningOut}
            className="pixel-btn"
            style={{ fontSize: '0.6rem', padding: '0.5rem', width: '100%' }}
            onClick={handleSignOut}
          >
            {isSigningOut ? 'LOGGING OUT...' : 'LOG OUT'}
          </button>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}
