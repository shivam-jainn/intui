"use client";

import {
  Badge,
  Box,
  Group,
  ScrollArea,
  Text,
  Title,
} from "@mantine/core";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import 'katex/dist/katex.min.css';
import React from "react";

interface IncidentPanelProps {
  report: string;
  incidentName: string;
}

export default function IncidentPanel({ report, incidentName }: IncidentPanelProps) {
  // Parse challenge type and difficulty from report header comments
  const challengeTypeMatch = report.match(/^# CHALLENGE TYPE\s*\n(.+)/m);
  const difficultyMatch = report.match(/^# DIFFICULTY\s*\n(.+)/m);
  const challengeType = challengeTypeMatch?.[1]?.trim() ?? "Incident";
  const difficulty = difficultyMatch?.[1]?.trim() ?? "Unknown";

  const difficultyColor =
    difficulty === "Easy"
      ? "green"
      : difficulty === "Medium"
      ? "yellow"
      : difficulty === "Hard"
      ? "red"
      : "gray";

  return (
    <Box style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box
        p="sm"
        style={{ borderBottom: "1px solid var(--mantine-color-dark-5)" }}
      >
        <Title order={5} mb={4}>
          {incidentName
            .split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ")}
        </Title>
        <Group gap={6}>
          <Badge size="sm" color="red" variant="light">
            {challengeType}
          </Badge>
          <Badge size="sm" color={difficultyColor} variant="outline">
            {difficulty}
          </Badge>
        </Group>
      </Box>

      <ScrollArea flex={1} p="sm" style={{ flex: 1 }}>
        <Box
          style={{
            fontSize: 13,
            lineHeight: 1.7,
            color: "var(--mantine-color-gray-3)",
          }}
        >
          <Markdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              h1: ({ children }) => (
                <Text fw={700} size="md" mt="sm" mb="xs" c="white">
                  {children}
                </Text>
              ),
              h2: ({ children }) => (
                <Text fw={600} size="sm" mt="sm" mb="xs" c="gray.2">
                  {children}
                </Text>
              ),
              h3: ({ children }) => (
                <Text fw={600} size="sm" mt="sm" mb="xs" c="gray.3">
                  {children}
                </Text>
              ),
              p: ({ children }) => (
                <Text size="sm" mb="xs" c="gray.3">
                  {children}
                </Text>
              ),
              li: ({ children }) => (
                <Text size="sm" component="li" mb={2} c="gray.3">
                  {children}
                </Text>
              ),
              code: ({ children, className }) => {
                const isBlock = className?.includes("language-");
                if (isBlock) {
                  return (
                    <Box
                      component="pre"
                      p="sm"
                      mb="sm"
                      style={{
                        backgroundColor: "var(--mantine-color-dark-8)",
                        borderRadius: "var(--mantine-radius-sm)",
                        overflowX: "auto",
                        fontSize: 12,
                        fontFamily: "monospace",
                        border: "1px solid var(--mantine-color-dark-4)",
                      }}
                    >
                      <code>{children}</code>
                    </Box>
                  );
                }
                return (
                  <Box
                    component="code"
                    px={4}
                    py={1}
                    style={{
                      backgroundColor: "var(--mantine-color-dark-6)",
                      borderRadius: "var(--mantine-radius-xs)",
                      fontSize: 12,
                      fontFamily: "monospace",
                    }}
                  >
                    {children}
                  </Box>
                );
              },
            }}
          >
            {report}
          </Markdown>
        </Box>
      </ScrollArea>
    </Box>
  );
}
