'use client';

import { useState } from 'react';
import { IconPlayerPlay } from '@tabler/icons-react';
import { useAtom } from 'jotai';
import { Badge, Button, Card, Group, Notification, Select, Stack, Text } from '@mantine/core';
import {
  activeFilePathAtom,
  fileContentsAtom,
  incidentFilesAtom,
  incidentLeftTabAtom,
  incidentResultAtom,
  incidentRunningAtom,
} from '@/contexts/IncidentContext';
import { useQueryClient } from '@tanstack/react-query';

interface IncidentRunBarProps {
  incidentSlug: string;
  language: string;
  onLanguageChange: (lang: string) => void;
  availableLanguages: string[];
  entryFile: string;
}

export default function IncidentRunBar({
  incidentSlug,
  language,
  onLanguageChange,
  availableLanguages,
  entryFile,
}: IncidentRunBarProps) {
  const [files] = useAtom(incidentFilesAtom);
  const [activeFile] = useAtom(activeFilePathAtom);
  const [fileContents] = useAtom(fileContentsAtom);
  const [, setResult] = useAtom(incidentResultAtom);
  const [, setLeftTab] = useAtom(incidentLeftTabAtom);
  const [running, setRunning] = useAtom(incidentRunningAtom);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // The entry file to submit is the active editable file, fallback to declared entryFile
  function getSubmitCode(): { code: string; filePath: string } {
    const target = activeFile || entryFile;
    const fileData = files.find((f) => f.path === target && !f.readonly);
    const code = fileContents[target] ?? fileData?.content ?? '';
    return { code, filePath: target };
  }

  async function handleRun() {
    setError(null);
    setRunning(true);

    const { code, filePath } = getSubmitCode();

    if (!code || code.trim().length < 5) {
      setError('No code to run. Select or edit a source file first.');
      setRunning(false);
      return;
    }

    try {
      const executionFiles = files.map((file) => ({
        path: file.path,
        content: file.readonly ? file.content : (fileContents[file.path] ?? file.content),
        readonly: file.readonly,
        language: file.language,
      }));

      const response = await fetch('/api/incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incident_slug: incidentSlug,
          code,
          language,
          entryFile: filePath,
          files: executionFiles,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || data.error || 'Run failed');
        return;
      }

      setResult(data);
      setLeftTab('submissions');
      queryClient.invalidateQueries({ queryKey: ['incident-submissions', incidentSlug] });
    } catch (err: any) {
      setError('Network error: could not reach execution server.');
    } finally {
      setRunning(false);
    }
  }

  const langOptions = availableLanguages.map((l) => ({
    value: l,
    label: l.charAt(0).toUpperCase() + l.slice(1),
  }));

  return (
    <Stack gap={0}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          background: 'var(--bg-raised)',
          borderBottom: '1px solid var(--border-default)',
          padding: '10px 14px',
          gap: 12,
        }}
      >
        <Group gap="xs">
          <select
            className="pixel-font pixel-border-sm"
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            style={{
              padding: '6px 10px',
              background: 'var(--surface-default)',
              color: 'var(--text-primary)',
              fontSize: '10px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {langOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

        </Group>

        <button
          onClick={handleRun}
          className="pixel-font pixel-btn-sm"
          disabled={!language || running}
          style={{ height: '32px', fontSize: '12px' }}
        >
          {running ? 'RUNNING...' : 'RUN TESTS'}
        </button>
      </div>

      {error && (
        <Notification
          color="red"
          title="Error"
          withCloseButton
          onClose={() => setError(null)}
          p="xs"
          style={{ borderRadius: 0 }}
        >
          <Text size="xs">{error}</Text>
        </Notification>
      )}
    </Stack>
  );
}
