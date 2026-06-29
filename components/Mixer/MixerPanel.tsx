'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Text,
  Button,
  Group,
  Stack,
  NumberInput,
  Divider,
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
} from '@tabler/icons-react';

type MixerMode = 'normal' | 'hardcore' | 'brick';

interface MixerPanelProps {
  questionId?: string;
  incidentId?: string;
  onTimerStart?: (seconds: number) => void;
  onTimerStop?: () => void;
  onTimeUp?: () => void;
  isTimerRunning?: boolean;
  showInline?: boolean;
  showToggle?: boolean;
  autoEnable?: boolean;
  isActive?: boolean;
}

type MixerState =
  | 'idle'
  | 'confirm'
  | 'verifying-device'
  | 'running'
  | 'failed'
  | 'consequence-shown'
  | 'ready'
  | 'banned';

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

export default function MixerPanel({
  questionId,
  incidentId,
  onTimerStart,
  onTimerStop,
  onTimeUp,
  isTimerRunning = false,
  showInline = false,
  showToggle = true,
  autoEnable = false,
  isActive,
}: MixerPanelProps) {
  const [state, setState] = useState<MixerState>('idle');
  const [timeLimit, setTimeLimit] = useState(10);
  const [selectedMode, setSelectedMode] = useState<MixerMode>('normal');
  const [remaining, setRemaining] = useState(0);
  const [consequence, setConsequence] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [verifyCommand, setVerifyCommand] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState(false);
  const hasAutoEnabled = useRef(false);

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

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/mixer/status');
        if (res.ok) {
          const data = await res.json();
          if (data.session?.status === 'banned') {
            setState('banned');
          }
        }
      } catch {
        // ignore
      }
    };
    checkStatus();
  }, []);

  // Auto-enable when prop changes to true
  useEffect(() => {
    if (autoEnable && state === 'idle' && !hasAutoEnabled.current) {
      hasAutoEnabled.current = true;
      setState('confirm');
    }
  }, [autoEnable, state]);

  // Timer countdown
  useEffect(() => {
    if (!isTimerRunning) return undefined;

    const interval = setInterval(() => {
      setRemaining((prev) => {
        const next = prev <= 1 ? 0 : prev - 1;
        if (next <= 0) {
          clearInterval(interval);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Handle timer expiry
  useEffect(() => {
    if (isTimerRunning && remaining === 0 && state === 'running') {
      setState('failed');
      onTimeUp?.();
    }
  }, [isTimerRunning, remaining, state, onTimeUp]);

  const handleToggle = () => {
    if (state === 'banned') return;
    if (state === 'idle') {
      setState('confirm');
    } else if (state === 'running') {
      setState('idle');
      setConsequence(null);
      setSessionId(null);
      setVerifyCommand(null);
      onTimerStop?.();
    }
  };

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
          setState('running');
          setRemaining(totalSeconds);
          onTimerStart?.(totalSeconds);
        } else {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
          const cmd = `curl -s ${appUrl}/shell/verify?session=${data.session.id} | bash`;
          setVerifyCommand(cmd);
          setState('verifying-device');
        }
      }
    } catch {
      // handle error
    }
  };

  const handleDecline = () => {
    setState('idle');
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
          setState('running');
          setRemaining(totalSeconds);
          onTimerStart?.(totalSeconds);
        } else {
          setVerifyError(true);
        }
      }
    } catch {
      setVerifyError(true);
    }
  };

  const handleShowConsequence = () => {
    setState('consequence-shown');
  };

  const handleReadyConfirm = async () => {
    if (sessionId) {
      await fetch('/api/mixer/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
    }
    setState('idle');
    setConsequence(null);
    setSessionId(null);
    setVerifyCommand(null);
    setRemaining(0);
    onTimerStop?.();
  };

  const handleRetry = () => {
    setState('confirm');
    setRemaining(0);
    setVerifyCommand(null);
    onTimerStop?.();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const isUrgent = remaining <= 60 && remaining > 0;
  const isCritical = remaining <= 30 && remaining > 0;
  const appUrl = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_APP_URL || window.location.origin) : '';
  const consequenceCommand = sessionId
    ? `curl -s ${appUrl}/shell/${consequence || 'wallpaper'}?session=${sessionId} | sudo bash`
    : '';

  if (state === 'banned') {
    return (
      <div
        style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 12,
          padding: '16px',
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

  if (state === 'ready') {
    return (
      <div
        style={{
          background: 'rgba(34,197,94,0.1)',
          border: '1px solid rgba(34,197,94,0.4)',
          borderRadius: 12,
          padding: '20px',
        }}
      >
        <Stack gap={16} align="center">
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'rgba(34,197,94,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconCheck size={24} color="var(--mantine-color-green-4)" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <Text fw={600} c="green.4" size="md">
              Challenge Complete
            </Text>
            <Text c="gray.5" size="sm" mt={4}>
              All consequences cleared. Nice work.
            </Text>
          </div>
          <Button
            variant="light"
            color="green"
            onClick={handleReadyConfirm}
            leftSection={<IconCheck size={14} />}
          >
            Done
          </Button>
        </Stack>
      </div>
    );
  }

  if (state === 'verifying-device') {
    const modeInfo = MODE_INFO[selectedMode];
    return (
      <div
        style={{
          background: 'rgba(99,102,241,0.1)',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: 12,
          padding: '20px',
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

  if (state === 'consequence-shown') {
    return (
      <div
        style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 12,
          padding: '20px',
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
            onClick={() => setState('idle')}
            leftSection={<IconCheck size={14} />}
            fullWidth
          >
            I ran it
          </Button>
        </Stack>
      </div>
    );
  }

  if (state === 'failed') {
    return (
      <div
        style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 12,
          padding: '20px',
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
            onClick={handleShowConsequence}
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
        background: state === 'running'
          ? 'rgba(239,68,68,0.15)'
          : 'rgba(255,255,255,0.04)',
        border: state === 'running'
          ? '2px solid rgba(239,68,68,0.6)'
          : '1px solid rgba(255,255,255,0.09)',
        borderRadius: 12,
        padding: '16px',
        transition: 'all 0.2s ease',
        boxShadow: state === 'running' ? '0 0 20px rgba(239,68,68,0.2)' : 'none',
      }}
    >
      <Stack gap={12}>
        <Group justify="space-between">
          <Group gap={10}>
            <IconFlame
              size={18}
              color={state === 'running' ? 'var(--mantine-color-red-4)' : 'rgba(255,255,255,0.4)'}
            />
            <div>
              <Text fw={600} c={state === 'running' ? 'red.4' : 'gray.3'} size="sm">
                Mixer Mode
              </Text>
              <Text c="gray.6" size="xs">
                {state === 'running'
                  ? `${MODE_INFO[selectedMode].label} mode — ${timeLimit} min`
                  : 'Timer + real consequences'}
              </Text>
            </div>
          </Group>

          {showToggle && (
            <button
              type="button"
              onClick={handleToggle}
              style={{
                width: 44,
                height: 24,
                borderRadius: 12,
                border: 'none',
                cursor: 'pointer',
                background: state === 'running'
                  ? 'var(--mantine-color-red-5)'
                  : 'rgba(255,255,255,0.15)',
                position: 'relative',
                transition: 'background 0.2s ease',
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: '#fff',
                  position: 'absolute',
                  top: 3,
                  left: state === 'running' ? 23 : 3,
                  transition: 'left 0.2s ease',
                }}
              />
            </button>
          )}
        </Group>

        {state === 'running' && (
          <>
            <Divider style={{ borderColor: 'rgba(239,68,68,0.3)' }} />
            <div
              style={{
                background: isCritical
                  ? 'rgba(239,68,68,0.25)'
                  : isUrgent
                  ? 'rgba(234,179,8,0.15)'
                  : 'rgba(239,68,68,0.12)',
                border: isCritical
                  ? '2px solid rgba(239,68,68,0.8)'
                  : isUrgent
                  ? '1px solid rgba(234,179,8,0.4)'
                  : '1px solid rgba(239,68,68,0.4)',
                borderRadius: 8,
                padding: '12px',
                textAlign: 'center',
              }}
            >
              <Group justify="center" gap={8}>
                {(isUrgent || !isCritical) && (
                  <IconAlertTriangle
                    size={14}
                    color={isCritical ? 'var(--mantine-color-red-4)' : isUrgent ? 'var(--mantine-color-yellow-4)' : 'var(--mantine-color-red-4)'}
                  />
                )}
                <Text
                  fw={700}
                  c={isCritical ? 'red.4' : isUrgent ? 'yellow.4' : 'red.3'}
                  style={{
                    fontSize: 24,
                    fontFamily: 'monospace',
                    letterSpacing: '0.05em',
                  }}
                >
                  {formatTime(remaining)}
                </Text>
              </Group>
              <Text
                size="xs"
                c="red.4"
                style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}
              >
                {isCritical ? 'Critical!' : isUrgent ? 'Running out!' : 'Time remaining'}
              </Text>
            </div>

            {consequence && (
              <div
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  border: '1px solid rgba(239,68,68,0.2)',
                }}
              >
                <Group gap={8}>
                  <IconTerminal size={14} color="var(--mantine-color-red-4)" />
                  <Text c="red.3" size="xs" style={{ fontFamily: 'monospace' }}>
                    Consequence: {consequence}.sh ({MODE_INFO[selectedMode].label} mode)
                  </Text>
                </Group>
              </div>
            )}
          </>
        )}

        {state === 'idle' && (
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
              onChange={(val) => setTimeLimit(Number(val) || 10)}
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

  if (showInline) {
    return (
      <>
        {panelContent}

        {state === 'confirm' && (
          <ConfirmModal
            timeLimit={timeLimit}
            selectedMode={selectedMode}
            onAccept={handleAccept}
            onDecline={handleDecline}
          />
        )}
      </>
    );
  }

  return (
    <>
      {panelContent}

      {state === 'confirm' && (
        <ConfirmModal
          timeLimit={timeLimit}
          selectedMode={selectedMode}
          onAccept={handleAccept}
          onDecline={handleDecline}
        />
      )}
    </>
  );
}

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
