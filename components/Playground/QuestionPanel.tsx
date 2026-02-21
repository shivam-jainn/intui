'use client';

import {
  Accordion,
  Badge,
  Box,
  Card,
  Group,
  Loader,
  SegmentedControl,
  Select,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import React, { useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import './QuestionPanel.css';

type MarkdownComponentsType = {
  [key: string]: React.FC<any>;
};

type Submission = {
  id: number;
  language: string;
  status: string;
  createdAt: string;
};

const statusColor: Record<string, string> = {
  TODO: 'gray',
  IN_PROGRESS: 'blue',
  DONE: 'teal',
};

const markdownComponents: MarkdownComponentsType = {
  h1: ({ children }: { children: React.ReactNode }) => (
    <Box mb="lg">
      <Title order={1} size="h2" fw={700} c="var(--mantine-color-text)">{children}</Title>
    </Box>
  ),
  h2: ({ children }: { children: React.ReactNode }) => (
    <Box mb="md" mt="xl">
      <Title order={2} size="h3" fw={600} c="var(--mantine-color-text)">{children}</Title>
    </Box>
  ),
  h3: ({ children }: { children: React.ReactNode }) => (
    <Box mb="sm" mt="lg">
      <Title order={3} size="h4" fw={600} c="var(--mantine-color-text)">{children}</Title>
    </Box>
  ),
  p: ({ children }: { children: React.ReactNode }) => (
    <Box mb="md">
      <Text size="md" c="var(--mantine-color-text)" lh={1.6}>{children}</Text>
    </Box>
  ),
  pre: ({ children }: { children: React.ReactNode }) => (
    <Box
      component="pre"
      mb="md"
      mt="xs"
      p="md"
      bg="var(--mantine-color-default)"
      style={{
        borderRadius: 'var(--mantine-radius-md)',
        overflowX: 'auto',
        color: 'var(--mantine-color-text)',
        border: '1px solid var(--mantine-color-default-border)',
        fontSize: '0.9em',
        lineHeight: 1.5,
      }}
    >
      {children}
    </Box>
  ),
  code: ({ inline, children }: { inline: boolean; children: React.ReactNode }) => {
    if (inline) {
      return (
        <Box
          component="code"
          px={6}
          py={2}
          bg="var(--mantine-color-default)"
          color="var(--mantine-color-text)"
          style={{
            borderRadius: 'var(--mantine-radius-sm)',
            fontSize: '0.85em',
            fontFamily: 'monospace',
            border: '1px solid var(--mantine-color-default-border)',
          }}
        >
          {children}
        </Box>
      );
    }

    return <code>{children}</code>;
  },
  hr: () => (
    <Box
      component="hr"
      my="md"
      style={{ border: 'none', borderTop: '1px solid var(--mantine-color-gray-7)' }}
    />
  ),
};

export default function QuestionPanel({
  questionTitle,
  difficulty,
  companies,
  description,
  topics,
  status: initialStatus,
}: {
  questionTitle: string;
  difficulty: string;
  companies: { company: { name: string } }[];
  description: string;
  topics: { topic: { name: string } }[];
  status?: string;
}) {
  const [tab, setTab] = useState<string>('description');
  const [status, setStatus] = useState<string>(initialStatus ?? 'TODO');
  const [updating, setUpdating] = useState(false);

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const getSubmissionBadgeColor = (submissionStatus: string) => {
    switch (submissionStatus) {
      case 'ACCEPTED':
        return 'green';
      case 'WRONG_ANSWER':
        return 'red';
      default:
        return 'gray';
    }
  };

  async function fetchSubmissions() {
    setSubmissionLoading(true);
    setSubmissionError(null);

    try {
      const response = await fetch(
        `/api/question/${encodeURIComponent(questionTitle)}/submissions`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch submissions');
      }

      const data = await response.json();
      setSubmissions(Array.isArray(data) ? data : []);
    } catch {
      setSubmissionError('Failed to load submissions. Please try again.');
    } finally {
      setSubmissionLoading(false);
    }
  }

  async function handleStatusChange(newStatus: string | null) {
    if (!newStatus || newStatus === status) {
      return;
    }

    setStatus(newStatus);
    setUpdating(true);

    try {
      await fetch(`/api/question/${encodeURIComponent(questionTitle)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } finally {
      setUpdating(false);
    }
  }

  useEffect(() => {
    if (tab === 'submission') {
      fetchSubmissions();
    }
  }, [tab, questionTitle]);

  return (
    <Stack h="100%" style={{ minHeight: '100vh' }} bg="var(--mantine-color-body)">
      {tab === 'description' ? (
        <Box style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
          <Stack p="md" py="xl">
            <SegmentedControl
              value={tab}
              onChange={setTab}
              data={[
                { label: 'Description', value: 'description' },
                { label: 'Submission', value: 'submission' },
              ]}
              mb="md"
              bg="var(--mantine-color-default)"
              styles={{
                root: {
                  backgroundColor: 'var(--mantine-color-default)',
                },
                control: {
                  border: 'none',
                },
                label: {
                  color: 'var(--mantine-color-text)',
                  '&[data-active]': {
                    color: 'var(--mantine-color-text)',
                  },
                },
              }}
            />

            <Group align="center" gap="xs" mb="xs">
              <Badge size="lg" color="blue" variant="filled">
                {difficulty}
              </Badge>
              <Select
                size="xs"
                value={status}
                onChange={handleStatusChange}
                disabled={updating}
                data={[
                  { value: 'TODO', label: 'To Do' },
                  { value: 'IN_PROGRESS', label: 'In Progress' },
                  { value: 'DONE', label: 'Done' },
                ]}
                styles={{
                  input: {
                    borderColor: `var(--mantine-color-${statusColor[status]}-6)`,
                    color: `var(--mantine-color-${statusColor[status]}-6)`,
                    fontWeight: 600,
                    backgroundColor: 'var(--mantine-color-default)',
                  },
                }}
                w={130}
              />
              {companies.map((companyData, index) => (
                <Badge key={index} color="var(--mantine-color-default)" size="lg" variant="filled" leftSection={<Box w={8} h={8} bg="orange" style={{ borderRadius: '50%' }} />}>
                  <Text size="xs" c="var(--mantine-color-text)">{companyData.company.name}</Text>
                </Badge>
              ))}
            </Group>

            <Box className="question-panel-markdown">
              <Markdown
                components={markdownComponents}
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[rehypeKatex, rehypeRaw]}
              >
                {description}
              </Markdown>
            </Box>

            <Box pb="xl" mb="xl">
              <Accordion defaultValue="topics" chevronPosition="right" variant="separated">
                <Accordion.Item value="topics" style={{ backgroundColor: 'var(--mantine-color-default)', border: '1px solid var(--mantine-color-default-border)' }}>
                  <Accordion.Control style={{ color: 'var(--mantine-color-text)' }}>Topics</Accordion.Control>
                  <Accordion.Panel>
                    <Group>
                      {topics.map((topicData, index) => (
                        <Badge key={index} color="var(--mantine-color-default-hover)" variant="filled">
                          <Text size="xs" c="var(--mantine-color-text)">{topicData.topic.name}</Text>
                        </Badge>
                      ))}
                    </Group>
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>
            </Box>
          </Stack>
        </Box>
      ) : (
        <Stack p="md" py="xl">
          <SegmentedControl
            value={tab}
            onChange={setTab}
            data={[
              { label: 'Description', value: 'description' },
              { label: 'Submission', value: 'submission' },
            ]}
            mb="md"
            bg="var(--mantine-color-default)"
            styles={{
              root: {
                backgroundColor: 'var(--mantine-color-default)',
              },
              control: {
                border: 'none',
              },
              label: {
                color: 'var(--mantine-color-text)',
                '&[data-active]': {
                  color: 'var(--mantine-color-text)',
                },
              },
            }}
          />

          {submissionLoading ? (
            <Group justify="center" py="xl">
              <Loader size="sm" />
            </Group>
          ) : submissionError ? (
            <Text c="red">{submissionError}</Text>
          ) : submissions.length === 0 ? (
            <Text c="var(--mantine-color-text)">No submissions yet. Click Submit to create one.</Text>
          ) : (
            <Stack>
              {submissions.map((submission) => (
                <Card withBorder radius="md" key={submission.id} bg="var(--mantine-color-default)" style={{ borderColor: 'var(--mantine-color-default-border)' }}>
                  <Group justify="space-between" align="center">
                    <Group gap="xs">
                      <Badge color={getSubmissionBadgeColor(submission.status)}>
                        {submission.status}
                      </Badge>
                      <Badge variant="light" color="gray">{submission.language.toUpperCase()}</Badge>
                    </Group>
                    <Text size="sm" c="var(--mantine-color-text)">
                      {new Date(submission.createdAt).toLocaleString()}
                    </Text>
                  </Group>
                </Card>
              ))}
            </Stack>
          )}
        </Stack>
      )}
    </Stack>
  );
}
