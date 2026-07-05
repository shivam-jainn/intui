'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useIncidents } from '@/lib/hooks/useIncidents';
import type { Incident } from '@/lib/hooks/useIncidents';
import { colors } from '@/lib/theme/colors';

const difficultyColor: Record<string, string> = {
  Easy: colors.success[500],
  Medium: colors.warning[500],
  Hard: colors.danger[500],
};

export default function P0SimulationHome() {
  const router = useRouter();
  const { data: incidentsData, isLoading: loading, error } = useIncidents();
  const incidents = React.useMemo(() => incidentsData ?? [], [incidentsData]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', position: 'relative' }}>
      {/* Ambient glows */}
      <div className="global-noise" />
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-5%',
            left: '10%',
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: `rgba(230,30,30,0.10)`,
            filter: 'blur(120px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '10%',
            left: '30%',
            width: 480,
            height: 480,
            borderRadius: '50%',
            background: `rgba(255,90,0,0.05)`,
            filter: 'blur(110px)',
          }}
        />
      </div>

      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '48px 24px 80px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <div
            className="pixel-border"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: `rgba(250,82,82,0.12)`,
              padding: '8px 14px',
              marginBottom: 20,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                background: colors.danger[500],
                display: 'inline-block',
                boxShadow: `0 0 8px ${colors.danger[500]}`,
                animation: 'blink 1s infinite'
              }}
            />
            <span
              className="pixel-font"
              style={{
                fontSize: 10,
                color: colors.danger[400],
                fontWeight: 600,
              }}
            >
              LIVE INCIDENTS
            </span>
          </div>
          <h1
            className="pixel-font"
            style={{
              fontSize: 'clamp(28px, 4vw, 48px)',
              fontWeight: 900,
              color: 'var(--primary-red)',
              margin: 0,
              lineHeight: 1.08,
            }}
          >
            COMMAND CENTER
          </h1>
          <p
            className="pixel-font"
            style={{
              marginTop: 12,
              fontSize: 10,
              color: 'var(--text-muted)',
              maxWidth: 520,
              lineHeight: 1.7,
            }}
          >
            Debug real-world production outages under SLA pressure. Pick an incident, triage the
            code, and ship the fix.
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 20,
            }}
          >
            {[1, 2].map((i) => (
              <div
                key={i}
                className="pixel-border"
                style={{
                  height: 220,
                  background: 'var(--surface-default)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
            ))}
          </div>
        ) : error ? (
          <div
            className="pixel-border"
            style={{
              background: `rgba(250,82,82,0.1)`,
              padding: '20px 24px',
            }}
          >
            <p className="pixel-font" style={{ color: colors.danger[400], margin: 0 }}>
              Failed to load incidents: {(error as Error)?.message}
            </p>
          </div>
        ) : incidents.length === 0 ? (
          <div
            className="pixel-border"
            style={{
              background: 'var(--surface-default)',
              padding: '20px 24px',
            }}
          >
            <p className="pixel-font" style={{ color: 'var(--text-secondary)', margin: 0 }}>No incidents found.</p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 20,
            }}
          >
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
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
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
      className="pixel-border"
      style={{
        background: hovered ? 'var(--surface-hover)' : 'var(--surface-default)',
        padding: '28px 28px 24px',
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        transform: hovered ? 'translateY(-3px)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      {/* Top row: severity + difficulty */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          className="pixel-font"
          style={{
            padding: '4px 8px',
            background: `rgba(250,82,82,0.15)`,
            border: `1px solid rgba(250,82,82,0.35)`,
            color: colors.danger[400],
            fontSize: 8,
          }}
        >
          {incident.severity}
        </span>
        <span
          className="pixel-font"
          style={{
            padding: '4px 8px',
            background: 'var(--surface-default)',
            border: `1px solid var(--border-default)`,
            color: difficultyColor[incident.difficulty] ?? colors.text.secondary,
            fontSize: 8,
          }}
        >
          {incident.difficulty}
        </span>
        <div style={{ flex: 1 }} />
        <span className="pixel-font" style={{ fontSize: 8, color: 'var(--text-muted)' }}>
          INC-{String(incident.id).padStart(3, '0')}
        </span>
      </div>

      {/* Title */}
      <div>
        <h3
          className="pixel-font"
          style={{
            margin: 0,
            fontSize: 12,
            color: 'var(--text-primary)',
            lineHeight: 1.5,
          }}
        >
          {incident.title}
        </h3>
      </div>

      {/* Summary */}
      <p
        className="pixel-font"
        style={{
          margin: 0,
          fontSize: 8,
          color: 'var(--text-muted)',
          lineHeight: 1.75,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {incident.summary}
      </p>

      {/* Service + SLA */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 'auto',
          paddingTop: 8,
          borderTop: `1px solid var(--border-subtle)`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="pixel-font" style={{ fontSize: 8, color: 'var(--text-secondary)' }}>
            &gt; {incident.service}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            className="pixel-font"
            style={{
              fontSize: 8,
              color: colors.danger[400],
            }}
          >
            SLA {incident.slaMinutes}m
          </span>
        </div>
      </div>
    </div>
  );
}
