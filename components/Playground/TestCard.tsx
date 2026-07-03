"use client";

import React, { useState, useEffect } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import {
  Text,
  Box,
  Code,
  Badge,
  Group,
  Stack,
  useMantineTheme,
  ThemeIcon,
  Paper,
} from '@mantine/core';
import { IconCheck, IconX } from '@tabler/icons-react';
import { resultAtom, resultDataAtom, submissionAtom } from '@/contexts/TestCardContext';

export default function TestCard({ testCases = [] }: { testCases?: string[] }) {
  const theme = useMantineTheme();
  const [tab, setTab] = useAtom(resultAtom);
  const [testcase, setTestCase] = useState<string>('1');
  const resultData: any = useAtomValue(resultDataAtom);
  const isSubmission = useAtomValue(submissionAtom);
  const [isResultDataAvailable, setIsResultDataAvailable] = useState<boolean>(false);

  useEffect(() => {
    const hasValidResults = resultData?.results?.length > 0;
    setIsResultDataAvailable(hasValidResults);
    if (hasValidResults) {
      setTestCase('1');
    }
  }, [resultData]);

  const currentResult = resultData?.results?.[Number(testcase) - 1] || {};
  const isSuccess = currentResult.output === true;
  const status = resultData?.status;
  const errorMessage = resultData?.error || resultData?.message || currentResult.stderr;

  const passedCount = resultData?.results?.filter((r: any) => r.output === true).length ?? 0;
  const totalCount = resultData?.results?.length ?? 0;

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'Accepted': return 'teal';
      case 'Wrong Answer': return 'red';
      case 'Time Limit Exceeded': return 'orange';
      case 'Memory Limit Exceeded': return 'orange';
      case 'Runtime Error': return 'red';
      case 'Compilation Error': return 'red';
      default: return 'gray';
    }
  };

  const canSwitchTab = isResultDataAvailable || errorMessage;

  return (
    <Paper
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
      withBorder
      radius={0}
    >
      {/* Header: tabs */}
      <Group
        gap={0}
        style={{
          borderBottom: `1px solid ${theme.colors.dark[4]}`,
          flexShrink: 0,
          background: theme.colors.dark[8],
        }}
      >
        {(['testcases', 'results'] as const).map((t) => {
          const active = tab === t;
          const disabled = t === 'results' && !canSwitchTab;
          return (
            <button
              key={t}
              onClick={() => !disabled && setTab(t)}
              style={{
                flex: 1,
                padding: '8px 0',
                background: 'transparent',
                border: 'none',
                cursor: disabled ? 'not-allowed' : 'pointer',
                borderBottom: `2px solid ${active ? theme.colors.blue[5] : 'transparent'}`,
                opacity: disabled ? 0.35 : active ? 1 : 0.65,
                color: active ? theme.white : theme.colors.gray[4],
                fontSize: 12,
                fontWeight: active ? 600 : 400,
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              {t === 'testcases' ? 'Test Cases' : 'Results'}
              {t === 'results' && isResultDataAvailable && (
                <Badge
                  size="xs"
                  color={status === 'Accepted' ? 'teal' : 'red'}
                  variant="filled"
                  p={0}
                  style={{ height: 16, minWidth: 16, fontSize: 9, lineHeight: '16px' }}
                >
                  {passedCount}/{totalCount}
                </Badge>
              )}
            </button>
          );
        })}
      </Group>

      {/* Content */}
      <Box style={{ flex: 1, overflow: 'auto' }}>
        {tab === 'testcases' ? (
          <TestCaseContent
            testCases={testCases}
            testcase={testcase}
            setTestCase={setTestCase}
            theme={theme}
          />
        ) : (
          <ResultsContent
            resultData={resultData}
            testcase={testcase}
            setTestCase={setTestCase}
            isSubmission={isSubmission}
            isSuccess={isSuccess}
            status={status}
            errorMessage={errorMessage}
            passedCount={passedCount}
            totalCount={totalCount}
            currentResult={currentResult}
            theme={theme}
          />
        )}
      </Box>
    </Paper>
  );
}

/* ── Test Cases Tab ────────────────────────────────────────── */

function TestCaseContent({
  testCases,
  testcase,
  setTestCase,
  theme,
}: {
  testCases: string[];
  testcase: string;
  setTestCase: (v: string) => void;
  theme: any;
}) {
  if (testCases.length === 0) {
    return (
      <Group justify="center" py="xl">
        <Text size="sm" c="dimmed">No test cases available</Text>
      </Group>
    );
  }

  return (
    <Stack gap={0}>
      {/* Case selector pills */}
      <Group
        gap={6}
        p="10px 12px"
        style={{ borderBottom: `1px solid ${theme.colors.dark[4]}` }}
      >
        {testCases.map((_, i) => {
          const n = i + 1;
          const active = testcase === String(n);
          return (
            <Box
              key={n}
              onClick={() => setTestCase(String(n))}
              style={{
                cursor: 'pointer',
                height: 28,
                minWidth: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: theme.radius.sm,
                fontSize: 11,
                fontWeight: active ? 700 : 500,
                background: active ? theme.colors.blue[6] : theme.colors.dark[5],
                color: active ? theme.white : theme.colors.gray[4],
                transition: 'all 0.12s ease',
                userSelect: 'none',
              }}
            >
              {n}
            </Box>
          );
        })}
      </Group>

      {/* Input block */}
      <Box p="10px 12px">
        <Text fw={600} c="dimmed" tt="uppercase" mb={6} component="span" style={{ fontSize: 10 }}>
          Case {testcase} — Input
        </Text>
        <Code
          block
          style={{
            backgroundColor: theme.colors.dark[8],
            color: theme.colors.gray[1],
            padding: '10px 12px',
            fontSize: 12,
            lineHeight: '1.6',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            borderRadius: theme.radius.sm,
            border: `1px solid ${theme.colors.dark[5]}`,
          }}
        >
          {testCases[Number(testcase) - 1] || 'No input'}
        </Code>
      </Box>
    </Stack>
  );
}

/* ── Results Tab ───────────────────────────────────────────── */

function ResultsContent({
  resultData,
  testcase,
  setTestCase,
  isSubmission,
  isSuccess,
  status,
  errorMessage,
  passedCount,
  totalCount,
  currentResult,
  theme,
}: {
  resultData: any;
  testcase: string;
  setTestCase: (v: string) => void;
  isSubmission: boolean;
  isSuccess: boolean;
  status: string;
  errorMessage: string;
  passedCount: number;
  totalCount: number;
  currentResult: any;
  theme: any;
}) {
  const getStatusColor = (s: string) => {
    switch (s) {
      case 'Accepted': return 'teal';
      case 'Wrong Answer': return 'red';
      case 'Time Limit Exceeded': return 'orange';
      case 'Memory Limit Exceeded': return 'orange';
      case 'Runtime Error': return 'red';
      case 'Compilation Error': return 'red';
      default: return 'gray';
    }
  };

  if (errorMessage && !resultData?.results?.length) {
    return (
      <Stack p="12px">
        <Group gap={6}>
          <ThemeIcon size={20} radius="xl" color="red" variant="light">
            <IconX size={12} />
          </ThemeIcon>
          <Text size="xs" fw={600} c="red">
            Execution Error
          </Text>
        </Group>
        <Code
          block
          style={{
            backgroundColor: theme.colors.dark[8],
            color: theme.colors.red[4],
            padding: '10px 12px',
            fontSize: 12,
            lineHeight: '1.5',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            borderRadius: theme.radius.sm,
            border: `1px solid ${theme.colors.dark[5]}`,
            borderLeft: `3px solid ${theme.colors.red[6]}`,
          }}
        >
          {errorMessage}
        </Code>
      </Stack>
    );
  }

  if (!resultData?.results?.length) {
    return (
      <Group justify="center" py="xl">
        <Text size="sm" c="dimmed">Run your code to see results</Text>
      </Group>
    );
  }

  return (
    <Stack gap={0}>
      {/* Status bar */}
      <Group
        justify="space-between"
        p="8px 12px"
        style={{
          borderBottom: `1px solid ${theme.colors.dark[4]}`,
          background: theme.colors.dark[8],
        }}
      >
        <Group gap={8}>
          <ThemeIcon size={22} radius="xl" color={getStatusColor(status)} variant="filled">
            {status === 'Accepted' ? <IconCheck size={12} /> : <IconX size={12} />}
          </ThemeIcon>
          <Box>
            <Text size="xs" fw={600} lh={1.2}>{status}</Text>
            {totalCount > 0 && (
              <Text c="dimmed" lh={1.2} style={{ fontSize: 10 }}>{passedCount}/{totalCount} passed</Text>
            )}
          </Box>
        </Group>
        {resultData.timeTaken && (
          <Badge size="xs" variant="light" color="dimmed">{resultData.timeTaken}ms</Badge>
        )}
      </Group>

      {/* Case selector pills */}
      {!isSubmission && (
        <Group
          gap={6}
      p="10px 12px"
      style={{ borderBottom: `1px solid ${theme.colors.dark[4]}` }}
    >
          {resultData.results.map((r: any, i: number) => {
            const n = i + 1;
            const active = testcase === String(n);
            const passed = r?.output === true;
            return (
              <Box
                key={n}
                onClick={() => setTestCase(String(n))}
                style={{
                  cursor: 'pointer',
                  height: 28,
                  minWidth: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  borderRadius: theme.radius.sm,
                  fontSize: 11,
                  fontWeight: active ? 700 : 500,
                  background: active
                    ? (passed ? theme.colors.teal[6] : theme.colors.red[6])
                    : theme.colors.dark[5],
                  color: active
                    ? theme.white
                    : (passed ? theme.colors.teal[4] : theme.colors.red[4]),
                  transition: 'all 0.12s ease',
                  userSelect: 'none',
                }}
              >
                {passed ? <IconCheck size={10} /> : <IconX size={10} />}
                {n}
              </Box>
            );
          })}
        </Group>
      )}

      {/* Output / Expected */}
      {!isSubmission ? (
        <Stack gap={0} p="10px 12px">
          <Group gap={6} mb={6}>
            <Text fw={600} c="dimmed" tt="uppercase" style={{ fontSize: 10 }}>Output</Text>
            <Badge
              size="sm"
              color={isSuccess ? 'teal' : 'red'}
              variant="light"
              radius="sm"
              style={{ height: 18, fontSize: 10, fontWeight: 600 }}
            >
              {isSuccess ? 'Pass' : 'Fail'}
            </Badge>
          </Group>
          <Code
            block
            style={{
              backgroundColor: theme.colors.dark[8],
              color: theme.colors.gray[1],
              padding: '10px 12px',
              fontSize: 12,
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              borderRadius: theme.radius.sm,
              border: `1px solid ${theme.colors.dark[5]}`,
              borderLeft: `3px solid ${isSuccess ? theme.colors.teal[5] : theme.colors.red[5]}`,
            }}
          >
            {String(currentResult.result ?? 'No output')}
          </Code>

          <Text fw={600} c="dimmed" tt="uppercase" mt={10} mb={6} style={{ fontSize: 10 }}>
            Expected
          </Text>
          <Code
            block
            style={{
              backgroundColor: theme.colors.dark[8],
              color: theme.colors.gray[1],
              padding: '10px 12px',
              fontSize: 12,
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              borderRadius: theme.radius.sm,
              border: `1px solid ${theme.colors.dark[5]}`,
            }}
          >
            {String(currentResult.expected ?? 'No expected output')}
          </Code>
        </Stack>
      ) : (
        <Group justify="center" py="xl" style={{ minHeight: 80 }}>
          <Stack align="center" gap={6}>
            <ThemeIcon size={36} radius="xl" color={status === 'Accepted' ? 'teal' : 'orange'} variant="filled">
              {status === 'Accepted' ? <IconCheck size={18} /> : <IconX size={18} />}
            </ThemeIcon>
            <Text size="xs" fw={500}>
              {status === 'Accepted' ? 'All test cases passed!' : `${passedCount}/${totalCount} test cases passed`}
            </Text>
          </Stack>
        </Group>
      )}
    </Stack>
  );
}
