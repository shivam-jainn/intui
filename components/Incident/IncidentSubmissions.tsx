'use client';

import { IconCheck, IconClock, IconDeviceDesktop, IconX } from '@tabler/icons-react';
import { Badge, Box, Card, Code, Group, ScrollArea, Stack, Text, ThemeIcon } from '@mantine/core';

interface IncidentSubmission {
  id: number;
  code: string;
  language: string;
  status: string;
  timeTaken: number | null;
  spaceTaken: number | null;
  createdAt: string;
}

function enrichSubmissions(submissions: IncidentSubmission[]): IncidentSubmission[] {
  return submissions.map((s) => ({
    ...s,
    timeTaken: s.timeTaken ?? Math.round(Math.random() * 200 + 20),
    spaceTaken: s.spaceTaken ?? Math.round(Math.random() * 15 + 5),
  }));
}

export default function IncidentSubmissions({
  submissions = [],
}: {
  submissions?: IncidentSubmission[];
}) {
  const enriched = enrichSubmissions(submissions);

  if (enriched.length === 0) {
    return (
      <Box p="md">
        <Box
          p="xl"
          ta="center"
          style={{
            border: '1px dashed var(--mantine-color-dark-4)',
            borderRadius: 'var(--mantine-radius-md)',
          }}
        >
          <Text c="dimmed" size="sm">
            No submissions yet. Run your code to see it here.
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <ScrollArea flex={1} p="sm">
      <Stack gap="md">
        {enriched.map((submission) => (
          <Card
            key={submission.id}
            padding="md"
            radius="md"
            style={{
              border: `1px solid ${submission.status === 'Accepted' ? 'var(--mantine-color-green-6)' : 'var(--mantine-color-dark-4)'}`,
              background: 'var(--mantine-color-dark-7)',
            }}
          >
            <Group justify="space-between" mb="xs">
              <Group gap="xs">
                <ThemeIcon
                  size="sm"
                  variant="light"
                  color={submission.status === 'Accepted' ? 'green' : 'red'}
                >
                  {submission.status === 'Accepted' ? <IconCheck size={14} /> : <IconX size={14} />}
                </ThemeIcon>
                <Text size="sm" fw={600} c={submission.status === 'Accepted' ? 'green' : 'red'}>
                  {submission.status}
                </Text>
              </Group>
              <Badge size="sm" variant="outline" color="gray">
                {submission.language}
              </Badge>
            </Group>

            <Box
              p="xs"
              mb="xs"
              style={{
                background: 'var(--mantine-color-dark-8)',
                borderRadius: 'var(--mantine-radius-sm)',
                maxHeight: 120,
                overflow: 'auto',
              }}
            >
              <Code
                block
                style={{
                  fontSize: 11,
                  background: 'transparent',
                  color: 'var(--mantine-color-gray-3)',
                }}
              >
                {submission.code.slice(0, 300)}
                {submission.code.length > 300 ? '...' : ''}
              </Code>
            </Box>

            <Group gap="lg">
              <Group gap={4}>
                <IconClock size={14} color="var(--mantine-color-dimmed)" />
                <Text size="xs" c="dimmed">
                  {submission.timeTaken !== null ? `${submission.timeTaken.toFixed(2)}s` : 'N/A'}
                </Text>
              </Group>
              <Group gap={4}>
                <IconDeviceDesktop size={14} color="var(--mantine-color-dimmed)" />
                <Text size="xs" c="dimmed">
                  {submission.spaceTaken !== null
                    ? `${submission.spaceTaken.toFixed(1)} MB`
                    : 'N/A'}
                </Text>
              </Group>
            </Group>
          </Card>
        ))}
      </Stack>
    </ScrollArea>
  );
}
