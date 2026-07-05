'use client';

import React from 'react';
import { Avatar, Popover, Stack, Text } from '@mantine/core';
import { signOut } from '@/lib/auth-client';
import { useInvalidateSession } from '@/lib/hooks/useSession';

export default function Profile({ avatar, name }: { avatar: string; name?: string }) {
  const [opened, setOpened] = React.useState(false);
  const [isSigningOut, setIsSigningOut] = React.useState(false);
  const invalidateSession = useInvalidateSession();

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    invalidateSession();
    setIsSigningOut(false);
  };

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
