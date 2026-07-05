'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { colors } from '@/lib/theme/colors';
import styles from './Timer.module.css';

export type TimerMode = 'timer' | 'mixer';
export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';
export type MixerDifficulty = 'easy' | 'medium' | 'hard';

export interface TimerProps {
  onTimerEnd?: () => void;
  onMixerStart?: (difficulty: MixerDifficulty, duration: number) => void;
}

export interface TimerHandle {
  getMixerRunId: () => string | null;
  submitMixerRun: () => Promise<void>;
}

function formatTime(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

const DIFF_HEX: Record<MixerDifficulty, string> = {
  easy: colors.primary[500],
  medium: colors.warning[500],
  hard: colors.danger[500],
};

const DIFF_BG: Record<MixerDifficulty, string> = {
  easy: 'rgba(32,201,151,0.10)',
  medium: 'rgba(252,196,25,0.10)',
  hard: 'rgba(250,82,82,0.10)',
};

const Timer = React.forwardRef<TimerHandle, TimerProps>(function Timer(
  { onTimerEnd, onMixerStart },
  ref
) {
  // ── State ─────────────────────────────────────────────────────
  const [mode, setMode] = React.useState<TimerMode>('timer');
  const [status, setStatus] = React.useState<TimerStatus>('idle');
  const [seconds, setSeconds] = React.useState(0);
  const [difficulty, setDifficulty] = React.useState<MixerDifficulty>('medium');
  const [inputMin, setInputMin] = React.useState(0);
  const [inputSec, setInputSec] = React.useState(0);
  const [stopwatch, setStopwatch] = React.useState(false);
  const [popup, setPopup] = React.useState<'config' | 'verify' | 'penalty' | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [runId, setRunId] = React.useState<string | null>(null);
  const [penaltyVerified, setPenaltyVerified] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);
  const [penaltyError, setPenaltyError] = React.useState<string | null>(null);
  const [verified, setVerified] = React.useState(false);
  const [showIntro, setShowIntro] = React.useState(false);

  const triggerRef = React.useRef<HTMLDivElement>(null);
  const [popupPos, setPopupPos] = React.useState({ top: 0, left: 0 });

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001';

  // ── Derived ───────────────────────────────────────────────────
  const isIdle = status === 'idle';
  const isFinished = status === 'finished';
  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isActive = isRunning || isPaused;
  const isLocked = isActive || isFinished;

  // ── Timer tick ────────────────────────────────────────────────
  React.useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      setSeconds((p) => {
        if (stopwatch) return p + 1;
        if (p <= 1) {
          setStatus('finished');
          onTimerEnd?.();
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning, stopwatch, onTimerEnd]);

  // ── Popup positioning ─────────────────────────────────────────
  React.useEffect(() => {
    if (popup !== 'config') return;
    const update = () => {
      if (triggerRef.current) {
        const r = triggerRef.current.getBoundingClientRect();
        setPopupPos({ top: r.bottom + 12, left: r.left });
      }
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [popup]);

  // ── Check local verification on mount ─────────────────────────
  React.useEffect(() => {
    const v = localStorage.getItem('intui_verified');
    setVerified(v === 'true');
    const seen = localStorage.getItem('intui_intro_seen');
    if (!seen) setShowIntro(true);
  }, []);

  // ── Actions ───────────────────────────────────────────────────
  const openConfig = () => {
    if (isLocked) return;
    setPopup(popup === 'config' ? null : 'config');
  };

  const switchMode = (m: TimerMode) => {
    if (isLocked) return;
    if (m === mode) {
      setPopup(popup === 'config' ? null : 'config');
      return;
    }
    setMode(m);
    setPopup('config');
  };

  const handleStart = () => {
    if (isPaused) {
      setStatus('running');
      setPopup(null);
      return;
    }
    const total = stopwatch ? 0 : inputMin * 60 + inputSec;
    if (!stopwatch && total === 0) return;

    if (mode === 'mixer' && !verified) {
      setPopup('verify');
      return;
    }

    setSeconds(total);
    setStatus('running');
    setPopup(null);

    if (mode === 'mixer') {
      startMixerRun(total);
    }
  };

  const startMixerRun = async (duration: number) => {
    try {
      const res = await fetch('/api/mixermode/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'local', difficulty, duration }),
      });
      const data = await res.json();
      if (data.runId) {
        setRunId(data.runId);
        onMixerStart?.(difficulty, duration);
      }
    } catch (e) {
      console.error('Failed to start mixer run', e);
    }
  };

  const submitMixerRun = async () => {
    if (!runId) return;
    try {
      await fetch('/api/mixermode/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId, userId: 'local-user' }),
      });
    } catch (e) {
      console.error('Failed to submit mixer run', e);
    }
  };

  React.useImperativeHandle(ref, () => ({
    getMixerRunId: () => runId,
    submitMixerRun,
  }));

  const handlePause = () => setStatus('paused');

  const handleReset = () => {
    setStatus('idle');
    setSeconds(0);
    setInputMin(0);
    setInputSec(0);
    setStopwatch(false);
    setRunId(null);
    setPenaltyVerified(false);
    setPopup(null);
  };

  const copyCurl = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const verifyCurl = `curl -sL "${baseUrl}/api/mixermode/verify.sh?userId=local" | bash`;

  const penaltyCurl = runId
    ? `curl -sL "${baseUrl}/api/mixermode/verify.sh?difficulty=${difficulty}&runid=${runId}" | bash`
    : `curl -sL "${baseUrl}/api/mixermode/verify.sh?difficulty=${difficulty}" | bash`;

  const verifyDevice = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/mixermode/verify?userId=local`);
      const data = await res.json();
      if (data.verified) {
        setVerified(true);
        localStorage.setItem('intui_verified', 'true');
      } else {
        alert('Device not verified yet. Please run the script first.');
      }
    } catch {
      alert('Failed to verify. Please try again.');
    }
  };

  const checkPenalty = async () => {
    setVerifying(true);
    setPenaltyError(null);
    try {
      if (runId) {
        const res = await fetch(`/api/mixermode/penalty-verify/${runId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uuid: 'client-check' }),
        });
        const data = await res.json();
        if (data.verified) {
          setPenaltyVerified(true);
          setTimeout(() => {
            setPopup(null);
            setPenaltyVerified(false);
            handleReset();
          }, 1500);
          return;
        }
        setPenaltyError(data.error || 'Not yet verified — run the script first.');
      }
      setVerifying(false);
    } catch {
      setPenaltyError('Network error — is the server running?');
      setVerifying(false);
    }
  };

  // ── Trigger penalty popup ─────────────────────────────────────
  React.useEffect(() => {
    if (isFinished && mode === 'mixer') {
      setPopup('penalty');
    }
  }, [isFinished, mode]);

  // ── Timer Bar ─────────────────────────────────────────────────
  const barClass = `${styles.bar} ${mode === 'timer' && isActive ? styles.barActiveTimer : ''} ${mode === 'mixer' && isActive ? styles.barActiveMixer : ''}`;

  const bar = (
    <div ref={triggerRef} className={barClass}>
      <div className={styles.modeTabs}>
        <button
          className={`${styles.modeTab} ${mode === 'timer' ? styles.modeTabActiveTimer : ''}`}
          onClick={() => switchMode('timer')}
          disabled={isLocked}
        >
          TIMER
        </button>
        <div className={styles.modeDivider} />
        <button
          className={`${styles.modeTab} ${mode === 'mixer' ? styles.modeTabActiveMixer : ''}`}
          onClick={() => switchMode('mixer')}
          disabled={isLocked}
        >
          MIXER
        </button>
        <div className={styles.modeDivider} />
        <button
          className={`${isFinished ? styles.timeFinished : isActive ? styles.timeActive : styles.timeIdle}`}
          onClick={openConfig}
          disabled={isLocked}
        >
          {formatTime(seconds)}
        </button>
      </div>

      {isActive && (
        <div className={styles.actions}>
          {isRunning && (
            <button className={styles.actionBtn} onClick={handlePause}>
              PAUSE
            </button>
          )}
          {isPaused && (
            <button className={styles.actionBtn} onClick={handleStart} style={{ color: '#fff' }}>
              RESUME
            </button>
          )}
          <button className={styles.actionBtn} onClick={handleReset}>
            RESET
          </button>
        </div>
      )}
    </div>
  );

  // ── Config Popup (positioned near trigger bar) ────────────────
  const configPopup =
    popup === 'config' && typeof document !== 'undefined'
      ? createPortal(
          <div className={styles.configOverlay} onClick={() => setPopup(null)}>
            <div
              className={styles.glassModalConfig}
              style={{ top: popupPos.top, left: popupPos.left }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
                {mode === 'timer' ? 'Timer Setup' : 'Mixer Setup'}
              </div>

              {mode === 'timer' && (
                <div className={styles.toggleGroup}>
                  <button
                    className={`${styles.toggleBtn} ${!stopwatch ? styles.toggleBtnActive : ''}`}
                    onClick={() => setStopwatch(false)}
                  >
                    Countdown
                  </button>
                  <button
                    className={`${styles.toggleBtn} ${stopwatch ? styles.toggleBtnActive : ''}`}
                    onClick={() => {
                      setStopwatch(true);
                      setPopup(null);
                      setStatus('running');
                      setSeconds(0);
                    }}
                  >
                    Stopwatch
                  </button>
                </div>
              )}

              {mode === 'mixer' && (
                <div className={styles.diffGrid}>
                  {(['easy', 'medium', 'hard'] as MixerDifficulty[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={styles.diffBtn}
                      style={
                        difficulty === d
                          ? { borderColor: DIFF_HEX[d], background: DIFF_BG[d], color: DIFF_HEX[d] }
                          : {}
                      }
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}

              {!stopwatch && (
                <div className={styles.timeRow}>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={inputMin}
                    onChange={(e) => setInputMin(Math.max(0, +e.target.value))}
                    className={`${styles.numInput} ${mode === 'mixer' ? styles.numInputMixer : ''}`}
                  />
                  <span className={styles.colon}>:</span>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={inputSec}
                    onChange={(e) => setInputSec(Math.min(59, Math.max(0, +e.target.value)))}
                    className={`${styles.numInput} ${mode === 'mixer' ? styles.numInputMixer : ''}`}
                  />
                </div>
              )}

              <button
                onClick={handleStart}
                className={mode === 'mixer' ? styles.glassBtnDanger : styles.glassBtn}
                disabled={!stopwatch && inputMin === 0 && inputSec === 0}
              >
                {stopwatch ? 'START STOPWATCH' : 'START'}
              </button>
            </div>
          </div>,
          document.body
        )
      : null;

  // ── Verify Modal (centered, blocking) ─────────────────────────
  const verifyModal =
    popup === 'verify' && typeof document !== 'undefined'
      ? createPortal(
          <div className={styles.glassOverlay} onClick={() => setPopup(null)}>
            <div className={styles.glassModal} onClick={(e) => e.stopPropagation()}>
              <div>
                <h2 className={styles.modalTitle}>Device Verification</h2>
                <p className={styles.modalDesc} style={{ marginTop: 8 }}>
                  Run this once to register your device for Mixer mode.
                </p>
              </div>

              <div className={styles.codeWrapper}>
                <span className={styles.codeLabel}># Run in terminal:</span>
                <div className={styles.codeBlock}>{verifyCurl}</div>
                <button
                  className={copied ? styles.copyBtnSuccess : styles.copyBtn}
                  onClick={() => copyCurl(verifyCurl)}
                >
                  {copied ? 'COPIED!' : 'COPY'}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button className={styles.glassBtn} onClick={verifyDevice}>
                  I'VE RUN IT
                </button>
                <button className={styles.glassBtnGhost} onClick={() => setPopup(null)}>
                  CANCEL
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  // ── Penalty Modal (centered, blocking, can't close) ───────────
  const penaltyModal =
    popup === 'penalty' && typeof document !== 'undefined'
      ? createPortal(
          <div className={styles.glassOverlay}>
            <div className={styles.glassModal}>
              {penaltyVerified ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div className={styles.iconSuccess}>✓</div>
                  <h3 className={styles.modalTitle} style={{ color: '#20c997', marginBottom: 8 }}>
                    Penalty Accepted
                  </h3>
                  <p className={styles.modalDesc}>You may now continue coding.</p>
                </div>
              ) : (
                <>
                  <div style={{ textAlign: 'center' }}>
                    <div className={styles.iconDanger}>⏱</div>
                    <h3 className={styles.modalTitle} style={{ marginBottom: 8 }}>Time's Up</h3>
                    <p className={styles.modalDesc}>
                      You failed to submit before the timer ended.
                      <br />
                      Accept your <span style={{ color: DIFF_HEX[difficulty], fontWeight: 700 }}>{difficulty}</span> penalty to continue.
                    </p>
                  </div>

                  <div className={styles.stepFlow}>
                    {/* Step 1: Device Verification */}
                    <div className={`${styles.step} ${verified ? styles.stepDone : styles.stepActive}`}>
                      <div className={`${styles.stepNum} ${verified ? styles.stepNumDone : styles.stepNumActive}`}>
                        {verified ? '✓' : '1'}
                      </div>
                      <div className={styles.stepContent}>
                        <div className={styles.stepTitle}>Verify Device</div>
                        {!verified ? (
                          <>
                            <div className={styles.stepDesc}>
                              Run this once to register your device for Mixer mode.
                            </div>
                            <div className={styles.codeWrapper} style={{ padding: 12, marginBottom: 12 }}>
                              <span className={styles.codeLabel} style={{ fontSize: 10 }}># Run in terminal:</span>
                              <div className={styles.codeBlock} style={{ fontSize: 11 }}>{verifyCurl}</div>
                              <button
                                className={copied ? styles.copyBtnSuccess : styles.copyBtn}
                                style={{ top: 8, right: 8, padding: '2px 8px' }}
                                onClick={() => copyCurl(verifyCurl)}
                              >
                                {copied ? 'COPIED' : 'COPY'}
                              </button>
                            </div>
                            <button className={styles.glassBtnGhost} style={{ padding: '8px' }} onClick={verifyDevice}>
                              I'VE RUN IT
                            </button>
                          </>
                        ) : (
                          <div style={{ fontSize: 13, color: '#38d9a9', fontWeight: 600 }}>
                            ✓ Device verified
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Step 2: Accept Penalty */}
                    <div className={`${styles.step} ${verified ? styles.stepActive : ''}`}>
                      <div className={`${styles.stepNum} ${verified ? styles.stepNumActive : ''}`}>2</div>
                      <div className={styles.stepContent}>
                        <div className={styles.stepTitle}>Accept Penalty</div>
                        {verified ? (
                          <>
                            <div className={styles.stepDesc}>
                              Accept the {difficulty} penalty by running the script below:
                            </div>
                            <div className={styles.codeWrapper} style={{ padding: 12 }}>
                              <span className={styles.codeLabel} style={{ fontSize: 10 }}># RUN IN YOUR TERMINAL:</span>
                              <div className={styles.codeBlock} style={{ fontSize: 11 }}>{penaltyCurl}</div>
                              <button
                                className={copied ? styles.copyBtnSuccess : styles.copyBtn}
                                style={{ top: 8, right: 8, padding: '2px 8px' }}
                                onClick={() => copyCurl(penaltyCurl)}
                              >
                                {copied ? 'COPIED' : 'COPY'}
                              </button>
                            </div>
                          </>
                        ) : (
                          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                            Complete device verification first.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {penaltyError && <div className={styles.errorBox}>{penaltyError}</div>}

                  {verified && (
                    <div style={{ marginTop: 8 }}>
                      <button className={styles.glassBtnDanger} onClick={checkPenalty} disabled={verifying}>
                        {verifying ? 'CHECKING...' : 'VERIFY MY PENALTY'}
                      </button>
                      <p className={styles.modalDesc} style={{ fontSize: 12, marginTop: 12 }}>
                        Run the script above, then click verify.<br/>
                        This screen won't close until your penalty is confirmed.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>,
          document.body
        )
      : null;

  // ── Intro Modal (centered, blocking) ──────────────────────────
  const introModal =
    showIntro && typeof document !== 'undefined'
      ? createPortal(
          <div className={styles.glassOverlay}>
            <div className={styles.glassModal} style={{ maxWidth: 500 }}>
              <div>
                <h2 className={styles.modalTitle}>Welcome to Intui</h2>
                <p className={styles.modalDesc} style={{ marginTop: 8 }}>
                  Two modes to sharpen your skills.
                </p>
              </div>

              <div className={styles.modeCardTimer}>
                <div className={styles.modeHeader}>
                  <div className={styles.iconBoxTimer}>⏱</div>
                  <div>
                    <div className={styles.modeTitle} style={{ color: '#20c997' }}>Timer</div>
                    <div className={styles.modalDesc} style={{ textAlign: 'left', fontSize: 13 }}>
                      Set a countdown or run a stopwatch. Track how fast you solve problems. No consequences — just you vs the clock.
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.modeCardMixer}>
                <div className={styles.modeHeader} style={{ marginBottom: 16 }}>
                  <div className={styles.iconBoxMixer}>🔥</div>
                  <div>
                    <div className={styles.modeTitle} style={{ color: '#ff6b6b' }}>Mixer</div>
                    <div className={styles.modalDesc} style={{ textAlign: 'left', fontSize: 13 }}>
                      Timed challenge with real stakes. Pick a difficulty, beat the clock. Fail to submit in time and you must accept a penalty to keep coding.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { color: colors.primary[500], bg: 'rgba(32,201,151,0.08)', label: 'Easy', desc: 'Your desktop wallpaper gets changed to a random image. Harmless but annoying.' },
                    { color: colors.warning[500], bg: 'rgba(252,196,25,0.08)', label: 'Medium', desc: 'Prank aliases injected into your shell config. Commands like ls, cd, rm behave differently.' },
                    { color: colors.danger[500], bg: 'rgba(250,82,82,0.08)', label: 'Hard', desc: '5000 dummy files, folder maze on desktop, rickroll tabs, notification spam, and chaos.' },
                  ].map((item) => (
                    <div key={item.label} className={styles.diffRow} style={{ background: item.bg, borderColor: `${item.color}20` }}>
                      <div className={styles.diffDot} style={{ color: item.color, background: item.color }} />
                      <div className={styles.diffText}>
                        <span className={styles.diffLabel} style={{ color: item.color }}>{item.label}</span>
                        {item.desc}
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.modalDesc} style={{ fontSize: 12, marginTop: 16 }}>
                  First use requires one-time device verification via terminal.<br />
                  Skip a penalty? You get shadowbanned. Only a friend's referral can unlock your account.
                </div>
              </div>

              <button
                className={styles.glassBtn}
                onClick={() => {
                  localStorage.setItem('intui_intro_seen', 'true');
                  setShowIntro(false);
                }}
              >
                GOT IT
              </button>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      {bar}
      {configPopup}
      {verifyModal}
      {penaltyModal}
      {introModal}
    </>
  );
});

export default Timer;
