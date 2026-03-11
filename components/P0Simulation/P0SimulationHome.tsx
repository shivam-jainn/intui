"use client";
import React from 'react';
import {
  Container,
  Paper,
  Title,
  Text,
  Badge,
  Group,
  Stack,
  ThemeIcon,
  Timeline,
  Box,
  SimpleGrid,
  Card,
  Overlay,
  Center,
} from '@mantine/core';

export default function P0SimulationHome() {
  const incidents = [
    {
      id: "INC-001",
      title: "Global Checkout Failure",
      severity: "P0",
      status: "Active",
      timer: "04:12",
      service: "Checkout-API",
      description: "Users reporting 500 errors during final checkout step. 45% drop in conversion.",
    },
    {
      id: "INC-002",
      title: "Authentication Loop",
      severity: "P0",
      status: "Scheduled",
      timer: "20:00",
      service: "Auth-Service",
      description: "Intermittent session invalidation across mobile clients.",
    }
  ];

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Group justify="space-between" align="center">
          <div>
            <Title order={1} style={{ fontSize: '2.5rem', fontWeight: 900 }}>
              Incident Command Center
            </Title>
            <Text c="dimmed" size="lg">
              Manage and resolve critical production outages in real-time.
            </Text>
          </div>
          <Badge size="xl" color="red" variant="filled">
            SLA: 99.9%
          </Badge>
        </Group>

        <Box pos="relative">
          <Overlay
            gradient="linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.9) 100%)"
            opacity={0.95}
            zIndex={10}
            radius="md"
            blur={3}
          >
            <Center h="100%">
              <Stack align="center" gap="xs">
                <ThemeIcon size={80} radius="xl" color="red" variant="light">
                  <div style={{ fontSize: 40 }}>⚠️</div>
                </ThemeIcon>
                <Title order={2} c="white">P0 Simulation Coming Soon</Title>
                <Text c="gray.4" size="lg" ta="center" maw={500}>
                  We are building a high-pressure environment where you'll debug 
                  multi-service distributed systems under strict SLA timers.
                </Text>
                <Badge size="lg" color="yellow" variant="outline" mt="md">
                  Under Construction
                </Badge>
              </Stack>
            </Center>
          </Overlay>

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            {incidents.map((incident) => (
              <Card key={incident.id} withBorder padding="lg" radius="md" style={{ opacity: 0.5 }}>
                <Group justify="space-between" mb="xs">
                  <Badge color="red" variant="light">{incident.severity}</Badge>
                  <Text size="xs" c="dimmed" ff="monospace">{incident.id}</Text>
                </Group>

                <Title order={3} mb="sm">{incident.title}</Title>
                <Text size="sm" c="dimmed" mb="md" lineClamp={2}>
                  {incident.description}
                </Text>

                <Group gap="xs" mb="md">
                  <ThemeIcon variant="light" color="blue" size="sm">
                    🔥
                  </ThemeIcon>
                  <Text size="xs" fw={700}>{incident.service}</Text>
                </Group>

                <Group justify="space-between" mt="auto">
                  <Text size="sm" fw={700} c="red" ff="monospace">
                    SLA Timer: {incident.timer}
                  </Text>
                  <div style={{ fontSize: 16 }}>🔒</div>
                </Group>
              </Card>
            ))}
          </SimpleGrid>

          <Paper withBorder p="xl" radius="md" mt="xl" style={{ opacity: 0.3 }}>
            <Title order={4} mb="lg">Incident Timeline (Preview)</Title>
            <Timeline active={1} bulletSize={24} lineWidth={2}>
              <Timeline.Item title="System Alert">
                <Text c="dimmed" size="sm">Anomalous spike in 5xx errors detected in us-east-1.</Text>
                <Text size="xs" mt={4}>2 minutes ago</Text>
              </Timeline.Item>

              <Timeline.Item title="On-Call Notified">
                <Text c="dimmed" size="sm">PagerDuty escalated to Tier 1 SRE.</Text>
                <Text size="xs" mt={4}>1 minute ago</Text>
              </Timeline.Item>

              <Timeline.Item title="Initial Triage">
                <Text c="dimmed" size="sm">Identifying root cause in shared library dependency...</Text>
                <Text size="xs" mt={4}>Just now</Text>
              </Timeline.Item>
            </Timeline>
          </Paper>
        </Box>
      </Stack>
    </Container>
  );
}
