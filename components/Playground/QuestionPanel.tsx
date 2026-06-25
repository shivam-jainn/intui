"use client";
import { Stack, Title, Group, Badge, SegmentedControl, Accordion, Text, Box, Button, Paper, Loader, ScrollArea } from '@mantine/core';
import React, { useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';

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

export default function QuestionPanel({
  questionSlug,
  questionTitle,
  difficulty,
  companies,
  description,
  topics,
}: {
  questionSlug: string;
  questionTitle: string;
  difficulty: string;
  companies: string[];
  description: string;
  topics: any[];
}) {
  const [tab, setTab] = useState<string>('description');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSubmissions() {
      if (tab !== "submission") return;

      setLoadingSubmissions(true);
      setSubmissionError(null);
      try {
        const response = await fetch(`/api/submissions?question=${encodeURIComponent(questionSlug)}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load submissions");
        }

        setSubmissions(Array.isArray(data.submissions) ? data.submissions : []);
      } catch (error: any) {
        setSubmissionError(error.message || "Failed to load submissions");
      } finally {
        setLoadingSubmissions(false);
      }
    }

    void loadSubmissions();
  }, [questionSlug, tab]);

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
                { label: 'Submission', value: 'submission' },
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
        <Stack h="100%" p="md" style={{ overflow: "hidden" }}>
          <SegmentedControl
            value={tab}
            onChange={setTab}
            data={[
              { label: 'Description', value: 'description' },
              { label: 'Submission', value: 'submission' },
            ]}
          />
          <Paper withBorder p="md" radius="md" style={{ background: "rgba(2, 6, 23, 0.35)", flex: 1 }}>
            <Stack gap="sm" h="100%">
              <Group justify="space-between" align="center">
                <Box>
                  <Text fw={600}>Your submissions</Text>
                  <Text size="xs" c="dimmed">
                    Latest submission attempts for this question.
                  </Text>
                </Box>
                <Button size="xs" variant="light" onClick={() => setTab("description")}>
                  Back to description
                </Button>
              </Group>

              {loadingSubmissions ? (
                <Group justify="center" py="xl">
                  <Loader size="sm" />
                </Group>
              ) : submissionError ? (
                <Text size="sm" c="red">{submissionError}</Text>
              ) : (
                <ScrollArea h="100%">
                  <Stack gap="sm">
                    {submissions.length === 0 ? (
                      <Text size="sm" c="dimmed">
                        No submissions yet. Run code from the editor, then press Submit.
                      </Text>
                    ) : (
                      submissions.map((submission) => (
                        <Paper key={submission.id} withBorder p="sm" radius="md">
                          <Group justify="space-between" align="center" mb={4}>
                            <Badge color={submission.status === "Accepted" ? "green" : "orange"} variant="filled">
                              {submission.status}
                            </Badge>
                            <Text size="xs" c="dimmed">
                              {new Date(submission.createdAt).toLocaleString()}
                            </Text>
                          </Group>
                          <Text size="xs" c="dimmed" mb={4}>
                            Language: {submission.language}
                          </Text>
                          <Box
                            component="pre"
                            p="sm"
                            style={{
                              margin: 0,
                              backgroundColor: "var(--mantine-color-dark-8)",
                              borderRadius: "var(--mantine-radius-sm)",
                              overflowX: "auto",
                              fontSize: 12,
                              color: "var(--mantine-color-gray-2)",
                            }}
                          >
                            <code>{submission.code}</code>
                          </Box>
                        </Paper>
                      ))
                    )}
                  </Stack>
                </ScrollArea>
              )}
            </Stack>
          </Paper>
        </Stack>
      )}
    </Stack>
  );
}
