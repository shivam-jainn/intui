'use client';

import { python } from '@codemirror/lang-python';
import CodeMirror from '@uiw/react-codemirror';
import { useState } from 'react';
import { oneDark } from '@codemirror/theme-one-dark';
import './CodeEditor.css';
import { Stack , Container, Input, Button } from '@mantine/core';
import { FaChevronDown } from "react-icons/fa6";
import { GrPowerReset } from "react-icons/gr";

interface CodeEditorProps {
  initialCode?: string;
  language?: 'python';
  onChange?: (value: string) => void;
}

const CodeEditor = ({ 
  initialCode = '', 
  language = 'python',
  onChange 
}: CodeEditorProps) => {
  const [code, setCode] = useState(initialCode);

  const handleChange = (value: string) => {
    setCode(value);
    onChange?.(value);
  };

  const getLanguageExtension = () => {
    switch (language) {
      case 'python':
        return python();
    }
  };

  return (
    <Stack h='100%'>
   
   <Container w="100%"  pt="2rem">
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
    <select
      style={{
        height: "30px", // Set a fixed height for the select
        borderRadius: "0.25rem", // Optional: add some border radius
        padding: "0 0.5rem", // Optional: add some padding for better spacing
      }}
    >
      <option value="1">1</option>
      <option value="2">2</option>
    </select>

    <Button style={{ height: "30px",minWidth: "50px" }}> {/* Set the same height for the button */}
      <GrPowerReset />
    </Button>
  </Container>
</Container>

    <div className="code-editor-container">
      <CodeMirror
        value={code}
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
