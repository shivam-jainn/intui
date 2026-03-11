"use client";
import { resultAtom, resultDataAtom, submissionAtom } from '@/contexts/TestCardContext';
import { Card, SegmentedControl, Text, Box, Stack, Code, Badge, Group, useMantineTheme } from '@mantine/core';
import { useAtom, useAtomValue } from 'jotai';
import React, { useState, useEffect } from 'react';

export default function TestCard({ testCases = [] }: { testCases?: string[] }) {
  const theme = useMantineTheme();
  const [tab, setTab] = useAtom(resultAtom);
  const [testcase, setTestCase] = useState<string>('1');
  const resultData:any = useAtomValue(resultDataAtom);
  const isSubmission = useAtomValue(submissionAtom);
  const [isResultDataAvailable, setIsResultDataAvailable] = useState<boolean>(false);

  useEffect(() => {
    const hasValidResults = resultData?.results?.length > 0;
    setIsResultDataAvailable(hasValidResults);
    
    // Reset test case selection when results change
    if (hasValidResults) {
      setTestCase('1');
    }

    console.log(resultData);
  }, [resultData]);

  const testcases = [
    { output: "1", value: "[1,2,3]" },
    { output: "4", value: "[5,2,3]" }
  ];

  function changeTab(tabName: "testcases" | "results") {
    if (tabName === "results" && !isResultDataAvailable) return;
    setTab(tabName);
  }

  const currentResult = resultData?.results?.[Number(testcase) - 1] || {};
  const isSuccess = currentResult.output === true;
  const status = resultData?.status;
  
  // Check for any stderr/error in the response
  const errorMessage = resultData?.error || resultData?.message || currentResult.stderr;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Accepted': return 'green';
      case 'Wrong Answer': return 'red';
      case 'Time Limit Exceeded': return 'orange';
      case 'Memory Limit Exceeded': return 'orange';
      case 'Runtime Error': return 'red';
      case 'Compilation Error': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Card withBorder radius="md">
      <Stack >
        <SegmentedControl
          value={tab}
          onChange={(value) => changeTab(value as "testcases" | "results")}
          data={[
            { label: 'Test Cases', value: 'testcases' },
            { 
              label: 'Results', 
              value: 'results', 
              disabled: !isResultDataAvailable && !errorMessage
            },
          ]}
          size="sm"
          color="blue"
          fullWidth
        />

        {tab === "testcases" ? (
          <Stack>
            <SegmentedControl
              value={testcase}
              onChange={setTestCase}
              data={testCases.map((_, index) => ({
                label: `Case ${index + 1}`,
                value: `${index + 1}`
              }))}
              size="xs"
              color="blue"
            />
            <Text size="sm" fw={500}>Input:</Text>
            <Code block style={codeBlockStyle(theme)}>
              {testCases[Number(testcase) - 1] || "No input available"}
            </Code>
          </Stack>
        ) : (
          <Stack>
            {status && (
              <Group justify="space-between" align="center">
                <Badge 
                  size="lg" 
                  color={getStatusColor(status || "")} 
                  variant="filled"
                >
                  {status}
                </Badge>
                {resultData.timeTaken && (
                  <Text size="xs" color="dimmed">
                    Runtime: {resultData.timeTaken}ms
                  </Text>
                )}
              </Group>
            )}

            {errorMessage && (
              <Box>
                <Text size="sm" fw={500} color="red">Execution Error:</Text>
                <Code block style={{ ...codeBlockStyle(theme), color: '#ff6b6b' }}>
                  {errorMessage}
                </Code>
              </Box>
            )}

            {resultData?.results?.length > 0 ? (
              <>
                {!isSubmission && (
                  <SegmentedControl
                    value={testcase}
                    onChange={setTestCase}
                    data={resultData.results.map((_:any, index: number) => ({
                      label: `Case ${index + 1}`,
                      value: `${index + 1}`
                    }))}
                    size="xs"
                    color="blue"
                  />
                )}

                {!isSubmission ? (
                  <Box>
                    <div className="flex items-center gap-2 mb-1">
                      <Text size="sm" fw={500} color="dimmed">Your Output:</Text>
                      <Badge 
                        color={isSuccess ? "green" : "red"}
                        variant="filled"
                      >
                        {isSuccess ? "Passed" : "Failed"}
                      </Badge>
                    </div>
                    <Code block style={{
                      ...codeBlockStyle(theme),
                      backgroundColor: isSuccess 
                        ? 'rgba(34, 139, 139, 0.15)' 
                        : 'rgba(255, 0, 0, 0.15)'
                    }}>
                      {String(currentResult.result ?? "No output")}
                    </Code>
                  </Box>
                ) : (
                  <Box>
                    <Text size="sm" color="dimmed">
                      {status === 'Accepted' 
                        ? 'All test cases passed!' 
                        : `Passed ${resultData.results.filter((r: any) => r.result).length}/${resultData.results.length} test cases.`}
                    </Text>
                  </Box>
                )}

                {!isSubmission && (
                  <Box>
                    <Text size="sm" fw={500} color="dimmed">Expected Output:</Text>
                    <Code block style={codeBlockStyle(theme)}>
                      {String(currentResult.expected ?? "No expected output")}
                    </Code>
                  </Box>
                )}
              </>
            ) : !errorMessage && (
              <Text size="sm" color="dimmed">
                No test results available
              </Text>
            )}
          </Stack>
        )}
      </Stack>
    </Card>
  );
}

const codeBlockStyle = (theme: any) => ({
  backgroundColor: theme.colors.dark[8],
  color: theme.colors.gray[0],
  padding: theme.spacing.md,
  marginTop: theme.spacing.xs,
  whiteSpace: 'pre-wrap' as const,
  wordBreak: 'break-word' as const
});