"use client";
import { resultAtom, resultDataAtom } from '@/contexts/TestCardContext';
import { Card, SegmentedControl, Text, Box, Stack, Code, Badge } from '@mantine/core';
import { useAtom, useAtomValue } from 'jotai';
import React, { useState, useEffect } from 'react';

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

  const currentResult = resultData?.results?.[Number(testcase)] || {};
  const isSuccess = currentResult.output === true;

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
              disabled: !isResultDataAvailable 
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
              data={testcases.map((_, index) => ({
                label: `Case ${index}`,
                value: `${index}`
              }))}
              size="xs"
              color="blue"
            />
            <Text size="sm" fw={500}>Input:</Text>
            <Code block style={codeBlockStyle}>
              {testcases[Number(testcase)]?.value || "No input available"}
            </Code>
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
                    value: `${index}`
                  }))}
                  size="xs"
                  color="blue"
                />

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
                    ...codeBlockStyle,
                    backgroundColor: isSuccess 
                      ? 'rgba(34, 139, 34, 0.15)' 
                      : 'rgba(255, 0, 0, 0.15)'
                  }}>
                    {currentResult.result ?? "No output"}
                  </Code>
                </Box>

                <Box>
                  <Text size="sm" fw={500} color="dimmed">Expected Output:</Text>
                  <Code block style={codeBlockStyle}>
                    {currentResult.expected ?? "No expected output"}
                  </Code>
                </Box>
              </>
            ) : (
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
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word'
});