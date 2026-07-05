'use client';

import React, { useEffect, useState } from 'react';
import { IconCheck, IconX } from '@tabler/icons-react';
import { useAtom, useAtomValue } from 'jotai';
import {
  Badge,
  Box,
  Code,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  useMantineTheme,
} from '@mantine/core';
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
      case 'Accepted':
        return 'teal';
      case 'Wrong Answer':
        return 'red';
      case 'Time Limit Exceeded':
        return 'orange';
      case 'Memory Limit Exceeded':
        return 'orange';
      case 'Runtime Error':
        return 'red';
      case 'Compilation Error':
        return 'red';
      default:
        return 'gray';
    }
  };

  const canSwitchTab = isResultDataAvailable || errorMessage;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        background: 'var(--bg-base)',
      }}
    >
      {/* Header: tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '2px solid var(--border-default)',
          flexShrink: 0,
          background: 'var(--bg-raised)',
        }}
      >
        {(['testcases', 'results'] as const).map((t) => {
          const active = tab === t;
          const disabled = t === 'results' && !canSwitchTab;
          return (
            <button
              key={t}
              onClick={() => !disabled && setTab(t)}
              className="pixel-font"
              style={{
                flex: 1,
                padding: '10px 0',
                background: active ? 'var(--blood-dark)' : 'transparent',
                border: 'none',
                cursor: disabled ? 'not-allowed' : 'pointer',
                borderBottom: active ? '2px solid var(--primary-red)' : '2px solid transparent',
                opacity: disabled ? 0.35 : 1,
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: 10,
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                outline: 'none',
              }}
            >
              {t === 'testcases' ? 'TEST CASES' : 'RESULTS'}
              {t === 'results' && isResultDataAvailable && (
                <span
                  style={{
                    background: status === 'Accepted' ? 'var(--primary-red)' : 'var(--border-focus)',
                    color: '#fff',
                    padding: '2px 6px',
                    fontSize: 8,
                  }}
                >
                  {passedCount}/{totalCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
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
      </div>
    </div>
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
      <div style={{ display: 'flex', justifyContent: 'center', padding: '30px 0' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div className="pixel-font" style={{ fontSize: 10, marginBottom: 4 }}>NO TEST CASES</div>
          <div style={{ fontSize: 11, fontStyle: 'italic' }}>Run your code to see results</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Case selector pills */}
      <div style={{ display: 'flex', gap: 6, padding: '10px 12px', borderBottom: '1px solid var(--border-default)', overflowX: 'auto' }}>
        {testCases.map((_, i) => {
          const n = i + 1;
          const active = testcase === String(n);
          return (
            <button
              key={n}
              onClick={() => setTestCase(String(n))}
              className="pixel-font"
              style={{
                cursor: 'pointer',
                height: 28,
                minWidth: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 0,
                fontSize: 10,
                background: active ? 'var(--primary-red)' : 'var(--bg-overlay)',
                color: active ? '#fff' : 'var(--text-secondary)',
                border: active ? '1px solid var(--primary-red)' : '1px solid var(--border-default)',
                transition: 'all 0.12s ease',
                userSelect: 'none',
                outline: 'none',
              }}
            >
              {n}
            </button>
          );
        })}
      </div>

      {/* Input block */}
      <div style={{ padding: '10px 12px' }}>
        <div className="pixel-font" style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 8 }}>
          CASE {testcase} — INPUT
        </div>
        <pre
          className="pixel-border-sm"
          style={{
            backgroundColor: 'var(--surface-default)',
            color: 'var(--text-primary)',
            padding: '10px 12px',
            fontSize: 12,
            lineHeight: '1.6',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            margin: 0,
            borderLeft: '2px solid var(--border-focus)',
          }}
        >
          {testCases[Number(testcase) - 1] || 'No input'}
        </pre>
      </div>
    </div>
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
      case 'Accepted':
        return '#4CAF50';
      case 'Wrong Answer':
      case 'Runtime Error':
      case 'Compilation Error':
        return 'var(--primary-red)';
      default:
        return 'var(--primary-orange)';
    }
  };

  const statusColor = getStatusColor(status);

  if (errorMessage && !resultData?.results?.length) {
    let errorTitle = 'Execution Error';
    let errorHint = '';

    if (errorMessage.includes('Compilation Error') || errorMessage.includes('syntax error') || errorMessage.includes('error:')) {
      errorTitle = 'COMPILATION ERROR';
      errorHint = 'Check your code for syntax errors and try again.';
    } else if (errorMessage.includes('Runtime Error') || errorMessage.includes('segmentation fault')) {
      errorTitle = 'RUNTIME ERROR';
      errorHint = 'Your code crashed during execution. Check for null pointer access or infinite loops.';
    } else if (errorMessage.includes('Time Limit Exceeded') || errorMessage.includes('timeout')) {
      errorTitle = 'TIME LIMIT EXCEEDED';
      errorHint = 'Your code took too long to run. Optimize your algorithm or reduce unnecessary operations.';
    } else if (errorMessage.includes('Memory Limit Exceeded')) {
      errorTitle = 'MEMORY LIMIT EXCEEDED';
    } else {
      errorTitle = 'SERVICE ERROR';
      errorHint = 'Unable to reach the execution service.';
    }

    return (
      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '8px', height: '8px', background: 'var(--primary-red)' }}></div>
          <span className="pixel-font" style={{ color: 'var(--primary-red)', fontSize: '12px' }}>{errorTitle}</span>
        </div>
        <pre
          className="pixel-border-sm"
          style={{
            backgroundColor: 'var(--surface-default)',
            color: 'var(--primary-red)',
            padding: '10px 12px',
            fontSize: '12px',
            lineHeight: '1.5',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            margin: 0,
            borderLeft: '2px solid var(--primary-red)',
          }}
        >
          {errorMessage}
        </pre>
        {errorHint && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>{errorHint}</div>
        )}
      </div>
    );
  }

  if (!resultData?.results?.length) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '30px 0' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div className="pixel-font" style={{ fontSize: 10, marginBottom: 4 }}>NO RESULTS</div>
          <div style={{ fontSize: 11, fontStyle: 'italic' }}>Run your code to see results</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Status bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 12px',
          borderBottom: '1px solid var(--border-default)',
          background: 'var(--bg-raised)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: '8px', height: '8px', background: statusColor }}></div>
          <div>
            <div className="pixel-font" style={{ fontSize: 12, color: statusColor, marginBottom: 2 }}>
              {status.toUpperCase()}
            </div>
            {totalCount > 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>
                {passedCount}/{totalCount} PASSED
              </div>
            )}
          </div>
        </div>
        {resultData.timeTaken && (
          <span className="pixel-font" style={{ color: 'var(--text-muted)', fontSize: 10 }}>
            {resultData.timeTaken}ms
          </span>
        )}
      </div>

      {/* Case selector pills */}
      {!isSubmission && (
        <div style={{ display: 'flex', gap: 6, padding: '10px 12px', borderBottom: '1px solid var(--border-default)', overflowX: 'auto' }}>
          {resultData.results.map((r: any, i: number) => {
            const n = i + 1;
            const active = testcase === String(n);
            const passed = r?.output === true;
            return (
              <button
                key={n}
                onClick={() => setTestCase(String(n))}
                className="pixel-font"
                style={{
                  cursor: 'pointer',
                  height: 28,
                  minWidth: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 0,
                  fontSize: 10,
                  background: active ? (passed ? '#4CAF50' : 'var(--primary-red)') : 'var(--bg-overlay)',
                  color: active ? '#fff' : (passed ? '#4CAF50' : 'var(--primary-red)'),
                  border: active ? '1px solid transparent' : '1px solid var(--border-default)',
                  transition: 'all 0.12s ease',
                  userSelect: 'none',
                  outline: 'none',
                }}
              >
                {n}
              </button>
            );
          })}
        </div>
      )}

      {/* Output / Expected */}
      {!isSubmission ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: '10px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span className="pixel-font" style={{ color: 'var(--text-muted)', fontSize: 10 }}>OUTPUT</span>
            <span
              className="pixel-font"
              style={{
                background: isSuccess ? '#4CAF50' : 'var(--primary-red)',
                color: '#fff',
                padding: '2px 6px',
                fontSize: 8,
              }}
            >
              {isSuccess ? 'PASS' : 'FAIL'}
            </span>
          </div>
          <pre
            className="pixel-border-sm"
            style={{
              backgroundColor: 'var(--surface-default)',
              color: 'var(--text-primary)',
              padding: '10px 12px',
              fontSize: 12,
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              margin: 0,
              borderLeft: `2px solid ${isSuccess ? '#4CAF50' : 'var(--primary-red)'}`,
            }}
          >
            {String(currentResult.result ?? 'No output')}
          </pre>

          <div className="pixel-font" style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 12, marginBottom: 6 }}>
            EXPECTED
          </div>
          <pre
            className="pixel-border-sm"
            style={{
              backgroundColor: 'var(--surface-default)',
              color: 'var(--text-primary)',
              padding: '10px 12px',
              fontSize: 12,
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              margin: 0,
            }}
          >
            {String(currentResult.expected ?? 'No expected output')}
          </pre>
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="pixel-font" style={{ color: statusColor, fontSize: 16, marginBottom: 8 }}>
              {status.toUpperCase()}
            </div>
            <div style={{ color: 'var(--text-primary)', fontSize: 12 }}>
              {status === 'Accepted'
                ? 'ALL TEST CASES PASSED'
                : `${passedCount}/${totalCount} TEST CASES PASSED`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
