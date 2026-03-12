"use client";

import { Box, Badge, Stack, Text, Code, Group, ThemeIcon, ScrollArea } from "@mantine/core";
import { useAtom } from "jotai";
import { incidentResultAtom } from "@/contexts/IncidentContext";
import { IconCheck, IconX } from "@tabler/icons-react";

export default function IncidentTestResults() {
  const [result] = useAtom(incidentResultAtom);

  if (!result) {
    return (
      <Box p="md">
        <Text size="sm" c="dimmed">
          Run your code to see test results
        </Text>
      </Box>
    );
  }

  const hasCountFields =
    typeof result.passed === "number" ||
    typeof result.failed === "number";

  const passedCount = typeof result.passed === "number" ? result.passed : 0;
  const failedCount = typeof result.failed === "number" ? result.failed : 0;
  const totalCount = passedCount + failedCount;

  const passedBool = typeof result.passed === "boolean" ? result.passed : undefined;
  const statusText = typeof result.status === "string" ? result.status : undefined;

  const stdout = typeof result.stdout === "string" ? result.stdout : (typeof result.output === "string" ? result.output : "");
  const stderr = typeof result.stderr === "string" ? result.stderr : (typeof result.error === "string" ? result.error : "");

  // Heuristic for unittest summary in stderr if passed/failed counts are missing
  let parsedPassed = passedCount;
  let parsedFailed = failedCount;
  let summaryMatched = false;

  if (totalCount === 0) {
    // Look for "Ran X tests" and "OK" or "FAILED"
    const ranMatch = stderr.match(/Ran (\d+) tests/);
    if (ranMatch) {
      const ran = parseInt(ranMatch[1], 10);
      if (stderr.includes("OK")) {
        parsedPassed = ran;
        parsedFailed = 0;
        summaryMatched = true;
      } else if (stderr.includes("FAILED")) {
        const failMatch = stderr.match(/FAILED \(failures=(\d+)(?:, errors=(\d+))?\)/);
        if (failMatch) {
          const fails = parseInt(failMatch[1], 10);
          const errs = failMatch[2] ? parseInt(failMatch[2], 10) : 0;
          parsedFailed = fails + errs;
          parsedPassed = ran - parsedFailed;
          summaryMatched = true;
        }
      }
    }
  }

  const finalPassed = summaryMatched ? parsedPassed : passedCount;
  const finalFailed = summaryMatched ? parsedFailed : failedCount;
  const finalTotal = finalPassed + finalFailed;

  const allPassed = summaryMatched 
    ? (finalFailed === 0 && finalTotal > 0)
    : (hasCountFields ? (failedCount === 0 && totalCount > 0) : (passedBool === true));

  // Determine if this is a "valid" failure or a system error
  // If we matched the unittest summary, it's a test result, not a crash.
  const isSystemError = !summaryMatched && stderr && !hasCountFields && !passedBool;

  return (
    <ScrollArea h="100%">
      <Stack gap="sm" p="md">
        {/* Summary */}
        <Group gap="xs">
          <Badge color={allPassed ? "green" : "red"} size="lg" variant="filled">
            {summaryMatched || hasCountFields
              ? (allPassed ? "All Tests Passed" : `${summaryMatched ? finalFailed : failedCount} / ${summaryMatched ? finalTotal : totalCount} Failed`)
              : (allPassed ? "Passed" : (statusText ? statusText : "Failed"))}
          </Badge>
          {(summaryMatched || (hasCountFields && totalCount > 0)) && (
            <Text size="sm" c="dimmed">
              {summaryMatched ? finalPassed : finalPassed} passed, {summaryMatched ? finalFailed : failedCount} failed
            </Text>
          )}
        </Group>

        {/* Stdout */}
        {stdout && (
          <Box>
            <Text size="xs" fw={600} c="dimmed" mb={4}>
              OUTPUT
            </Text>
            <Code
              block
              style={{
                fontSize: 11,
                backgroundColor: "var(--mantine-color-dark-8)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                maxHeight: "300px",
                overflowY: "auto",
              }}
            >
              {stdout}
            </Code>
          </Box>
        )}

        {/* Stderr - Only show as Error if it's not just the unittest output */}
        {stderr && (
          <Box>
            <Text size="xs" fw={600} c={isSystemError ? "red" : "dimmed"} mb={4}>
              {isSystemError ? "ERRORS" : "TEST LOGS"}
            </Text>
            <Code
              block
              style={{
                fontSize: 11,
                backgroundColor: "var(--mantine-color-dark-8)",
                color: isSystemError ? "var(--mantine-color-red-4)" : "var(--mantine-color-gray-5)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                maxHeight: "300px",
                overflowY: "auto",
              }}
            >
              {stderr}
            </Code>
          </Box>
        )}

        {/* Individual test cases */}
        {result.test_results && Array.isArray(result.test_results) && (
          <Box>
            <Text size="xs" fw={600} c="dimmed" mb={4}>
              TEST CASES
            </Text>
            <Stack gap={4}>
              {result.test_results.map((tc: any, i: number) => (
                <Group key={i} gap="xs" wrap="nowrap">
                  <ThemeIcon
                    size="xs"
                    color={tc.passed ? "green" : "red"}
                    variant="light"
                    radius="xl"
                  >
                    {tc.passed ? <IconCheck size={10} /> : <IconX size={10} />}
                  </ThemeIcon>
                  <Text size="xs" c={tc.passed ? "green" : "red"} style={{ fontFamily: "monospace" }}>
                    {tc.name ?? `Test ${i + 1}`}
                  </Text>
                  {tc.message && (
                    <Text size="xs" c="dimmed" truncate>
                      — {tc.message}
                    </Text>
                  )}
                </Group>
              ))}
            </Stack>
          </Box>
        )}
      </Stack>
    </ScrollArea>
  );
}
