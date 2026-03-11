'use client';

import { python } from '@codemirror/lang-python';
import { cpp } from '@codemirror/lang-cpp';
import CodeMirror from '@uiw/react-codemirror';
import { useEffect, useState } from 'react';
import { oneDark } from '@codemirror/theme-one-dark';
import './CodeEditor.css';
import { Select, Button, Card } from '@mantine/core';
import { GrPowerReset } from "react-icons/gr";
import { useAtom } from 'jotai';
import { langAtom } from '@/contexts/LanguageContext';
import { Language } from '@/lib/common/types/playground.types';
import { useLocalStorage } from '@mantine/hooks';
import { getDriver } from '@/lib/common/playground/desc_and_driver';
import { resultAtom, resultDataAtom } from '@/contexts/TestCardContext';

interface CodeEditorProps {
  questionName: string;
}

const CodeEditor = ({
  questionName
}: CodeEditorProps) => {
  const [language, setLanguage] = useAtom<Language>(langAtom);
  const [initialCode, setInitialCode] = useState("");
  const [isLoading,setIsLoading] = useState<boolean>(false);
  const [testTab,setTestTab] = useAtom(resultAtom);
  const [_,setResultData] = useAtom(resultDataAtom);

  async function setDriverCode() {
    console.log(language);
    const { driver_code } = await getDriver(decodeURIComponent(questionName), language)
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
    defaultValue: ""
  })


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

    setIsLoading(true);

    const requestBody = {
      question_name : questionName,
      code : storedCode,
      language: language
    }

    const response = await fetch('/api/execution',{
      method : "POST",
      body : JSON.stringify(requestBody)
    })

    // const {status,message} = await response.json();
    const data = await response.json();
    setResultData(data);
    console.log(data)
    // if(process.env.NODE_ENV === "development") console.log(message);
    // if(process.env.NODE_ENV === "development") console.log(status);

    setTestTab("results");



    setIsLoading(false);

  }

  async function handleSubmission(){

    setIsLoading(true);

    const requestBody = {
      question_name : questionName,
      code : storedCode,
      language: language
    }

    const response = await fetch('/api/execution/submission',{
      method : "POST",
      body : JSON.stringify(requestBody)
    })

    // const {status,message} = await response.json();
    const data = await response.json();
    setResultData(data);
    // if(process.env.NODE_ENV === "development") console.log(message);
    // if(process.env.NODE_ENV === "development") console.log(status);

    setTestTab("results");



    setIsLoading(false);

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
