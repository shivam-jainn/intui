"use client";

import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import {
  activeFilePathAtom,
  fileContentsAtom,
  incidentFilesAtom,
  incidentResultAtom,
  incidentSubmissionAtom,
  incidentRunningAtom,
} from "@/contexts/IncidentContext";

interface IncidentRunBarProps {
  incidentSlug: string;
  language: string;
  availableLanguages: string[];
  entryFile: string;
}

/**
 * Hidden controller component that handles Run/Submit logic.
 * UI buttons are now in the TopBar — this component listens for
 * custom DOM events and executes the API call.
 */
export default function IncidentRunBar({
  incidentSlug,
  language,
  availableLanguages,
  entryFile,
}: IncidentRunBarProps) {
  const [files] = useAtom(incidentFilesAtom);
  const [activeFile] = useAtom(activeFilePathAtom);
  const [fileContents] = useAtom(fileContentsAtom);
  const [, setResult] = useAtom(incidentResultAtom);
  const [, setSubmission] = useAtom(incidentSubmissionAtom);
  const [running, setRunning] = useAtom(incidentRunningAtom);

  function getSubmitCode(): { code: string; filePath: string } {
    const target = activeFile || entryFile;
    const fileData = files.find((f) => f.path === target && !f.readonly);
    const code = fileContents[target] ?? fileData?.content ?? "";
    return { code, filePath: target };
  }

  async function executeIncident(isSubmission: boolean) {
    setRunning(true);
    setSubmission(isSubmission);

    const { code, filePath } = getSubmitCode();

    if (!code || code.trim().length < 5) {
      setRunning(false);
      return;
    }

    try {
      const executionFiles = files.map((file) => ({
        path: file.path,
        content: file.readonly
          ? file.content
          : fileContents[file.path] ?? file.content,
        readonly: file.readonly,
        language: file.language,
      }));

      const response = await fetch("/api/incident", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incident_slug: incidentSlug,
          code,
          language,
          entryFile: filePath,
          files: executionFiles,
          isSubmission,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setResult({
          id: Date.now().toString(),
          timestamp: Date.now(),
          isSubmission,
          status: "error",
          passed: 0,
          failed: 0,
          total: 0,
          stdout: "",
          stderr: data.message || data.error || "Run failed",
          testResults: [],
        });
        return;
      }

      setResult(data);
    } catch {
      setResult({
        id: Date.now().toString(),
        timestamp: Date.now(),
        isSubmission,
        status: "error",
        passed: 0,
        failed: 0,
        total: 0,
        stdout: "",
        stderr: "Network error: could not reach execution server.",
        testResults: [],
      });
    } finally {
      setRunning(false);
    }
  }

  // Listen for keyboard shortcut events
  useEffect(() => {
    const onRun = () => executeIncident(false);
    const onSubmit = () => executeIncident(true);
    document.addEventListener("incident-run", onRun);
    document.addEventListener("incident-submit", onSubmit);
    return () => {
      document.removeEventListener("incident-run", onRun);
      document.removeEventListener("incident-submit", onSubmit);
    };
  }, [files, fileContents, activeFile, incidentSlug, language]);

  // This component renders nothing — it's a logic-only controller
  return null;
}
