"use client";

import { useAtom } from "jotai";
import React, { useMemo } from "react";
import {
  IconFile,
  IconFolder,
  IconFolderOpen,
  IconLock,
  IconFileCode,
  IconFileText,
  IconFileSettings,
  IconSettings,
  IconMarkdown,
} from "@tabler/icons-react";
import { activeFilePathAtom, incidentFilesAtom } from "@/contexts/IncidentContext";
import { t } from "@/lib/incident-theme";

interface TreeNode {
  name: string;
  path: string;
  isDir: boolean;
  readonly: boolean;
  children?: TreeNode[];
}

function buildTree(files: { path: string; readonly: boolean }[]): TreeNode[] {
  const root: TreeNode[] = [];
  const dirMap: Record<string, TreeNode> = {};

  for (const file of files) {
    const parts = file.path.split("/");
    let current = root;

    for (let i = 0; i < parts.length - 1; i++) {
      const dirPath = parts.slice(0, i + 1).join("/");
      if (!dirMap[dirPath]) {
        const node: TreeNode = {
          name: parts[i],
          path: dirPath,
          isDir: true,
          readonly: false,
          children: [],
        };
        dirMap[dirPath] = node;
        current.push(node);
      }
      current = dirMap[dirPath].children!;
    }

    current.push({
      name: parts[parts.length - 1],
      path: file.path,
      isDir: false,
      readonly: file.readonly,
    });
  }

  return root;
}

function getFileIcon(name: string, readonly: boolean) {
  const ext = name.split(".").pop()?.toLowerCase();
  const color = readonly ? t.textDim : "rgba(74,222,128,0.5)";

  switch (ext) {
    case "py":
      return <IconFileCode size={13} color={color} />;
    case "cpp":
    case "cc":
    case "cxx":
    case "h":
    case "hpp":
      return <IconFileCode size={13} color={color} />;
    case "json":
      return <IconFileSettings size={13} color={color} />;
    case "md":
      return <IconMarkdown size={13} color={color} />;
    case "yaml":
    case "yml":
    case "toml":
    case "cfg":
    case "ini":
      return <IconSettings size={13} color={color} />;
    default:
      return <IconFileText size={13} color={color} />;
  }
}

function TreeNodeItem({
  node,
  depth = 0,
  activeFile,
  onSelect,
}: {
  node: TreeNode;
  depth?: number;
  activeFile: string;
  onSelect: (path: string) => void;
}) {
  if (node.isDir) {
    return (
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "3px 8px",
            paddingLeft: depth * 14 + 8,
          }}
        >
          <IconFolderOpen size={13} color={t.textDim} />
          <span
            style={{
              fontSize: t.size.sm,
              color: t.textMuted,
              fontWeight: 600,
              fontFamily: t.font.mono,
              letterSpacing: "0.02em",
            }}
          >
            {node.name}
          </span>
        </div>
        {node.children?.map((child) => (
          <TreeNodeItem
            key={child.path}
            node={child}
            depth={depth + 1}
            activeFile={activeFile}
            onSelect={onSelect}
          />
        ))}
      </div>
    );
  }

  const isActive = node.path === activeFile;

  return (
    <button
      type="button"
      onClick={() => onSelect(node.path)}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 8px",
        paddingLeft: depth * 14 + 8,
        borderRadius: t.radius.sm,
        background: isActive ? t.accentMuted : "transparent",
        border: isActive ? `1px solid ${t.accentBorder}` : "1px solid transparent",
        cursor: "pointer",
        transition: `all ${t.transition.fast}`,
        textAlign: "left",
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = t.bgSurfaceHover;
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = "transparent";
      }}
    >
      {getFileIcon(node.name, node.readonly)}
      <span
        style={{
          fontSize: t.size.sm,
          fontFamily: t.font.mono,
          color: isActive ? t.textPrimary : t.textMuted,
          fontWeight: isActive ? 600 : 400,
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {node.name}
      </span>
      {node.readonly && (
        <IconLock size={9} color={t.textDim} style={{ flexShrink: 0 }} />
      )}
    </button>
  );
}

export default function FileTree() {
  const [files] = useAtom(incidentFilesAtom);
  const [activeFile, setActiveFile] = useAtom(activeFilePathAtom);

  const tree = useMemo(
    () => buildTree(files.map((f) => ({ path: f.path, readonly: f.readonly }))),
    [files]
  );

  const editableCount = files.filter((f) => !f.readonly).length;
  const readonlyCount = files.filter((f) => f.readonly).length;

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Section label */}
      <div
        style={{
          padding: "8px 12px 4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: t.size.xs,
            fontWeight: 700,
            color: t.textDim,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            fontFamily: t.font.mono,
          }}
        >
          Explorer
        </span>
        <span
          style={{
            fontSize: t.size.xs,
            color: t.textFaint,
            fontFamily: t.font.mono,
          }}
        >
          {editableCount} editable · {readonlyCount} ro
        </span>
      </div>

      {/* File tree */}
      <div style={{ flex: 1, overflow: "auto", padding: "4px 0" }}>
        {tree.map((node) => (
          <TreeNodeItem
            key={node.path}
            node={node}
            activeFile={activeFile}
            onSelect={setActiveFile}
          />
        ))}
      </div>
    </div>
  );
}
