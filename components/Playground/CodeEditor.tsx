'use client';

import { useEffect, useRef, useState } from 'react';
import { cpp } from '@codemirror/lang-cpp';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';
import CodeMirror from '@uiw/react-codemirror';

import './CodeEditor.css';

import { useAtom } from 'jotai';
import { GrPowerReset } from 'react-icons/gr';
import { Button, Card, Notification, Select } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import { langAtom } from '@/contexts/LanguageContext';
import { resultAtom, resultDataAtom, submissionAtom } from '@/contexts/TestCardContext';
import { Language } from '@/lib/common/types/playground.types';
import { useDriverCode } from '@/lib/hooks/useDriverCode';
import Timer, { TimerHandle } from '@/components/Timer/Timer';
import { useTimerContext } from '@/components/Timer/TimerContext';
import { useQueryClient } from '@tanstack/react-query';
import { questionTabAtom } from '@/contexts/TestCardContext';

interface CodeEditorProps {
  questionSlug: string;
}

const CodeEditor = ({ questionSlug }: CodeEditorProps) => {
  const [language, setLanguage] = useAtom<Language>(langAtom);
  const [initialCode, setInitialCode] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [testTab, setTestTab] = useAtom(resultAtom);
  const [_, setResultData] = useAtom(resultDataAtom);
  const [__, setSubmission] = useAtom(submissionAtom);
  const [, setQuestionTab] = useAtom(questionTabAtom);
  const { timerRef } = useTimerContext();
  const queryClient = useQueryClient();

  const { data: driver, error: driverError } = useDriverCode(
    decodeURIComponent(questionSlug),
    language
  );

  useEffect(() => {
    if (driver && driver.driver_code) {
      setStoredCode(driver.driver_code);
      setInitialCode(driver.driver_code);
    }
  }, [driver]);

  const [storedCode, setStoredCode] = useLocalStorage({
    key: `${questionSlug}-${language}-code`,
    defaultValue: '',
  });

  useEffect(() => {
    // If there's no stored code for this specific lang/question, use the driver code
    if (!storedCode && initialCode) {
      setStoredCode(initialCode);
    }
  }, [initialCode, storedCode, setStoredCode]);

  // Local state for temporary UI error messages
  const [uiError, setUiError] = useState<string | null>(null);

  const handleChange = (value: string) => {
    setStoredCode(value);
  };

  const getLanguageExtension = () => {
    switch (language) {
      case 'python':
        return python();

      case 'cpp':
        return cpp();
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
    setUiError(null);
    setIsLoading(true);

    try {
      const requestBody = {
        question_slug: questionSlug,
        code: storedCode,
        language: language,
      };

      const response = await fetch('/api/execution', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      setSubmission(false);
      setResultData(data);
      setTestTab('results');
    } catch (error: any) {
      setUiError(
        'Unable to connect to the execution server. Check your internet connection and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmission() {
    setUiError(null);
    setIsLoading(true);

    try {
      const requestBody = {
        question_slug: questionSlug,
        code: storedCode,
        language: language,
      };

      const response = await fetch('/api/execution/submission', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      setSubmission(true);
      setResultData(data);
      setTestTab('results');
      setQuestionTab('submission');

      queryClient.invalidateQueries({ queryKey: ['question', decodeURIComponent(questionSlug)] });

      await timerRef.current?.submitMixerRun();
    } catch (error: any) {
      setUiError(
        'Unable to connect to the submission server. Check your internet connection and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <div
        style={{
          width: '100%',
          padding: '6px 14px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          background: 'var(--bg-raised)',
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <select
            className="pixel-font pixel-border-sm"
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            style={{
              padding: '6px 10px',
              background: 'var(--surface-default)',
              color: 'var(--text-primary)',
              fontSize: '10px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {languageOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button 
            className="pixel-btn-ghost-sm" 
            onClick={resetCode} 
            style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Reset Code"
          >
            <GrPowerReset size={14} />
          </button>
        </div>

        <div style={{ flex: 1, minWidth: '10px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            className="pixel-font pixel-btn-ghost-sm"
            onClick={handleRunCode}
            disabled={isLoading}
          >
            RUN
          </button>
          <button
            className="pixel-font pixel-btn-sm"
            onClick={handleSubmission}
            disabled={isLoading}
          >
            SUBMIT
          </button>
        </div>
      </div>

      {uiError && (
        <Notification
          color="red"
          title="Execution Error"
          onClose={() => setUiError(null)}
          mt="sm"
          mb="sm"
        >
          {uiError}
        </Notification>
      )}

      <div
        style={{
          flexGrow: 1,
          overflowY: 'auto',
        }}
      >
        <CodeMirror
          value={storedCode}
          extensions={[getLanguageExtension()]}
          onChange={handleChange}
          theme={oneDark}
          height="100%"
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
        />
      </div>
    </div>
  );
};

export default CodeEditor;
