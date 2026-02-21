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
      style={{
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
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
              />
              <Text size="sm" fw={500}>Input:</Text>
              <Box style={scrollContainerStyle}>
                <Code block style={codeBlockStyle}>
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
                  />

                  <Box>
                    <div className="flex items-center gap-2 mb-1">
                      <Text size="sm" fw={500} color="dimmed">Your Output:</Text>
                      <Badge
                        color={isSuccess ? 'green' : 'red'}
                        variant="filled"
                      >
                        {isSuccess ? 'Passed' : 'Failed'}
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
                      }}>
                        <Box style={scrollContentStyle}>
                          {actualOutput ?? 'No output'}
                        </Box>
                      </Code>
                    </Box>
                  </Box>

                  <Box>
                    <Text size="sm" fw={500} color="dimmed">Expected Output:</Text>
                    <Box style={scrollContainerStyle}>
                      <Code block style={codeBlockStyle}>
                        {expectedOutput ?? 'No expected output'}
                      </Code>
                    </Box>
                  </Box>
                </>
              ) : (
                <Text size="sm" color="dimmed">
                  No test results available
                </Text>
              )}
            </Stack>
          )}
        </Box>
      </Stack>
    </Card>
  );
}

const codeBlockStyle = (theme: any) => ({
  marginTop: 0,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
});

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
