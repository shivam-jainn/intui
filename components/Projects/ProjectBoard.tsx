'use client';

import React, { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useSensor,
  useSensors,
  PointerSensor,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import { Box, Text, Stack, Paper, Badge, Group, Loader, Center } from '@mantine/core';
import IssueCard, { Issue, IssueStatus } from './IssueCard';
import IssueModal from './IssueModal';

// ── Column colours ──────────────────────────────────────────────────────────
export const COLUMNS: { id: IssueStatus; label: string; color: string }[] = [
  { id: 'TODO', label: 'To Do', color: 'gray' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'blue' },
  { id: 'DONE', label: 'Done', color: 'teal' },
];

// ── Droppable column ─────────────────────────────────────────────────────────
function Column({
  column,
  issues,
  activeId,
  onCardClick,
}: {
  column: (typeof COLUMNS)[0];
  issues: Issue[];
  activeId: string | null;
  onCardClick: (issue: Issue) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <Paper
      ref={setNodeRef}
      p="md"
      radius="md"
      withBorder
      style={{
        flex: 1,
        minWidth: 280,
        minHeight: 500,
        backgroundColor: isOver
          ? 'var(--mantine-color-dark-6)'
          : 'var(--mantine-color-dark-7)',
        transition: 'background-color 0.15s ease',
        border: isOver ? '2px dashed var(--mantine-color-blue-5)' : undefined,
      }}
    >
      {/* Column header */}
      <Group mb="md" justify="space-between">
        <Group gap={8}>
          <Badge color={column.color} variant="filled" radius="sm">
            {column.label}
          </Badge>
          <Text size="sm" c="dimmed" fw={500}>
            {issues.length}
          </Text>
        </Group>
      </Group>

      {/* Issue cards */}
      <Stack gap="xs">
        {issues.length === 0 && (
          <Center h={80}>
            <Text size="xs" c="dimmed">Drop issues here</Text>
          </Center>
        )}
        {issues.map((issue) => (
          <DraggableCard
            key={issue.id}
            issue={issue}
            isDimmed={activeId === String(issue.id)}
            onCardClick={onCardClick}
          />
        ))}
      </Stack>
    </Paper>
  );
}

// ── Draggable wrapper ─────────────────────────────────────────────────────────
function DraggableCard({
  issue,
  onCardClick,
}: {
  issue: Issue;
  isDimmed: boolean;
  onCardClick: (issue: Issue) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: String(issue.id),
    data: { issue },
  });

  // Track whether the pointer actually moved so we don't open the modal
  // after a drag gesture completes.
  const hasMoved = React.useRef(false);

  return (
    <div
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0 : 1 }}
      {...attributes}
      {...{
        ...listeners,
        onPointerDown: (e: React.PointerEvent) => {
          hasMoved.current = false;
          (listeners as any)?.onPointerDown?.(e);
        },
        onPointerMove: (e: React.PointerEvent) => {
          hasMoved.current = true;
          (listeners as any)?.onPointerMove?.(e);
        },
      }}
      onClick={() => {
        if (!hasMoved.current) onCardClick(issue);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onCardClick(issue);
      }}
    >
      <IssueCard issue={issue} isDragging={false} onClick={() => onCardClick(issue)} />
    </div>
  );
}

// ── Main board ────────────────────────────────────────────────────────────────
interface ProjectBoardProps {
  topicName: string;
  initialIssues: Issue[];
}

export default function ProjectBoard({ topicName, initialIssues }: ProjectBoardProps) {
  const [issues, setIssues] = useState<Issue[]>(initialIssues);
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const grouped = useCallback(
    (status: IssueStatus) => issues.filter((i) => i.status === status),
    [issues]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const id = Number(event.active.id);
    setActiveIssue(issues.find((i) => i.id === id) ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveIssue(null);

    if (!over) return;

    const newStatus = over.id as IssueStatus;
    const issueId = Number(active.id);
    const issue = issues.find((i) => i.id === issueId);

    if (!issue || issue.status === newStatus) return;

    // Optimistic update
    setIssues((prev) =>
      prev.map((i) => (i.id === issueId ? { ...i, status: newStatus } : i))
    );

    setUpdating(issueId);
    try {
      const res = await fetch(`/api/question/${encodeURIComponent(issue.name)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
    } catch {
      // Roll back on error
      setIssues((prev) =>
        prev.map((i) => (i.id === issueId ? { ...i, status: issue.status } : i))
      );
    } finally {
      setUpdating(null);
    }
  };

  return (
    <Box>
      {/* Board heading */}
      <Group mb="xl" align="center" gap="xs">
        <Text fw={700} size="xl" tt="uppercase" style={{ letterSpacing: 1 }}>
          {topicName}
        </Text>
        <Text size="sm" c="dimmed">/ Board</Text>
        {updating !== null && <Loader size="xs" ml="sm" />}
      </Group>

      {/* Kanban columns */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Group align="flex-start" gap="md" wrap="nowrap" style={{ overflowX: 'auto' }}>
          {COLUMNS.map((col) => (
            <Column
              key={col.id}
              column={col}
              issues={grouped(col.id)}
              activeId={activeIssue ? String(activeIssue.id) : null}
              onCardClick={setSelectedIssue}
            />
          ))}
        </Group>

        {/* Drag overlay (floating ghost card) */}
        <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
          {activeIssue && <IssueCard issue={activeIssue} isDragging />}
        </DragOverlay>
      </DndContext>

      {/* Issue detail modal */}
      <IssueModal
        opened={!!selectedIssue}
        issue={selectedIssue}
        onClose={() => setSelectedIssue(null)}
      />
    </Box>
  );
}
