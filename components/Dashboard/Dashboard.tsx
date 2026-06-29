'use client';

import React from 'react';
import { Container, Title, Text, Group, Stack, Badge } from '@mantine/core';
import Link from 'next/link';
import {
  IconCode,
  IconAlertTriangle,
  IconArrowRight,
} from '@tabler/icons-react';

const quickAccessCards = [
  {
    title: 'Questions',
    description: 'Solve DSA challenges in sequence',
    icon: IconCode,
    href: '/questions',
    color: 'indigo',
    stats: '24 questions',
  },
  {
    title: 'Incidents',
    description: 'Handle P0 simulations',
    icon: IconAlertTriangle,
    href: '/p0',
    color: 'red',
    stats: '8 scenarios',
  },
];

export default function Dashboard() {
  return (
    <div style={{ minHeight: '100vh', background: '#08080d' }}>
      <Container size="xl" style={{ padding: '36px 20px 64px' }}>
        <Stack gap={44}>
          <div>
            <Title
              order={1}
              c="white"
              style={{
                fontSize: 'clamp(26px, 4vw, 44px)',
                lineHeight: 1.08,
                fontWeight: 700,
                letterSpacing: '-0.02em',
              }}
            >
              Dashboard
            </Title>
            <Text
              c="gray.4"
              mt={12}
              style={{ maxWidth: 540, lineHeight: 1.7, fontSize: 15 }}
            >
              Welcome back. Choose a mode to continue your progress.
            </Text>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 16,
            }}
          >
            {quickAccessCards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                style={{
                  display: 'block',
                  cursor: 'pointer',
                  background: 'rgba(255,255,255,0.04)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  borderRadius: 14,
                  padding: '24px',
                  transition: 'all 0.18s ease',
                  textDecoration: 'none',
                }}
              >
                <Group justify="space-between" mb={16}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'rgba(99,102,241,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <card.icon size={20} color="var(--mantine-color-indigo-4)" />
                  </div>
                  <Badge variant="light" color={card.color} size="xs">
                    {card.stats}
                  </Badge>
                </Group>
                <Title order={3} c="white" size="h4" mb={8}>
                  {card.title}
                </Title>
                <Text c="gray.5" size="sm" mb={16}>
                  {card.description}
                </Text>
                <Group gap={4} c="gray.4" style={{ fontSize: 13 }}>
                  <span>Get started</span>
                  <IconArrowRight size={14} />
                </Group>
              </Link>
            ))}
          </div>

          <div
            style={{
              background: 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 14,
              padding: '24px 28px',
            }}
          >
            <Text
              size="xs"
              c="gray.6"
              mb={16}
              style={{
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                fontWeight: 600,
              }}
            >
              Quick Stats
            </Text>
            <Group gap={32}>
              <div>
                <Text c="white" fw={600} size="xl">
                  0
                </Text>
                <Text c="gray.5" size="sm">
                  Questions Solved
                </Text>
              </div>
              <div>
                <Text c="white" fw={600} size="xl">
                  0
                </Text>
                <Text c="gray.5" size="sm">
                  Incidents Handled
                </Text>
              </div>
              <div>
                <Text c="white" fw={600} size="xl">
                  0
                </Text>
                <Text c="gray.5" size="sm">
                  Mixer Wins
                </Text>
              </div>
            </Group>
          </div>
        </Stack>
      </Container>
    </div>
  );
}
