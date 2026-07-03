import React from "react";
import { createPortal } from "react-dom";
import { colors } from "@/lib/theme/colors";

export type TimerMode = "timer" | "mixer";
export type TimerStatus = "idle" | "running" | "paused" | "finished";
export type MixerDifficulty = "easy" | "medium" | "hard";

export interface TimerProps {
  onTimerEnd?: () => void;
  onMixerStart?: (difficulty: MixerDifficulty, duration: number) => void;
  questionSlug?: string;
}

export interface TimerHandle {
  getMixerRunId: () => string | null;
  submitMixerRun: () => Promise<void>;
}

function formatTime(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

const DIFF_HEX: Record<MixerDifficulty, string> = {
  easy: colors.primary[500],
  medium: colors.warning[500],
  hard: colors.danger[500],
};
const DIFF_BG: Record<MixerDifficulty, string> = {
  easy: "rgba(32,201,151,0.10)",
  medium: "rgba(252,196,25,0.10)",
  hard: "rgba(250,82,82,0.10)",
};

const Timer = React.forwardRef<TimerHandle, TimerProps>(function Timer(
  { onTimerEnd, onMixerStart },
  ref
) {
  // ── State ─────────────────────────────────────────────────────
  const [mode, setMode] = React.useState<TimerMode>("timer");
  const [status, setStatus] = React.useState<TimerStatus>("idle");
  const [seconds, setSeconds] = React.useState(0);
  const [difficulty, setDifficulty] = React.useState<MixerDifficulty>("medium");
  const [inputMin, setInputMin] = React.useState(0);
  const [inputSec, setInputSec] = React.useState(0);
  const [stopwatch, setStopwatch] = React.useState(false);
  const [popup, setPopup] = React.useState<"config" | "verify" | "penalty" | null>(
    "config"
  );
  const [copied, setCopied] = React.useState(false);
  const [runId, setRunId] = React.useState<string | null>(null);
  const [penaltyVerified, setPenaltyVerified] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);
  const [verified, setVerified] = React.useState(false);

  const triggerRef = React.useRef<HTMLDivElement>(null);
  const [popupPos, setPopupPos] = React.useState({ top: 0, left: 0 });

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3001";

  // ── Derived ───────────────────────────────────────────────────
  const isIdle = status === "idle";
  const isFinished = status === "finished";
  const isRunning = status === "running";
  const isPaused = status === "paused";
  const isActive = isRunning || isPaused;
  const isLocked = isActive || isFinished; // lock mode switching

  // ── Timer tick ────────────────────────────────────────────────
  React.useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      setSeconds((p) => {
        if (stopwatch) return p + 1;
        if (p <= 1) {
          setStatus("finished");
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
    if (!popup) return;
    const update = () => {
      if (triggerRef.current) {
        const r = triggerRef.current.getBoundingClientRect();
        setPopupPos({ top: r.bottom + 8, left: r.left });
      }
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [popup]);

  // ── Check local verification on mount ─────────────────────────
  React.useEffect(() => {
    const v = localStorage.getItem("intui_verified");
    setVerified(v === "true");
    const seen = localStorage.getItem("intui_intro_seen");
    if (!seen) setShowIntro(true);
  }, []);

  const [showIntro, setShowIntro] = React.useState(false);

  // ── Actions ───────────────────────────────────────────────────
  const openConfig = () => {
    if (isLocked) return;
    setPopup("config");
  };

  const switchMode = (m: TimerMode) => {
    if (isLocked || m === mode) return;
    setMode(m);
    setPopup("config");
  };

  const handleStart = () => {
    if (isPaused) {
      setStatus("running");
      setPopup(null);
      return;
    }
    const total = stopwatch ? 0 : inputMin * 60 + inputSec;
    if (!stopwatch && total === 0) return;

    if (mode === "mixer" && !verified) {
      setPopup("verify");
      return;
    }

    setSeconds(total);
    setStatus("running");
    setPopup(null);

    if (mode === "mixer") {
      startMixerRun(total);
    }
  };

  const startMixerRun = async (duration: number) => {
    try {
      const res = await fetch("/api/mixermode/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "local", difficulty, duration }),
      });
      const data = await res.json();
      if (data.runId) {
        setRunId(data.runId);
        onMixerStart?.(difficulty, duration);
      }
    } catch (e) {
      console.error("Failed to start mixer run", e);
    }
  };

  const submitMixerRun = async () => {
    if (!runId) return;
    try {
      await fetch("/api/mixermode/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId, userId: "local-user" }),
      });
    } catch (e) {
      console.error("Failed to submit mixer run", e);
    }
  };

  React.useImperativeHandle(ref, () => ({
    getMixerRunId: () => runId,
    submitMixerRun,
  }));

  const handlePause = () => setStatus("paused");

  const handleReset = () => {
    setStatus("idle");
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

  // ── Colors ────────────────────────────────────────────────────
  const timerColor = isFinished
    ? colors.danger[500]
    : isActive
      ? colors.text.primary
      : colors.text.muted;

  const timerBg = mode === "timer" ? colors.glass.timer : colors.glass.mixer;
  const timerBorder =
    mode === "timer" ? colors.glass.timerBorder : colors.glass.mixerBorder;
  const timerFg = mode === "timer" ? colors.primary[400] : colors.danger[400];

  // ── Bar ───────────────────────────────────────────────────────
  const bar = (
    <div
      ref={triggerRef}
      style={{ display: "flex", alignItems: "center", gap: 10 }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          borderRadius: 12,
          background: colors.surface.default,
          border: `1px solid ${colors.border.subtle}`,
          height: 38,
          overflow: "hidden",
        }}
      >
        {/* Timer */}
        <button
          onClick={() => switchMode("timer")}
          disabled={isLocked}
          style={{
            padding: "0 16px",
            height: "100%",
            border: "none",
            background: mode === "timer" ? timerBg : "transparent",
            color: mode === "timer" ? timerFg : colors.text.muted,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 0.3,
            cursor: isLocked ? "default" : "pointer",
            opacity: isLocked && mode !== "timer" ? 0.4 : 1,
            transition: "all 0.2s ease",
          }}
        >
          Timer
        </button>

        {/* Mixer */}
        <button
          onClick={() => switchMode("mixer")}
          disabled={isLocked}
          style={{
            padding: "0 16px",
            height: "100%",
            border: "none",
            background: mode === "mixer" ? timerBg : "transparent",
            color: mode === "mixer" ? timerFg : colors.text.muted,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 0.3,
            cursor: isLocked ? "default" : "pointer",
            opacity: isLocked && mode !== "mixer" ? 0.4 : 1,
            transition: "all 0.2s ease",
          }}
        >
          Mixer
        </button>

        {/* Divider */}
        <div
          style={{
            width: 1,
            height: 18,
            background: colors.border.subtle,
          }}
        />

        {/* Time */}
        <button
          onClick={openConfig}
          style={{
            padding: "0 14px",
            height: "100%",
            border: "none",
            background: "transparent",
            color: timerColor,
            fontSize: 15,
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
            cursor: isLocked ? "default" : "pointer",
            letterSpacing: 1,
            fontFamily: "SF Mono, Menlo, Consolas, monospace",
          }}
        >
          {formatTime(seconds)}
        </button>
      </div>

      {/* Action buttons */}
      {isActive && (
        <div style={{ display: "flex", gap: 6 }}>
          {isRunning && (
            <Btn
              label="Pause"
              color={colors.warning[500]}
              bg="rgba(252,196,25,0.10)"
              onClick={handlePause}
            />
          )}
          {isPaused && (
            <Btn
              label="Resume"
              color={colors.primary[500]}
              bg="rgba(32,201,151,0.10)"
              onClick={handleStart}
            />
          )}
          <Btn
            label="Reset"
            color={colors.danger[500]}
            bg="rgba(250,82,82,0.10)"
            onClick={handleReset}
          />
        </div>
      )}
    </div>
  );

  // ── Shared popup styles ───────────────────────────────────────
  const popupStyle: React.CSSProperties = {
    position: "fixed",
    top: popupPos.top,
    left: popupPos.left,
    zIndex: 9999,
    width: 280,
    borderRadius: 14,
    background: colors.bg.raised,
    border: `1px solid ${colors.border.default}`,
    boxShadow: `0 12px 40px rgba(0,0,0,0.55), 0 0 0 1px ${colors.border.subtle}`,
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 14,
    color: colors.text.primary,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  };

  const inputStyle: React.CSSProperties = {
    width: 56,
    height: 42,
    padding: "0 6px",
    borderRadius: 10,
    border: `1px solid ${colors.border.default}`,
    background: colors.bg.overlay,
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 600,
    textAlign: "center",
    outline: "none",
    fontFamily: "SF Mono, Menlo, Consolas, monospace",
  };

  // ── Config Popup ──────────────────────────────────────────────
  const configPopup =
    popup === "config"
      ? createPortal(
          <div style={popupStyle} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase" as const,
                letterSpacing: 1,
                color: colors.text.muted,
              }}
            >
              {mode === "timer" ? "Timer Setup" : "Mixer Setup"}
            </div>

            {mode === "timer" && (
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  background: colors.bg.overlay,
                  borderRadius: 10,
                  padding: 4,
                }}
              >
                <Tab
                  active={!stopwatch}
                  label="Countdown"
                  onClick={() => setStopwatch(false)}
                />
                <Tab
                  active={stopwatch}
                  label="Stopwatch"
                  onClick={() => {
                    setStopwatch(true);
                    setPopup(null);
                    setStatus("running");
                    setSeconds(0);
                  }}
                />
              </div>
            )}

            {mode === "mixer" && (
              <div style={{ display: "flex", gap: 8 }}>
                {(["easy", "medium", "hard"] as MixerDifficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    style={{
                      flex: 1,
                      padding: "10px 0",
                      borderRadius: 10,
                      border:
                        difficulty === d
                          ? `1.5px solid ${DIFF_HEX[d]}`
                          : `1.5px solid ${colors.border.default}`,
                      background: difficulty === d ? DIFF_BG[d] : "transparent",
                      color: difficulty === d ? DIFF_HEX[d] : colors.text.muted,
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: "uppercase" as const,
                      letterSpacing: 0.3,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}

            {!stopwatch && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={inputMin}
                  onChange={(e) => setInputMin(Math.max(0, +e.target.value))}
                  style={inputStyle}
                />
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: colors.text.muted,
                    fontFamily: "SF Mono, Menlo, Consolas, monospace",
                  }}
                >
                  :
                </span>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={inputSec}
                  onChange={(e) =>
                    setInputSec(Math.min(59, Math.max(0, +e.target.value)))
                  }
                  style={inputStyle}
                />
              </div>
            )}

            <button
              onClick={handleStart}
              disabled={!stopwatch && inputMin === 0 && inputSec === 0}
              style={{
                padding: "11px 0",
                borderRadius: 10,
                border: "none",
                background:
                  !stopwatch && inputMin === 0 && inputSec === 0
                    ? colors.surface.hover
                    : mode === "timer"
                      ? colors.primary[600]
                      : colors.danger[600],
                color:
                  !stopwatch && inputMin === 0 && inputSec === 0
                    ? colors.text.muted
                    : "#fff",
                fontWeight: 600,
                fontSize: 13,
                cursor:
                  !stopwatch && inputMin === 0 && inputSec === 0
                    ? "not-allowed"
                    : "pointer",
                transition: "background 0.15s ease",
              }}
            >
              {stopwatch ? "Start Stopwatch" : "Start"}
            </button>

            <button
              onClick={() => setPopup(null)}
              style={{
                padding: "8px 0",
                borderRadius: 8,
                border: `1px solid ${colors.border.subtle}`,
                background: "transparent",
                color: colors.text.muted,
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>,
          document.body
        )
      : null;

  // ── Verify Popup ──────────────────────────────────────────────
  const verifyCurl = `curl -sL "${baseUrl}/api/mixermode/verify.sh" | bash`;

  const verifyPopup =
    popup === "verify"
      ? createPortal(
          <div style={popupStyle} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase" as const,
                letterSpacing: 1,
                color: colors.text.muted,
              }}
            >
              Device Verification
            </div>
            <div style={{ fontSize: 12, color: colors.text.secondary, lineHeight: 1.5 }}>
              Run this once to register your device for Mixer mode.
            </div>
            <div
              style={{
                background: colors.bg.overlay,
                borderRadius: 10,
                padding: 14,
                fontFamily: "SF Mono, Menlo, Consolas, monospace",
                fontSize: 11,
                color: colors.primary[300],
                wordBreak: "break-all",
                position: "relative",
                border: `1px solid ${colors.border.subtle}`,
                lineHeight: 1.6,
              }}
            >
              <div style={{ color: colors.text.muted, marginBottom: 6, fontSize: 10 }}>
                # Run in terminal:
              </div>
              <div>{verifyCurl}</div>
              <button
                onClick={() => copyCurl(verifyCurl)}
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  padding: "4px 10px",
                  borderRadius: 6,
                  border: `1px solid ${colors.border.default}`,
                  background: copied ? colors.success[900] : colors.surface.hover,
                  color: copied ? colors.success[400] : colors.text.secondary,
                  fontSize: 10,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <button
              onClick={() => {
                setVerified(true);
                localStorage.setItem("intui_verified", "true");
                setPopup("config");
              }}
              style={{
                padding: "11px 0",
                borderRadius: 10,
                border: "none",
                background: colors.primary[600],
                color: "#fff",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              I&apos;ve Run It
            </button>
            <button
              onClick={() => setPopup(null)}
              style={{
                padding: "8px 0",
                borderRadius: 8,
                border: `1px solid ${colors.border.subtle}`,
                background: "transparent",
                color: colors.text.muted,
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>,
          document.body
        )
      : null;

  // ── Penalty Popup ─────────────────────────────────────────────
  const penaltyCurl = runId
    ? `curl -sL "${baseUrl}/api/mixermode/verify.sh?difficulty=${difficulty}&runid=${runId}" | bash`
    : `curl -sL "${baseUrl}/api/mixermode/verify.sh?difficulty=${difficulty}" | bash`;

  const checkPenalty = async () => {
    setVerifying(true);
    try {
      if (runId) {
        const res = await fetch(`/api/mixermode/penalty-verify/${runId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uuid: "client-check" }),
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
      }
      setVerifying(false);
    } catch {
      setVerifying(false);
    }
  };

  const penaltyPopup =
    popup === "penalty"
      ? createPortal(
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 99999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0, 0, 0, 0.65)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          >
            <div
              style={{
                width: 400,
                maxWidth: "90vw",
                borderRadius: 18,
                background: colors.bg.raised,
                border: `1px solid ${colors.border.default}`,
                boxShadow: `0 24px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.03)`,
                padding: 28,
                display: "flex",
                flexDirection: "column",
                gap: 20,
                color: colors.text.primary,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              }}
            >
              {penaltyVerified ? (
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      background: "rgba(32, 201, 151, 0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 16px",
                      fontSize: 28,
                      color: colors.primary[500],
                    }}
                  >
                    ✓
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: colors.primary[500] }}>
                    Penalty Accepted
                  </div>
                  <div style={{ fontSize: 13, color: colors.text.secondary, marginTop: 8 }}>
                    You may now continue coding.
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 32,
                        background: "rgba(250, 82, 82, 0.10)",
                        border: "1px solid rgba(250, 82, 82, 0.20)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 20px",
                        fontSize: 32,
                      }}
                    >
                      ⏱
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: colors.text.primary, marginBottom: 6 }}>
                      Time&apos;s Up
                    </div>
                    <div style={{ fontSize: 13, color: colors.text.secondary, lineHeight: 1.6 }}>
                      You failed to submit before the timer ended.
                      <br />
                      Accept your{" "}
                      <span style={{ color: DIFF_HEX[difficulty], fontWeight: 600 }}>
                        {difficulty}
                      </span>{" "}
                      penalty to continue.
                    </div>
                  </div>

                  <div
                    style={{
                      background: colors.bg.overlay,
                      borderRadius: 12,
                      padding: 16,
                      fontFamily: "SF Mono, Menlo, Consolas, monospace",
                      fontSize: 11,
                      color: colors.primary[300],
                      wordBreak: "break-all",
                      position: "relative",
                      border: `1px solid ${colors.border.subtle}`,
                      lineHeight: 1.7,
                    }}
                  >
                    <div style={{ color: colors.text.muted, marginBottom: 8, fontSize: 10, letterSpacing: 0.5 }}>
                      # RUN IN YOUR TERMINAL
                    </div>
                    <div>{penaltyCurl}</div>
                    <button
                      onClick={() => copyCurl(penaltyCurl)}
                      style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        padding: "5px 12px",
                        borderRadius: 6,
                        border: `1px solid ${colors.border.default}`,
                        background: copied ? colors.success[900] : colors.surface.hover,
                        color: copied ? colors.success[400] : colors.text.secondary,
                        fontSize: 10,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>

                  <button
                    onClick={checkPenalty}
                    disabled={verifying}
                    style={{
                      padding: "13px 0",
                      borderRadius: 12,
                      border: "none",
                      background: verifying
                        ? colors.surface.hover
                        : `linear-gradient(135deg, ${colors.primary[600]}, ${colors.primary[700]})`,
                      color: verifying ? colors.text.muted : "#fff",
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: verifying ? "not-allowed" : "pointer",
                      transition: "all 0.2s ease",
                      boxShadow: verifying ? "none" : "0 4px 16px rgba(32, 201, 151, 0.25)",
                    }}
                  >
                    {verifying ? "Checking..." : "Verify My Penalty"}
                  </button>

                  <div style={{ fontSize: 11, color: colors.text.muted, textAlign: "center", lineHeight: 1.5 }}>
                    Run the script above, then click verify.
                    <br />
                    This screen won&apos;t close until your penalty is confirmed.
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body
        )
      : null;

  // ── Trigger penalty popup from parent ─────────────────────────
  React.useEffect(() => {
    if (isFinished && mode === "mixer") {
      setPopup("penalty");
    }
  }, [isFinished, mode]);

  // ── Intro Modal ───────────────────────────────────────────────
  const introPopup =
    showIntro
      ? createPortal(
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 99999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0, 0, 0, 0.65)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          >
            <div
              style={{
                width: 420,
                maxWidth: "90vw",
                borderRadius: 18,
                background: colors.bg.raised,
                border: `1px solid ${colors.border.default}`,
                boxShadow: `0 24px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.03)`,
                padding: 32,
                display: "flex",
                flexDirection: "column",
                gap: 24,
                color: colors.text.primary,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              }}
            >
              {/* Header */}
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: colors.text.primary,
                    marginBottom: 6,
                  }}
                >
                  Welcome to Intui
                </div>
                <div style={{ fontSize: 13, color: colors.text.secondary }}>
                  Two modes to sharpen your skills.
                </div>
              </div>

              {/* Timer card */}
              <div
                style={{
                  display: "flex",
                  gap: 14,
                  padding: 16,
                  borderRadius: 12,
                  background: colors.glass.timer,
                  border: `1px solid ${colors.glass.timerBorder}`,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "rgba(32, 201, 151, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    flexShrink: 0,
                  }}
                >
                  ⏱
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: colors.primary[400], marginBottom: 4 }}>
                    Timer
                  </div>
                  <div style={{ fontSize: 12, color: colors.text.secondary, lineHeight: 1.6 }}>
                    Set a countdown or run a stopwatch. Track how fast you solve problems. No consequences — just you vs the clock.
                  </div>
                </div>
              </div>

              {/* Mixer card */}
              <div
                style={{
                  padding: 16,
                  borderRadius: 12,
                  background: colors.glass.mixer,
                  border: `1px solid ${colors.glass.mixerBorder}`,
                }}
              >
                <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: "rgba(250, 82, 82, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      flexShrink: 0,
                    }}
                  >
                    🔥
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: colors.danger[400], marginBottom: 4 }}>
                      Mixer
                    </div>
                    <div style={{ fontSize: 12, color: colors.text.secondary, lineHeight: 1.6 }}>
                      Timed challenge with real stakes. Pick a difficulty, beat the clock. Fail to submit in time and you must accept a penalty to keep coding.
                    </div>
                  </div>
                </div>

                {/* Difficulty breakdown */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <DiffRow
                    color={colors.primary[500]}
                    bg="rgba(32,201,151,0.08)"
                    label="Easy"
                    desc="Your desktop wallpaper gets changed to a random image. Harmless but annoying."
                  />
                  <DiffRow
                    color={colors.warning[500]}
                    bg="rgba(252,196,25,0.08)"
                    label="Medium"
                    desc="Prank aliases injected into your shell config. Commands like ls, cd, rm will behave differently."
                  />
                  <DiffRow
                    color={colors.danger[500]}
                    bg="rgba(250,82,82,0.08)"
                    label="Hard"
                    desc="5,000 dummy files flood your /tmp directory and a matrix effect takes over your terminal."
                  />
                </div>

                <div style={{ fontSize: 10, color: colors.text.muted, marginTop: 10, lineHeight: 1.5, textAlign: "center" }}>
                  First use requires one-time device verification via terminal.
                  <br />
                  Skip a penalty? You get shadowbanned. Only a friend&apos;s referral can unlock your account.
                </div>
              </div>

              {/* Got it */}
              <button
                onClick={() => {
                  localStorage.setItem("intui_intro_seen", "true");
                  setShowIntro(false);
                }}
                style={{
                  padding: "12px 0",
                  borderRadius: 12,
                  border: "none",
                  background: `linear-gradient(135deg, ${colors.primary[600]}, ${colors.primary[700]})`,
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(32, 201, 151, 0.25)",
                  transition: "all 0.15s ease",
                }}
              >
                Got it
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
      {verifyPopup}
      {penaltyPopup}
      {introPopup}
    </>
  );
});

// ── Small helpers ──────────────────────────────────────────────
function Btn({
  label,
  color,
  bg,
  onClick,
}: {
  label: string;
  color: string;
  bg: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "0 12px",
        height: 30,
        borderRadius: 8,
        border: "none",
        background: bg,
        color,
        fontSize: 11,
        fontWeight: 600,
        cursor: "pointer",
        transition: "opacity 0.15s ease",
      }}
    >
      {label}
    </button>
  );
}

function Tab({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: "8px 0",
        borderRadius: 8,
        border: "none",
        background: active ? colors.primary[700] : "transparent",
        color: active ? "#fff" : colors.text.muted,
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.15s ease",
      }}
    >
      {label}
    </button>
  );
}

function DiffRow({
  color,
  bg,
  label,
  desc,
}: {
  color: string;
  bg: string;
  label: string;
  desc: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        padding: "8px 10px",
        borderRadius: 8,
        background: bg,
        border: `1px solid ${color}20`,
      }}
    >
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          background: color,
          marginTop: 5,
          flexShrink: 0,
        }}
      />
      <div>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>{label}</span>
        <span style={{ fontSize: 11, color: colors.text.muted, marginLeft: 6 }}>
          {desc}
        </span>
      </div>
    </div>
  );
}

export default Timer;
