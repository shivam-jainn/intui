"use client";

import React from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { useAtom } from "jotai";
import {
  IconSkull,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { incidentMetaAtom } from "@/contexts/IncidentContext";
import { t } from "@/lib/incident-theme";

interface IncidentPanelProps {
  report: string;
  incidentName: string;
}

const severityConfig: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
  P0: {
    color: "#ef4444",
    bg: "rgba(239,68,68,0.06)",
    border: "rgba(239,68,68,0.15)",
    icon: <IconSkull size={14} color="#ef4444" />,
  },
  P1: {
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.05)",
    border: "rgba(96,165,250,0.12)",
    icon: <IconAlertTriangle size={14} color="#60a5fa" />,
  },
  P2: {
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.05)",
    border: "rgba(245,158,11,0.12)",
    icon: <IconAlertTriangle size={14} color="#f59e0b" />,
  },
};

export default function IncidentPanel({ report, incidentName }: IncidentPanelProps) {
  const [meta] = useAtom(incidentMetaAtom);

  const challengeTypeMatch = report.match(/^# CHALLENGE TYPE\s*\n(.+)/m);
  const difficultyMatch = report.match(/^# DIFFICULTY\s*\n(.+)/m);
  const challengeType = challengeTypeMatch?.[1]?.trim() ?? "Incident";
  const difficulty = difficultyMatch?.[1]?.trim() ?? meta?.difficulty ?? "Unknown";

  const difficultyColor =
    difficulty === "Easy" ? "#10b981" :
    difficulty === "Medium" ? "#f59e0b" :
    difficulty === "Hard" ? "#ef4444" : "#94a3b8";

  const severity = meta?.severity || "P0";
  const sevConfig = severityConfig[severity] || severityConfig.P0;

  const displayName = meta?.title || incidentName
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ") + " Incident";

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Severity banner */}
      <div
        style={{
          padding: "12px 14px",
          borderBottom: `1px solid ${t.border}`,
          background: sevConfig.bg,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          {sevConfig.icon}
          <span
            style={{
              fontSize: t.size.xs,
              fontWeight: 700,
              color: sevConfig.color,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontFamily: t.font.mono,
            }}
          >
            {severity} Incident
          </span>
          <div style={{ flex: 1 }} />
          {meta?.service && (
            <span
              style={{
                padding: "1px 6px",
                borderRadius: t.radius.sm,
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${t.borderSubtle}`,
                fontSize: t.size.xs,
                color: t.textDim,
                fontFamily: t.font.mono,
              }}
            >
              {meta.service}
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: t.size.base,
            fontWeight: 700,
            color: t.textPrimary,
            lineHeight: 1.3,
            letterSpacing: "-0.01em",
          }}
        >
          {displayName}
        </div>
      </div>

      {/* Metadata pills */}
      <div
        style={{
          display: "flex",
          gap: 6,
          padding: "8px 14px",
          borderBottom: `1px solid ${t.border}`,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "2px 8px",
            borderRadius: t.radius.sm,
            background: `${difficultyColor}10`,
            border: `1px solid ${difficultyColor}20`,
            fontSize: t.size.xs,
            fontWeight: 600,
            color: difficultyColor,
            fontFamily: t.font.mono,
            letterSpacing: "0.04em",
          }}
        >
          {difficulty}
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "2px 8px",
            borderRadius: t.radius.sm,
            background: "rgba(255,255,255,0.03)",
            border: `1px solid ${t.borderSubtle}`,
            fontSize: t.size.xs,
            fontWeight: 600,
            color: t.textDim,
            fontFamily: t.font.mono,
          }}
        >
          {challengeType}
        </span>
      </div>

      {/* Report content */}
      <div style={{ flex: 1, overflow: "auto", padding: 14 }}>
        <div
          style={{
            fontSize: t.size.base,
            lineHeight: 1.75,
            color: t.textSecondary,
          }}
        >
          <Markdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              h1: ({ children }) => (
                <h1
                  style={{
                    fontSize: t.size.xl,
                    fontWeight: 700,
                    color: t.textPrimary,
                    marginTop: 20,
                    marginBottom: 10,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2
                  style={{
                    fontSize: t.size.lg,
                    fontWeight: 600,
                    color: t.textPrimary,
                    marginTop: 16,
                    marginBottom: 8,
                  }}
                >
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3
                  style={{
                    fontSize: t.size.base,
                    fontWeight: 600,
                    color: t.textSecondary,
                    marginTop: 14,
                    marginBottom: 6,
                  }}
                >
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p style={{ margin: "0 0 10px 0", color: t.textSecondary }}>
                  {children}
                </p>
              ),
              li: ({ children }) => (
                <li style={{ margin: "0 0 4px 0", color: t.textSecondary }}>
                  {children}
                </li>
              ),
              strong: ({ children }) => (
                <span style={{ color: t.textPrimary, fontWeight: 600 }}>
                  {children}
                </span>
              ),
              code: ({ children, className }) => {
                const isBlock = className?.includes("language-");
                if (isBlock) {
                  return (
                    <pre
                      style={{
                        backgroundColor: t.bgCode,
                        borderRadius: t.radius.lg,
                        overflowX: "auto",
                        padding: 12,
                        fontSize: t.size.sm,
                        fontFamily: t.font.mono,
                        border: `1px solid ${t.borderSubtle}`,
                        color: t.textSecondary,
                        margin: "0 0 12px 0",
                        lineHeight: 1.5,
                      }}
                    >
                      <code>{children}</code>
                    </pre>
                  );
                }
                return (
                  <code
                    style={{
                      backgroundColor: "rgba(255,255,255,0.06)",
                      borderRadius: t.radius.sm,
                      padding: "1px 5px",
                      fontSize: t.size.sm,
                      fontFamily: t.font.mono,
                      color: t.accent,
                    }}
                  >
                    {children}
                  </code>
                );
              },
              a: ({ children, href }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: t.accent, textDecoration: "underline" }}
                >
                  {children}
                </a>
              ),
              blockquote: ({ children }) => (
                <blockquote
                  style={{
                    margin: "0 0 12px 0",
                    padding: "8px 12px",
                    borderLeft: `3px solid ${t.accentBorder}`,
                    background: t.accentMuted,
                    borderRadius: `0 ${t.radius.md}px ${t.radius.md}px 0`,
                    color: t.textSecondary,
                  }}
                >
                  {children}
                </blockquote>
              ),
            }}
          >
            {report}
          </Markdown>
        </div>
      </div>
    </div>
  );
}
