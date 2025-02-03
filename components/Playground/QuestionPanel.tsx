"use client";
import { Stack, Title, Group, Badge, Container, SegmentedControl, Accordion, Text, Box } from '@mantine/core';
import React, { useState } from 'react';
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

export default function QuestionPanel({
  questionTitle,
  difficulty,
  companies,
  description,
  topics,
}: {
  questionTitle: string;
  difficulty: string;
  companies: string[];
  description: string;
  topics: any[];
}) {
  const [tab, setTab] = useState<string>('description');

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

            <Title order={1}>{questionTitle}</Title>

            <Group align="flex-start" gap="xs">
              <Badge size="lg">{difficulty}</Badge>
              {companies.map((company, index) => (
                <Badge key={index} color="orange" size="lg">
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
        <Stack>
          <SegmentedControl
            value={tab}
            onChange={setTab}
            data={[
              { label: 'Description', value: 'description' },
              { label: 'Submission', value: 'submission' },
            ]}
          />
          TODO : Submission
        </Stack>
      )}
    </Stack>
  );
}