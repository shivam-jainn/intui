"use client";

import { useAtom } from "jotai";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import CodeMirror from "@uiw/react-codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";
import { searchKeymap, search } from "@codemirror/search";
import { keymap } from "@codemirror/view";
import type { Extension } from "@codemirror/state";
import { useEffect, useMemo, useState } from "react";
import { IconX, IconFileCode } from "@tabler/icons-react";
import {
  activeFilePathAtom,
  fileContentsAtom,
  incidentFilesAtom,
} from "@/contexts/IncidentContext";
import { screenLockupAtom } from "@/contexts/GlobalContext";
import { t } from "@/lib/incident-theme";

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
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [isLocked] = useAtom(screenLockupAtom);

  useEffect(() => {
    if (activeFile && !openTabs.includes(activeFile)) {
      setOpenTabs((prev) => [...prev, activeFile].sort());
    }
  }, [activeFile]);

  const activeFileData = files.find((f) => f.path === activeFile);
  const currentContent = activeFile
    ? fileContents[activeFile] ?? activeFileData?.content ?? ""
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
    const exts: Extension[] = [
      getLanguageExtension(activeFileData?.language ?? "python"),
      search(),
      keymap.of(searchKeymap),
    ];
    if (activeFileData?.readonly || isLocked) exts.push(readonlyExtension);
    return exts;
  }, [activeFileData, isLocked]);

  if (!activeFile) {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: t.radius.xl,
            background: t.bgSurface,
            border: `1px solid ${t.borderSubtle}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconFileCode size={24} color={t.textDim} />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: t.size.md, color: t.textMuted, fontWeight: 500, marginBottom: 4 }}>
            Select a file to edit
          </div>
          <div style={{ fontSize: t.size.xs, color: t.textDim, fontFamily: t.font.mono }}>
            Use the explorer sidebar on the left
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* File tabs */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          borderBottom: `1px solid ${t.borderSubtle}`,
          background: "rgba(0,0,0,0.2)",
          overflow: "auto",
          flexShrink: 0,
          minHeight: t.sidebar.tabHeight,
        }}
      >
        {openTabs.map((tabPath) => {
          const tabFile = files.find((f) => f.path === tabPath);
          const fileName = tabPath.split("/").pop() ?? tabPath;
          const isActive = tabPath === activeFile;
          const isModified =
            fileContents[tabPath] !== undefined &&
            fileContents[tabPath] !== tabFile?.content;

          return (
            <button
              key={tabPath}
              onClick={() => setActiveFile(tabPath)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "0 12px",
                height: t.sidebar.tabHeight,
                borderBottom: isActive ? `2px solid ${t.accent}` : "2px solid transparent",
                background: isActive ? "rgba(255,255,255,0.03)" : "transparent",
                cursor: "pointer",
                border: "none",
                borderRight: `1px solid ${t.borderSubtle}`,
                flexShrink: 0,
                transition: `background ${t.transition.fast}`,
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = t.bgSurfaceHover;
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = "transparent";
              }}
            >
              <span
                style={{
                  fontSize: t.size.sm,
                  fontFamily: t.font.mono,
                  color: isActive ? t.textPrimary : t.textMuted,
                  fontWeight: isActive ? 600 : 400,
                  whiteSpace: "nowrap",
                }}
              >
                {fileName}
              </span>
              {tabFile?.readonly && (
                <span
                  style={{
                    fontSize: 8,
                    padding: "1px 4px",
                    borderRadius: t.radius.sm,
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${t.borderSubtle}`,
                    color: t.textDim,
                    fontFamily: t.font.mono,
                    fontWeight: 700,
                  }}
                >
                  RO
                </span>
              )}
              {isModified && !tabFile?.readonly && (
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: t.accent,
                    flexShrink: 0,
                  }}
                />
              )}
              <button
                onClick={(e) => closeTab(e, tabPath)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 16,
                  height: 16,
                  borderRadius: t.radius.sm,
                  background: "transparent",
                  border: "none",
                  color: t.textDim,
                  cursor: "pointer",
                  padding: 0,
                  transition: `all ${t.transition.fast}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(239,68,68,0.15)";
                  e.currentTarget.style.color = "#f87171";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = t.textDim;
                }}
              >
                <IconX size={10} />
              </button>
            </button>
          );
        })}
      </div>

      {/* Editor */}
      <div style={{ flex: 1, overflow: "auto", position: "relative" }}>
        <CodeMirror
          value={currentContent}
          height="100%"
          theme={oneDark}
          extensions={extensions}
          onChange={handleChange}
          style={{ height: "100%", fontSize: 13 }}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            highlightActiveLine: !activeFileData?.readonly && !isLocked,
          }}
        />
      </div>
    </div>
  );
}
