"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import type { ImperativePanelHandle } from "react-resizable-panels";
import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import {
  IconArrowLeft,
  IconFileCode,
  IconFileText,
  IconRobot,
  IconPlayerPlay,
  IconSend,
  IconLoader2,
  IconChevronRight,
  IconCheck,
  IconAlertTriangle,
} from "@tabler/icons-react";
import Link from "next/link";
import {
  activeFilePathAtom,
  fileContentsAtom,
  incidentFilesAtom,
  slaSecondsAtom,
  slaTotalSecondsAtom,
  incidentMetaAtom,
  incidentRunningAtom,
  incidentResultAtom,
  incidentSubmissionAtom,
  isModifiedAtom,
  fileTreeOpenAtom,
  aiPanelOpenAtom,
  testDrawerOpenAtom,
  leftTabAtom,
} from "@/contexts/IncidentContext";
import { t } from "@/lib/incident-theme";

import IncidentPanel from "@/components/Incident/IncidentPanel";
import FileTree from "@/components/Incident/FileTree";
import MultiFileEditor from "@/components/Incident/MultiFileEditor";
import AIChatPanel from "@/components/Incident/AIChatPanel";
import IncidentRunBar from "@/components/Incident/IncidentRunBar";
import MixerExplainerModal from "@/components/Mixer/MixerExplainerModal";
import TimeSwitch from "@/components/Timer/TimeSwitch";
import ScreenLockUp from "@/components/ScreenLockUp";
import type { IncidentFile } from "@/app/api/incident/[incidentid]/files/route";

interface IncidentData {
  report: string;
  files: IncidentFile[];
  availableLanguages: string[];
  entryFile: string;
  title?: string;
  severity?: string;
  difficulty?: string;
  service?: string;
  slaMinutes?: number;
}

const severityColors: Record<string, { color: string; bg: string; border: string }> = {
  P0: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)" },
  P1: { color: "#60a5fa", bg: "rgba(96,165,250,0.08)", border: "rgba(96,165,250,0.2)" },
  P2: { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" },
};

