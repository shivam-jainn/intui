"use client";

import React, { useEffect, useState } from "react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { Box, Loader, Center, Text, Group } from "@mantine/core";
import { useAtom } from "jotai";
import {
  activeFilePathAtom,
  fileContentsAtom,
  incidentFilesAtom,
} from "@/contexts/IncidentContext";

import IncidentPanel from "@/components/Incident/IncidentPanel";
import FileTree from "@/components/Incident/FileTree";
import MultiFileEditor from "@/components/Incident/MultiFileEditor";
import AIChatPanel from "@/components/Incident/AIChatPanel";
import IncidentRunBar from "@/components/Incident/IncidentRunBar";
import IncidentTestResults from "@/components/Incident/IncidentTestResults";
import SubmissionTab from "@/components/Playground/SubmissionTab";
import type { IncidentFile } from "@/app/api/incident/[incidentid]/files/route";

interface IncidentData {
  report: string;
  files: IncidentFile[];
  availableLanguages: string[];
  entryFile: string;
}

export default function IncidentPlaygroundPage({
  params,
}: {
  params: { incidentid: string };
}) {
  const incidentId = params.incidentid;

  const [incidentData, setIncidentData] = useState<IncidentData | null>(null);
  const [language, setLanguage] = useState("python");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leftTab, setLeftTab] = useState<"description" | "files" | "submissions">("description");

  const [, setFiles] = useAtom(incidentFilesAtom);
  const [, setActiveFile] = useAtom(activeFilePathAtom);
  const [, setFileContents] = useAtom(fileContentsAtom);

  async function fetchIncident(lang: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/incident/${encodeURIComponent(incidentId)}/files?language=${lang}`
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${res.status}`);
      }
      const data: IncidentData = await res.json();
      setIncidentData(data);
      setFiles(data.files);

      const initContents: Record<string, string> = {};
      for (const f of data.files) {
        initContents[f.path] = f.content;
      }
      setFileContents(initContents);

      if (data.entryFile) {
        setActiveFile(data.entryFile);
      } else if (data.files.length > 0) {
        setActiveFile(data.files[0].path);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load incident");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchIncident(language);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidentId, language]);

  if (loading) {
    return (
      <Center style={{ height: "calc(100vh - 80px)" }}>
        <Loader size="lg" color="blue" />
      </Center>
    );
  }

  if (error || !incidentData) {
    return (
      <Center style={{ height: "calc(100vh - 80px)" }}>
        <Text c="red">{error || "Incident not found"}</Text>
      </Center>
    );
  }

  return (
    <Box
      style={{
        height: "calc(100vh - 80px)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <PanelGroup direction="horizontal">
        {/* Left panel: description + file tree */}
        <Panel defaultSize={22} minSize={15} maxSize={35}>
          <Box
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              borderRight: "1px solid var(--mantine-color-dark-5)",
            }}
          >
            <Group
              gap={0}
              style={{ borderBottom: "1px solid var(--mantine-color-dark-5)" }}
            >
              {(["description", "files", "submissions"] as const).map((tab) => (
                <Box
                  key={tab}
                  px="md"
                  py={8}
                  onClick={() => setLeftTab(tab)}
                  style={{
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: leftTab === tab ? 600 : 400,
                    color:
                      leftTab === tab
                        ? "var(--mantine-color-white)"
                        : "var(--mantine-color-dimmed)",
                    borderBottom:
                      leftTab === tab
                        ? "2px solid var(--mantine-color-blue-5)"
                        : "2px solid transparent",
                    textTransform: "capitalize",
                  }}
                >
                  {tab}
                </Box>
              ))}
            </Group>

            <Box style={{ flex: 1, overflow: "hidden" }}>
              {leftTab === "description" ? (
                <IncidentPanel
                  report={incidentData.report}
                  incidentName={incidentId}
                />
              ) : leftTab === "files" ? (
                <FileTree />
              ) : (
                <Box p="md" style={{ height: "100%" }}>
                  <SubmissionTab incidentSlug={incidentId} />
                </Box>
              )}
            </Box>
          </Box>
        </Panel>

        <PanelResizeHandle
          style={{
            width: "4px",
            background: "var(--mantine-color-dark-5)",
            cursor: "col-resize",
          }}
        />

        {/* Center: run bar + editor + test results */}
        <Panel defaultSize={52} minSize={30}>
          <PanelGroup direction="vertical">
            <Panel minSize={50}>
              <Box
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <IncidentRunBar
                  incidentSlug={incidentId}
                  language={language}
                  onLanguageChange={setLanguage}
                  availableLanguages={incidentData.availableLanguages}
                  entryFile={incidentData.entryFile}
                />
                <Box style={{ flex: 1, overflow: "hidden" }}>
                  <MultiFileEditor />
                </Box>
              </Box>
            </Panel>

            <PanelResizeHandle
              style={{
                height: "4px",
                background: "var(--mantine-color-dark-5)",
                cursor: "row-resize",
              }}
            />

            <Panel defaultSize={28} minSize={15} maxSize={50}>
              <Box
                style={{
                  height: "100%",
                  borderTop: "1px solid var(--mantine-color-dark-5)",
                }}
              >
                <Box
                  px="md"
                  py={6}
                  style={{
                    borderBottom: "1px solid var(--mantine-color-dark-5)",
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
            width: "4px",
            background: "var(--mantine-color-dark-5)",
            cursor: "col-resize",
          }}
        />

        {/* Right: AI chat */}
        <Panel defaultSize={26} minSize={18} maxSize={40}>
          <Box
            style={{
              height: "100%",
              borderLeft: "1px solid var(--mantine-color-dark-5)",
            }}
          >
            <AIChatPanel
              incidentName={incidentId}
              incidentReport={incidentData.report}
            />
          </Box>
        </Panel>
      </PanelGroup>
    </Box>
  );
}