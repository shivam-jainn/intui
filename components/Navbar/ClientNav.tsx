'use client';

import {
  IconBook,
  IconChartPie3,
  IconChevronDown,
  IconCode,
  IconCoin,
  IconFingerprint,
  IconNotification,
} from '@tabler/icons-react';
import {
  Anchor,
  Box,
  Burger,
  Button,
  Center,
  Collapse,
  Divider,
  Drawer,
  Group,
  HoverCard,
  rem,
  ScrollArea,
  SimpleGrid,
  Skeleton,
  Text,
  ThemeIcon,
  UnstyledButton,
  useMantineTheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Intui from './Intui';
import classes from './Navbar.module.css';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import React from 'react';
import Profile from './Profile';

const mockdata = [
  {
    icon: IconCode,
    title: 'Open source',
    description: "This Pokémon's cry is very loud and distracting",   
  },
  {
    icon: IconCoin,
    title: 'Free for everyone',
    description: 'The fluid of Smeargle\'s tail secretions changes',
  },
  {
    icon: IconBook,
    title: 'Documentation',
    description: 'Yanma is capable of seeing 360 degrees without',
  },
  {
    icon: IconFingerprint,
    title: 'Security',
    description: 'The shell\'s rounded shape and the grooves on its surface are a security feature.',
  },
  {
    icon: IconChartPie3,
    title: 'Analytics',
    description: 'This Pokémon uses its flying ability to quickly chase',
  },
  {
    icon: IconNotification,
    title: 'Notifications',
    description: 'Combusken battles with the intensely hot flames it spews',
  },
];

interface ClientNavbarProps {
  initialSession: any;
}

function UserNav({ router }: { router: any }) {
  const { data, isPending } = useSession();

  if (isPending) {
    return <Skeleton height={40} radius="md" />;
  }

  return (
    <>
      {data?.user == null ? (
        <Group justify="center" grow pb="xl" px="md">
          <Button variant="default" onClick={() => {
            router.push('/signin')
          }}>Log in</Button>
          <Button onClick={() => {
            router.push('/signup')
          }}>Sign up</Button>
        </Group>
      ) : (
        <Group justify="center" grow pb="xl" px="md">
          <Text>Welcome, {data.user.email}</Text>
        </Group>
      )}
    </>
  );
}

export default function ClientNavbar({ initialSession }: ClientNavbarProps) {
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
  const [linksOpened, { toggle: toggleLinks }] = useDisclosure(false);
  const theme = useMantineTheme();
  const router = useRouter();
  const { data, isPending } = useSession();

  // Use initial session if still loading
  const currentSession = isPending ? initialSession : data;

  const links = mockdata.map((item) => (
    <UnstyledButton className={classes.subLink} key={item.title}>
      <Group wrap="nowrap" align="flex-start">
        <ThemeIcon size={34} variant="default" radius="md">
          <item.icon style={{ width: rem(22), height: rem(22) }} color={theme.colors.blue[6]} />
        </ThemeIcon>
        <div>
          <Text size="sm" fw={500}>
            {item.title}
          </Text>
          <Text size="xs" c="dimmed">
            {item.description}
          </Text>
        </div>
      </Group>
    </UnstyledButton>
  ));

  return (
    <Box>
      <header className={classes.header}>
        <Group justify="space-between" h="100%">
          <a href="/">
            <Intui />
          </a>

          <Group h="100%" gap={0} visibleFrom="sm">
            <a href="/" className={classes.link}>
              Home
            </a>
            <a href="/questions" className={classes.link}>
              Questions
            </a>
          </Group>

          <Group visibleFrom="sm">
            {currentSession?.user == null ? (
              <>
                <Button variant="default" onClick={() => {
                  router.push('/signin')
                }}>Log in</Button>
                <Button onClick={() => {
                  router.push('/signup')
                }}>Sign up</Button>
              </>
            ) : (
              <Profile avatar={currentSession.user.image} />
            )}
          </Group>

          <Burger opened={drawerOpened} onClick={toggleDrawer} hiddenFrom="sm" />
        </Group>
      </header>

      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        size="100%"
        padding="md"
        title="Navigation"
        hiddenFrom="sm"
        zIndex={1000000}
      >
        <ScrollArea h={`calc(100vh - ${rem(80)})`} mx="-md">
          <Divider my="sm" />

          <a href="/" className={classes.link}>
            Home
          </a>
          <UnstyledButton className={classes.link} onClick={toggleLinks}>
            <Center inline>
              <Box component="span" mr={5}>
                Features
              </Box>
              <IconChevronDown
                style={{ width: rem(16), height: rem(16) }}
                color={theme.colors.blue[6]}
              />
            </Center>
          </UnstyledButton>
          <Collapse in={linksOpened}>{links}</Collapse>
          <a href="/questions" className={classes.link}>
            Questions
          </a>

          <Divider my="sm" />

          <UserNav router={router} />
        </ScrollArea>
      </Drawer>
    </Box>
  );
}