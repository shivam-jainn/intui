"use client";
import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/lib/incident-theme";

interface Incident {
  id: number;
  slug: string;
  title: string;
  severity: string;
  difficulty: string;
  service: string;
  summary: string;
  slaMinutes: number;
}

const difficultyColor: Record<string, string> = {
  Easy: "#10b981",
  Medium: "#f59e0b",
  Hard: "#ef4444",
};

const difficultyBg: Record<string, string> = {
  Easy: "rgba(16,185,129,0.06)",
  Medium: "rgba(245,158,11,0.06)",
  Hard: "rgba(239,68,68,0.06)",
};

const difficultyBorder: Record<string, string> = {
  Easy: "rgba(16,185,129,0.15)",
  Medium: "rgba(245,158,11,0.15)",
  Hard: "rgba(239,68,68,0.15)",
};

export default function P0SimulationHome() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/incidents")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: Incident[]) => setIncidents(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return incidents;
    const q = search.toLowerCase();
    return incidents.filter(
      (inc) =>
        inc.title.toLowerCase().includes(q) ||
        inc.service.toLowerCase().includes(q) ||
        inc.difficulty.toLowerCase().includes(q) ||
        inc.severity.toLowerCase().includes(q) ||
        inc.slug.toLowerCase().includes(q)
    );
  }, [incidents, search]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: t.bgRoot,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Grid overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Ambient glows */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            top: "-10%",
            left: "5%",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "rgba(239,68,68,0.06)",
            filter: "blur(150px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "30%",
            right: "-5%",
            width: 450,
            height: 450,
            borderRadius: "50%",
            background: "rgba(251,146,60,0.04)",
            filter: "blur(120px)",
          }}
        />
      </div>

      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "48px 24px 80px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.18)",
              borderRadius: t.radius.full,
              padding: "4px 14px",
              marginBottom: 20,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: t.error,
                boxShadow: `0 0 12px ${t.error}`,
                animation: "pulse-dot 2s ease-in-out infinite",
              }}
            />
            <span
              style={{
                fontSize: t.size.xs,
                color: t.error,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontFamily: t.font.mono,
              }}
            >
              Live Incidents
            </span>
          </div>
          <h1
            style={{
              fontSize: "clamp(30px, 5vw, 52px)",
              fontWeight: 900,
              color: t.textPrimary,
              margin: 0,
              lineHeight: 1.05,
              letterSpacing: "-0.04em",
            }}
          >
            Incident Command
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #ef4444 0%, #fb923c 50%, #fbbf24 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Center
            </span>
          </h1>
          <p
            style={{
              marginTop: 14,
              fontSize: t.size.lg,
              color: t.textDim,
              maxWidth: 460,
              lineHeight: 1.8,
            }}
          >
            Debug real-world production outages under SLA pressure.
            Triage the code, find the root cause, ship the fix.
          </p>
        </div>

        {/* Search + stats */}
        {!loading && incidents.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                flex: 1,
                maxWidth: 320,
                position: "relative",
              }}
            >
              <input
                type="text"
                placeholder="Search incidents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 34px",
                  borderRadius: t.radius.lg,
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid ${t.border}`,
                  color: t.textSecondary,
                  fontSize: t.size.md,
                  fontFamily: t.font.mono,
                  outline: "none",
                  transition: `border-color ${t.transition.fast}`,
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = t.accentBorder)}
                onBlur={(e) => (e.target.style.borderColor = t.border)}
              />
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke={t.textDim}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <span style={{ fontSize: t.size.sm, color: t.textDim, fontFamily: t.font.mono }}>
              {filtered.length} incident{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 220 }} />
            ))}
          </div>
        ) : error ? (
          <div
            style={{
              background: t.errorMuted,
              border: `1px solid ${t.errorBorder}`,
              borderRadius: t.radius.xl,
              padding: "20px 24px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: t.radius.lg,
                background: "rgba(239,68,68,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.error} strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <span style={{ color: t.errorHover, fontSize: t.size.base }}>
              Failed to load incidents: {error}
            </span>
          </div>
        ) : filtered.length === 0 && search ? (
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              border: `1px solid ${t.border}`,
              borderRadius: t.radius.xl,
              padding: "40px 24px",
              textAlign: "center",
            }}
          >
            <span style={{ color: t.textDim }}>
              No incidents match &ldquo;{search}&rdquo;
            </span>
          </div>
        ) : incidents.length === 0 ? (
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              border: `1px solid ${t.border}`,
              borderRadius: t.radius.xl,
              padding: "40px 24px",
              textAlign: "center",
            }}
          >
            <span style={{ color: t.textDim }}>No active incidents at this time.</span>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 16,
            }}
          >
            {filtered.map((incident, index) => (
              <IncidentCard
                key={incident.id}
                incident={incident}
                index={index}
                onClick={() => router.push(`/p0/${incident.slug}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function IncidentCard({
  incident,
  index,
  onClick,
}: {
  incident: Incident;
  index: number;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const sevColor = "#ef4444";
  const diffColor = difficultyColor[incident.difficulty] || t.textDim;
  const diffBg = difficultyBg[incident.difficulty] || "rgba(255,255,255,0.03)";
  const diffBorderVal = difficultyBorder[incident.difficulty] || t.border;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.015)",
        border: `1px solid ${hovered ? "rgba(239,68,68,0.3)" : t.border}`,
        borderRadius: t.radius["2xl"],
        padding: "24px 24px 20px",
        cursor: "pointer",
        transition: `all ${t.transition.normal}`,
        transform: hovered ? "translateY(-3px)" : "none",
        boxShadow: hovered
          ? "0 12px 40px rgba(239,68,68,0.08), 0 0 0 1px rgba(239,68,68,0.08)"
          : "none",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        animation: `card-enter 0.4s ease-out ${index * 0.06}s both`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Hover glow */}
      {hovered && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 100,
            background: "radial-gradient(ellipse at top, rgba(239,68,68,0.05) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Top row: severity + difficulty */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
        <span
          style={{
            padding: "2px 8px",
            borderRadius: t.radius.sm,
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.25)",
            color: "#f87171",
            fontSize: t.size.xs,
            fontWeight: 700,
            letterSpacing: "0.06em",
            fontFamily: t.font.mono,
          }}
        >
          {incident.severity}
        </span>
        <span
          style={{
            padding: "2px 8px",
            borderRadius: t.radius.sm,
            background: diffBg,
            border: `1px solid ${diffBorderVal}`,
            color: diffColor,
            fontSize: t.size.xs,
            fontWeight: 600,
            fontFamily: t.font.mono,
          }}
        >
          {incident.difficulty}
        </span>
        <div style={{ flex: 1 }} />
        <span
          style={{
            fontSize: t.size.xs,
            color: t.textFaint,
            fontFamily: t.font.mono,
            letterSpacing: "0.04em",
          }}
        >
          INC-{String(incident.id).padStart(3, "0")}
        </span>
      </div>

      {/* Title */}
      <div style={{ position: "relative" }}>
        <h3
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 700,
            color: t.textPrimary,
            letterSpacing: "-0.02em",
            lineHeight: 1.3,
          }}
        >
          {incident.title}
        </h3>
      </div>

      {/* Summary */}
      <p
        style={{
          margin: 0,
          fontSize: t.size.base,
          color: t.textDim,
          lineHeight: 1.7,
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {incident.summary}
      </p>

      {/* Service + SLA */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "auto",
          paddingTop: 10,
          borderTop: `1px solid ${t.borderSubtle}`,
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke={t.textDim}
            strokeWidth="2"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" />
          </svg>
          <span style={{ fontSize: t.size.sm, color: t.textDim, fontWeight: 500 }}>
            {incident.service}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "2px 8px",
            borderRadius: t.radius.md,
            background: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.1)",
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(239,68,68,0.6)" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span
            style={{
              fontSize: t.size.xs,
              color: "#f87171",
              fontFamily: t.font.mono,
              fontWeight: 700,
              letterSpacing: "0.02em",
            }}
          >
            SLA {incident.slaMinutes}m
          </span>
        </div>
      </div>
    </div>
  );
}
