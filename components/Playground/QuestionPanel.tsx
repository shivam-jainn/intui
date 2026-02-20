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
    <Box mb="md">
      <Title order={1}>{children}</Title>
    </Box>
  ),
  h2: ({ children }: { children: React.ReactNode }) => (
    <Box mb="md" mt="lg">
      <Title order={2}>{children}</Title>
    </Box>
  ),
  h3: ({ children }: { children: React.ReactNode }) => (
    <Box mb="sm" mt="md">
      <Title order={3}>{children}</Title>
    </Box>
  ),
  p: ({ children }: { children: React.ReactNode }) => (
    <Box mb="xs">
      <Text>{children}</Text>
    </Box>
  ),
  pre: ({ children }: { children: React.ReactNode }) => (
    <Box
      component="pre"
      mb="xs"
      mt="xs"
      p="md"
      bg="dark.8"
      style={{
        borderRadius: 'var(--mantine-radius-sm)',
        overflowX: 'auto',
        color: 'white',
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
          px={4}
          bg="dark.6"
          color="white"
          style={{
            borderRadius: 'var(--mantine-radius-sm)',
            fontSize: '0.9em',
            fontFamily: 'monospace',
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
    <Stack h="100%" style={{ minHeight: '100vh' }}>
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
            />

            <Group align="center" gap="xs" mb="xs">
              <Badge size="lg">{difficulty}</Badge>
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
                  },
                }}
                w={130}
              />
              {companies.map((companyData, index) => (
                <Badge key={index} color="orange" size="lg" variant="dot">
                  {companyData.company.name}
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
              <Accordion defaultValue="topics" chevronPosition="right">
                <Accordion.Item value="topics">
                  <Accordion.Control>Topics</Accordion.Control>
                  <Accordion.Panel>
                    <Group>
                      {topics.map((topicData, index) => (
                        <Badge key={index}>{topicData.topic.name}</Badge>
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
          />

          {submissionLoading ? (
            <Group justify="center" py="xl">
              <Loader size="sm" />
            </Group>
          ) : submissionError ? (
            <Text c="red">{submissionError}</Text>
          ) : submissions.length === 0 ? (
            <Text c="dimmed">No submissions yet. Click Submit to create one.</Text>
          ) : (
            <Stack>
              {submissions.map((submission) => (
                <Card withBorder radius="md" key={submission.id}>
                  <Group justify="space-between" align="center">
                    <Group gap="xs">
                      <Badge color={getSubmissionBadgeColor(submission.status)}>
                        {submission.status}
                      </Badge>
                      <Badge variant="light">{submission.language.toUpperCase()}</Badge>
                    </Group>
                    <Text size="sm" c="dimmed">
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
