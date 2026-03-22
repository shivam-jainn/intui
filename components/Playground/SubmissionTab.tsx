"use client";

import React, { useEffect, useState } from "react";
import { Box, Table, Badge, Loader, Center, Text, ScrollArea, Modal, Code } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

interface Submission {
  id: number;
  status: string;
  language: string;
  timeTaken: number | null;
  memoryUsed: number | null;
  createdAt: string;
  code: string;
}

interface SubmissionTabProps {
  questionSlug?: string;
  incidentSlug?: string;
}

const statusColor: Record<string, string> = {
  Accepted: "green",
  Rejected: "red",
  Error: "red",
  Pending: "yellow",
};

export default function SubmissionTab({ questionSlug, incidentSlug }: SubmissionTabProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [opened, { open, close }] = useDisclosure(false);
  const [selectedCode, setSelectedCode] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");

  useEffect(() => {
    async function fetchSubmissions() {
      setLoading(true);
      setError(null);
      try {
        const query = new URLSearchParams();
        if (questionSlug) query.append("questionSlug", questionSlug);
        if (incidentSlug) query.append("incidentSlug", incidentSlug);

        const res = await fetch(`/api/submissions?${query.toString()}`);
        if (!res.ok) {
          throw new Error("Failed to load submissions");
        }
        const data = await res.json();
        setSubmissions(data.submissions || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (questionSlug || incidentSlug) {
      fetchSubmissions();
    }
  }, [questionSlug, incidentSlug]);

  if (loading) {
    return (
      <Center h={200}>
        <Loader size="sm" />
      </Center>
    );
  }

  if (error) {
    return (
      <Center h={200}>
        <Text c="red" size="sm">
          {error}
        </Text>
      </Center>
    );
  }

  if (submissions.length === 0) {
    return (
      <Center h={200}>
        <Text c="dimmed" size="sm">
          No submissions yet.
        </Text>
      </Center>
    );
  }

  return (
    <Box>
      <ScrollArea h={400} offsetScrollbars>
        <Table verticalSpacing="sm" striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Time Submitted</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Language</Table.Th>
              <Table.Th>Runtime</Table.Th>
              <Table.Th>Memory</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {submissions.map((sub) => (
              <Table.Tr
                key={sub.id}
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setSelectedCode(sub.code);
                  setSelectedLanguage(sub.language);
                  open();
                }}
              >
                <Table.Td>
                  {new Date(sub.createdAt).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </Table.Td>
                <Table.Td>
                  <Text fw={600} size="sm" c={statusColor[sub.status] || "gray"}>
                    {sub.status || "Unknown"}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Badge variant="light" size="sm">
                    {sub.language}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  {sub.timeTaken ? `${sub.timeTaken.toFixed(2)} ms` : "N/A"}
                </Table.Td>
                <Table.Td>
                  {sub.memoryUsed ? `${sub.memoryUsed.toFixed(2)} KB` : "N/A"}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>

      <Modal opened={opened} onClose={close} title="Submission Code" size="xl">
        <ScrollArea h={400} type="auto">
          <Code block color="dark">
            {selectedCode}
          </Code>
        </ScrollArea>
      </Modal>
    </Box>
  );
}
