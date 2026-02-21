'use client';

import React from 'react';
import { Avatar, Button, Popover, Stack, Text } from '@mantine/core';
import { signOut } from '@/lib/auth/auth-client';

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
      offset={2} // smaller gap so dropdown is closer to avatar
      shadow="lg" // deeper shadow for popover
      opened={opened}
      onChange={setOpened}
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
