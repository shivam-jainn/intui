import React from 'react';
import { MantineProvider } from '@mantine/core';
import { Provider as JotaiProvider } from 'jotai';
import { act, render, screen, waitFor } from '@testing-library/react';
import { theme } from '@/theme';
import CodeEditor from './CodeEditor';
import TestCard from './TestCard';

jest.mock('@/lib/common/playground/desc_and_driver', () => ({
  getDriver: jest.fn(async () => ({ driver_code: 'class Solution:\n    pass\n' })),
}));

jest.mock('@uiw/react-codemirror', () => {
  return function MockCodeMirror(props: {
    value: string;
    onChange: (value: string) => void;
  }) {
    return (
      <textarea
        data-testid="mock-codemirror"
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
      />
    );
  };
});

type EventSourceEventHandler = ((event: MessageEvent<string>) => void) | null;

class MockEventSource {
  static instances: MockEventSource[] = [];

  url: string;

  onmessage: EventSourceEventHandler = null;

  onerror: ((event: Event) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  close() {}

  emitMessage(payload: unknown) {
    if (!this.onmessage) {
      return;
    }

    this.onmessage({
      data: JSON.stringify(payload),
    } as MessageEvent<string>);
  }
}

describe('CodeEditor SSE flow', () => {
  beforeEach(() => {
    MockEventSource.instances = [];
    (global as unknown as { EventSource: typeof MockEventSource }).EventSource =
      MockEventSource;

    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      if (String(input).includes('/api/execution')) {
        return {
          ok: true,
          json: async () => ({
            message: 'Execution request queued.',
            jobId: 'job-123',
            status: 'queued',
          }),
        } as Response;
      }

      throw new Error(`Unexpected fetch call: ${String(input)}`);
    }) as jest.Mock;
  });

  it('shows final execution result from SSE events', async () => {
    render(
      <MantineProvider theme={theme}>
        <JotaiProvider>
          <CodeEditor questionName="two-sum" />
          <TestCard />
        </JotaiProvider>
      </MantineProvider>
    );

    const runButton = await screen.findByRole('button', { name: 'Run' });
    await act(async () => {
      runButton.click();
    });

    await waitFor(() => {
      expect(MockEventSource.instances.length).toBe(1);
    });

    const sse = MockEventSource.instances[0];

    await act(async () => {
      sse.emitMessage({
        jobId: 'job-123',
        status: 'queued',
        message: 'Execution queued...',
      });
    });

    await act(async () => {
      sse.emitMessage({
        jobId: 'job-123',
        status: 'completed',
        results: [
          {
            input: { nums: [2, 7, 11, 15], target: 9 },
            expected: [0, 1],
            actual: [0, 1],
            output: true,
          },
        ],
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Passed')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('/api/execution', expect.any(Object));
  });
});
