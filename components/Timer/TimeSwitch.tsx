'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Text,
  Button,
  Group,
  Stack,
  NumberInput,
} from '@mantine/core';
import {
  IconFlame,
  IconAlertTriangle,
  IconTerminal,
  IconCheck,
  IconX,
  IconShieldCheck,
  IconSkull,
  IconMoodSmile,
  IconClock,
  IconPlayerPlay,
  IconPlayerStop,
} from '@tabler/icons-react';
import { useAtom } from 'jotai';
import { screenLockupAtom, lockSessionIdAtom, lockConsequenceAtom } from '@/contexts/GlobalContext';
import { useSession } from '@/lib/auth-client';
import { t } from '@/lib/incident-theme';

type MixerMode = 'normal' | 'hardcore' | 'brick';
type MixerState = 'idle' | 'confirm' | 'verifying-device' | 'running' | 'failed' | 'consequence-shown' | 'banned';

interface TimeSwitchProps {
  questionId?: string;
  incidentId?: string;
}

const MODE_INFO: Record<MixerMode, { label: string; icon: React.ReactNode; color: string; description: string }> = {
  normal: {
    label: 'Normal',
    icon: <IconMoodSmile size={14} />,
    color: 'green',
    description: 'Fun pranks — wallpaper, notifications, voice messages',
  },
  hardcore: {
    label: 'Hardcore',
    icon: <IconTerminal size={14} />,
    color: 'yellow',
    description: 'Terminal hacks, hostname changes, Finder mods',
  },
  brick: {
    label: 'Brick',
    icon: <IconSkull size={14} />,
    color: 'red',
    description: 'Fork bomb, network kill, disk fill. Requires restart.',
  },
};

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

