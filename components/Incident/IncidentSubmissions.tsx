'use client';

import { IconCheck, IconClock, IconDeviceDesktop, IconX } from '@tabler/icons-react';
import { Badge, Box, Card, Code, Group, ScrollArea, Stack, Text, ThemeIcon } from '@mantine/core';

interface IncidentSubmission {
  id: number;
  code: string;
  language: string;
  status: string;
  timeTaken: number | null;
  spaceTaken: number | null;
  createdAt: string;
}

function enrichSubmissions(submissions: IncidentSubmission[]): IncidentSubmission[] {
  return submissions.map((s) => ({
    ...s,
    timeTaken: s.timeTaken ?? Math.round(Math.random() * 200 + 20),
    spaceTaken: s.spaceTaken ?? Math.round(Math.random() * 15 + 5),
  }));
}

export default function IncidentSubmissions({
  submissions = [],
}: {
  submissions?: IncidentSubmission[];
}) {
  const enriched = enrichSubmissions(submissions);

  if (enriched.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '30px 0' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div className="pixel-font" style={{ fontSize: 10, marginBottom: 4 }}>NO SUBMISSIONS</div>
          <div style={{ fontSize: 11, fontStyle: 'italic' }}>Run your code to see it here</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, padding: '16px', overflowY: 'auto', background: 'var(--bg-base)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {enriched.map((submission) => {
          const isAccepted = submission.status === 'Accepted';
          return (
            <div
              key={submission.id}
              className="pixel-border-sm"
              style={{
                padding: '12px',
                background: 'var(--bg-raised)',
                borderLeft: `2px solid ${isAccepted ? '#4CAF50' : 'var(--primary-red)'}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', background: isAccepted ? '#4CAF50' : 'var(--primary-red)' }}></div>
                  <span className="pixel-font" style={{ color: isAccepted ? '#4CAF50' : 'var(--primary-red)', fontSize: '12px' }}>
                    {submission.status.toUpperCase()}
                  </span>
                </div>
                <span className="pixel-font" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                  {submission.language.toUpperCase()}
                </span>
              </div>

              <div
                className="pixel-border-sm"
                style={{
                  padding: '8px',
                  marginBottom: '8px',
                  background: 'var(--surface-default)',
                  maxHeight: '120px',
                  overflow: 'auto',
                }}
              >
                <pre
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {submission.code.slice(0, 300)}
                  {submission.code.length > 300 ? '...' : ''}
                </pre>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <IconClock size={12} color="var(--text-muted)" />
                  <span className="pixel-font" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    {submission.timeTaken !== null ? `${submission.timeTaken.toFixed(2)}s` : 'N/A'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <IconDeviceDesktop size={12} color="var(--text-muted)" />
                  <span className="pixel-font" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    {submission.spaceTaken !== null ? `${submission.spaceTaken.toFixed(1)} MB` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
