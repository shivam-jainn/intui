"use client";
import { Stack, Title, Group, Badge, Container, SegmentedControl, Accordion, Text, Box, Card, ScrollArea, Code, ThemeIcon } from '@mantine/core';
import React, { useState } from 'react';
import Markdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import { IconClock, IconDeviceDesktop, IconCheck, IconX } from '@tabler/icons-react';

type MarkdownComponentsType = {
  [key: string]: React.FC<any>;
};

const MarkdownComponents: MarkdownComponentsType = {
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
      style={{ borderRadius: 'var(--mantine-radius-sm)', overflowX: 'auto', color: 'white' }}
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
          style={{ borderRadius: 'var(--mantine-radius-sm)', fontSize: '0.9em', fontFamily: 'monospace' }}
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

const difficultyColor: Record<string, string> = {
  Easy: "blue",
  Medium: "yellow",
  Hard: "red",
};

interface Submission {
  id: number;
  code: string;
  language: string;
  status: string;
  timeTaken: number | null;
  spaceTaken: number | null;
  createdAt: string;
}

export default function QuestionPanel({
  questionTitle,
  difficulty,
  companies,
  description,
  topics,
  submissions = [],
}: {
  questionTitle: string;
  difficulty: string;
  companies: string[];
  description: string;
  topics: any[];
  submissions?: Submission[];
}) {
  const [tab, setTab] = useState<string>('description');

  return (
    <Stack h="100%" style={{ maxHeight: '100%' }}>
      {tab === 'description' ? (
        <Box
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflowY: 'auto',
          }}
        >
          <Stack p="md" py="xl">
            <SegmentedControl
              value={tab}
              onChange={setTab}
              data={[
                { label: 'Description', value: 'description' },
                { label: 'Submissions', value: 'submission' },
              ]}
            />

            <Title order={1}>{questionTitle}</Title>

            <Group align="flex-start" gap="xs">
              <Badge size="lg" color={difficultyColor[difficulty] ?? "gray"} variant="light">
                {difficulty}
              </Badge>
              {companies.map((company, index) => (
                <Badge key={index} color="orange" size="lg" variant="dots">
                  {company}
                </Badge>
              ))}
            </Group>

            <Box
              style={(theme) => ({
                '& .math, & .math-display': {
                  padding: '0.5rem 0',
                  overflowX: 'auto',
                },
                '& ul, & ol': {
                  paddingLeft: '1.5rem',
                  margin: '0.5rem 0',
                },
                '& li': {
                  margin: '0.25rem 0',
                },
                '& strong': {
                  color: theme.white,
                },
                '& blockquote': {
                  borderLeft: '4px solid ' + theme.colors.blue[6],
                  paddingLeft: '1rem',
                  margin: '1rem 0',
                  color: theme.colors.gray[3],
                },
              })}
            >
              <Markdown
                components={MarkdownComponents}
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
                      {topics.map((element, index) => (
                        <Badge key={index}>{element.topic.name}</Badge>
                      ))}
                    </Group>
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>
            </Box>
          </Stack>
        </Box>
      ) : (
        <Box style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Stack p="md" pb={0}>
            <SegmentedControl
              value={tab}
              onChange={setTab}
              data={[
                { label: 'Description', value: 'description' },
                { label: 'Submissions', value: 'submission' },
              ]}
            />
          </Stack>
          <ScrollArea flex={1} p="md">
            {submissions.length === 0 ? (
              <Box
                p="xl"
                ta="center"
                style={{
                  border: '1px dashed var(--mantine-color-dark-4)',
                  borderRadius: 'var(--mantine-radius-md)',
                }}
              >
                <Text c="dimmed" size="sm">No submissions yet. Submit your code to see it here.</Text>
              </Box>
            ) : (
              <Stack gap="md">
                {submissions.map((submission) => (
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
                          {submission.status === 'Accepted' ? (
                            <IconCheck size={14} />
                          ) : (
                            <IconX size={14} />
                          )}
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
                      <Code block style={{ fontSize: 11, background: 'transparent', color: 'var(--mantine-color-gray-3)' }}>
                        {submission.code.slice(0, 300)}{submission.code.length > 300 ? '...' : ''}
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
                          {submission.spaceTaken !== null ? `${submission.spaceTaken.toFixed(1)} MB` : 'N/A'}
                        </Text>
                      </Group>
                    </Group>
                  </Card>
                ))}
              </Stack>
            )}
          </ScrollArea>
        </Box>
      )}
    </Stack>
  );
}
