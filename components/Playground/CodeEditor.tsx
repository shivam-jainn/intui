'use client';

import { python } from '@codemirror/lang-python';
import { cpp } from '@codemirror/lang-cpp';
import CodeMirror from '@uiw/react-codemirror';
import { useEffect, useState } from 'react';
import { oneDark } from '@codemirror/theme-one-dark';
import './CodeEditor.css';
import { Select, Button, Card, Notification } from '@mantine/core';
import { GrPowerReset } from "react-icons/gr";
import { useAtom } from 'jotai';
import { langAtom } from '@/contexts/LanguageContext';
import { Language } from '@/lib/common/types/playground.types';
import { useLocalStorage } from '@mantine/hooks';
import { getDriver } from '@/lib/common/playground/desc_and_driver';
import { resultAtom, resultDataAtom, submissionAtom } from '@/contexts/TestCardContext';

interface CodeEditorProps {
  questionSlug: string;
}

const CodeEditor = ({
  questionSlug
}: CodeEditorProps) => {
  const [language, setLanguage] = useAtom<Language>(langAtom);
  const [initialCode, setInitialCode] = useState("");
  const [isLoading,setIsLoading] = useState<boolean>(false);
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
    setIsLoading(true);

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
      setIsLoading(false);
    }
  }

  async function handleSubmission(){
    setUiError(null);
    setIsLoading(true);

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
      }

      setSubmission(true);
      setResultData(data);
      setTestTab("results");
    } catch (error: any) {
      setUiError("Network error: Could not reach submission server.");
    } finally {
      setIsLoading(false);
    }
  }

  return (

    <div style={{
      display:'flex',
      flexDirection: 'column',
      height:'100%'
    }}>
      

      <Card w="100%" style={{
        display: "flex",
        flexDirection: 'row',
        alignItems: "center",
        justifyContent: "space-between",
      }}
      >
        <Select
          placeholder="Select Language"
          data={languageOptions}
          value={language}
          onChange={(value) => setLanguage(value as Language)}

        />

<Button onClick={resetCode}>
          <GrPowerReset />
        </Button>


      <div style={{display:'flex',flexDirection:'row',gap:'5px'}}>

        <Button variant='secondary' onClick={handleRunCode} loading={isLoading}>Run</Button>
        <Button onClick={handleSubmission}>Submit</Button>
      </div>
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

      <div style={{
        flexGrow: 1
      }}>
      <CodeMirror
        value={storedCode}
        extensions={[getLanguageExtension()]}
        onChange={handleChange}
        theme={oneDark}
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
        minHeight='100%'
      />
      </div>
    </div>
  );
};

export default CodeEditor;
