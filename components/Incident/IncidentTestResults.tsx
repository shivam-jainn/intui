'use client';

import { IconCheck, IconX } from '@tabler/icons-react';
import { useAtom } from 'jotai';
import { Badge, Box, Code, Group, ScrollArea, Stack, Text, ThemeIcon } from '@mantine/core';
import { incidentResultAtom } from '@/contexts/IncidentContext';

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

  const hasCountFields = typeof result.passed === 'number' || typeof result.failed === 'number';

  const passedCount = typeof result.passed === 'number' ? result.passed : 0;
  const failedCount = typeof result.failed === 'number' ? result.failed : 0;
  const totalCount = passedCount + failedCount;

  const passedBool = typeof result.passed === 'boolean' ? result.passed : undefined;
  const statusText = typeof result.status === 'string' ? result.status : undefined;

  const stdout =
    typeof result.stdout === 'string'
      ? result.stdout
      : typeof result.output === 'string'
        ? result.output
        : '';
  const stderr =
    typeof result.stderr === 'string'
      ? result.stderr
      : typeof result.error === 'string'
        ? result.error
        : '';

  // Heuristic for unittest summary in stderr if passed/failed counts are missing
  let parsedPassed = passedCount;
  let parsedFailed = failedCount;
  let summaryMatched = false;

  if (totalCount === 0) {
    // Look for "Ran X tests" and "OK" or "FAILED"
    const ranMatch = stderr.match(/Ran (\d+) tests/);
    if (ranMatch) {
      const ran = parseInt(ranMatch[1], 10);
      if (stderr.includes('OK')) {
        parsedPassed = ran;
        parsedFailed = 0;
        summaryMatched = true;
      } else if (stderr.includes('FAILED')) {
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
    ? finalFailed === 0 && finalTotal > 0
    : hasCountFields
      ? failedCount === 0 && totalCount > 0
      : passedBool === true;

  // Determine if this is a "valid" failure or a system error
  // If we matched the unittest summary, it's a test result, not a crash.
  const isSystemError = !summaryMatched && stderr && !hasCountFields && !passedBool;

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg-base)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
        {/* Summary */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            className="pixel-font"
            style={{
              background: allPassed ? '#4CAF50' : 'var(--primary-red)',
              color: '#fff',
              padding: '6px 12px',
              fontSize: '12px',
            }}
          >
            {summaryMatched || hasCountFields
              ? allPassed
                ? 'ALL TESTS PASSED'
                : `${summaryMatched ? finalFailed : failedCount} / ${summaryMatched ? finalTotal : totalCount} FAILED`
              : allPassed
                ? 'PASSED'
                : statusText
                  ? statusText.toUpperCase()
                  : 'FAILED'}
          </span>
          {(summaryMatched || (hasCountFields && totalCount > 0)) && (
            <div className="pixel-font" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              {summaryMatched ? finalPassed : finalPassed} PASSED,{' '}
              {summaryMatched ? finalFailed : failedCount} FAILED
            </div>
          )}
        </div>

        {/* Stdout */}
        {stdout && (
          <div>
            <div className="pixel-font" style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              OUTPUT
            </div>
            <pre
              className="pixel-border-sm"
              style={{
                fontSize: '12px',
                backgroundColor: 'var(--surface-default)',
                color: 'var(--text-primary)',
                padding: '12px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: '300px',
                overflowY: 'auto',
                margin: 0,
              }}
            >
              {stdout}
            </pre>
          </div>
        )}

        {/* Stderr */}
        {stderr && (
          <div>
            <div className="pixel-font" style={{ fontSize: '10px', color: isSystemError ? 'var(--primary-red)' : 'var(--text-muted)', marginBottom: '8px' }}>
              {isSystemError ? 'ERRORS' : 'TEST LOGS'}
            </div>
            <pre
              className="pixel-border-sm"
              style={{
                fontSize: '12px',
                backgroundColor: 'var(--surface-default)',
                color: isSystemError ? 'var(--primary-red)' : 'var(--text-secondary)',
                padding: '12px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: '300px',
                overflowY: 'auto',
                margin: 0,
                borderLeft: isSystemError ? '2px solid var(--primary-red)' : 'none',
              }}
            >
              {stderr}
            </pre>
          </div>
        )}

        {/* Individual test cases */}
        {result.test_results && Array.isArray(result.test_results) && (
          <div>
            <div className="pixel-font" style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              TEST CASES
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {result.test_results.map((tc: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      background: tc.passed ? '#4CAF50' : 'var(--primary-red)',
                      marginTop: '4px',
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div
                      className="pixel-font"
                      style={{
                        fontSize: '10px',
                        color: tc.passed ? '#4CAF50' : 'var(--primary-red)',
                        marginBottom: tc.message ? '4px' : '0',
                      }}
                    >
                      {tc.name ?? `TEST ${i + 1}`}
                    </div>
                    {tc.message && (
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {tc.message}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
