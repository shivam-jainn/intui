'use client';

import React from 'react';
import {
  Modal,
  Group,
  Badge,
  Button,
  Text,
  Divider,
  Box,
  ScrollArea,
  Title,
} from '@mantine/core';
import { IconExternalLink, IconBuilding } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import Markdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import type { Issue } from './IssueCard';

const difficultyColor: Record<string, string> = {
  Easy: 'teal',
  Medium: 'yellow',
  Hard: 'red',
};

const statusColor: Record<string, string> = {
  TODO: 'gray',
  IN_PROGRESS: 'blue',
  DONE: 'teal',
};

const statusLabel: Record<string, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

type MarkdownComponentsType = { [key: string]: React.FC<any> };

const MarkdownComponents: MarkdownComponentsType = {
  h1: ({ children }) => <Title order={2} mb="sm">{children}</Title>,
  h2: ({ children }) => <Title order={3} mb="sm" mt="md">{children}</Title>,
  h3: ({ children }) => <Title order={4} mb="xs" mt="sm">{children}</Title>,
  p: ({ children }) => <Text size="sm" mb="sm" style={{ lineHeight: 1.7 }}>{children}</Text>,
  pre: ({ children }) => (
    <Box
      component="pre"
      style={{
        background: 'var(--mantine-color-dark-6)',
        borderRadius: 6,
        padding: '10px 14px',
        overflowX: 'auto',
        fontSize: 13,
        marginBottom: 12,
      }}
    >
      {children}
    </Box>
  ),
  code: ({ inline, children }: { inline?: boolean; children: React.ReactNode }) =>
    inline ? (
      <Box
        component="code"
        style={{
          background: 'var(--mantine-color-dark-5)',
          borderRadius: 3,
          padding: '1px 5px',
          fontSize: 12,
        }}
      >
        {children}
      </Box>
    ) : (
      <code>{children}</code>
    ),
  ul: ({ children }) => (
    <Box component="ul" pl="lg" mb="sm" style={{ fontSize: 14 }}>{children}</Box>
  ),
  ol: ({ children }) => (
    <Box component="ol" pl="lg" mb="sm" style={{ fontSize: 14 }}>{children}</Box>
  ),
  li: ({ children }) => <li style={{ marginBottom: 4 }}>{children}</li>,
};

interface IssueModalProps {
  opened: boolean;
  issue: Issue | null;
  onClose: () => void;
}

export default function IssueModal({ opened, issue, onClose }: IssueModalProps) {
  const router = useRouter();

  if (!issue) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="xl"
      radius="md"
      padding="xl"
      withCloseButton={false}
      styles={{
        body: { padding: 0 },
        content: { overflow: 'hidden' },
      }}
    >
      {/* ── Header ── */}
      <Box px="xl" pt="xl" pb="md">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Text fw={700} size="lg" style={{ flex: 1, lineHeight: 1.3 }}>
            {issue.name}
          </Text>
          <Button
            size="xs"
            variant="light"
            color="blue"
            rightSection={<IconExternalLink size={13} />}
            onClick={() => {
              onClose();
              router.push(`/${encodeURIComponent(issue.name)}`);
            }}
            style={{ flexShrink: 0 }}
          >
            Open in editor
          </Button>
        </Group>

        {/* Meta badges */}
        <Group gap={6} mt="sm" wrap="wrap">
          <Badge size="sm" color={difficultyColor[issue.difficulty]} variant="light">
            {issue.difficulty}
          </Badge>
          <Badge size="sm" color={statusColor[issue.status]} variant="filled">
            {statusLabel[issue.status]}
          </Badge>
          {issue.topics.map((t) => (
            <Badge key={t.topic.name} size="sm" color="blue" variant="outline">
              {t.topic.name}
            </Badge>
          ))}
          {issue.companies.length > 0 && (
            <>
              <Text size="xs" c="dimmed">·</Text>
              <IconBuilding size={14} color="var(--mantine-color-dimmed)" />
              {issue.companies.slice(0, 4).map((c) => (
                <Badge key={c.company.name} size="sm" color="orange" variant="dot">
                  {c.company.name}
                </Badge>
              ))}
              {issue.companies.length > 4 && (
                <Text size="xs" c="dimmed">+{issue.companies.length - 4} more</Text>
              )}
            </>
          )}
        </Group>
      </Box>

      <Divider />

      {/* ── Description ── */}
      <ScrollArea h={480} scrollbarSize={6}>
        <Box px="xl" py="lg">
          {issue.description ? (
            <Markdown
              remarkPlugins={[remarkMath, remarkGfm]}
              rehypePlugins={[rehypeKatex, rehypeRaw]}
              components={MarkdownComponents}
            >
              {issue.description}
            </Markdown>
          ) : (
            <Text c="dimmed" size="sm">No description available.</Text>
          )}
        </Box>
      </ScrollArea>
    </Modal>
  );
}
