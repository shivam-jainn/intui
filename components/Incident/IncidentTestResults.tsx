"use client";

import {
  Badge,
  Stack,
  Text,
  Code,
  Group,
  ScrollArea,
} from '@mantine/core';
import { useAtom } from 'jotai';
import { useState } from 'react';
import {
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconTerminal,
} from '@tabler/icons-react';
import {
  incidentResultAtom,
  incidentSubmissionAtom,
} from '@/contexts/IncidentContext';

export default function IncidentTestResults() {
  const [result] = useAtom(incidentResultAtom);
  const [isSubmission] = useAtom(incidentSubmissionAtom);
  const [showFullStdout, setShowFullStdout] = useState(false);
  const [showFullStderr, setShowFullStderr] = useState(false);

  if (!result) {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: 20,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconTerminal size={20} color="rgba(255,255,255,0.15)" />
        </div>
        <Text size="xs" c="dimmed" ta="center" maw={200}>
          Run tests to see results here
        </Text>
        <div style={{ display: "flex", gap: 6 }}>
          <Badge
            size="xs"
            variant="outline"
            color="gray"
            style={{ fontFamily: "monospace", opacity: 0.5 }}
          >
            Ctrl+Enter to run
          </Badge>
        </div>
      </div>
    );
  }

  const hasCountFields =
    typeof result.passed === "number" ||
    typeof result.failed === "number";

  const passedCount =
    typeof result.passed === "number" ? result.passed : 0;
  const failedCount =
    typeof result.failed === "number" ? result.failed : 0;
  const totalCount = passedCount + failedCount;

  const passedBool =
    typeof result.passed === "boolean" ? result.passed : undefined;
  const statusText =
    typeof result.status === "string" ? result.status : undefined;

  const stdout =
    typeof result.stdout === "string"
      ? result.stdout
      : typeof result.output === "string"
        ? result.output
        : "";
  const stderr =
    typeof result.stderr === "string"
      ? result.stderr
      : typeof result.error === "string"
        ? result.error
        : "";

  const testRows = Array.isArray(result.test_results)
    ? result.test_results
    : [];
  const derivedPassedFromRows = testRows.filter((tc: any) => {
    if (typeof tc?.passed === "boolean") return tc.passed;
    if (typeof tc?.result === "boolean") return tc.result;
    return tc?.output === true;
  }).length;
  const derivedTotalFromRows = testRows.length;

  let parsedPassed = passedCount;
  let parsedFailed = failedCount;
  let summaryMatched = false;

  if (totalCount === 0) {
    const ranMatch = stderr.match(/Ran (\d+) tests/);
    if (ranMatch) {
      const ran = parseInt(ranMatch[1], 10);
      if (stderr.includes("OK")) {
        parsedPassed = ran;
        parsedFailed = 0;
        summaryMatched = true;
      } else if (stderr.includes("FAILED")) {
        const failMatch = stderr.match(
          /FAILED \(failures=(\d+)(?:, errors=(\d+))?\)/
        );
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

  const finalPassed =
    derivedTotalFromRows > 0
      ? derivedPassedFromRows
      : summaryMatched
        ? parsedPassed
        : passedCount;
  const finalFailed =
    derivedTotalFromRows > 0
      ? Math.max(derivedTotalFromRows - derivedPassedFromRows, 0)
      : summaryMatched
        ? parsedFailed
        : failedCount;
  const finalTotal =
    derivedTotalFromRows > 0
      ? derivedTotalFromRows
      : finalPassed + finalFailed;

  const allPassed = finalTotal > 0 && finalFailed === 0;
  const actionLabel = isSubmission ? "Submission" : "Run";
  const isSystemError =
    !summaryMatched && stderr && !hasCountFields && !passedBool;

  const passRate = finalTotal > 0 ? (finalPassed / finalTotal) * 100 : 0;

  return (
    <ScrollArea h="100%">
      <div style={{ padding: 12 }}>
        {/* Status banner */}
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            marginBottom: 10,
            background: allPassed
              ? "rgba(34,197,94,0.06)"
              : "rgba(239,68,68,0.06)",
            border: `1px solid ${
              allPassed
                ? "rgba(34,197,94,0.15)"
                : "rgba(239,68,68,0.15)"
            }`,
          }}
        >
          <Group justify="space-between" align="center">
            <Group gap={8}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: allPassed
                    ? "rgba(34,197,94,0.15)"
                    : "rgba(239,68,68,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {allPassed ? (
                  <IconCheck size={14} color="#4ade80" />
                ) : (
                  <IconX size={14} color="#f87171" />
                )}
              </div>
              <div>
                <Group gap={4} align="center">
                  <Badge
                    size="xs"
                    color={isSubmission ? "orange" : "blue"}
                    variant="filled"
                    style={{ fontFamily: "monospace" }}
                  >
                    {actionLabel}
                  </Badge>
                  <Text
                    size="xs"
                    fw={700}
                    style={{
                      color: allPassed ? "#4ade80" : "#f87171",
                      fontFamily: "monospace",
                    }}
                  >
                    {allPassed
                      ? "ALL TESTS PASSED"
                      : finalTotal > 0
                        ? `${finalFailed}/${finalTotal} FAILED`
                        : statusText || "FAILED"}
                  </Text>
                </Group>
                {finalTotal > 0 && (
                  <Text size="xs" c="dimmed" style={{ fontFamily: "monospace", marginTop: 2 }}>
                    {finalPassed} passed, {finalFailed} failed
                  </Text>
                )}
              </div>
            </Group>

            {/* Pass rate ring */}
            {finalTotal > 0 && (
              <div style={{ position: "relative", width: 36, height: 36 }}>
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 36 36"
                  style={{ transform: "rotate(-90deg)" }}
                >
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="3"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke={allPassed ? "#4ade80" : "#f87171"}
                    strokeWidth="3"
                    strokeDasharray={`${(passRate / 100) * 88} 88`}
                    strokeLinecap="round"
                    style={{
                      transition: "stroke-dasharray 0.6s ease-out",
                      filter: `drop-shadow(0 0 4px ${allPassed ? "#4ade80" : "#f87171"}40)`,
                    }}
                  />
                </svg>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 9,
                    fontWeight: 700,
                    fontFamily: "monospace",
                    color: allPassed ? "#4ade80" : "#f87171",
                  }}
                >
                  {Math.round(passRate)}%
                </div>
              </div>
            )}
          </Group>
        </div>

        {/* Stdout */}
        {stdout && (
          <div style={{ marginBottom: 10 }}>
            <Group gap={4} mb={4}>
              <IconTerminal size={10} color="rgba(255,255,255,0.3)" />
              <Text
                size="xs"
                fw={600}
                style={{
                  color: "rgba(255,255,255,0.4)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontSize: 9,
                }}
              >
                Output
              </Text>
            </Group>
            <Code
              block
              style={{
                fontSize: 11,
                fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                backgroundColor: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.04)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                maxHeight: showFullStdout ? "none" : "200px",
                overflowY: "auto",
                color: "rgba(255,255,255,0.6)",
              }}
            >
              {stdout}
            </Code>
            {stdout.length > 500 && (
              <button
                type="button"
                onClick={() => setShowFullStdout(!showFullStdout)}
                style={{
                  marginTop: 4,
                  padding: "2px 8px",
                  borderRadius: 4,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 10,
                  fontFamily: "monospace",
                  cursor: "pointer",
                }}
              >
                {showFullStdout ? "Show less" : "Show full output"}
              </button>
            )}
          </div>
        )}

        {/* Stderr */}
        {stderr && (
          <div style={{ marginBottom: 10 }}>
            <Group gap={4} mb={4}>
              <IconAlertTriangle
                size={10}
                color={isSystemError ? "#ef4444" : "rgba(255,255,255,0.3)"}
              />
              <Text
                size="xs"
                fw={600}
                style={{
                  color: isSystemError
                    ? "#f87171"
                    : "rgba(255,255,255,0.4)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontSize: 9,
                }}
              >
                {isSystemError ? "Error" : "Test Logs"}
              </Text>
            </Group>
            <Code
              block
              style={{
                fontSize: 11,
                fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                backgroundColor: isSystemError
                  ? "rgba(239,68,68,0.05)"
                  : "rgba(0,0,0,0.3)",
                border: `1px solid ${
                  isSystemError
                    ? "rgba(239,68,68,0.12)"
                    : "rgba(255,255,255,0.04)"
                }`,
                color: isSystemError
                  ? "#f87171"
                  : "rgba(255,255,255,0.5)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                maxHeight: showFullStderr ? "none" : "200px",
                overflowY: "auto",
              }}
            >
              {stderr}
            </Code>
            {stderr.length > 500 && (
              <button
                type="button"
                onClick={() => setShowFullStderr(!showFullStderr)}
                style={{
                  marginTop: 4,
                  padding: "2px 8px",
                  borderRadius: 4,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 10,
                  fontFamily: "monospace",
                  cursor: "pointer",
                }}
              >
                {showFullStderr ? "Show less" : "Show full output"}
              </button>
            )}
          </div>
        )}

        {/* Individual test cases */}
        {result.test_results &&
          Array.isArray(result.test_results) &&
          result.test_results.length > 0 && (
            <div>
              <Group gap={4} mb={6}>
                <Text
                  size="xs"
                  fw={600}
                  style={{
                    color: "rgba(255,255,255,0.4)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontSize: 9,
                  }}
                >
                  Test Cases ({result.test_results.length})
                </Text>
              </Group>
              <Stack gap={4}>
                {result.test_results.map((tc: any, i: number) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                      padding: "6px 10px",
                      borderRadius: 6,
                      background: tc.passed
                        ? "rgba(34,197,94,0.04)"
                        : "rgba(239,68,68,0.04)",
                      border: `1px solid ${
                        tc.passed
                          ? "rgba(34,197,94,0.1)"
                          : "rgba(239,68,68,0.1)"
                      }`,
                    }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 6,
                        background: tc.passed
                          ? "rgba(34,197,94,0.12)"
                          : "rgba(239,68,68,0.12)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      {tc.passed ? (
                        <IconCheck size={10} color="#4ade80" />
                      ) : (
                        <IconX size={10} color="#f87171" />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        size="xs"
                        style={{
                          fontFamily: "monospace",
                          color: tc.passed ? "#4ade80" : "#f87171",
                          fontWeight: 600,
                          fontSize: 11,
                        }}
                      >
                        {tc.name ?? `Test ${i + 1}`}
                      </Text>
                      {tc.message && (
                        <Text
                          size="xs"
                          c="dimmed"
                          style={{
                            fontFamily: "monospace",
                            fontSize: 10,
                            marginTop: 2,
                          }}
                        >
                          {tc.message}
                        </Text>
                      )}
                    </div>
                  </div>
                ))}
              </Stack>
            </div>
          )}

        <div
          style={{
            marginTop: 12,
            paddingTop: 8,
            borderTop: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <Text size="xs" c="dimmed" style={{ fontFamily: "monospace", fontSize: 10 }}>
            {isSubmission
              ? "Submission results are recorded separately"
              : "Run mode for quick feedback before submitting"}
          </Text>
        </div>
      </div>
    </ScrollArea>
  );
}
