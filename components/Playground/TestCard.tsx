'use client';

import { Card, SegmentedControl, Text, Box, Stack, Code, Badge } from '@mantine/core';
import { useAtom, useAtomValue } from 'jotai';
import React, { useState, useEffect } from 'react';
import { resultAtom, resultDataAtom } from '@/contexts/TestCardContext';

function formatForDisplay(value: any) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function TestCard() {
  const [tab, setTab] = useAtom(resultAtom);
  const [testcase, setTestCase] = useState<string>('0');
  const resultData:any = useAtomValue(resultDataAtom);
  const [isResultDataAvailable, setIsResultDataAvailable] = useState<boolean>(false);

  useEffect(() => {
    const hasValidResults = resultData?.results?.length > 0;
    setIsResultDataAvailable(hasValidResults);

    // Reset test case selection when results change
    if (hasValidResults) {
      setTestCase('0');
    }
  }, [resultData]);

  const testcases = [
    { output: '1', value: '[1,2,3]' },
    { output: '4', value: '[5,2,3]' },
  ];

  function changeTab(tabName: 'testcases' | 'results') {
    if (tabName === 'results' && !isResultDataAvailable) return;
    setTab(tabName);
  }

  const currentResult = resultData?.results?.[Number(testcase)] || {};
  const isSuccess = currentResult.output === true;
  const actualOutput = formatForDisplay(currentResult.actual ?? currentResult.result);
  const expectedOutput = formatForDisplay(currentResult.expected);

  return (
    <Card
      withBorder
      radius="md"
      h="100%"
      bg="var(--mantine-color-body)"
      style={{
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        border: 'none',
      }}
    >
      <Stack style={{ minHeight: 0, flex: 1 }}>
        <SegmentedControl
          value={tab}
          onChange={(value) => changeTab(value as 'testcases' | 'results')}
          data={[
            { label: 'Test Cases', value: 'testcases' },
            {
              label: 'Results',
              value: 'results',
              disabled: !isResultDataAvailable,
            },
          ]}
          size="sm"
          color="blue"
          fullWidth
          bg="var(--mantine-color-default)"
          styles={{
            root: {
              backgroundColor: 'var(--mantine-color-default)',
            },
            control: {
              border: 'none',
            },
            label: {
              color: 'var(--mantine-color-text)',
              '&[data-active]': {
                color: 'var(--mantine-color-text)',
              },
            },
          }}
        />
        <Box style={tabBodyStyle}>
          {tab === 'testcases' ? (
            <Stack>
              <SegmentedControl
                value={testcase}
                onChange={setTestCase}
                data={testcases.map((_, index) => ({
                  label: `Case ${index}`,
                  value: `${index}`,
                }))}
                size="xs"
                color="blue"
                bg="transparent"
                styles={{
                  root: {
                    backgroundColor: 'transparent',
                  },
                  control: {
                    border: 'none',
                  },
                  label: {
                    color: 'var(--mantine-color-text)',
                    '&[data-active]': {
                      color: 'var(--mantine-color-text)',
                    },
                  },
                }}
              />
              <Text size="sm" fw={500} c="var(--mantine-color-text)">Input:</Text>
              <Box style={scrollContainerStyle}>
                <Code block style={{ ...codeBlockStyle, border: '1px solid var(--mantine-color-default-border)' }}>
                  {testcases[Number(testcase)]?.value || 'No input available'}
                </Code>
              </Box>
            </Stack>
          ) : (
            <Stack>
              {resultData?.results?.length > 0 ? (
                <>
                  <SegmentedControl
                    value={testcase}
                    onChange={setTestCase}
                    data={resultData.results.map((_:any, index: number) => ({
                      label: `Case ${index}`,
                      value: `${index}`,
                    }))}
                    size="xs"
                    color="blue"
                    bg="transparent"
                    styles={{
                      root: {
                        backgroundColor: 'transparent',
                      },
                      control: {
                        border: 'none',
                      },
                      label: {
                        color: 'var(--mantine-color-text)',
                        '&[data-active]': {
                          color: 'var(--mantine-color-text)',
                        },
                      },
                    }}
                  />

                  <Box>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
                      <Text size="sm" fw={500} c="var(--mantine-color-text)">Your Output:</Text>
                      <Badge
                        color={isSuccess ? 'green' : 'red'}
                        variant="filled"
                        size="lg"
                        style={{ alignSelf: 'flex-start' }}
                      >
                        {isSuccess ? 'PASSED' : 'FAILED'}
                      </Badge>
                    </div>
                    <Box style={scrollContainerStyle}>
                      <Code
                        block
                        style={{
                        ...codeBlockStyle,
                        backgroundColor: isSuccess
                          ? 'rgba(34, 139, 34, 0.15)'
                          : 'rgba(255, 0, 0, 0.15)',
                        color: isSuccess ? 'var(--mantine-color-green-text)' : 'var(--mantine-color-red-text)',
                        border: '1px solid var(--mantine-color-default-border)',
                      }}>
                        <Box style={scrollContentStyle}>
                          {actualOutput ?? 'No output'}
                        </Box>
                      </Code>
                    </Box>
                  </Box>

                  <Box>
                    <Text size="sm" fw={500} c="var(--mantine-color-text)">Expected Output:</Text>
                    <Box style={scrollContainerStyle}>
                      <Code block style={{ ...codeBlockStyle, border: '1px solid var(--mantine-color-default-border)' }}>
                        {expectedOutput ?? 'No expected output'}
                      </Code>
                    </Box>
                  </Box>
                </>
              ) : (
                <Stack gap="xs">
                  <Text size="sm" c="var(--mantine-color-text)">
                    {resultData?.message || 'No test results available'}
                  </Text>
                  {resultData?.status && (
                    <Badge variant="light" color={resultData?.status === 'failed' ? 'red' : 'blue'}>
                      {String(resultData.status).toUpperCase()}
                    </Badge>
                  )}
                  {resultData?.error && (
                    <Code block style={{ ...codeBlockStyle, color: 'var(--mantine-color-red-text)', border: '1px solid var(--mantine-color-default-border)' }}>{String(resultData.error)}</Code>
                  )}
                </Stack>
              )}
            </Stack>
          )}
        </Box>
      </Stack>
    </Card>
  );
}

const codeBlockStyle = {
  marginTop: 0,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  backgroundColor: 'var(--mantine-color-default)',
  color: 'var(--mantine-color-text)',
};

const scrollContainerStyle = {
  marginTop: '8px',
  overflowY: 'auto' as const,
  overflowX: 'auto' as const,
  borderRadius: '8px',
};

const scrollContentStyle = {
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
};

const tabBodyStyle = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto' as const,
  overflowX: 'hidden' as const,
};
