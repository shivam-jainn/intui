"use client";

import {
  Badge,
  Button,
  Card,
  Group,
  Select,
  Text,
  Notification,
  Stack,
} from "@mantine/core";
import { useAtom } from "jotai";
import {
  activeFilePathAtom,
  fileContentsAtom,
  incidentFilesAtom,
  incidentResultAtom,
  incidentRunningAtom,
} from "@/contexts/IncidentContext";
import { useState } from "react";
import { IconPlayerPlay } from "@tabler/icons-react";

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
  const [running, setRunning] = useAtom(incidentRunningAtom);
  const [error, setError] = useState<string | null>(null);

  // The entry file to submit is the active editable file, fallback to declared entryFile
  function getSubmitCode(): { code: string; filePath: string } {
    const target = activeFile || entryFile;
    const fileData = files.find((f) => f.path === target && !f.readonly);
    const code = fileContents[target] ?? fileData?.content ?? "";
    return { code, filePath: target };
  }

  async function handleRun() {
    setError(null);
    setRunning(true);

    const { code, filePath } = getSubmitCode();

    if (!code || code.trim().length < 5) {
      setError("No code to run. Select or edit a source file first.");
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

      const response = await fetch("/api/incident", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        setError(data.message || data.error || "Run failed");
        return;
      }

      setResult(data);
    } catch (err: any) {
      setError("Network error: could not reach execution server.");
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
      <Card
        p="xs"
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--mantine-color-dark-5)",
          borderRadius: 0,
        }}
      >
        <Group gap="xs">
          <Select
            size="xs"
            data={langOptions}
            value={language}
            onChange={(v: string | null) => v && onLanguageChange(v)}
            w={110}
            styles={{ input: { fontSize: 12 } }}
          />
          <Badge size="sm" variant="outline" color="gray">
            {activeFile
              ? activeFile.split("/").pop()
              : entryFile.split("/").pop() || "no file"}
          </Badge>
        </Group>

        <Button
          size="xs"
          leftSection={<IconPlayerPlay size={12} />}
          onClick={handleRun}
          loading={running}
          color="green"
          variant="filled"
        >
          Run Tests
        </Button>
      </Card>

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
