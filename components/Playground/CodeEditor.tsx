'use client';

import { python } from '@codemirror/lang-python';
import { cpp } from '@codemirror/lang-cpp';
import CodeMirror from '@uiw/react-codemirror';
import { useEffect, useState } from 'react';
import { githubLight } from '@uiw/codemirror-theme-github';
import { oneDark } from '@codemirror/theme-one-dark';
import './CodeEditor.css';
import { Select, Button, useMantineColorScheme } from '@mantine/core';
import { GrPowerReset } from 'react-icons/gr';
import { useAtom } from 'jotai';
import { useLocalStorage } from '@mantine/hooks';
import { langAtom } from '@/contexts/LanguageContext';
import { Language } from '@/lib/common/types/playground.types';
import { getDriver } from '@/lib/common/playground/desc_and_driver';
import { resultAtom, resultDataAtom } from '@/contexts/TestCardContext';

interface CodeEditorProps {
  questionName: string;
  onSubmissionComplete?: () => void;
}

const CodeEditor = ({
  questionName,
  onSubmissionComplete,
}: CodeEditorProps) => {
  const [language, setLanguage] = useAtom<Language>(langAtom);
  const [initialCode, setInitialCode] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [, setTestTab] = useAtom(resultAtom);
  const [, setResultData] = useAtom<any>(resultDataAtom);
  const { colorScheme } = useMantineColorScheme();

  async function setDriverCode() {
    const { driver_code } = await getDriver(decodeURIComponent(questionName), language);
    setStoredCode(driver_code);
    setInitialCode(driver_code);
  }

  useEffect(() => {
    const fetchDriverCode = async () => {
      await setDriverCode();
    };
    fetchDriverCode();
  }, [questionName, language]);

  const [storedCode, setStoredCode] = useLocalStorage({
    key: `${questionName}-code`,
    defaultValue: '',
  });

  async function streamExecutionResultViaFetch(jobId: string) {
    const response = await fetch(`/api/execution/${jobId}/stream`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Accept: 'text/event-stream',
      },
    });

    if (!response.ok || !response.body) {
      throw new Error('Failed to open execution stream');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    let streamDone = false;
    while (!streamDone) {
      const { value, done } = await reader.read();
      if (done) {
        streamDone = true;
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split('\n\n');
      buffer = chunks.pop() ?? '';

      for (const chunk of chunks) {
        const line = chunk
          .split('\n')
          .find((part) => part.startsWith('data: '));

        if (line) {
          const data = JSON.parse(line.replace(/^data:\s*/, '')) as Record<string, unknown>;
          setResultData(data);
          setTestTab('results');

          if (data.status === 'completed' || data.status === 'failed') {
            return data;
          }
        }
      }
    }

    throw new Error('Execution stream closed before completion');
  }

  async function streamExecutionResult(jobId: string) {
    return new Promise((resolve, reject) => {
      let settled = false;
      const timeoutAt = Date.now() + 120000;
      let eventSource: EventSource | null = null;
      let receivedMessage = false;
      let fallbackTriggered = false;

      const timeoutId = setTimeout(() => {
        if (settled) {
          return;
        }

        settled = true;
        if (eventSource) {
          eventSource.close();
        }
        reject(new Error('Execution stream timed out. Please try again.'));
      }, 120000);

      const done = (cb: () => void) => {
        if (settled) {
          return;
        }

        settled = true;
        clearTimeout(timeoutId);
        if (eventSource) {
          eventSource.close();
        }
        cb();
      };

      const triggerFetchFallback = () => {
        if (settled || fallbackTriggered) {
          return;
        }

        fallbackTriggered = true;
        if (eventSource) {
          eventSource.close();
        }

        streamExecutionResultViaFetch(jobId)
          .then((data) => done(() => resolve(data)))
          .catch((error: unknown) => done(() => reject(error)));
      };

      setTimeout(() => {
        if (!receivedMessage) {
          triggerFetchFallback();
        }
      }, 5000);

      const connect = () => {
        if (settled) {
          return;
        }

        if (Date.now() >= timeoutAt) {
          done(() => reject(new Error('Execution stream timed out. Please try again.')));
          return;
        }

        eventSource = new EventSource(`/api/execution/${jobId}/stream`);

        eventSource.onmessage = (event) => {
          try {
            receivedMessage = true;
            const data = JSON.parse(event.data) as Record<string, unknown>;
            setResultData(data);
            setTestTab('results');

            if (data.status === 'completed' || data.status === 'failed') {
              done(() => resolve(data));
            }
          } catch {
            done(() => reject(new Error('Invalid SSE payload')));
          }
        };

        eventSource.onerror = () => {
          if (settled) {
            return;
          }

          if (eventSource) {
            eventSource.close();
          }

          setResultData({
            status: 'processing',
            message: 'Reconnecting stream...',
          });

          setTimeout(() => {
            if (!receivedMessage && Date.now() > timeoutAt - 110000) {
              triggerFetchFallback();
              return;
            }

            connect();
          }, 1000);
        };
      };

      connect();
    });
  }

  async function handleQueuedExecution(endpoint: string, queuedMessage: string) {
    setIsLoading(true);

    const requestBody = {
      question_name: questionName,
      code: storedCode,
      language,
    };

    try {
      const enqueueResponse = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const enqueueData = await enqueueResponse.json();
      if (!enqueueResponse.ok || !enqueueData?.jobId) {
        setResultData(enqueueData);
        setTestTab('results');
        return;
      }

      setResultData({ message: queuedMessage, status: 'queued' });
      setTestTab('results');

      const finalData = await streamExecutionResult(enqueueData.jobId);

      setResultData(finalData);
      setTestTab('results');

      // If this was a submission flow, notify parent to refresh question data
      if (endpoint.includes('/submission')) {
        try {
          onSubmissionComplete?.();
        } catch {
          // ignore
        }
      }
    } catch (error) {
      setResultData({
        message: 'Failed to process execution request',
        error: error instanceof Error ? error.message : String(error),
      });
      setTestTab('results');
    } finally {
      setIsLoading(false);
    }
  }

  const handleChange = (value: string) => {
    setStoredCode(value);
  };

  const getLanguageExtension = () => {
    switch (language) {
      case 'python':
        return python();

      case 'cpp':
        return cpp();

      default:
        return python();
    }
  };

  const languageOptions = [
    { value: 'cpp', label: 'C++' },
    { value: 'python', label: 'Python' },
  ];

  function resetCode() {
    setStoredCode(initialCode);
  }

  async function handleRunCode() {
    await handleQueuedExecution('/api/execution', 'Execution queued...');
  }

  async function handleSubmission() {
    await handleQueuedExecution('/api/execution/submission', 'Submission queued...');
  }

  return (

    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: 'var(--mantine-color-body)',
    }}>

      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          backgroundColor: 'var(--mantine-color-body)',
          borderBottom: '1px solid var(--mantine-color-default-border)',
        }}
      >
        <Select
          placeholder="Select Language"
          data={languageOptions}
          value={language}
          onChange={(value) => setLanguage(value as Language)}
          size="sm"
          styles={{
            input: {
              backgroundColor: 'var(--mantine-color-default)',
              border: '1px solid var(--mantine-color-default-border)',
            },
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'row', gap: '8px' }}>
          <Button variant="default" size="sm" onClick={resetCode} px="xs">
            <GrPowerReset />
          </Button>
          <Button variant="filled" size="sm" onClick={handleRunCode} loading={isLoading}>
            Run
          </Button>
          <Button variant="filled" size="sm" onClick={handleSubmission}>
            Submit
          </Button>
        </div>
      </div>

      <div style={{
        flexGrow: 1,
      }}>
      <CodeMirror
        value={storedCode}
        extensions={[getLanguageExtension()]}
        onChange={handleChange}
        theme={colorScheme === 'dark' ? oneDark : githubLight}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightSpecialChars: true,
          foldGutter: true,
          drawSelection: true,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          rectangularSelection: true,
          crosshairCursor: true,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          closeBracketsKeymap: true,
          defaultKeymap: true,
          searchKeymap: true,
          historyKeymap: true,
          foldKeymap: true,
          completionKeymap: true,
          lintKeymap: true,
        }}
        height="100%"
      />
      </div>
    </div>
  );
};

export default CodeEditor;
