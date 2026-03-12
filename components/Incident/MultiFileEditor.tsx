"use client";

import { Box, Group, ScrollArea, Tabs, Text, Badge, UnstyledButton } from "@mantine/core";
import { useAtom } from "jotai";
import {
  activeFilePathAtom,
  fileContentsAtom,
  incidentFilesAtom,
} from "@/contexts/IncidentContext";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import CodeMirror from "@uiw/react-codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";
import type { Extension } from "@codemirror/state";
import { useMemo, useState } from "react";
import { IconX } from "@tabler/icons-react";

const readonlyExtension = EditorView.editable.of(false);

function getLanguageExtension(lang: string): Extension {
  switch (lang) {
    case "python":
      return python();
    case "cpp":
      return cpp();
    default:
      return python();
  }
}

export default function MultiFileEditor() {
  const [files] = useAtom(incidentFilesAtom);
  const [activeFile, setActiveFile] = useAtom(activeFilePathAtom);
  const [fileContents, setFileContents] = useAtom(fileContentsAtom);

  // Track which files are open as tabs (preserves order and allows close)
  const [openTabs, setOpenTabs] = useState<string[]>([]);

  // When activeFile changes, ensure it's in openTabs
  useMemo(() => {
    if (activeFile && !openTabs.includes(activeFile)) {
      setOpenTabs((prev) => [...prev, activeFile]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFile]);

  const activeFileData = files.find((f) => f.path === activeFile);
  const currentContent = activeFile
    ? (fileContents[activeFile] ?? activeFileData?.content ?? "")
    : "";

  function handleChange(value: string) {
    if (!activeFile || activeFileData?.readonly) return;
    setFileContents((prev) => ({ ...prev, [activeFile]: value }));
  }

  function closeTab(e: React.MouseEvent, tabPath: string) {
    e.stopPropagation();
    const newTabs = openTabs.filter((t) => t !== tabPath);
    setOpenTabs(newTabs);
    if (activeFile === tabPath) {
      setActiveFile(newTabs[newTabs.length - 1] ?? "");
    }
  }

  const extensions = useMemo(() => {
    const exts: Extension[] = [getLanguageExtension(activeFileData?.language ?? "python")];
    if (activeFileData?.readonly) exts.push(readonlyExtension);
    return exts;
  }, [activeFileData]);

  if (!activeFile) {
    return (
      <Box
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <Text c="dimmed" size="sm">
          Select a file from the tree to start editing
        </Text>
      </Box>
    );
  }

  return (
    <Box style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* File tabs */}
      <ScrollArea scrollbarSize={4} type="never">
        <Group
          gap={0}
          style={{
            borderBottom: "1px solid var(--mantine-color-dark-5)",
            backgroundColor: "var(--mantine-color-dark-8)",
            flexWrap: "nowrap",
          }}
        >
          {openTabs.map((tabPath) => {
            const tabFile = files.find((f) => f.path === tabPath);
            const fileName = tabPath.split("/").pop() ?? tabPath;
            const isActive = tabPath === activeFile;
            return (
              <UnstyledButton
                key={tabPath}
                onClick={() => setActiveFile(tabPath)}
                px="sm"
                py={8}
                style={{
                  borderRight: "1px solid var(--mantine-color-dark-5)",
                  borderBottom: isActive
                    ? "2px solid var(--mantine-color-blue-5)"
                    : "2px solid transparent",
                  backgroundColor: isActive
                    ? "var(--mantine-color-dark-7)"
                    : "transparent",
                  flexShrink: 0,
                  cursor: "pointer",
                }}
              >
                <Group gap={6}>
                  <Text
                    size="xs"
                    c={isActive ? "white" : "dimmed"}
                    style={{ fontFamily: "monospace", whiteSpace: "nowrap" }}
                  >
                    {fileName}
                  </Text>
                  {tabFile?.readonly && (
                    <Badge size="xs" color="gray" variant="outline" px={4}>
                      RO
                    </Badge>
                  )}
                  <UnstyledButton
                    onClick={(e) => closeTab(e, tabPath)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      color: "var(--mantine-color-dimmed)",
                      borderRadius: 2,
                    }}
                  >
                    <IconX size={11} />
                  </UnstyledButton>
                </Group>
              </UnstyledButton>
            );
          })}
        </Group>
      </ScrollArea>

      {/* Editor */}
      <Box style={{ flex: 1, overflow: "auto" }}>
        <CodeMirror
          key={activeFile}
          value={currentContent}
          height="100%"
          theme={oneDark}
          extensions={extensions}
          onChange={handleChange}
          style={{ height: "100%", fontSize: 13 }}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            highlightActiveLine: !activeFileData?.readonly,
          }}
        />
      </Box>
    </Box>
  );
}
