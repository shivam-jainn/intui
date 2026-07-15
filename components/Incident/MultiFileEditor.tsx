'use client';

import { useMemo, useState } from 'react';
import { cpp } from '@codemirror/lang-cpp';
import { python } from '@codemirror/lang-python';
import type { Extension } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import { IconX } from '@tabler/icons-react';
import CodeMirror from '@uiw/react-codemirror';
import { useAtom } from 'jotai';
import { Badge, Box, Group, ScrollArea, Tabs, Text, UnstyledButton } from '@mantine/core';
import {
  activeFilePathAtom,
  fileContentsAtom,
  incidentFilesAtom,
} from '@/contexts/IncidentContext';
import { timerStatusAtom, timerModeAtom, timerPopupAtom } from '@/contexts/TimerAtom';

const readonlyExtension = EditorView.editable.of(false);

function getLanguageExtension(lang: string): Extension {
  switch (lang) {
    case 'python':
      return python();
    case 'cpp':
      return cpp();
    default:
      return python();
  }
}

export default function MultiFileEditor() {
  const [files] = useAtom(incidentFilesAtom);
  const [activeFile, setActiveFile] = useAtom(activeFilePathAtom);
  const [fileContents, setFileContents] = useAtom(fileContentsAtom);
  const [timerStatus] = useAtom(timerStatusAtom);
  const [, setTimerMode] = useAtom(timerModeAtom);
  const [, setTimerPopup] = useAtom(timerPopupAtom);

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
    ? (fileContents[activeFile] ?? activeFileData?.content ?? '')
    : '';

  function handleChange(value: string) {
    if (!activeFile || activeFileData?.readonly) return;
    setFileContents((prev) => ({ ...prev, [activeFile]: value }));
  }

  function closeTab(e: React.MouseEvent, tabPath: string) {
    e.stopPropagation();
    const newTabs = openTabs.filter((t) => t !== tabPath);
    setOpenTabs(newTabs);
    if (activeFile === tabPath) {
      setActiveFile(newTabs[newTabs.length - 1] ?? '');
    }
  }

  const extensions = useMemo(() => {
    const exts: Extension[] = [getLanguageExtension(activeFileData?.language ?? 'python')];
    if (activeFileData?.readonly) exts.push(readonlyExtension);
    return exts;
  }, [activeFileData]);

  if (!activeFile) {
    return (
      <Box
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
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
    <Box style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* File tabs */}
      <ScrollArea scrollbarSize={4} type="never">
        <Group
          gap={0}
          style={{
            borderBottom: '1px solid var(--mantine-color-dark-5)',
            backgroundColor: 'var(--mantine-color-dark-8)',
            flexWrap: 'nowrap',
          }}
        >
          {openTabs.map((tabPath) => {
            const tabFile = files.find((f) => f.path === tabPath);
            const fileName = tabPath.split('/').pop() ?? tabPath;
            const isActive = tabPath === activeFile;
            return (
              <UnstyledButton
                key={tabPath}
                onClick={() => setActiveFile(tabPath)}
                px="sm"
                py={8}
                style={{
                  borderRight: '1px solid var(--mantine-color-dark-5)',
                  borderBottom: isActive
                    ? '2px solid var(--mantine-color-blue-5)'
                    : '2px solid transparent',
                  backgroundColor: isActive ? 'var(--mantine-color-dark-7)' : 'transparent',
                  flexShrink: 0,
                  cursor: 'pointer',
                }}
              >
                <Group gap={6}>
                  <Text
                    size="xs"
                    c={isActive ? 'white' : 'dimmed'}
                    style={{ fontFamily: 'monospace', whiteSpace: 'nowrap' }}
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
                      display: 'flex',
                      alignItems: 'center',
                      color: 'var(--mantine-color-dimmed)',
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
      <Box style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        {timerStatus === 'idle' && (
          <div
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              zIndex: 10,
              background: 'rgba(10, 10, 15, 0.8)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
              color: 'var(--text-primary)',
            }}
          >
            <div
              style={{
                maxWidth: 480,
                width: '100%',
                background: 'rgba(20, 20, 28, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 20,
                padding: '32px 28px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 24,
                textAlign: 'center',
              }}
            >
              <div>
                <div style={{ display: 'inline-flex', padding: '6px 14px', borderRadius: 99, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 12 }}>
                  SESSION LOCKED
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: -0.5 }}>
                  Activation Required
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.5 }}>
                  Select a mode to unlock the editor and start resolving the incident.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, width: '100%', textAlign: 'left' }}>
                {/* Timer Card */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.01)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: 14,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 16,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: '#20c997', letterSpacing: 0.5 }}>
                      ⏱ TIMER
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.4, marginBlockEnd: 0 }}>
                      Standard mode. Solve with a regular countdown. No system penalties.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setTimerMode('timer');
                      setTimerPopup('config');
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: 'none',
                      background: 'linear-gradient(135deg, #20c997, #12b886)',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    Start Timer
                  </button>
                </div>

                {/* Mixer Card */}
                <div
                  style={{
                    background: 'rgba(250, 82, 82, 0.01)',
                    border: '1px solid rgba(250, 82, 82, 0.15)',
                    borderRadius: 14,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 16,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: '#fa5252', letterSpacing: 0.5 }}>
                      🔥 MIXER
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.4, marginBlockEnd: 0 }}>
                      High stakes. Running out of time locks your workspace with a local penalty until verified.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setTimerMode('mixer');
                      setTimerPopup('config');
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: 'none',
                      background: 'linear-gradient(135deg, #fa5252, #e03131)',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    Start Mixer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        <CodeMirror
          key={activeFile}
          value={currentContent}
          height="100%"
          theme={oneDark}
          extensions={extensions}
          onChange={handleChange}
          style={{ height: '100%', fontSize: 13 }}
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
