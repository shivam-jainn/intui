'use client';

import React, { useEffect, useState } from 'react';
import { Container, Text, Skeleton, Anchor, Group, Stack, Alert } from '@mantine/core';
import { IconAlertCircle, IconArrowLeft } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import ProjectBoard from '@/components/Projects/ProjectBoard';
import type { Issue } from '@/components/Projects/IssueCard';

interface BoardPageProps {
  params: { topic: string };
}

export default function BoardPage({ params }: BoardPageProps) {
  const topicName = decodeURIComponent(params.topic);
  const router = useRouter();

  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/questions?topic=${encodeURIComponent(topicName)}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to fetch issues');
        return r.json();
      })
      .then((data) => {
        // Normalise shape: companies comes as { company: { name } }[]
        setIssues(
          data.map((q: any) => ({
            id: q.id,
            name: q.name,
            difficulty: q.difficulty,
            status: q.status ?? 'TODO',
            description: q.description ?? '',
            topics: q.topics ?? [],
            companies: q.companies ?? [],
          }))
        );
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [topicName]);

  return (
    <Container size="xl" py="xl">
      {/* Breadcrumb */}
      <Group mb="lg" align="center">
        <Anchor
          size="sm"
          c="dimmed"
          onClick={() => router.push('/projects')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <IconArrowLeft size={14} />
          Projects
        </Anchor>
        <Text size="sm" c="dimmed">/</Text>
        <Text size="sm" fw={500}>{topicName}</Text>
      </Group>

      {loading && (
        <Stack gap="md">
          <Skeleton height={40} width={300} />
          <Group align="flex-start" gap="md">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height={500} width={300} radius="md" />
            ))}
          </Group>
        </Stack>
      )}

      {!loading && error && (
        <Alert icon={<IconAlertCircle />} color="red" title="Error">
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <ProjectBoard topicName={topicName} initialIssues={issues} />
      )}
    </Container>
  );
}
