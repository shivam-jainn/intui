"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

export default function P0SimulationHome() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/incidents")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: Incident[]) => {
        setIncidents(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#08080d", position: "relative" }}>
      {/* Ambient glows */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-5%", left: "10%", width: 600, height: 600, borderRadius: "50%", background: "rgba(239,68,68,0.10)", filter: "blur(120px)" }} />
        <div style={{ position: "absolute", top: "40%", right: "5%", width: 400, height: 400, borderRadius: "50%", background: "rgba(249,115,22,0.07)", filter: "blur(100px)" }} />
        <div style={{ position: "absolute", bottom: "10%", left: "30%", width: 480, height: 480, borderRadius: "50%", background: "rgba(239,68,68,0.05)", filter: "blur(110px)" }} />
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px 80px", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 999, padding: "4px 14px", marginBottom: 20 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#ef4444", display: "inline-block", boxShadow: "0 0 8px #ef4444" }} />
            <span style={{ fontSize: 12, color: "#ef4444", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Live Incidents</span>
          </div>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, color: "#fff", margin: 0, lineHeight: 1.08, letterSpacing: "-0.03em" }}>
            Incident Command Center
          </h1>
          <p style={{ marginTop: 12, fontSize: 16, color: "rgba(255,255,255,0.42)", maxWidth: 520, lineHeight: 1.7 }}>
            Debug real-world production outages under SLA pressure. Pick an incident, triage the code, and ship the fix.
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
            {[1, 2].map((i) => (
              <div key={i} style={{ height: 220, borderRadius: 16, background: "rgba(255,255,255,0.04)", animation: "pulse 1.5s ease-in-out infinite" }} />
            ))}
          </div>
        ) : error ? (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "20px 24px" }}>
            <p style={{ color: "#f87171", margin: 0 }}>Failed to load incidents: {error}</p>
          </div>
        ) : incidents.length === 0 ? (
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "20px 24px" }}>
            <p style={{ color: "rgba(255,255,255,0.4)", margin: 0 }}>No incidents found.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
            {incidents.map((incident) => (
              <IncidentCard
                key={incident.id}
                incident={incident}
                onClick={() => router.push(`/p0/${incident.slug}`)}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

function IncidentCard({ incident, onClick }: { incident: Incident; onClick: () => void }) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${hovered ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.08)"}`,
        borderRadius: 16,
        padding: "28px 28px 24px",
        cursor: "pointer",
        transition: "all 0.18s ease",
        transform: hovered ? "translateY(-3px)" : "none",
        boxShadow: hovered ? "0 12px 40px rgba(239,68,68,0.12)" : "none",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      {/* Top row: severity + difficulty */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{
          padding: "3px 10px",
          borderRadius: 999,
          background: "rgba(239,68,68,0.15)",
          border: "1px solid rgba(239,68,68,0.35)",
          color: "#f87171",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.06em",
        }}>
          {incident.severity}
        </span>
        <span style={{
          padding: "3px 10px",
          borderRadius: 999,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: difficultyColor[incident.difficulty] ?? "rgba(255,255,255,0.5)",
          fontSize: 11,
          fontWeight: 600,
        }}>
          {incident.difficulty}
        </span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>
          INC-{String(incident.id).padStart(3, "0")}
        </span>
      </div>

      {/* Title */}
      <div>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.3 }}>
          {incident.title}
        </h3>
      </div>

      {/* Summary */}
      <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.75, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {incident.summary}
      </p>

      {/* Service + SLA */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" />
          </svg>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", fontWeight: 500 }}>
            {incident.service}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(239,68,68,0.6)" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span style={{ fontSize: 12, color: "rgba(239,68,68,0.8)", fontFamily: "monospace", fontWeight: 700 }}>
            SLA {incident.slaMinutes}m
          </span>
        </div>
      </div>
    </div>
  );
}
