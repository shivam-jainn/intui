'use client';

import React from 'react';
import { Avatar, Popover, Stack, Text, Group } from '@mantine/core';
import { signOut } from '@/lib/auth-client';
import { useInvalidateSession, useUserProfile } from '@/lib/hooks/useSession';
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

  const { data: profileData } = useUserProfile();

  return (
    <Popover
      width={180}
      position="bottom-end"
      offset={10}
      shadow="xl"
      opened={opened}
      onChange={setOpened}
      zIndex={20000}
      withArrow
      styles={{
        dropdown: {
          background: 'var(--surface-default)',
          borderColor: 'var(--border-default)',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
          padding: '12px',
        },
        arrow: {
          borderColor: 'var(--border-default)',
          background: 'var(--surface-default)',
        }
      }}
    >
      <Popover.Target>
        <Avatar
          src={avatar}
          alt="User"
          radius="xl"
          size={36}
          style={{
            cursor: 'pointer',
            border: opened ? '2px solid var(--primary-red)' : '2px solid var(--border-default)',
            transition: 'all 0.2s ease',
          }}
          onClick={() => setOpened((o) => !o)}
        />
      </Popover.Target>

      <Popover.Dropdown>
        <Stack gap="xs">
          {name && (
            <Text fw={600} size="xs" ta="center" c="var(--text-secondary)" className="pixel-font" style={{ fontSize: '0.65rem', marginBottom: '2px' }}>
              {name}
            </Text>
          )}
          <button
            className="pixel-btn-ghost"
            style={{
              fontSize: '0.65rem',
              padding: '6px 12px',
              width: '100%',
              textAlign: 'center',
              display: 'block',
            }}
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
            style={{
              fontSize: '0.65rem',
              padding: '6px 12px',
              width: '100%',
              display: 'block',
            }}
            onClick={handleSignOut}
          >
            {isSigningOut ? 'LOGGING OUT...' : 'LOG OUT'}
          </button>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}
