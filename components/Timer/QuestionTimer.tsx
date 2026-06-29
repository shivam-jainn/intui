'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { IconClock, IconFlame, IconPlayerPlay, IconPlayerStop } from '@tabler/icons-react';
import { t } from '@/lib/incident-theme';

interface QuestionTimerProps {
  questionId: string;
  mode: 'timer' | 'mixer';
  onModeChange: (mode: 'timer' | 'mixer') => void;
  isMixerRunning: boolean;
  mixerTimeRemaining: number;
  onMixerTimerStart: (seconds: number) => void;
  onMixerTimerStop: () => void;
  onMixerTimeUp: () => void;
  onLocked?: (locked: boolean) => void;
}

export default function QuestionTimer({
  questionId,
  mode,
  onModeChange,
  isMixerRunning,
  mixerTimeRemaining,
  onMixerTimerStart,
  onMixerTimerStop,
  onMixerTimeUp,
  onLocked,
}: QuestionTimerProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {/* Timer | Mixer toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          borderRadius: t.radius.md,
          border: `1px solid ${t.border}`,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <ToggleButton
          active={mode === 'timer'}
          onClick={() => onModeChange('timer')}
          icon={<IconClock size={11} />}
          label="Timer"
          activeColor={t.accent}
          activeBg={t.accentMuted}
        />
        <ToggleButton
          active={mode === 'mixer'}
          onClick={() => onModeChange('mixer')}
          icon={<IconFlame size={11} />}
          label="Mixer"
          activeColor={t.error}
          activeBg="rgba(239,68,68,0.08)"
        />
      </div>

      {/* Timer content */}
      {mode === 'timer' ? (
        <TimerDisplay
          onLocked={onLocked}
        />
      ) : (
        <MixerPill
          isMixerRunning={isMixerRunning}
          mixerTimeRemaining={mixerTimeRemaining}
          onLocked={onLocked}
        />
      )}
    </div>
  );
}

// ── Toggle Button ──────────────────────────────────────

function ToggleButton({
  active,
  onClick,
  icon,
  label,
  activeColor,
  activeBg,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  activeColor: string;
  activeBg: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 10px',
        background: active ? activeBg : 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontSize: t.size.xs,
        fontWeight: active ? 600 : 400,
        color: active ? activeColor : t.textDim,
        fontFamily: t.font.mono,
        transition: `all ${t.transition.fast}`,
        borderRight: `1px solid ${t.border}`,
      }}
    >
      {icon}
      {label}
    </button>
  );
}

// ── Timer Display (settable SLA timer) ─────────────────

