'use client';

import { Card, Text, Badge, Group, Stack, Tooltip } from '@mantine/core';
import { IconBuilding } from '@tabler/icons-react';
import React from 'react';

export type IssueStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface Issue {
  id: number;
  name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: IssueStatus;
  description?: string;
  topics: { topic: { name: string } }[];
  companies: { company: { name: string } }[];
}

interface IssueCardProps {
  issue: Issue;
  dragHandleProps?: Record<string, any>;
  isDragging?: boolean;
  onClick?: () => void;
}

const difficultyColor: Record<string, string> = {
  Easy: 'teal',
  Medium: 'yellow',
  Hard: 'red',
};

export default function IssueCard({ issue, dragHandleProps, isDragging, onClick }: IssueCardProps) {
  return (
    <Card
      shadow={isDragging ? 'xl' : 'sm'}
      padding="sm"
      radius="md"
      withBorder
      style={{
        cursor: 'grab',
        opacity: isDragging ? 0.85 : 1,
        transform: isDragging ? 'rotate(2deg)' : undefined,
        transition: 'box-shadow 0.15s ease, transform 0.1s ease',
        userSelect: 'none',
        borderLeft: `3px solid var(--mantine-color-${difficultyColor[issue.difficulty]}-6)`,
      }}
      {...dragHandleProps}
    >
      <Stack gap={6}>
        {/* Issue key + title */}
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Text
            size="sm"
            fw={600}
            lineClamp={2}
            style={{ cursor: 'pointer', flex: 1 }}
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
          >
            {issue.name}
          </Text>
        </Group>

        {/* Difficulty */}
        <Group gap={4} wrap="wrap">
          <Badge size="xs" color={difficultyColor[issue.difficulty]} variant="light">
            {issue.difficulty}
          </Badge>

          {/* Up to 2 topic tags */}
          {issue.topics.slice(0, 2).map((t) => (
            <Badge key={t.topic.name} size="xs" color="blue" variant="outline">
              {t.topic.name}
            </Badge>
          ))}
        </Group>

        {/* Companies row */}
        {issue.companies.length > 0 && (
          <Group gap={4} wrap="wrap">
            <IconBuilding size={12} color="var(--mantine-color-dimmed)" />
            {issue.companies.slice(0, 3).map((c) => (
              <Tooltip key={c.company.name} label={c.company.name} withinPortal>
                <Badge size="xs" color="orange" variant="dot">
                  {c.company.name.length > 10 ? `${c.company.name.slice(0, 10)}…` : c.company.name}
                </Badge>
              </Tooltip>
            ))}
            {issue.companies.length > 3 && (
              <Text size="xs" c="dimmed">+{issue.companies.length - 3}</Text>
            )}
          </Group>
        )}
      </Stack>
    </Card>
  );
}
