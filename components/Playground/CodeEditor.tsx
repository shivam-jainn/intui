'use client';

import { python } from '@codemirror/lang-python';
import { cpp } from '@codemirror/lang-cpp';
import CodeMirror from '@uiw/react-codemirror';
import { useEffect, useState } from 'react';
import { oneDark } from '@codemirror/theme-one-dark';
import './CodeEditor.css';
import { Stack, Container, Select, Button, Card } from '@mantine/core';
import { GrPowerReset } from "react-icons/gr";
import { useAtom } from 'jotai';
import { langAtom } from '@/contexts/LanguageContext';
import { Language } from '@/lib/common/types/playground.types';
import { useLocalStorage } from '@mantine/hooks';
import { getDriver } from '@/lib/common/playground/desc_and_driver';
import RunAndSubmissionBar from './RunAndSubmissionBar';

interface CodeEditorProps {
  questionName: string;
}

const CodeEditor = ({
  questionName
}: CodeEditorProps) => {
  const [language, setLanguage] = useAtom<Language>(langAtom);
  const [initialCode, setInitialCode] = useState("");

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
        bg="gray"
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

        <Button variant='secondary'>Run</Button>
        <Button>Submit</Button>
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
