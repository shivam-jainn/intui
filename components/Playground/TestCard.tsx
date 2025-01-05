"use client";
import { resultAtom, resultDataAtom } from '@/contexts/TestCardContext';
import { Card, SegmentedControl, Text, Box, Stack, Code } from '@mantine/core';
import { useAtom, useAtomValue } from 'jotai';
import React, { useState, useEffect } from 'react';

export default function TestCard() {
  const [tab, setTab] = useAtom(resultAtom);
  const [testcase, setTestCase] = useState<string>('0');
  const resultData = useAtomValue(resultDataAtom);
  const [isResultDataAvailable, setIsResultDataAvailable] = useState<boolean>(false);

  useEffect(() => {
    setIsResultDataAvailable(resultData && Array.isArray(resultData.output));
  }, [resultData]);

  const testcases = [
    {
      output: "1",
      value: "[1,2,3]",
    },
    {
      output: "4",
      value: "[5,2,3]",
    }
  ];

  function changeTab(tabName: "testcases" | "results") {
    if (tabName === "results" && !isResultDataAvailable) return; // Prevent switching to "results" if resultData is not available
    setTab(tabName);
  }

  return (
    <Card withBorder radius="md">
      <Stack spacing="md">
        <SegmentedControl
          value={tab}
          onChange={(value) => changeTab(value as "testcases" | "results")}
          data={[
            { label: 'Test Cases', value: 'testcases' },
            { label: 'Results', value: 'results', disabled: !isResultDataAvailable }, // Disable "Results" tab if resultData is not available
          ]}
          size="sm"
          color="blue"
          fullWidth
        />

        {tab === "testcases" ? (
          <Stack spacing="xs">
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
            <Text size="sm" weight={500} color="dimmed">Input:</Text>
            <Code block 
                  sx={(theme) => ({
                    backgroundColor: theme.colors.dark[8],
                    color: theme.colors.gray[0],
                    padding: theme.spacing.md
                  })}>
              {testcases[Number(testcase)].value}
            </Code>
          </Stack>
        ) : (
          <Stack spacing="xs">
            <SegmentedControl
              value={testcase}
              onChange={setTestCase}
              data={resultData.output.map((_, index: number) => ({
                label: `Case ${index}`,
                value: `${index}`
              }))}
              size="xs"
              color="blue"
            />
            
            <Box>
              <Text size="sm" weight={500} color="dimmed">Your Output:</Text>
              <Code block 
                    sx={(theme) => ({
                      backgroundColor: 
                        resultData.output[Number(testcase)].result === 
                        resultData.output[Number(testcase)].expected
                          ? theme.fn.rgba(theme.colors.green[9], 0.15)
                          : theme.fn.rgba(theme.colors.red[9], 0.15),
                      color: theme.colors.gray[0],
                      padding: theme.spacing.md,
                      marginTop: theme.spacing.xs
                    })}>
                {resultData.output[Number(testcase)].result}
              </Code>
            </Box>

            <Box>
              <Text size="sm" weight={500} color="dimmed">Expected Output:</Text>
              <Code block 
                    sx={(theme) => ({
                      backgroundColor: theme.colors.dark[8],
                      color: theme.colors.gray[0],
                      padding: theme.spacing.md,
                      marginTop: theme.spacing.xs
                    })}>
                {resultData.output[Number(testcase)].expected}
              </Code>
            </Box>
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
