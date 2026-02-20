'use client';

import React, { useEffect, useState } from 'react';
import {
  Container,
  Title,
  Text,
  SimpleGrid,
  Card,
  Group,
  Badge,
  Progress,
  Stack,
  Skeleton,
  Box,
  Tooltip,
} from '@mantine/core';
import { IconStack3, IconChartBar } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

interface ProjectSummary {
  id: number;
  name: string;
  questionCount: number;
  todo: number;
  inProgress: number;
  done: number;
}

function ProjectCard({ project }: { project: ProjectSummary }) {
  const router = useRouter();
  const total = project.questionCount || 1;
  const donePct = Math.round((project.done / total) * 100);
  const inProgressPct = Math.round((project.inProgress / total) * 100);

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      style={{
        cursor: 'pointer',
        transition: 'box-shadow 0.15s ease, transform 0.1s ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = '';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '';
      }}
      onClick={() => router.push(`/projects/${encodeURIComponent(project.name)}/board`)}
    >
      <Stack gap="sm">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <Group gap={8}>
            <IconStack3 size={18} color="var(--mantine-color-blue-5)" />
            <Text fw={700} size="md">
              {project.name}
            </Text>
          </Group>
          <Badge variant="outline" size="sm" color="gray">
            {project.questionCount} issues
          </Badge>
        </Group>

        {/* Progress bar */}
        <Tooltip
          label={`Todo: ${project.todo}  ·  In Progress: ${project.inProgress}  ·  Done: ${project.done}`}
          withinPortal
        >
          <Box>
            <Progress.Root size="md" radius="sm">
              <Progress.Section value={donePct} color="teal" />
              <Progress.Section value={inProgressPct} color="blue" />
            </Progress.Root>
          </Box>
        </Tooltip>

        {/* Stats row */}
        <Group gap="md">
          <Group gap={4}>
            <Badge size="xs" color="gray" variant="dot">Todo</Badge>
            <Text size="xs" c="dimmed">{project.todo}</Text>
          </Group>
          <Group gap={4}>
            <Badge size="xs" color="blue" variant="dot">In Progress</Badge>
            <Text size="xs" c="dimmed">{project.inProgress}</Text>
          </Group>
          <Group gap={4}>
            <Badge size="xs" color="teal" variant="dot">Done</Badge>
            <Text size="xs" c="dimmed">{project.done}</Text>
          </Group>
        </Group>
      </Stack>
    </Card>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/topics')
      .then((r) => r.json())
      .then((data) => setProjects(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Container size="xl" py="xl">
      {/* Page header */}
      <Group mb="xs" align="center" gap="sm">
        <IconChartBar size={28} color="var(--mantine-color-blue-5)" />
        <Title order={2}>Projects</Title>
      </Group>
      <Text c="dimmed" mb="xl" size="sm">
        Each project is a DSA / LLD topic. Pick one and grind through its issues on the board.
      </Text>

      {loading ? (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height={160} radius="md" />
          ))}
        </SimpleGrid>
      ) : projects.length === 0 ? (
        <Text c="dimmed">No projects yet. Add topics and questions to get started.</Text>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </SimpleGrid>
      )}
    </Container>
  );
}
