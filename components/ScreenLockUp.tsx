'use client';

import React, { useEffect, useCallback } from 'react';
import { useAtom } from 'jotai';
import { screenLockupAtom, lockSessionIdAtom, lockConsequenceAtom } from '@/contexts/GlobalContext';
import { useAuth } from '@/lib/auth-client';
import { t } from '@/lib/incident-theme';
import { IconAlertTriangle, IconFlame } from '@tabler/icons-react';

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

export default function ScreenLockUp() {
  const [isLocked, setScreenLockup] = useAtom(screenLockupAtom);
  const [sessionId, setSessionId] = useAtom(lockSessionIdAtom);
  const [consequence, setConsequence] = useAtom(lockConsequenceAtom);

  const { user } = useAuth();
  const userId = user?.id || '';

  // Auto-dismiss if user already cleared this lock
  useEffect(() => {
    if (!isLocked || !userId) return;
    const key = `mixer-cleared-${simpleHash(userId)}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed === simpleHash('yes')) {
          setScreenLockup(false);
          setSessionId('');
          setConsequence('');
        }
      } catch {
        // ignore
      }
    }
  }, [isLocked, userId, setScreenLockup, setSessionId, setConsequence]);

  const handleRanIt = useCallback(async () => {
    if (sessionId) {
      try {
        await fetch('/api/mixer/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
      } catch {
        // proceed anyway
      }
    }

    // Store cleared status in localStorage
    if (userId) {
      const key = `mixer-cleared-${simpleHash(userId)}`;
      localStorage.setItem(key, JSON.stringify(simpleHash('yes')));
    }

    setScreenLockup(false);
    setSessionId('');
    setConsequence('');
  }, [sessionId, userId, setScreenLockup, setSessionId, setConsequence]);

  if (!isLocked) return null;

  const appUrl = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_APP_URL || window.location.origin) : '';
  const consequenceCommand = sessionId
    ? `curl -s ${appUrl}/shell/${consequence || 'wallpaper'}?session=${sessionId} | sudo bash`
    : '';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(7,11,20,0.92)',
        backdropFilter: 'blur(12px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fade-in 0.3s ease-out',
      }}
    >
      <div
        style={{
          background: 'rgba(12,18,36,0.98)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 16,
          padding: '32px 40px',
          maxWidth: 480,
          width: '90%',
          textAlign: 'center',
          animation: 'scale-in 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <IconFlame size={28} color="#ef4444" />
        </div>

        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            fontFamily: t.font.mono,
            color: '#ef4444',
            letterSpacing: '0.04em',
            marginBottom: 8,
          }}
        >
          MIXER MODE — TIME&apos;S UP!
        </div>

        <div
          style={{
            fontSize: t.size.md,
            color: t.textMuted,
            marginBottom: 20,
            lineHeight: 1.6,
          }}
        >
          You failed the challenge. Run this consequence command to clear your ban:
        </div>

        {consequenceCommand && (
          <div
            style={{
              background: '#0d0d0f',
              borderRadius: 8,
              padding: '12px 16px',
              fontFamily: t.font.mono,
              fontSize: 11,
              color: '#ef4444',
              wordBreak: 'break-all',
              cursor: 'pointer',
              position: 'relative',
              marginBottom: 20,
              textAlign: 'left',
              border: '1px solid rgba(239,68,68,0.2)',
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
        )}

        <div
          style={{
            fontSize: t.size.sm,
            color: t.textDim,
            marginBottom: 24,
            lineHeight: 1.6,
          }}
        >
          This will apply a consequence to your machine.
        </div>

        <button
          type="button"
          onClick={handleRanIt}
          style={{
            width: '100%',
            padding: '10px 0',
            borderRadius: t.radius.md,
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.4)',
            color: '#ef4444',
            fontFamily: t.font.mono,
            fontSize: t.size.lg,
            fontWeight: 700,
            cursor: 'pointer',
            transition: `background ${t.transition.fast}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = 'rgba(239,68,68,0.25)')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = 'rgba(239,68,68,0.15)')
          }
        >
          <IconAlertTriangle size={16} />
          I ran it
        </button>
      </div>

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}
