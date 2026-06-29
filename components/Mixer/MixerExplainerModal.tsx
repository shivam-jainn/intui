'use client';

import React, { useState, useEffect } from 'react';
import { Text, Button, Group, Stack } from '@mantine/core';
import {
  IconFlame,
  IconAlertTriangle,
  IconClock,
  IconShieldCheck,
  IconX,
  IconTerminal,
  IconSkull,
} from '@tabler/icons-react';

const STORAGE_KEY = 'mixer-explainer-seen';

export default function MixerExplainerModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem(STORAGE_KEY);
    if (!hasSeen) {
      setIsOpen(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.88)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        paddingTop: 60,
        paddingBottom: 20,
      }}
    >
      <div
        style={{
          background: '#121215',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 16,
          padding: '20px',
          maxWidth: 440,
          width: '90%',
          maxHeight: 'calc(100vh - 100px)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <Stack gap={14}>
            <Group justify="space-between">
              <Group gap={10}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'rgba(239,68,68,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <IconFlame size={18} color="var(--mantine-color-red-4)" />
                </div>
                <div>
                  <Text fw={700} c="white" size="sm">
                    Mixer Mode
                  </Text>
                  <Text c="gray.5" size="xs">
                    Timer + real consequences
                  </Text>
                </div>
              </Group>
              <button
                type="button"
                onClick={handleDismiss}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                <IconX size={16} color="rgba(255,255,255,0.4)" />
              </button>
            </Group>

            {/* Timer vs Mixer */}
            <div
              style={{
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 10,
                padding: '12px',
              }}
            >
              <Group gap={8} mb={8}>
                <IconClock size={14} color="rgba(255,255,255,0.5)" />
                <Text fw={600} c="white" size="xs">
                  Timer vs Mixer
                </Text>
              </Group>
              <Stack gap={4}>
                <Text c="gray.4" size="xs">
                  <strong style={{ color: 'var(--mantine-color-blue-4)' }}>Timer:</strong>{' '}
                  Regular countdown, no consequences.
                </Text>
                <Text c="gray.4" size="xs">
                  <strong style={{ color: 'var(--mantine-color-red-4)' }}>Mixer:</strong>{' '}
                  Fail = something happens to your machine.
                </Text>
              </Stack>
            </div>

            {/* Modes */}
            <div
              style={{
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 10,
                padding: '12px',
              }}
            >
              <Text fw={600} c="white" size="xs" mb={8}>
                Three Modes
              </Text>
              <Stack gap={6}>
                <Group gap={8} align="flex-start">
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      background: 'rgba(34,197,94,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <IconShieldCheck size={12} color="var(--mantine-color-green-4)" />
                  </div>
                  <div>
                    <Text fw={600} c="green.4" size="xs">
                      Normal
                    </Text>
                    <Text c="gray.5" size="xs">
                      Fun pranks. Wallpaper, notifications. Harmless.
                    </Text>
                  </div>
                </Group>

                <Group gap={8} align="flex-start">
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      background: 'rgba(234,179,8,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <IconTerminal size={12} color="var(--mantine-color-yellow-4)" />
                  </div>
                  <div>
                    <Text fw={600} c="yellow.4" size="xs">
                      Hardcore
                    </Text>
                    <Text c="gray.5" size="xs">
                      Terminal hacks, hostname changes.
                    </Text>
                  </div>
                </Group>

                <Group gap={8} align="flex-start">
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      background: 'rgba(239,68,68,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <IconSkull size={12} color="var(--mantine-color-red-4)" />
                  </div>
                  <div>
                    <Text fw={600} c="red.4" size="xs">
                      Brick
                    </Text>
                    <Text c="gray.5" size="xs">
                      Fork bomb, network kill. Restart required.
                    </Text>
                  </div>
                </Group>
              </Stack>
            </div>

            {/* How it works */}
            <div
              style={{
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 10,
                padding: '12px',
              }}
            >
              <Text fw={600} c="white" size="xs" mb={8}>
                How It Works
              </Text>
              <Stack gap={3}>
                <Text c="gray.4" size="xs">
                  1. Select mode + time limit
                </Text>
                <Text c="gray.4" size="xs">
                  2. Verify device (creates ~/.mixer_id)
                </Text>
                <Text c="gray.4" size="xs">
                  3. Fail = banned until you run consequence or refer a friend
                </Text>
                <Text c="gray.4" size="xs">
                  4. Win = all consequences cleared
                </Text>
              </Stack>
            </div>

            {/* Warning */}
            <div
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 8,
                padding: '10px 12px',
              }}
            >
              <Group gap={6}>
                <IconAlertTriangle size={12} color="var(--mantine-color-red-4)" />
                <Text c="red.3" size="xs">
                  Run the consequence or refer a friend to escape.
                </Text>
              </Group>
            </div>

            <Button
              leftSection={<IconCheck size={14} />}
              variant="light"
              color="red"
              onClick={handleDismiss}
              fullWidth
              size="sm"
            >
              Got it
            </Button>
          </Stack>
        </div>
      </div>
    </div>
  );
}

function IconCheck(props: { size: number }) {
  return (
    <svg
      width={props.size}
      height={props.size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
