'use client';

import React, { useEffect } from 'react';
import { useAtom } from 'jotai';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Box, Center, Group, Text } from '@mantine/core';
import AIChatPanel from '@/components/Incident/AIChatPanel';
import FileTree from '@/components/Incident/FileTree';
import IncidentPanel from '@/components/Incident/IncidentPanel';
import IncidentRunBar from '@/components/Incident/IncidentRunBar';
import IncidentSubmissions from '@/components/Incident/IncidentSubmissions';
import IncidentTestResults from '@/components/Incident/IncidentTestResults';
import MultiFileEditor from '@/components/Incident/MultiFileEditor';
import {
  activeFilePathAtom,
  fileContentsAtom,
  incidentFilesAtom,
  incidentLeftTabAtom,
} from '@/contexts/IncidentContext';
import { useIncidentFiles } from '@/lib/hooks/useIncidentFiles';
import { useIncidentSubmissions } from '@/lib/hooks/useIncidentSubmissions';
import { timerDefaultConfigAtom } from '@/contexts/TimerAtom';
import DesktopWarning from '@/components/DesktopWarning';

export default function IncidentPlaygroundPage({ params }: { params: { incidentid: string } }) {
  const incidentId = params.incidentid;

  const [language, setLanguage] = React.useState('python');
  const [leftTab, setLeftTab] = useAtom(incidentLeftTabAtom);
  const [, setTimerConfig] = useAtom(timerDefaultConfigAtom);

  const [, setFiles] = useAtom(incidentFilesAtom);
  const [, setActiveFile] = useAtom(activeFilePathAtom);
  const [, setFileContents] = useAtom(fileContentsAtom);

  const {
    data: incidentData,
    isLoading: filesLoading,
    error: filesError,
  } = useIncidentFiles(incidentId, language);

  const { data: submissions } = useIncidentSubmissions(incidentId);

  useEffect(() => {
    if (!incidentData) return;
    setFiles(incidentData.files);

    const initContents: Record<string, string> = {};
    for (const f of incidentData.files) {
      initContents[f.path] = f.content;
    }
    setFileContents(initContents);

    if (incidentData.entryFile) {
      setActiveFile(incidentData.entryFile);
    } else if (incidentData.files.length > 0) {
      setActiveFile(incidentData.files[0].path);
    }
    
    // Assuming SLA might be part of incidentData, let's say 45 mins default for now or read from report
    // Need to parse SLA or default to 60. Wait, SLA should be provided.
    // Since we don't know the exact property, we use 60 as default or read incidentData.sla
    setTimerConfig({ type: 'incident', slaMinutes: (incidentData as any).slaMinutes ?? (incidentData as any).sla ?? 60 });
  }, [incidentData, setFiles, setFileContents, setActiveFile, setTimerConfig]);

  if (filesLoading) {
    return (
      <Center style={{ height: 'calc(100vh - 80px)' }}>
        <div className="pixel-border animate-pulse" style={{ padding: '20px 40px', background: 'var(--surface-default)' }}>
          <Text className="pixel-font" style={{ color: 'var(--primary-red)' }}>LOADING DATABANKS...</Text>
        </div>
      </Center>
    );
  }

  if (filesError || !incidentData) {
    return (
      <Center style={{ height: 'calc(100vh - 80px)' }}>
        <Text c="red">{(filesError as any)?.message || 'Incident not found'}</Text>
      </Center>
    );
  }

  return (
    <Box
      style={{
        height: 'calc(100vh - 80px)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <DesktopWarning />
      <PanelGroup direction="horizontal">
        {/* Left panel: description + file tree + submissions */}
        <Panel defaultSize={22} minSize={15} maxSize={35}>
          <Box
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              borderRight: '1px solid var(--mantine-color-dark-5)',
            }}
          >
            <Group gap={0} style={{ borderBottom: '1px solid var(--mantine-color-dark-5)' }}>
              {(['description', 'files', 'submissions'] as const).map((tab) => (
                <Box
                  key={tab}
                  px="md"
                  py={8}
                  onClick={() => setLeftTab(tab)}
                  style={{
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: leftTab === tab ? 600 : 400,
                    color:
                      leftTab === tab
                        ? 'var(--mantine-color-white)'
                        : 'var(--mantine-color-dimmed)',
                    borderBottom:
                      leftTab === tab
                        ? '2px solid var(--mantine-color-blue-5)'
                        : '2px solid transparent',
                    textTransform: 'capitalize',
                  }}
                >
                  {tab}
                </Box>
              ))}
            </Group>

            <Box style={{ flex: 1, overflow: 'hidden' }}>
              {leftTab === 'description' ? (
                <IncidentPanel report={incidentData.report} incidentName={incidentId} />
              ) : leftTab === 'files' ? (
                <FileTree />
              ) : (
                <IncidentSubmissions submissions={submissions ?? []} />
              )}
            </Box>
          </Box>
        </Panel>

        <PanelResizeHandle
          style={{
            width: '4px',
            background: 'var(--mantine-color-dark-5)',
            cursor: 'col-resize',
          }}
        />

        {/* Center: run bar + editor + test results */}
        <Panel defaultSize={52} minSize={30}>
          <PanelGroup direction="vertical">
            <Panel minSize={50}>
              <Box
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <IncidentRunBar
                  incidentSlug={incidentId}
                  language={language}
                  onLanguageChange={setLanguage}
                  availableLanguages={incidentData.availableLanguages}
                  entryFile={incidentData.entryFile}
                />
                <Box style={{ flex: 1, overflow: 'hidden' }}>
                  <MultiFileEditor />
                </Box>
              </Box>
            </Panel>

            <PanelResizeHandle
              style={{
                height: '4px',
                background: 'var(--mantine-color-dark-5)',
                cursor: 'row-resize',
              }}
            />

            <Panel defaultSize={28} minSize={15} maxSize={50}>
              <Box
                style={{
                  height: '100%',
                  borderTop: '1px solid var(--mantine-color-dark-5)',
                }}
              >
                <Box
                  px="md"
                  py={6}
                  style={{
                    borderBottom: '1px solid var(--mantine-color-dark-5)',
                  }}
                >
                  <Text size="xs" fw={600} c="dimmed">
                    TEST RESULTS
                  </Text>
                </Box>
                <IncidentTestResults />
              </Box>
            </Panel>
          </PanelGroup>
        </Panel>

        <PanelResizeHandle
          style={{
            width: '4px',
            background: 'var(--mantine-color-dark-5)',
            cursor: 'col-resize',
          }}
        />

        {/* Right: AI chat */}
        <Panel defaultSize={26} minSize={18} maxSize={40}>
          <Box
            style={{
              height: '100%',
              borderLeft: '1px solid var(--mantine-color-dark-5)',
            }}
          >
            <AIChatPanel incidentName={incidentId} incidentReport={incidentData.report} />
          </Box>
        </Panel>
      </PanelGroup>
    </Box>
  );
}