function TimerDisplay({
  onLocked,
}: {
  onLocked?: (locked: boolean) => void;
}) {
  const [duration, setDuration] = useState(25); // minutes
  const [remaining, setRemaining] = useState(0); // seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [expired, setExpired] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const totalSeconds = duration * 60;
  const notStarted = remaining === 0 && !isRunning && !expired;

  // Countdown
  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        const next = prev <= 1 ? 0 : prev - 1;
        if (next <= 0) {
          clearInterval(intervalRef.current!);
          setIsRunning(false);
          setExpired(true);
          onLocked?.(true);
        }
        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, onLocked]);

  const handleStart = useCallback(() => {
    if (totalSeconds <= 0) return;
    setRemaining(totalSeconds);
    setIsRunning(true);
    setIsEditing(false);
    setExpired(false);
    onLocked?.(false);
  }, [totalSeconds, onLocked]);

  const handleStop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setRemaining(0);
    setExpired(false);
    onLocked?.(false);
  }, [onLocked]);

  const handleReset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setRemaining(0);
    setExpired(false);
    onLocked?.(false);
  }, [onLocked]);

  const handleDurationClick = useCallback(() => {
    if (!isRunning) {
      setIsEditing(true);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isRunning]);

  const handleDurationSubmit = useCallback(() => {
    setIsEditing(false);
    const clamped = Math.max(1, Math.min(120, duration));
    setDuration(clamped);
  }, [duration]);

  // Display values
  const displayMinutes = Math.floor(Math.max(0, remaining) / 60);
  const displaySeconds = Math.max(0, remaining) % 60;
  const progress = totalSeconds > 0 ? Math.max(0, remaining / totalSeconds) : 0;

  const isUrgent = isRunning && remaining <= 300 && remaining > 60;
  const isCritical = isRunning && remaining <= 60 && remaining > 0;

  const timerColor = expired
    ? '#ef4444'
    : isCritical
      ? '#f87171'
      : isUrgent
        ? '#f59e0b'
        : t.accent;

  // Lockout state
  if (expired) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 10px',
            borderRadius: t.radius.md,
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.4)',
            flexShrink: 0,
          }}
        >
          <IconClock size={11} color="#ef4444" />
          <span
            style={{
              fontFamily: t.font.mono,
              fontSize: t.size.md,
              fontWeight: 700,
              color: '#ef4444',
              letterSpacing: '0.04em',
            }}
          >
            00:00
          </span>
        </div>
        <button
          type="button"
          onClick={handleReset}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 10px',
            borderRadius: t.radius.md,
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            cursor: 'pointer',
            fontSize: t.size.xs,
            fontWeight: 600,
            color: '#ef4444',
            fontFamily: t.font.mono,
            transition: `all ${t.transition.fast}`,
            flexShrink: 0,
          }}
          title="Reset timer"
        >
          Reset
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {/* Duration input / Time display */}
      <div
        onClick={handleDurationClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleDurationSubmit();
          if (e.key === 'Escape') {
            setIsEditing(false);
            setDuration(Math.max(1, Math.ceil(remaining / 60)));
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '3px 10px',
          borderRadius: t.radius.md,
          background: expired
            ? 'rgba(239,68,68,0.12)'
            : isCritical
              ? 'rgba(239,68,68,0.1)'
              : isUrgent
                ? 'rgba(245,158,11,0.08)'
                : notStarted
                  ? 'rgba(255,255,255,0.04)'
                  : 'rgba(96,165,250,0.06)',
          border: `1px solid ${
            expired
              ? 'rgba(239,68,68,0.3)'
              : isCritical
                ? 'rgba(239,68,68,0.25)'
                : isUrgent
                  ? 'rgba(245,158,11,0.2)'
                  : notStarted
                    ? t.border
                    : 'rgba(96,165,250,0.12)'
          }`,
          flexShrink: 0,
          cursor: isRunning ? 'default' : 'pointer',
          transition: `all ${t.transition.fast}`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Progress bar background */}
        {!notStarted && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: timerColor,
              opacity: 0.08,
              width: `${progress * 100}%`,
              transition: 'width 1s linear',
            }}
          />
        )}

        {isEditing ? (
          <input
            ref={inputRef}
            type="number"
            value={duration}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v)) setDuration(v);
            }}
            onBlur={handleDurationSubmit}
            min={1}
            max={120}
            style={{
              width: 40,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: t.accent,
              fontFamily: t.font.mono,
              fontSize: t.size.md,
              fontWeight: 700,
              letterSpacing: '0.04em',
              textAlign: 'center',
              padding: 0,
            }}
          />
        ) : (
          <>
            {!notStarted && (
              <IconClock size={11} color={timerColor} />
            )}
            <span
              style={{
                fontFamily: t.font.mono,
                fontSize: t.size.md,
                fontWeight: 700,
                color: notStarted ? t.textDim : timerColor,
                letterSpacing: '0.04em',
                textShadow: isUrgent ? `0 0 12px ${timerColor}40` : 'none',
                minWidth: 40,
                textAlign: 'center',
                position: 'relative',
              }}
            >
              {notStarted
                ? `${duration}m`
                : `${String(displayMinutes).padStart(2, '0')}:${String(displaySeconds).padStart(2, '0')}`}
            </span>
          </>
        )}
      </div>

      {/* Start / Stop button */}
      {isRunning ? (
        <button
          type="button"
          onClick={handleStop}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 26,
            height: 26,
            borderRadius: t.radius.md,
            background: 'rgba(239,68,68,0.1)',
            border: `1px solid rgba(239,68,68,0.3)`,
            cursor: 'pointer',
            color: '#ef4444',
            transition: `all ${t.transition.fast}`,
            flexShrink: 0,
          }}
          title="Stop timer"
        >
          <IconPlayerStop size={12} />
        </button>
      ) : (
        <button
          type="button"
          onClick={handleStart}
          disabled={totalSeconds <= 0}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 26,
            height: 26,
            borderRadius: t.radius.md,
            background: totalSeconds > 0 ? t.accentMuted : 'rgba(255,255,255,0.04)',
            border: `1px solid ${totalSeconds > 0 ? t.accentBorder : t.border}`,
            cursor: totalSeconds > 0 ? 'pointer' : 'default',
            color: totalSeconds > 0 ? t.accent : t.textDim,
            transition: `all ${t.transition.fast}`,
            flexShrink: 0,
            opacity: totalSeconds > 0 ? 1 : 0.5,
          }}
          title="Start timer"
        >
          <IconPlayerPlay size={12} />
        </button>
      )}
    </div>
  );
}

// ── Mixer Pill (compact display when mixer is running) ──

function MixerPill({
  isMixerRunning,
  mixerTimeRemaining,
  onLocked,
}: {
  isMixerRunning: boolean;
  mixerTimeRemaining: number;
  onLocked?: (locked: boolean) => void;
}) {
  const prevRunningRef = useRef(isMixerRunning);

  // Detect when mixer transitions from running → stopped (time up)
  useEffect(() => {
    if (prevRunningRef.current && !isMixerRunning && mixerTimeRemaining <= 0) {
      onLocked?.(true);
    }
    prevRunningRef.current = isMixerRunning;
  }, [isMixerRunning, mixerTimeRemaining, onLocked]);

  // Reset lock when mixer starts fresh
  useEffect(() => {
    if (isMixerRunning) {
      onLocked?.(false);
    }
  }, [isMixerRunning, onLocked]);

  if (!isMixerRunning && mixerTimeRemaining <= 0) return null;

  const mins = Math.floor(Math.max(0, mixerTimeRemaining) / 60);
  const secs = Math.max(0, mixerTimeRemaining) % 60;
  const urgent = mixerTimeRemaining <= 60 && mixerTimeRemaining > 0;
  const critical = mixerTimeRemaining <= 30 && mixerTimeRemaining > 0;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 10px',
        borderRadius: t.radius.md,
        background: critical
          ? 'rgba(239,68,68,0.2)'
          : urgent
            ? 'rgba(234,179,8,0.12)'
            : 'rgba(239,68,68,0.1)',
        border: `1px solid ${
          critical
            ? 'rgba(239,68,68,0.5)'
            : urgent
              ? 'rgba(234,179,8,0.3)'
              : 'rgba(239,68,68,0.3)'
        }`,
        flexShrink: 0,
      }}
    >
      <IconFlame size={11} color={critical ? '#ef4444' : urgent ? '#eab308' : '#f87171'} />
      <span
        style={{
          fontFamily: t.font.mono,
          fontSize: t.size.md,
          fontWeight: 700,
          color: critical ? '#ef4444' : urgent ? '#eab308' : '#f87171',
          letterSpacing: '0.04em',
        }}
      >
        [{critical ? '00:00' : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`}]
      </span>
    </div>
  );
}
