'use client';

import { python } from '@codemirror/lang-python';
import { cpp } from '@codemirror/lang-cpp';
import CodeMirror from '@uiw/react-codemirror';
import { useEffect, useState } from 'react';
import { oneDark } from '@codemirror/theme-one-dark';
import './CodeEditor.css';
import { ActionIcon, Button, Card, Group, Notification, Select, Tooltip } from '@mantine/core';
import { IconPlayerPlay, IconRefresh, IconSend } from '@tabler/icons-react';
import { useAtom } from 'jotai';
import { langAtom } from '@/contexts/LanguageContext';
import TimeSwitch from '@/components/Timer/TimeSwitch';
import { Language } from '@/lib/common/types/playground.types';
import { useLocalStorage } from '@mantine/hooks';
import { getDriver } from '@/lib/common/playground/desc_and_driver';
import { resultAtom, resultDataAtom, submissionAtom } from '@/contexts/TestCardContext';

interface CodeEditorProps {
  questionSlug: string;
}

const CodeEditor = ({
  questionSlug,
}: CodeEditorProps) => {
  const [language, setLanguage] = useAtom<Language>(langAtom);
  const [initialCode, setInitialCode] = useState("");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [testTab,setTestTab] = useAtom(resultAtom);
  const [_,setResultData] = useAtom(resultDataAtom);
  const [__, setSubmission] = useAtom(submissionAtom);

  async function setDriverCode() {
    try {
      console.log(language);
      const driver = await getDriver(decodeURIComponent(questionSlug), language);
      if (driver && driver.driver_code) {
        setStoredCode(driver.driver_code);
        setInitialCode(driver.driver_code);
      }
    } catch (error) {
      console.error("Failed to load driver code:", error);
    }
  }

  useEffect(() => {
    const fetchDriverCode = async () => {
      await setDriverCode();
    };
    fetchDriverCode();
  }, [questionSlug, language]);


  const [storedCode, setStoredCode] = useLocalStorage({
    key: `${questionSlug}-${language}-code`,
    defaultValue: ""
  })

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
    { value: "cpp", label: "C++" },
    { value: "python", label: "Python" },
  ];

  function resetCode() {
    setStoredCode(initialCode);
  }

  async function handleRunCode(){
    setUiError(null);
    setIsRunning(true);

    try {
      const requestBody = {
        question_slug : questionSlug,
        code : storedCode,
        language: language
      }

      const response = await fetch('/api/execution',{
        method : "POST",
        body : JSON.stringify(requestBody)
      })

      const data = await response.json();
      
      if (!response.ok) {
        setUiError(data.message || data.error || "Execution failed");
      }
      
      setSubmission(false);
      setResultData(data);
      setTestTab("results");
    } catch (error: any) {
      setUiError("Network error: Could not reach execution server.");
    } finally {
      setIsRunning(false);
    }
  }

  async function handleSubmission(){
    setUiError(null);
    setIsSubmitting(true);

    try {
      const requestBody = {
        question_slug : questionSlug,
        code : storedCode,
        language: language
      }

      const response = await fetch('/api/execution/submission',{
        method : "POST",
        body : JSON.stringify(requestBody)
      })

      const data = await response.json();

      if (!response.ok) {
        setUiError(data.message || data.error || "Submission failed");
        return;
      }

      setSubmission(true);
      setResultData(data);
      setTestTab("results");

      try {
        await fetch("/api/submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question_slug: questionSlug,
            code: storedCode,
            language,
            status: data.status || (data.results?.length ? "Submitted" : "Unknown"),
          }),
        });
      } catch (persistError) {
        console.error("Failed to persist submission:", persistError);
      }
    } catch (error: any) {
      setUiError("Network error: Could not reach submission server.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="playground-editor-shell">
      <Card className="playground-editor-toolbar" withBorder radius="lg" p="md">
        <Group justify="space-between" wrap="nowrap" align="center">
          <Group gap="xs" wrap="nowrap">
            <Select
              className="playground-language-select"
              placeholder="Language"
              data={languageOptions}
              value={language}
              onChange={(value) => setLanguage(value as Language)}
              w={130}
              size="sm"
            />

            <Tooltip label="Reset" withArrow>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="lg"
                radius="md"
                onClick={resetCode}
                aria-label="Reset code"
              >
                <IconRefresh size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>

          <Group gap="xs" wrap="nowrap">
            {/* Timer | Mixer toggle + display */}
            <TimeSwitch questionId={questionSlug} />

            <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.06)' }} />

            <Button
              variant="light"
              color="gray"
              onClick={handleRunCode}
              loading={isRunning}
              leftSection={<IconPlayerPlay size={16} />}
            >
              Run
            </Button>
            <Button
              variant="filled"
              color="dark"
              onClick={handleSubmission}
              loading={isSubmitting}
              leftSection={<IconSend size={16} />}
            >
              Submit
            </Button>
          </Group>
        </Group>
      </Card>

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

      <div className="playground-editor-frame" style={{ position: 'relative' }}>
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
