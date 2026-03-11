'use client';

import React from 'react';
import { Avatar, Button, Popover, Stack, Text } from '@mantine/core';
import { signOut } from '@/lib/auth-client';

export default function Profile({ avatar, name }: { avatar: string; name?: string }) {
  const [opened, setOpened] = React.useState(false);
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
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
          radius="xl"
          style={{ cursor: 'pointer' }}
          onClick={() => setOpened((o) => !o)}
        />
      </Popover.Target>

      <Popover.Dropdown p="sm">
        <Stack gap="xs">
          {name && (
            <Text fw={500} size="sm">
              {name}
            </Text>
          )}
          <Button
            loading={isSigningOut}
            variant="light"
            color="red"
            size="xs"
            onClick={handleSignOut}
          >
            Log out
          </Button>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}