// ── Top Bar ─────────────────────────────────────────────
function TopBar({
  incidentId,
  language,
  onLanguageChange,
  availableLanguages,
  onRun,
  onSubmit,
  onFileTreeToggle,
  onAiPanelToggle,
  onBack,
}: {
  incidentId: string;
  language: string;
  onLanguageChange: (lang: string) => void;
  availableLanguages: string[];
  onRun: () => void;
  onSubmit: () => void;
  onFileTreeToggle: () => void;
  onAiPanelToggle: () => void;
  onBack: () => void;
}) {
  const [meta] = useAtom(incidentMetaAtom);
  const [running] = useAtom(incidentRunningAtom);
  const [fileTreeOpen] = useAtom(fileTreeOpenAtom);
  const [aiPanelOpen] = useAtom(aiPanelOpenAtom);

  const sev = severityColors[meta?.severity || "P0"] || severityColors.P0;

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          height: t.sidebar.topBarHeight,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 16px",
          borderBottom: `1px solid ${t.border}`,
          background: t.bgPanel,
          flexShrink: 0,
          zIndex: t.z.panel,
        }}
      >
        {/* File tree toggle */}
        <button
          type="button"
          onClick={onFileTreeToggle}
          className="incident-btn incident-btn-ghost"
          style={{
            padding: "6px 8px",
            background: fileTreeOpen ? t.accentMuted : "transparent",
            color: fileTreeOpen ? t.accent : t.textMuted,
            borderColor: fileTreeOpen ? t.accentBorder : "transparent",
          }}
          title="Toggle file explorer"
        >
          <IconFileCode size={14} />
        </button>

        <div style={{ width: 1, height: 18, background: t.divider }} />

        {/* Incident info */}
        {meta && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <span
              style={{
                padding: "2px 8px",
                borderRadius: t.radius.sm,
                background: sev.bg,
                border: `1px solid ${sev.border}`,
                color: sev.color,
                fontSize: t.size.xs,
                fontWeight: 700,
                fontFamily: t.font.mono,
                letterSpacing: "0.06em",
                flexShrink: 0,
              }}
            >
              {meta.severity}
            </span>
            <span
              style={{
                fontSize: t.size.md,
                fontWeight: 600,
                color: t.textPrimary,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                minWidth: 0,
              }}
            >
              {meta.title}
            </span>
            <span
              style={{
                fontSize: t.size.xs,
                color: t.textDim,
                fontFamily: t.font.mono,
                flexShrink: 0,
              }}
            >
              {meta.service}
            </span>
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Timer | Mixer switcher */}
        <TimeSwitch incidentId={incidentId} />

        <div style={{ width: 1, height: 18, background: t.divider }} />

        {/* Language selector */}
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          style={{
            padding: "4px 8px",
            borderRadius: t.radius.md,
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${t.border}`,
            color: t.textSecondary,
            fontSize: t.size.sm,
            fontFamily: t.font.mono,
            cursor: "pointer",
            outline: "none",
          }}
        >
          {availableLanguages.map((l) => (
            <option key={l} value={l}>
              {l.charAt(0).toUpperCase() + l.slice(1)}
            </option>
          ))}
        </select>

        {/* Action buttons */}
        <button
          type="button"
          className="incident-btn incident-btn-success"
          onClick={onRun}
          disabled={running}
          style={{ gap: 5 }}
        >
          {running ? (
            <IconLoader2 size={12} style={{ animation: "spin 0.8s linear infinite" }} />
          ) : (
            <IconPlayerPlay size={12} />
          )}
          Run
        </button>
        <button
          type="button"
          className="incident-btn incident-btn-primary"
          onClick={onSubmit}
          disabled={running}
          style={{ gap: 5 }}
        >
          <IconSend size={12} />
          Submit
        </button>

        {/* AI panel toggle */}
        <button
          type="button"
          onClick={onAiPanelToggle}
          className="incident-btn incident-btn-ghost"
          style={{
            padding: "6px 8px",
            background: aiPanelOpen ? t.accentMuted : "transparent",
            color: aiPanelOpen ? t.accent : t.textMuted,
            borderColor: aiPanelOpen ? t.accentBorder : "transparent",
          }}
          title="Toggle AI assistant"
        >
          <IconRobot size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Status Bar ──────────────────────────────────────────
function StatusBar() {
  const [activeFile] = useAtom(activeFilePathAtom);
  const [running] = useAtom(incidentRunningAtom);
  const [result] = useAtom(incidentResultAtom);
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (running) {
      setElapsed(0);
      elapsedRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
    } else {
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    }
    return () => {
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    };
  }, [running]);

  return (
    <div
      style={{
        height: t.sidebar.statusBarHeight,
        display: "flex",
        alignItems: "center",
        padding: "0 12px",
        gap: 12,
        fontSize: t.size.xs,
        fontFamily: t.font.mono,
        color: t.textDim,
        borderTop: `1px solid ${t.border}`,
        background: t.bgPanel,
        flexShrink: 0,
      }}
    >
      {activeFile && (
        <span style={{ color: t.textMuted }}>
          {activeFile}
        </span>
      )}
      <div style={{ flex: 1 }} />
      {running && (
        <span style={{ display: "flex", alignItems: "center", gap: 5, color: t.accent }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: t.accent,
              animation: "status-pulse 1s ease-in-out infinite",
            }}
          />
          Executing {elapsed}s
        </span>
      )}
      {!running && result && (
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <IconCheck size={11} color={t.success} />
          Tests complete
        </span>
      )}
    </div>
  );
}

// ── Sidebar Header ──────────────────────────────────────
function SidebarHeader({
  leftTab,
  onTabChange,
}: {
  leftTab: "report" | "code";
  onTabChange: (tab: "report" | "code") => void;
}) {
  return (
    <div className="incident-panel-header" style={{ gap: 0 }}>
      {(["report", "code"] as const).map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onTabChange(tab)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "6px 12px",
            background: "transparent",
            border: "none",
            borderBottom: leftTab === tab ? `2px solid ${t.accent}` : "2px solid transparent",
            cursor: "pointer",
            fontSize: t.size.sm,
            fontWeight: leftTab === tab ? 600 : 400,
            color: leftTab === tab ? t.textPrimary : t.textMuted,
            fontFamily: t.font.mono,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            transition: `color ${t.transition.fast}`,
          }}
        >
          {tab === "report" ? <IconFileText size={12} /> : <IconFileCode size={12} />}
          {tab}
        </button>
      ))}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────
export default function IncidentPlaygroundPage({
  params,
}: {
  params: { incidentid: string };
}) {
  const incidentId = params.incidentid;
  const router = useRouter();

  const [incidentData, setIncidentData] = useState<IncidentData | null>(null);
  const [language, setLanguage] = useState("python");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStartModal, setShowStartModal] = useState(true);
  const [pendingSlaMinutes, setPendingSlaMinutes] = useState<number | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const [, setFiles] = useAtom(incidentFilesAtom);
  const [, setActiveFile] = useAtom(activeFilePathAtom);
  const [fileContents, setFileContents] = useAtom(fileContentsAtom);
  const [, setSlaSeconds] = useAtom(slaSecondsAtom);
  const [, setSlaTotal] = useAtom(slaTotalSecondsAtom);
  const [, setMeta] = useAtom(incidentMetaAtom);
  const [isModified] = useAtom(isModifiedAtom);
  const [fileTreeOpen, setFileTreeOpen] = useAtom(fileTreeOpenAtom);
  const [aiPanelOpen, setAiPanelOpen] = useAtom(aiPanelOpenAtom);
  const [, setTestDrawerOpen] = useAtom(testDrawerOpenAtom);
  const [leftTab, setLeftTab] = useAtom(leftTabAtom);
  const [slaSecondsVal] = useAtom(slaSecondsAtom);
  const [slaTotalVal] = useAtom(slaTotalSecondsAtom);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timerStartedRef = useRef<string | null>(null);
  const leftPanelRef = useRef<ImperativePanelHandle>(null);
  const rightPanelRef = useRef<ImperativePanelHandle>(null);
  const prevFileTreeOpen = useRef(fileTreeOpen);
  const prevAiPanelOpen = useRef(aiPanelOpen);

  // ── Timer logic ──
  const startTimer = useCallback(
    (minutes: number, incidentKey: string) => {
      if (timerStartedRef.current === incidentKey) return;
      if (timerRef.current) clearInterval(timerRef.current);
      timerStartedRef.current = incidentKey;
      const total = minutes * 60;
      setSlaSeconds(total);
      setSlaTotal(total);
      timerRef.current = setInterval(() => {
        setSlaSeconds((prev) => {
          if (prev <= 0) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [setSlaSeconds, setSlaTotal]
  );

  function handleStartNow() {
    if (pendingSlaMinutes) startTimer(pendingSlaMinutes, incidentId);
    setShowStartModal(false);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ── Panel collapse/expand when toggles change ──
  useEffect(() => {
    if (!leftPanelRef.current) return;
    if (fileTreeOpen && prevFileTreeOpen.current === false) {
      leftPanelRef.current.expand();
    } else if (!fileTreeOpen && prevFileTreeOpen.current === true) {
      leftPanelRef.current.collapse();
    }
    prevFileTreeOpen.current = fileTreeOpen;
  }, [fileTreeOpen]);

  useEffect(() => {
    if (!rightPanelRef.current) return;
    if (aiPanelOpen && prevAiPanelOpen.current === false) {
      rightPanelRef.current.expand();
    } else if (!aiPanelOpen && prevAiPanelOpen.current === true) {
      rightPanelRef.current.collapse();
    }
    prevAiPanelOpen.current = aiPanelOpen;
  }, [aiPanelOpen]);

  // ── Back navigation guard ──
  const timerRunning = slaSecondsVal > 0 && slaTotalVal > 0;
  const needsGuard = timerRunning || isModified;

  function handleBack() {
    if (needsGuard) {
      setShowLeaveModal(true);
    } else {
      router.push("/p0");
    }
  }

  function confirmLeave() {
    setShowLeaveModal(false);
    router.push("/p0");
  }

  // ── Auto-save to localStorage ──
  useEffect(() => {
    const saved = localStorage.getItem(`incident-files-${incidentId}`);
    if (saved) {
      try {
        setFileContents(JSON.parse(saved));
      } catch {}
    }
  }, [incidentId]);

  useEffect(() => {
    if (Object.keys(fileContents).length > 0) {
      const timeout = setTimeout(() => {
        localStorage.setItem(
          `incident-files-${incidentId}`,
          JSON.stringify(fileContents)
        );
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [fileContents, incidentId]);

  // ── Navigation guard ──
  useEffect(() => {
    if (!isModified) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isModified]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (e.shiftKey) {
          document.dispatchEvent(new CustomEvent("incident-submit"));
        } else {
          document.dispatchEvent(new CustomEvent("incident-run"));
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ── Fetch incident data ──
  async function fetchIncident(lang: string, isLanguageChange = false) {
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

      if (isLanguageChange) setFileContents({});

      const initContents: Record<string, string> = {};
      for (const f of data.files) initContents[f.path] = f.content;
      setFileContents((prev) => ({ ...initContents, ...prev }));

      if (data.entryFile) setActiveFile(data.entryFile);
      else if (data.files.length > 0) setActiveFile(data.files[0].path);

      setMeta({
        title:
          data.title ||
          incidentId
            .split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" "),
        severity: data.severity || "P0",
        difficulty: data.difficulty || "Hard",
        service: data.service || "Unknown Service",
      });

      setPendingSlaMinutes(data.slaMinutes || 20);
    } catch (err: any) {
      setError(err.message || "Failed to load incident");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchIncident(language, false);
  }, [incidentId]);

  useEffect(() => {
    if (incidentData) fetchIncident(language, true);
  }, [language]);

  // ── Run / Submit handlers (passed to TopBar, called from keyboard) ──
  const runBarRef = useRef<{ handleRun: () => void; handleSubmit: () => void } | null>(null);

  const handleRun = useCallback(() => {
    // Dispatch event — RunBar listens for this
    document.dispatchEvent(new CustomEvent("incident-run"));
  }, []);

  const handleSubmit = useCallback(() => {
    document.dispatchEvent(new CustomEvent("incident-submit"));
  }, []);

  // ── Loading state ──
  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          background: t.bgRoot,
        }}
      >
        <div style={{ position: "relative" }}>
          <div
            style={{
              width: 36,
              height: 36,
              border: `3px solid ${t.accentBorder}`,
              borderTopColor: t.accent,
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
        </div>
        <span
          style={{
            fontSize: t.size.md,
            color: t.textMuted,
            fontFamily: t.font.mono,
          }}
        >
          Loading incident data...
        </span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Error state ──
  if (error || !incidentData) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          background: t.bgRoot,
        }}
      >
        <div
          style={{
            padding: "20px 28px",
            borderRadius: t.radius.xl,
            background: t.errorMuted,
            border: `1px solid ${t.errorBorder}`,
            textAlign: "center",
          }}
        >
          <span style={{ color: t.error, fontWeight: 600, fontSize: t.size.md, fontFamily: t.font.mono }}>
            {error || "Incident not found"}
          </span>
          <br />
          <span style={{ fontSize: t.size.xs, color: t.textDim, fontFamily: t.font.mono }}>
            Please check the incident slug or contact support.
          </span>
        </div>
        <Link
          href="/p0"
          className="incident-btn incident-btn-ghost"
          style={{ textDecoration: "none" }}
        >
          <IconArrowLeft size={12} />
          Back to incidents
        </Link>
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: t.bgRoot,
      }}
    >
      <MixerExplainerModal />
      <ScreenLockUp />

      {/* Top Bar */}
      <TopBar
        incidentId={incidentId}
        language={language}
        onLanguageChange={setLanguage}
        availableLanguages={incidentData.availableLanguages}
        onRun={handleRun}
        onSubmit={handleSubmit}
        onFileTreeToggle={() => setFileTreeOpen((p) => !p)}
        onAiPanelToggle={() => setAiPanelOpen((p) => !p)}
        onBack={handleBack}
      />

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <PanelGroup direction="horizontal" style={{ flex: 1 }}>
          {/* Left Sidebar — File Tree + Report */}
          <Panel
            ref={leftPanelRef}
            defaultSize={22}
            minSize={0}
            collapsedSize={0}
            collapsible
            style={{ overflow: "hidden" }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRight: `1px solid ${t.border}`,
                display: "flex",
                flexDirection: "column",
                background: t.bgPanel,
              }}
            >
              <SidebarHeader leftTab={leftTab} onTabChange={setLeftTab} />
              <div style={{ flex: 1, overflow: "hidden" }}>
                {leftTab === "report" ? (
                  <IncidentPanel
                    report={incidentData.report}
                    incidentName={incidentId}
                  />
                ) : (
                  <FileTree />
                )}
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="resize-handle resize-handle-vertical" />

          {/* Center — Editor + Test Drawer */}
          <Panel defaultSize={52} minSize={30}>
            <div
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                background: "rgba(10,15,30,0.6)",
              }}
            >
              {/* Editor */}
              <div style={{ flex: 1, overflow: "hidden" }}>
                <MultiFileEditor />
              </div>

              {/* Test Drawer */}
              <TestDrawer incidentId={incidentId} />
            </div>
          </Panel>

          <PanelResizeHandle className="resize-handle resize-handle-vertical" />

          {/* Right Sidebar — AI Chat */}
          <Panel
            ref={rightPanelRef}
            defaultSize={26}
            minSize={0}
            collapsedSize={0}
            collapsible
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                background: t.bgPanel,
              }}
            >
              <AIChatPanel
                incidentName={incidentId}
                incidentReport={incidentData.report}
              />
            </div>
          </Panel>
        </PanelGroup>
      </div>

      {/* Hidden Run/Submit controller */}
      <IncidentRunBar
        incidentSlug={incidentId}
        language={language}
        availableLanguages={incidentData.availableLanguages}
        entryFile={incidentData.entryFile}
      />

      {/* Status Bar */}
      <StatusBar />

      {/* Start Modal */}
      {showStartModal && (
        <StartModal
          severity={incidentData.severity || "P0"}
          title={
            incidentData.title ||
            incidentId
              .split("-")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" ")
          }
          slaMinutes={pendingSlaMinutes || 20}
          onStart={handleStartNow}
        />
      )}

      {/* Leave Confirmation Modal */}
      {showLeaveModal && (
        <LeaveModal
          timerRunning={timerRunning}
          isModified={isModified}
          onConfirm={confirmLeave}
          onCancel={() => setShowLeaveModal(false)}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ── Test Drawer ─────────────────────────────────────────
function TestDrawer({ incidentId }: { incidentId: string }) {
  const [testDrawerOpen, setTestDrawerOpen] = useAtom(testDrawerOpenAtom);
  const [result] = useAtom(incidentResultAtom);
  const [running] = useAtom(incidentRunningAtom);
  const [isSubmission] = useAtom(incidentSubmissionAtom);

  // Auto-open drawer when results arrive
  useEffect(() => {
    if (result) setTestDrawerOpen(true);
  }, [result]);

  const hasResults = !!result;
  const passedCount = typeof result?.passed === "number" ? result.passed : 0;
  const failedCount = typeof result?.failed === "number" ? result.failed : 0;
  const totalTests = passedCount + failedCount;
  const allPassed = totalTests > 0 && failedCount === 0;

  return (
    <div
      style={{
        borderTop: `1px solid ${t.border}`,
        flexShrink: 0,
      }}
    >
      {/* Drawer handle */}
      <button
        type="button"
        onClick={() => setTestDrawerOpen((p) => !p)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 12px",
          background: "rgba(10,15,30,0.8)",
          border: "none",
          cursor: "pointer",
          transition: `background ${t.transition.fast}`,
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "rgba(14,20,38,0.9)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = "rgba(10,15,30,0.8)")
        }
      >
        <IconChevronRight
          size={12}
          color={t.textDim}
          style={{
            transform: testDrawerOpen ? "rotate(90deg)" : "rotate(0deg)",
            transition: `transform ${t.transition.normal}`,
          }}
        />
        <span style={{ fontSize: t.size.xs, fontWeight: 600, color: t.textMuted, fontFamily: t.font.mono, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Test Results
        </span>
        {hasResults && (
          <span
            style={{
              padding: "1px 6px",
              borderRadius: t.radius.sm,
              background: allPassed ? t.successMuted : t.errorMuted,
              border: `1px solid ${allPassed ? t.successBorder : t.errorBorder}`,
              fontSize: t.size.xs,
              fontWeight: 700,
              fontFamily: t.font.mono,
              color: allPassed ? t.success : t.error,
            }}
          >
            {allPassed ? "PASSED" : `${failedCount}/${totalTests} FAILED`}
          </span>
        )}
        {running && (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: t.size.xs,
              color: t.accent,
              fontFamily: t.font.mono,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: t.accent,
                animation: "status-pulse 1s ease-in-out infinite",
              }}
            />
            Running...
          </span>
        )}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: t.size.xs, color: t.textDim, fontFamily: t.font.mono }}>
          Ctrl+Enter
        </span>
      </button>

      {/* Drawer content */}
      <div
        style={{
          maxHeight: testDrawerOpen ? 300 : 0,
          overflow: "hidden",
          transition: `max-height ${t.transition.slow}`,
        }}
      >
        <div style={{ height: 300, overflow: "auto" }}>
          <TestResultsContent />
        </div>
      </div>
    </div>
  );
}

// ── Test Results Content (inline) ───────────────────────
function TestResultsContent() {
  const [result] = useAtom(incidentResultAtom);
  const [isSubmission] = useAtom(incidentSubmissionAtom);

  if (!result) {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: 20,
        }}
      >
        <span style={{ fontSize: t.size.md, color: t.textDim, fontFamily: t.font.mono }}>
          No results yet
        </span>
      </div>
    );
  }

  const passedCount = typeof result.passed === "number" ? result.passed : 0;
  const failedCount = typeof result.failed === "number" ? result.failed : 0;
  const totalTests = passedCount + failedCount;
  const allPassed = totalTests > 0 && failedCount === 0;
  const passRate = totalTests > 0 ? (passedCount / totalTests) * 100 : 0;

  const stdout =
    typeof result.stdout === "string"
      ? result.stdout
      : typeof result.output === "string"
        ? result.output
        : "";
  const stderr =
    typeof result.stderr === "string"
      ? result.stderr
      : typeof result.error === "string"
        ? result.error
        : "";

  const testRows = Array.isArray(result.test_results) ? result.test_results : [];
  const actionLabel = isSubmission ? "Submission" : "Run";

  return (
    <div style={{ padding: 12 }}>
      {/* Status banner */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          borderRadius: t.radius.lg,
          marginBottom: 10,
          background: allPassed ? t.successMuted : t.errorMuted,
          border: `1px solid ${allPassed ? t.successBorder : t.errorBorder}`,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: t.radius.lg,
            background: allPassed ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {allPassed ? (
            <IconCheck size={14} color={t.success} />
          ) : (
            <span style={{ fontSize: 12, color: t.error, fontWeight: 700 }}>!</span>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                padding: "1px 6px",
                borderRadius: t.radius.sm,
                background: isSubmission ? "rgba(251,146,60,0.12)" : "rgba(96,165,250,0.1)",
                fontSize: t.size.xs,
                fontWeight: 600,
                fontFamily: t.font.mono,
                color: isSubmission ? "#fb923c" : t.accent,
              }}
            >
              {actionLabel}
            </span>
            <span
              style={{
                fontSize: t.size.sm,
                fontWeight: 700,
                fontFamily: t.font.mono,
                color: allPassed ? t.success : t.error,
              }}
            >
              {allPassed
                ? "ALL TESTS PASSED"
                : totalTests > 0
                  ? `${failedCount}/${totalTests} FAILED`
                  : "FAILED"}
            </span>
          </div>
          {totalTests > 0 && (
            <span style={{ fontSize: t.size.xs, color: t.textDim, fontFamily: t.font.mono }}>
              {passedCount} passed, {failedCount} failed
            </span>
          )}
        </div>
        {/* Pass rate ring */}
        {totalTests > 0 && (
          <div style={{ position: "relative", width: 36, height: 36, flexShrink: 0 }}>
            <svg width="36" height="36" viewBox="0 0 36 36" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="14" fill="none"
                stroke={allPassed ? t.success : t.error}
                strokeWidth="3"
                strokeDasharray={`${(passRate / 100) * 88} 88`}
                strokeLinecap="round"
                style={{ transition: "stroke-dasharray 0.6s ease-out" }}
              />
            </svg>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 9,
                fontWeight: 700,
                fontFamily: t.font.mono,
                color: allPassed ? t.success : t.error,
              }}
            >
              {Math.round(passRate)}%
            </div>
          </div>
        )}
      </div>

      {/* Stdout */}
      {stdout && (
        <details open style={{ marginBottom: 8 }}>
          <summary style={{ fontSize: t.size.xs, fontWeight: 600, color: t.textMuted, fontFamily: t.font.mono, cursor: "pointer", marginBottom: 4 }}>
            Output
          </summary>
          <pre
            style={{
              fontSize: t.size.sm,
              fontFamily: t.font.mono,
              background: t.bgCode,
              border: `1px solid ${t.borderSubtle}`,
              borderRadius: t.radius.lg,
              padding: 10,
              overflowX: "auto",
              color: t.textSecondary,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              margin: 0,
            }}
          >
            {stdout}
          </pre>
        </details>
      )}

      {/* Stderr */}
      {stderr && (
        <details style={{ marginBottom: 8 }}>
          <summary style={{ fontSize: t.size.xs, fontWeight: 600, color: t.textMuted, fontFamily: t.font.mono, cursor: "pointer", marginBottom: 4 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <IconAlertTriangle size={10} color={t.error} />
              Test Logs
            </span>
          </summary>
          <pre
            style={{
              fontSize: t.size.sm,
              fontFamily: t.font.mono,
              background: t.bgCode,
              border: `1px solid ${t.borderSubtle}`,
              borderRadius: t.radius.lg,
              padding: 10,
              overflowX: "auto",
              color: t.textSecondary,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              margin: 0,
            }}
          >
            {stderr}
          </pre>
        </details>
      )}

      {/* Individual test cases */}
      {testRows.length > 0 && (
        <div>
          <span style={{ fontSize: t.size.xs, fontWeight: 600, color: t.textMuted, fontFamily: t.font.mono, display: "block", marginBottom: 6 }}>
            Test Cases ({testRows.length})
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {testRows.map((tc: any, i: number) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "5px 10px",
                  borderRadius: t.radius.md,
                  background: tc.passed ? "rgba(34,197,94,0.04)" : "rgba(239,68,68,0.04)",
                  border: `1px solid ${tc.passed ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)"}`,
                }}
              >
                {tc.passed ? (
                  <IconCheck size={10} color={t.success} />
                ) : (
                  <span style={{ fontSize: 10, color: t.error, fontWeight: 700 }}>X</span>
                )}
                <span
                  style={{
                    fontSize: t.size.sm,
                    fontFamily: t.font.mono,
                    color: tc.passed ? t.success : t.error,
                    fontWeight: 600,
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {tc.name ?? `Test ${i + 1}`}
                </span>
                {tc.message && (
                  <span
                    style={{
                      fontSize: t.size.xs,
                      color: t.textDim,
                      fontFamily: t.font.mono,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: 150,
                    }}
                  >
                    {tc.message}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Start Modal ─────────────────────────────────────────
function StartModal({
  severity,
  title,
  slaMinutes,
  onStart,
}: {
  severity: string;
  title: string;
  slaMinutes: number;
  onStart: () => void;
}) {
  const sev = severityColors[severity] || severityColors.P0;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(7,11,20,0.88)",
        backdropFilter: "blur(8px)",
        zIndex: t.z.modal,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "fade-in 0.3s ease-out",
      }}
    >
      <div
        style={{
          padding: "32px 40px",
          borderRadius: t.radius["2xl"],
          background: "rgba(12,18,36,0.98)",
          border: `1px solid ${t.border}`,
          boxShadow: t.shadow.lg,
          maxWidth: 420,
          width: "90%",
          textAlign: "center",
          animation: "scale-in 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {/* Severity icon */}
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: t.radius.xl,
            background: sev.bg,
            border: `1px solid ${sev.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <IconAlertTriangle size={24} color={sev.color} />
        </div>

        <div
          style={{
            fontSize: t.size.xl,
            fontWeight: 700,
            color: t.textPrimary,
            marginBottom: 8,
            letterSpacing: "-0.01em",
          }}
        >
          Ready to resolve?
        </div>

        <div
          style={{
            fontSize: t.size.md,
            color: t.textMuted,
            marginBottom: 8,
            fontFamily: t.font.mono,
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginBottom: 20,
          }}
        >
          <span
            style={{
              padding: "3px 8px",
              borderRadius: t.radius.sm,
              background: sev.bg,
              border: `1px solid ${sev.border}`,
              color: sev.color,
              fontSize: t.size.xs,
              fontWeight: 700,
              fontFamily: t.font.mono,
            }}
          >
            {severity}
          </span>
          <span style={{ fontSize: t.size.md, color: t.textDim }}>·</span>
          <span style={{ fontSize: t.size.md, color: t.textMuted, fontFamily: t.font.mono }}>
            SLA {slaMinutes}m
          </span>
        </div>

        <p
          style={{
            fontSize: t.size.md,
            color: t.textDim,
            marginBottom: 24,
            lineHeight: 1.6,
            fontFamily: t.font.mono,
          }}
        >
          Your SLA timer starts now. Read the report, fix the code, and run tests before time runs out.
        </p>

        <button
          type="button"
          className="incident-btn incident-btn-primary"
          onClick={onStart}
          style={{
            width: "100%",
            padding: "10px 0",
            fontSize: t.size.lg,
            fontWeight: 700,
          }}
        >
          Start Now
        </button>
      </div>
    </div>
  );
}

// ── Leave Confirmation Modal ──────────────────────────────
function LeaveModal({
  timerRunning,
  isModified,
  onConfirm,
  onCancel,
}: {
  timerRunning: boolean;
  isModified: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(7,11,20,0.88)",
        backdropFilter: "blur(8px)",
        zIndex: t.z.modal,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "fade-in 0.2s ease-out",
      }}
    >
      <div
        style={{
          padding: "28px 36px",
          borderRadius: t.radius["2xl"],
          background: "rgba(12,18,36,0.98)",
          border: `1px solid ${t.border}`,
          boxShadow: t.shadow.lg,
          maxWidth: 400,
          width: "90%",
          textAlign: "center",
          animation: "scale-in 0.2s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {/* Warning icon */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: t.radius.xl,
            background: "rgba(245,158,11,0.1)",
            border: "1px solid rgba(245,158,11,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <IconAlertTriangle size={22} color="#f59e0b" />
        </div>

        <div
          style={{
            fontSize: t.size.xl,
            fontWeight: 700,
            color: t.textPrimary,
            marginBottom: 8,
          }}
        >
          Leave incident?
        </div>

        <div
          style={{
            fontSize: t.size.md,
            color: t.textDim,
            marginBottom: 20,
            lineHeight: 1.6,
          }}
        >
          {timerRunning && isModified && (
            <>Your SLA timer is running and you have unsaved changes.</>
          )}
          {timerRunning && !isModified && (
            <>Your SLA timer is still running.</>
          )}
          {!timerRunning && isModified && (
            <>You have unsaved changes that will be lost.</>
          )}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            className="incident-btn incident-btn-ghost"
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "10px 0",
              fontSize: t.size.md,
              fontWeight: 600,
              borderColor: t.border,
            }}
          >
            Stay
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: t.radius.md,
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#f87171",
              fontFamily: t.font.mono,
              fontSize: t.size.md,
              fontWeight: 700,
              cursor: "pointer",
              transition: `background ${t.transition.fast}`,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(239,68,68,0.2)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(239,68,68,0.12)")
            }
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  );
}
