'use client';

import React, { useState } from 'react';
import { useAtom } from 'jotai';
import {
  IconClock,
  IconFlame,
} from '@tabler/icons-react';
import {
  slaSecondsAtom,
  slaTotalSecondsAtom,
  incidentMetaAtom,
} from '@/contexts/IncidentContext';
import MixerPanel from '@/components/Mixer/MixerPanel';
import { t } from '@/lib/incident-theme';

interface TimerPanelProps {
  incidentId?: string;
  questionId?: string;
  onTimerStart?: (seconds: number) => void;
  onTimerStop?: () => void;
  onTimeUp?: () => void;
  isTimerRunning?: boolean;
  autoEnable?: boolean;
}

export default function TimerPanel({
  incidentId,
  questionId,
  onTimerStart,
  onTimerStop,
  onTimeUp,
  isTimerRunning = false,
  autoEnable = false,
}: TimerPanelProps) {
  const [mode, setMode] = useState<'timer' | 'fire'>('timer');

  return (
    <div
      style={{
        borderRadius: t.radius.xl,
        border: mode === 'fire'
          ? `1px solid ${t.errorBorder}`
          : `1px solid ${t.border}`,
        background: mode === 'fire' ? t.errorMuted : 'transparent',
        transition: `all ${t.transition.normal}`,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          borderBottom: `1px solid ${t.border}`,
        }}
      >
        <TabButton
          active={mode === 'timer'}
          label="Timer"
          icon={<IconClock size={12} />}
          activeColor={t.accent}
          onClick={() => setMode('timer')}
        />
        <TabButton
          active={mode === 'fire'}
          label="Fire"
          icon={<IconFlame size={12} />}
          activeColor={t.error}
          onClick={() => setMode('fire')}
        />
      </div>

      {mode === 'timer' && <TimerContent />}

      {mode === 'fire' && (
        <div style={{ padding: 0 }}>
          <MixerPanel
            incidentId={incidentId}
            questionId={questionId}
            onTimerStart={onTimerStart}
            onTimerStop={onTimerStop}
            onTimeUp={onTimeUp}
            isTimerRunning={isTimerRunning}
            autoEnable={autoEnable}
            isActive={mode === 'fire'}
            showToggle={false}
          />
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  label,
  icon,
  activeColor,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  activeColor: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        padding: '6px 10px',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        fontSize: t.size.sm,
        fontWeight: active ? 600 : 400,
        color: active ? t.textPrimary : t.textDim,
        borderBottom: active ? `2px solid ${activeColor}` : '2px solid transparent',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        transition: `all ${t.transition.fast}`,
        fontFamily: t.font.mono,
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function TimerContent() {
  const [slaSeconds] = useAtom(slaSecondsAtom);
  const [slaTotal] = useAtom(slaTotalSecondsAtom);
  const [meta] = useAtom(incidentMetaAtom);

  const notStarted = slaTotal <= 0;
  const minutes = Math.floor(Math.max(0, slaSeconds) / 60);
  const seconds = Math.max(0, slaSeconds) % 60;
  const progress = slaTotal > 0 ? Math.max(0, slaSeconds / slaTotal) : 1;
  const isUrgent = slaSeconds < 300 && !notStarted;
  const isCritical = slaSeconds < 60 && !notStarted;
  const isExpired = slaSeconds <= 0 && !notStarted;

  const timerColor = isExpired
    ? t.error
    : isCritical
      ? '#f87171'
      : isUrgent
        ? t.warning
        : t.accent;

  if (!meta && notStarted) {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: t.size.sm, color: t.textDim, textAlign: 'center' }}>
          No active timer
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 12 }}>
      {/* Progress bar */}
      <div
        style={{
          height: 2,
          borderRadius: 1,
          background: 'rgba(255,255,255,0.06)',
          overflow: 'hidden',
          marginBottom: 10,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress * 100}%`,
            background: timerColor,
            borderRadius: 1,
            transition: 'width 1s linear',
            boxShadow: isUrgent ? `0 0 8px ${timerColor}` : 'none',
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '3px 10px',
            borderRadius: t.radius.lg,
            background: isExpired
              ? 'rgba(239,68,68,0.12)'
              : isCritical
                ? 'rgba(239,68,68,0.1)'
                : isUrgent
                  ? 'rgba(245,158,11,0.08)'
                  : t.accentMuted,
            border: `1px solid ${
              isExpired
                ? 'rgba(239,68,68,0.3)'
                : isCritical
                  ? 'rgba(239,68,68,0.25)'
                  : isUrgent
                    ? 'rgba(245,158,11,0.2)'
                    : t.accentBorder
            }`,
          }}
        >
          <IconClock size={12} color={timerColor} />
          <span
            style={{
              fontFamily: t.font.mono,
              fontSize: t.size.base,
              fontWeight: 700,
              color: timerColor,
              letterSpacing: '0.04em',
              minWidth: 40,
              textShadow: isUrgent ? `0 0 12px ${timerColor}40` : 'none',
            }}
          >
            {isExpired
              ? '00:00'
              : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {isExpired && (
            <span
              style={{
                padding: '2px 8px',
                borderRadius: t.radius.sm,
                background: 'rgba(239,68,68,0.15)',
                fontSize: t.size.xs,
                fontWeight: 700,
                fontFamily: t.font.mono,
                color: t.error,
                animation: 'pulse-glow 1s ease-in-out infinite',
              }}
            >
              BREACHED
            </span>
          )}
          {notStarted && meta && (
            <span
              style={{
                padding: '2px 8px',
                borderRadius: t.radius.sm,
                border: `1px solid ${t.border}`,
                fontSize: t.size.xs,
                fontFamily: t.font.mono,
                color: t.textDim,
              }}
            >
              Not Started
            </span>
          )}
          {!isExpired && !notStarted && meta && (
            <span
              style={{
                padding: '2px 8px',
                borderRadius: t.radius.sm,
                border: `1px solid ${t.border}`,
                fontSize: t.size.xs,
                fontFamily: t.font.mono,
                color: t.textDim,
              }}
            >
              SLA {meta.severity || 'P0'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
