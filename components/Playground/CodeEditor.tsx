'use client';

import { python } from '@codemirror/lang-python';
import { cpp } from '@codemirror/lang-cpp';
import CodeMirror from '@uiw/react-codemirror';
import { useEffect, useState } from 'react';
import { oneDark } from '@codemirror/theme-one-dark';
import './CodeEditor.css';
import { Stack , Container, Select , Button } from '@mantine/core';
import { FaChevronDown } from "react-icons/fa6";
import { GrPowerReset } from "react-icons/gr";
import { useAtom } from 'jotai';
import { langAtom } from '@/contexts/LanguageContext';
import { Language } from '@/lib/common/types/playground.types';
import { useLocalStorage } from '@mantine/hooks';
import { getDriver } from '@/lib/common/playground/desc_and_driver';

interface CodeEditorProps {
  questionName: string;
}

const CodeEditor = ({ 
  questionName
}: CodeEditorProps) => {
  const [language,setLanguage] = useAtom<Language>(langAtom);
  const [initialCode,setInitialCode] = useState("");

  async function setDriverCode(){
    console.log(language);
    const {driver_code} = await getDriver(decodeURIComponent(questionName),language)
    setStoredCode(driver_code);
    setInitialCode(driver_code);
  }

  useEffect(() => {
    const fetchDriverCode = async () => {
      await setDriverCode();
    };
    fetchDriverCode();
  }, [questionName, language]);
  

  const [storedCode,setStoredCode] = useLocalStorage({
    key: `${questionName}-code`,
    defaultValue : ""
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
  
  function resetCode(){
    setStoredCode(initialCode);
  }

  return (
    <Stack h='100%'>
   
   <Container w="100%"  pt="0.5rem" pb="0.5rem">
  <Container
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      borderRadius: "0.5rem",
    }}
    bg="gray"
    w="98%"
    py="sm"
    px="lg"
  >
   <Select
      placeholder="Select Language"
      data={languageOptions}
      value={language}
      onChange={(value) => setLanguage(value as Language)}
      comboboxProps={{
        position: "bottom",
        middlewares: { flip: false, shift: false },
        offset: 0,
      }}
    />


    <Button style={{ height: "30px",minWidth: "50px" }} onClick={resetCode}> 
      <GrPowerReset />
    </Button>
  </Container>
</Container>

    <div className="code-editor-container">
      <CodeMirror
        value={storedCode}
        height='100vh'
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
      />
    </div>
    </Stack>
  );
};

export default CodeEditor;