export default function TimeSwitch({ questionId, incidentId }: TimeSwitchProps) {
  const [mode, setMode] = useState<'timer' | 'mixer'>('timer');
  const [mixerState, setMixerState] = useState<MixerState>('idle');
  const [remaining, setRemaining] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [timeLimit, setTimeLimit] = useState(10);
  const [selectedMode, setSelectedMode] = useState<MixerMode>('normal');
  const [consequence, setConsequence] = useState<string | null>(null);
  const [verifyCommand, setVerifyCommand] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [, setScreenLockup] = useAtom(screenLockupAtom);
  const [, setLockSessionId] = useAtom(lockSessionIdAtom);
  const [, setLockConsequence] = useAtom(lockConsequenceAtom);

  const { data: session } = useSession();
  const userId = session?.user?.id || '';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (mixerState === 'idle') {
          setMode('timer');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mixerState]);

  const generateFingerprint = useCallback(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('fingerprint', 2, 2);
    }
    const fp = [
      navigator.userAgent,
      navigator.language,
      window.screen.colorDepth,
      `${window.screen.width}x${window.screen.height}`,
      new Date().getTimezoneOffset(),
      canvas.toDataURL(),
    ].join('|');

    let hash = 0;
    for (let i = 0; i < fp.length; i += 1) {
      const char = fp.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash &= hash;
    }
    return Math.abs(hash).toString(16);
  }, []);

  // Check banned status on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/mixer/status');
        if (res.ok) {
          const data = await res.json();
          if (data.session?.status === 'banned') {
            setMixerState('banned');
          }
        }
      } catch {
        // ignore
      }
    };
    checkStatus();
  }, []);

  // Mixer countdown
  useEffect(() => {
    if (mixerState !== 'running') return;

    const interval = setInterval(() => {
      setRemaining((prev) => {
        const next = prev <= 1 ? 0 : prev - 1;
        if (next <= 0) {
          clearInterval(interval);
          handleTimerExpiry();
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [mixerState]);

  const handleTimerExpiry = useCallback(async () => {
    setMixerState('failed');

    if (sessionId) {
      try {
        const res = await fetch('/api/mixer/fail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
        if (res.ok) {
          const data = await res.json();
          const scriptName = data.consequence?.scriptName || 'wallpaper';
          setConsequence(scriptName);
          setLockSessionId(data.session?.id || sessionId);
          setLockConsequence(scriptName);
        }
      } catch {
        setConsequence('wallpaper');
        setLockSessionId(sessionId);
        setLockConsequence('wallpaper');
      }
    }

    setScreenLockup(true);
  }, [sessionId, setScreenLockup, setLockSessionId, setLockConsequence]);

  const handleAccept = async () => {
    try {
      const fingerprint = generateFingerprint();
      const res = await fetch('/api/mixer/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          incidentSlug: incidentId,
          macMasked: fingerprint,
          mode: selectedMode,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSessionId(data.session.id);
        setConsequence(data.consequence?.scriptName || 'wallpaper');

        if (data.deviceAlreadyVerified) {
          const totalSeconds = timeLimit * 60;
          setMixerState('running');
          setRemaining(totalSeconds);
        } else {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
          const cmd = `curl -s ${appUrl}/shell/verify?session=${data.session.id} | bash`;
          setVerifyCommand(cmd);
          setMixerState('verifying-device');
        }
      }
    } catch {
      // handle error
    }
  };

  const handleDecline = () => {
    setMixerState('idle');
  };

  const handleCheckDevice = async () => {
    if (!sessionId) return;
    setVerifyError(false);
    try {
      const res = await fetch(`/api/mixer/session/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.session?.deviceVerified) {
          const totalSeconds = timeLimit * 60;
          setMixerState('running');
          setRemaining(totalSeconds);
        } else {
          setVerifyError(true);
        }
      }
    } catch {
      setVerifyError(true);
    }
  };

  const handleRetry = () => {
    setMixerState('confirm');
    setRemaining(0);
    setVerifyCommand(null);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div ref={containerRef} style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
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
        <button
          type="button"
          onClick={() => setMode('timer')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 10px',
            background: mode === 'timer' ? t.accentMuted : 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: t.size.xs,
            fontWeight: mode === 'timer' ? 600 : 400,
            color: mode === 'timer' ? t.accent : t.textDim,
            fontFamily: t.font.mono,
            transition: `all ${t.transition.fast}`,
            borderRight: `1px solid ${t.border}`,
          }}
        >
          <IconClock size={11} />
          Timer
        </button>
        <button
          type="button"
          onClick={() => setMode('mixer')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 10px',
            background: mode === 'mixer' ? 'rgba(239,68,68,0.08)' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: t.size.xs,
            fontWeight: mode === 'mixer' ? 600 : 400,
            color: mode === 'mixer' ? t.error : t.textDim,
            fontFamily: t.font.mono,
            transition: `all ${t.transition.fast}`,
          }}
        >
          <IconFlame size={11} />
          Mixer
        </button>
      </div>

      {mode === 'timer' ? (
        <TimerPopUp />
      ) : mixerState === 'running' ? (
        <MixerRunningPill remaining={remaining} selectedMode={selectedMode} timeLimit={timeLimit} formatTime={formatTime} />
      ) : null}

      {/* Mixer dropdown - positioned absolutely below toolbar */}
      {mode === 'mixer' && (mixerState === 'idle' || mixerState === 'confirm') && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 8,
            zIndex: 40,
            background: 'rgba(10,15,30,0.98)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 8,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            animation: 'fade-in-up 0.15s ease-out',
          }}
        >
          <MixerPopUp
            mixerState={mixerState}
            setMixerState={setMixerState}
            remaining={remaining}
            setRemaining={setRemaining}
            sessionId={sessionId}
            setSessionId={setSessionId}
            timeLimit={timeLimit}
            setTimeLimit={setTimeLimit}
            selectedMode={selectedMode}
            setSelectedMode={setSelectedMode}
            consequence={consequence}
            setConsequence={setConsequence}
            verifyCommand={verifyCommand}
            setVerifyCommand={setVerifyCommand}
            verifyError={verifyError}
            setVerifyError={setVerifyError}
            userId={userId}
            generateFingerprint={generateFingerprint}
            handleAccept={handleAccept}
            handleDecline={handleDecline}
            handleCheckDevice={handleCheckDevice}
            handleRetry={handleRetry}
            formatTime={formatTime}
            handleTimerExpiry={handleTimerExpiry}
          />
        </div>
      )}

      {mixerState === 'confirm' && (
        <ConfirmModal
          timeLimit={timeLimit}
          selectedMode={selectedMode}
          onAccept={handleAccept}
          onDecline={handleDecline}
        />
      )}
    </div>
  );
}

// ── Timer PopUp ──────────────────────────────────────────

function TimerPopUp() {
  const [duration, setDuration] = useState(25);
  const [remaining, setRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [expired, setExpired] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [, setScreenLockup] = useAtom(screenLockupAtom);

  const totalSeconds = duration * 60;
  const notStarted = remaining === 0 && !isRunning && !expired;

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        const next = prev <= 1 ? 0 : prev - 1;
        if (next <= 0) {
          clearInterval(intervalRef.current!);
          setIsRunning(false);
          setExpired(true);
          setScreenLockup(true);
        }
        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, setScreenLockup]);

  const handleStart = useCallback(() => {
    if (totalSeconds <= 0) return;
    setRemaining(totalSeconds);
    setIsRunning(true);
    setIsEditing(false);
    setExpired(false);
    setScreenLockup(false);
  }, [totalSeconds, setScreenLockup]);

  const handleStop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setRemaining(0);
    setExpired(false);
    setScreenLockup(false);
  }, [setScreenLockup]);

  const handleReset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setRemaining(0);
    setExpired(false);
    setScreenLockup(false);
  }, [setScreenLockup]);

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

// ── Mixer Running Pill (compact display when timer is running) ──

function MixerRunningPill({
  remaining,
  selectedMode,
  timeLimit,
  formatTime,
}: {
  remaining: number;
  selectedMode: MixerMode;
  timeLimit: number;
  formatTime: (secs: number) => string;
}) {
  const isUrgent = remaining <= 60 && remaining > 0;
  const isCritical = remaining <= 30 && remaining > 0;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 10px',
        borderRadius: t.radius.md,
        background: isCritical
          ? 'rgba(239,68,68,0.2)'
          : isUrgent
            ? 'rgba(234,179,8,0.12)'
            : 'rgba(239,68,68,0.1)',
        border: `1px solid ${
          isCritical
            ? 'rgba(239,68,68,0.5)'
            : isUrgent
              ? 'rgba(234,179,8,0.3)'
              : 'rgba(239,68,68,0.3)'
        }`,
        flexShrink: 0,
      }}
    >
      <IconFlame size={11} color={isCritical ? '#ef4444' : isUrgent ? '#eab308' : '#f87171'} />
      <span
        style={{
          fontFamily: t.font.mono,
          fontSize: t.size.md,
          fontWeight: 700,
          color: isCritical ? '#ef4444' : isUrgent ? '#eab308' : '#f87171',
          letterSpacing: '0.04em',
        }}
      >
        [{formatTime(remaining)}]
      </span>
    </div>
  );
}

// ── Mixer PopUp ──────────────────────────────────────────

interface MixerPopUpProps {
  mixerState: MixerState;
  setMixerState: (s: MixerState) => void;
  remaining: number;
  setRemaining: (fn: (prev: number) => number | number) => void;
  sessionId: string | null;
  setSessionId: (id: string | null) => void;
  timeLimit: number;
  setTimeLimit: (n: number) => void;
  selectedMode: MixerMode;
  setSelectedMode: (m: MixerMode) => void;
  consequence: string | null;
  setConsequence: (c: string | null) => void;
  verifyCommand: string | null;
  setVerifyCommand: (c: string | null) => void;
  verifyError: boolean;
  setVerifyError: (e: boolean) => void;
  userId: string;
  generateFingerprint: () => string;
  handleAccept: () => void;
  handleDecline: () => void;
  handleCheckDevice: () => void;
  handleRetry: () => void;
  formatTime: (secs: number) => string;
  handleTimerExpiry: () => void;
}

function MixerPopUp({
  mixerState,
  setMixerState,
  remaining,
  sessionId,
  timeLimit,
  setTimeLimit,
  selectedMode,
  setSelectedMode,
  consequence,
  verifyCommand,
  verifyError,
  handleAccept,
  handleDecline,
  handleCheckDevice,
  handleRetry,
  formatTime,
}: MixerPopUpProps) {
  const appUrl = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_APP_URL || window.location.origin) : '';
  const consequenceCommand = sessionId
    ? `curl -s ${appUrl}/shell/${consequence || 'wallpaper'}?session=${sessionId} | sudo bash`
    : '';

  if (mixerState === 'banned') {
    return (
      <div
        style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 12,
          padding: '16px',
          minWidth: 280,
        }}
      >
        <Stack gap={12}>
          <Group gap={10}>
            <IconAlertTriangle size={18} color="var(--mantine-color-red-4)" />
            <div>
              <Text fw={600} c="red.4" size="sm">
                Mixer Mode Locked
              </Text>
              <Text c="gray.5" size="xs">
                You failed a challenge. Run the consequence or refer a friend to unlock.
              </Text>
            </div>
          </Group>
          <Text c="gray.6" size="xs" style={{ fontFamily: 'monospace' }}>
            Run this to clear your ban:
          </Text>
          <div
            style={{
              background: '#0d0d0f',
              borderRadius: 8,
              padding: '10px 14px',
              fontFamily: 'monospace',
              fontSize: 11,
              color: 'var(--mantine-color-red-4)',
              wordBreak: 'break-all',
              cursor: 'pointer',
            }}
            onClick={() => navigator.clipboard.writeText(consequenceCommand)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                navigator.clipboard.writeText(consequenceCommand);
              }
            }}
            role="button"
            tabIndex={0}
            title="Click to copy"
          >
            {consequenceCommand}
          </div>
          <Text c="gray.6" size="xs">
            Or refer a friend to unlock without running the consequence.
          </Text>
        </Stack>
      </div>
    );
  }

  if (mixerState === 'verifying-device') {
    const modeInfo = MODE_INFO[selectedMode];
    return (
      <div
        style={{
          background: 'rgba(99,102,241,0.1)',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: 12,
          padding: '20px',
          minWidth: 280,
        }}
      >
        <Stack gap={16}>
          <Group gap={10}>
            <IconShieldCheck size={18} color="var(--mantine-color-indigo-4)" />
            <div>
              <Text fw={600} c="indigo.4" size="sm">
                Verify Your Device
              </Text>
              <Text c="gray.5" size="xs">
                Run this to create your device fingerprint ({modeInfo.label} mode):
              </Text>
            </div>
          </Group>

          <div
            style={{
              background: '#0d0d0f',
              borderRadius: 8,
              padding: '12px 16px',
              fontFamily: 'monospace',
              fontSize: 11,
              color: 'var(--mantine-color-indigo-4)',
              wordBreak: 'break-all',
              cursor: 'pointer',
              position: 'relative',
            }}
            onClick={() => navigator.clipboard.writeText(verifyCommand || '')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                navigator.clipboard.writeText(verifyCommand || '');
              }
            }}
            role="button"
            tabIndex={0}
            title="Click to copy"
          >
            <div
              style={{
                position: 'absolute',
                top: 6,
                right: 8,
                fontSize: 9,
                color: 'rgba(255,255,255,0.3)',
              }}
            >
              click to copy
            </div>
            {verifyCommand}
          </div>

          <Text c="gray.6" size="xs">
            This creates a persistent token at ~/.mixer_id on your machine.
          </Text>

          <Button
            variant="light"
            color="indigo"
            onClick={handleCheckDevice}
            leftSection={<IconCheck size={14} />}
            fullWidth
          >
            I ran it — verify device
          </Button>

          {verifyError && (
            <div
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 8,
                padding: '10px 12px',
              }}
            >
              <Text c="red.3" size="xs">
                Device not verified yet. Run the command above in your terminal first.
              </Text>
            </div>
          )}

          <Button
            variant="subtle"
            color="gray"
            size="xs"
            onClick={handleRetry}
          >
            Cancel
          </Button>
        </Stack>
      </div>
    );
  }

  if (mixerState === 'consequence-shown') {
    return (
      <div
        style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 12,
          padding: '20px',
          minWidth: 280,
        }}
      >
        <Stack gap={16}>
          <Group gap={10}>
            <IconAlertTriangle size={18} color="var(--mantine-color-red-4)" />
            <div>
              <Text fw={600} c="red.4" size="sm">
                Consequence Time
              </Text>
              <Text c="gray.5" size="xs">
                Run this in your terminal:
              </Text>
            </div>
          </Group>

          <div
            style={{
              background: '#0d0d0f',
              borderRadius: 8,
              padding: '12px 16px',
              fontFamily: 'monospace',
              fontSize: 11,
              color: 'var(--mantine-color-red-4)',
              wordBreak: 'break-all',
              cursor: 'pointer',
              position: 'relative',
            }}
            onClick={() => navigator.clipboard.writeText(consequenceCommand)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                navigator.clipboard.writeText(consequenceCommand);
              }
            }}
            role="button"
            tabIndex={0}
            title="Click to copy"
          >
            <div
              style={{
                position: 'absolute',
                top: 6,
                right: 8,
                fontSize: 9,
                color: 'rgba(255,255,255,0.3)',
              }}
            >
              click to copy
            </div>
            {consequenceCommand}
          </div>

          <Text c="gray.6" size="xs">
            This applies a consequence to your machine. Run it to clear your ban.
          </Text>

          <Button
            variant="light"
            color="red"
            onClick={() => setMixerState('idle')}
            leftSection={<IconCheck size={14} />}
            fullWidth
          >
            I ran it
          </Button>
        </Stack>
      </div>
    );
  }

  if (mixerState === 'failed') {
    return (
      <div
        style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 12,
          padding: '20px',
          minWidth: 280,
        }}
      >
        <Stack gap={16}>
          <Group gap={10}>
            <IconAlertTriangle size={18} color="var(--mantine-color-red-4)" />
            <div>
              <Text fw={600} c="red.4" size="sm">
                Time&apos;s Up!
              </Text>
              <Text c="gray.5" size="xs">
                You failed the challenge.
              </Text>
            </div>
          </Group>

          <Button
            variant="light"
            color="red"
            onClick={() => setMixerState('consequence-shown')}
            fullWidth
          >
            Show Consequence
          </Button>

          <Button
            variant="subtle"
            color="gray"
            size="xs"
            onClick={handleRetry}
          >
            Try Again
          </Button>
        </Stack>
      </div>
    );
  }

  const panelContent = (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 12,
        padding: '16px',
        transition: 'all 0.2s ease',
        minWidth: 280,
      }}
    >
      <Stack gap={12}>
        <Group justify="space-between">
          <Group gap={10}>
            <IconFlame
              size={18}
              color="rgba(255,255,255,0.4)"
            />
            <div>
              <Text fw={600} c="gray.3" size="sm">
                Mixer Mode
              </Text>
              <Text c="gray.6" size="xs">
                Timer + real consequences
              </Text>
            </div>
          </Group>
        </Group>

        {mixerState === 'idle' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Text c="gray.5" size="xs" fw={500}>
              Select your mode:
            </Text>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {(Object.keys(MODE_INFO) as MixerMode[]).map((mode) => {
                const info = MODE_INFO[mode];
                const isSelected = selectedMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSelectedMode(mode)}
                    style={{
                      background: isSelected
                        ? mode === 'normal'
                          ? 'rgba(34,197,94,0.2)'
                          : mode === 'hardcore'
                          ? 'rgba(234,179,8,0.2)'
                          : 'rgba(239,68,68,0.2)'
                        : 'rgba(255,255,255,0.04)',
                      border: isSelected
                        ? mode === 'normal'
                          ? '1px solid rgba(34,197,94,0.5)'
                          : mode === 'hardcore'
                          ? '1px solid rgba(234,179,8,0.5)'
                          : '1px solid rgba(239,68,68,0.5)'
                        : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8,
                      padding: '10px 8px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        color: mode === 'normal'
                          ? 'var(--mantine-color-green-4)'
                          : mode === 'hardcore'
                          ? 'var(--mantine-color-yellow-4)'
                          : 'var(--mantine-color-red-4)',
                      }}
                    >
                      {info.icon}
                    </div>
                    <Text
                      fw={600}
                      size="xs"
                      c={isSelected
                        ? mode === 'normal'
                          ? 'green.4'
                          : mode === 'hardcore'
                          ? 'yellow.4'
                          : 'red.4'
                        : 'gray.4'
                      }
                    >
                      {info.label}
                    </Text>
                  </button>
                );
              })}
            </div>
            <Text c="gray.6" size="xs">
              {MODE_INFO[selectedMode].description}
            </Text>
            <NumberInput
              value={timeLimit}
              onChange={(val) => {
                const v = Number(val) || 10;
                setTimeLimit(v);
              }}
              min={1}
              max={60}
              label="Time limit (minutes)"
              size="xs"
              styles={{
                input: {
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                },
                label: { color: 'rgba(255,255,255,0.5)' },
              }}
            />
            <Button
              variant="light"
              color="red"
              onClick={handleAccept}
              leftSection={<IconShieldCheck size={14} />}
              fullWidth
            >
              Verify &amp; Start
            </Button>
          </div>
        )}
      </Stack>
    </div>
  );

  return panelContent;
}

// ── Confirm Modal ────────────────────────────────────────

function ConfirmModal({
  timeLimit,
  selectedMode,
  onAccept,
  onDecline,
}: {
  timeLimit: number;
  selectedMode: MixerMode;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const modeInfo = MODE_INFO[selectedMode];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: '#1a1a1f',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 16,
          padding: '32px',
          maxWidth: 480,
          width: '90%',
        }}
      >
        <Stack gap={20}>
          <Group gap={12}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: selectedMode === 'normal'
                  ? 'rgba(34,197,94,0.15)'
                  : selectedMode === 'hardcore'
                  ? 'rgba(234,179,8,0.15)'
                  : 'rgba(239,68,68,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconFlame size={20} color={
                selectedMode === 'normal'
                  ? 'var(--mantine-color-green-4)'
                  : selectedMode === 'hardcore'
                  ? 'var(--mantine-color-yellow-4)'
                  : 'var(--mantine-color-red-4)'
              } />
            </div>
            <div>
              <Text fw={600} c="white" size="lg">
                Mixer Mode — {modeInfo.label}
              </Text>
              <Text c="gray.5" size="sm">
                {timeLimit} min timer + {modeInfo.description}
              </Text>
            </div>
          </Group>

          <div
            style={{
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 10,
              padding: '16px',
            }}
          >
            <Text c="gray.4" size="sm" mb={8} fw={500}>
              How it works:
            </Text>
            <Stack gap={6}>
              <Text c="gray.5" size="xs">1. Verify your device (creates ~/.mixer_id)</Text>
              <Text c="gray.5" size="xs">2. Timer starts — solve before it hits zero</Text>
              <Text c="gray.5" size="xs">3. Fail = banned until you run the consequence</Text>
              <Text c="gray.5" size="xs">4. Or refer a friend to escape the ban</Text>
              <Text c="gray.5" size="xs">5. Win = all past consequences cleared</Text>
            </Stack>
          </div>

          {selectedMode === 'brick' && (
            <div
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 8,
                padding: '12px',
              }}
            >
              <Text c="red.3" size="xs" fw={500}>
                ⚠️ Brick mode will hang your system. Restart required. Your data is safe.
              </Text>
            </div>
          )}

          <Group gap={12}>
            <Button
              leftSection={<IconCheck size={14} />}
              variant="light"
              color={selectedMode === 'normal' ? 'green' : selectedMode === 'hardcore' ? 'yellow' : 'red'}
              onClick={onAccept}
              style={{ flex: 1 }}
            >
              Verify &amp; Start
            </Button>
            <Button
              leftSection={<IconX size={14} />}
              variant="subtle"
              color="gray"
              onClick={onDecline}
            >
              Cancel
            </Button>
          </Group>
        </Stack>
      </div>
    </div>
  );
}
