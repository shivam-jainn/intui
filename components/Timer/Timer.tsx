"use client";

import React from "react";
import { createPortal } from "react-dom";
import { Modal, Group, Stack, Text, Button, Title, Code } from "@mantine/core";
import { colors } from "@/lib/theme/colors";
import styles from "./Timer.module.css";

export type TimerMode = "timer" | "mixer";
export type TimerStatus = "idle" | "running" | "paused" | "finished";
export type MixerDifficulty = "easy" | "medium" | "hard";

export interface TimerProps {
  onTimerEnd?: () => void;
  onMixerStart?: (difficulty: MixerDifficulty, duration: number) => void;
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
  const [popup, setPopup] = React.useState<"config" | "verify" | "penalty" | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [runId, setRunId] = React.useState<string | null>(null);
  const [penaltyVerified, setPenaltyVerified] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);
  const [penaltyError, setPenaltyError] = React.useState<string | null>(null);
  const [verified, setVerified] = React.useState(false);
  const [showIntro, setShowIntro] = React.useState(false);

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
  const isLocked = isActive || isFinished;

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
    if (popup !== "config") return;
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

  // ── Actions ───────────────────────────────────────────────────
  const openConfig = () => {
    if (isLocked) return;
    setPopup(popup === "config" ? null : "config");
  };

  const switchMode = (m: TimerMode) => {
    if (isLocked) return;
    if (m === mode) {
      setPopup(popup === "config" ? null : "config");
      return;
    }
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
        localStorage.setItem("intui_verified", "true");
      } else {
        alert("Device not verified yet. Please run the script first.");
      }
    } catch {
      alert("Failed to verify. Please try again.");
    }
  };

  const checkPenalty = async () => {
    setVerifying(true);
    setPenaltyError(null);
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
        setPenaltyError(data.error || "Not yet verified — run the script first.");
      }
      setVerifying(false);
    } catch {
      setPenaltyError("Network error — is the server running?");
      setVerifying(false);
    }
  };

  // ── Trigger penalty popup ─────────────────────────────────────
  React.useEffect(() => {
    if (isFinished && mode === "mixer") {
      setPopup("penalty");
    }
  }, [isFinished, mode]);

  // ── Timer Bar ─────────────────────────────────────────────────
  const bar = (
    <div ref={triggerRef} className={styles.bar}>
      <div className={styles.modeTabs}>
        <button
          className={`${styles.modeTab} ${mode === "timer" ? styles.modeTabActiveTimer : ""}`}
          onClick={() => switchMode("timer")}
          disabled={isLocked}
        >
          Timer
        </button>
        <div className={styles.modeDivider} />
        <button
          className={`${styles.modeTab} ${mode === "mixer" ? styles.modeTabActiveMixer : ""}`}
          onClick={() => switchMode("mixer")}
          disabled={isLocked}
        >
          Mixer
        </button>
        <div className={styles.modeDivider} />
        <button
          className={
            isFinished
              ? styles.timeFinished
              : isActive
                ? styles.timeActive
                : styles.timeIdle
          }
          onClick={openConfig}
          disabled={isLocked}
        >
          {formatTime(seconds)}
        </button>
      </div>

      {isActive && (
        <div className={styles.actions}>
          {isRunning && (
            <button
              className={styles.actionBtn}
              style={{ background: "rgba(252,196,25,0.10)", color: colors.warning[500] }}
              onClick={handlePause}
            >
              Pause
            </button>
          )}
          {isPaused && (
            <button
              className={styles.actionBtn}
              style={{ background: "rgba(32,201,151,0.10)", color: colors.primary[500] }}
              onClick={handleStart}
            >
              Resume
            </button>
          )}
          <button
            className={styles.actionBtn}
            style={{ background: "rgba(250,82,82,0.10)", color: colors.danger[500] }}
            onClick={handleReset}
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );

  // ── Config Popup (positioned near trigger bar) ────────────────
  const configPopup =
    popup === "config"
      ? createPortal(
          <div className={styles.configOverlay} onClick={() => setPopup(null)}>
            <div
              className={styles.configPopup}
              style={{ top: popupPos.top, left: popupPos.left }}
              onClick={(e) => e.stopPropagation()}
            >
              <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: 1 }}>
                {mode === "timer" ? "Timer Setup" : "Mixer Setup"}
              </Text>

              {mode === "timer" && (
                <div className={styles.toggleGroup}>
                  <button
                    className={`${styles.toggleBtn} ${!stopwatch ? styles.toggleBtnActive : ""}`}
                    onClick={() => setStopwatch(false)}
                  >
                    Countdown
                  </button>
                  <button
                    className={`${styles.toggleBtn} ${stopwatch ? styles.toggleBtnActive : ""}`}
                    onClick={() => {
                      setStopwatch(true);
                      setPopup(null);
                      setStatus("running");
                      setSeconds(0);
                    }}
                  >
                    Stopwatch
                  </button>
                </div>
              )}

              {mode === "mixer" && (
                <div className={styles.diffGrid}>
                  {(["easy", "medium", "hard"] as MixerDifficulty[]).map(
                    (d) => (
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
                    )
                  )}
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
                    className={styles.numInput}
                  />
                  <span className={styles.colon}>:</span>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={inputSec}
                    onChange={(e) => setInputSec(Math.min(59, Math.max(0, +e.target.value)))}
                    className={styles.numInput}
                  />
                </div>
              )}

              <Button
                onClick={handleStart}
                fullWidth
                size="md"
                color={mode === "mixer" ? "red" : "primary"}
                disabled={!stopwatch && inputMin === 0 && inputSec === 0}
              >
                {stopwatch ? "Start Stopwatch" : "Start"}
              </Button>

              <Button onClick={() => setPopup(null)} variant="default" fullWidth size="sm">
                Close
              </Button>
            </div>
          </div>,
          document.body
        )
      : null;

  // ── Verify Modal (centered, blocking) ─────────────────────────
  const verifyModal = (
    <Modal
      opened={popup === "verify"}
      onClose={() => setPopup(null)}
      title="Device Verification"
      size="md"
      centered
      padding="xl"
      zIndex={9999}
    >
      <div className={styles.verifyBody}>
        <Text size="sm" c="dimmed">
          Run this once to register your device for Mixer mode.
        </Text>

        <div className={styles.codeWrapper}>
          <span className={styles.codeLabel}># Run in terminal:</span>
          <div style={{ position: "relative" }}>
            <Code
              block
              style={{ fontSize: 12, padding: "14px 80px 14px 16px", wordBreak: "break-all", lineHeight: 1.7 }}
            >
              {verifyCurl}
            </Code>
            <Button
              size="compact-xs"
              variant={copied ? "filled" : "default"}
              color={copied ? "green" : undefined}
              onClick={() => copyCurl(verifyCurl)}
              style={{ position: "absolute", top: 10, right: 10 }}
            >
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>

        <Button onClick={verifyDevice} fullWidth size="md">
          I&apos;ve Run It
        </Button>

        <Button onClick={() => setPopup(null)} variant="default" fullWidth size="sm">
          Cancel
        </Button>
      </div>
    </Modal>
  );

  // ── Penalty Modal (centered, blocking, can't close) ───────────
  const penaltyModal = (
    <Modal
      opened={popup === "penalty"}
      onClose={() => {}}
      withCloseButton={false}
      closeOnClickOutside={false}
      closeOnEscape={false}
      size="lg"
      centered
      padding="xl"
      zIndex={99999}
      overlayProps={{ backgroundOpacity: 0.65, blur: 12 }}
    >
      {penaltyVerified ? (
        <Stack align="center" gap="md" py={32}>
          <div className={styles.iconSuccess}>✓</div>
          <Title order={3} c="primary.5">Penalty Accepted</Title>
          <Text size="md" c="dimmed">You may now continue coding.</Text>
        </Stack>
      ) : (
        <div className={styles.penaltyBody}>
          <div className={styles.iconDanger}>⏱</div>

          <div>
            <Title order={3} mb={4}>Time&apos;s Up</Title>
            <Text size="sm" c="dimmed" style={{ lineHeight: 1.6 }}>
              You failed to submit before the timer ended.
              <br />
              Accept your{" "}
              <Text component="span" style={{ color: DIFF_HEX[difficulty], fontWeight: 600 }}>
                {difficulty}
              </Text>{" "}
              penalty to continue.
            </Text>
          </div>

          {/* Two-step flow: device verification → penalty acceptance */}
          <div className={styles.stepFlow}>
            {/* Step 1: Device Verification */}
            <div className={`${styles.step} ${verified ? styles.stepDone : styles.stepActive}`}>
              <div className={`${styles.stepNum} ${verified ? styles.stepNumDone : styles.stepNumActive}`}>
                {verified ? "✓" : "1"}
              </div>
              <div className={styles.stepContent}>
                <Text size="sm" fw={600} mb={4}>Verify Device</Text>
                {!verified ? (
                  <>
                    <Text size="xs" c="dimmed" mb={8}>
                      Run this once to register your device for Mixer mode.
                    </Text>
                    <div className={styles.codeWrapper}>
                      <span className={styles.codeLabel}># Run in terminal:</span>
                      <div style={{ position: "relative" }}>
                        <Code
                          block
                          style={{ fontSize: 11, padding: "10px 70px 10px 12px", wordBreak: "break-all", lineHeight: 1.6 }}
                        >
                          {verifyCurl}
                        </Code>
                        <Button
                          size="compact-xs"
                          variant={copied ? "filled" : "default"}
                          color={copied ? "green" : undefined}
                          onClick={() => copyCurl(verifyCurl)}
                          style={{ position: "absolute", top: 7, right: 7 }}
                        >
                          {copied ? "Copied!" : "Copy"}
                        </Button>
                      </div>
                    </div>
                    <Button size="xs" mt="xs" onClick={verifyDevice}>
                      I&apos;ve Run It
                    </Button>
                  </>
                ) : (
                  <Text size="xs" c="green.5">✓ Device verified</Text>
                )}
              </div>
            </div>

            {/* Step 2: Accept Penalty */}
            <div className={`${styles.step} ${verified ? styles.stepActive : ""}`}>
              <div className={`${styles.stepNum} ${verified ? styles.stepNumActive : ""}`}>
                2
              </div>
              <div className={styles.stepContent}>
                <Text size="sm" fw={600} mb={4}>Accept Penalty</Text>
                {verified ? (
                  <>
                    <Text size="xs" c="dimmed" mb={8}>
                      Accept the {difficulty} penalty by running the script below:
                    </Text>
                    <div className={styles.codeWrapper}>
                      <span className={styles.codeLabel}># RUN IN YOUR TERMINAL:</span>
                      <div style={{ position: "relative" }}>
                        <Code
                          block
                          style={{ fontSize: 11, padding: "10px 70px 10px 12px", wordBreak: "break-all", lineHeight: 1.6 }}
                        >
                          {penaltyCurl}
                        </Code>
                        <Button
                          size="compact-xs"
                          variant={copied ? "filled" : "default"}
                          color={copied ? "green" : undefined}
                          onClick={() => copyCurl(penaltyCurl)}
                          style={{ position: "absolute", top: 7, right: 7 }}
                        >
                          {copied ? "Copied!" : "Copy"}
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <Text size="xs" c="dimmed">Complete device verification first.</Text>
                )}
              </div>
            </div>
          </div>

          {penaltyError && <div className={styles.errorBox}>{penaltyError}</div>}

          {verified && (
            <>
              <Button onClick={checkPenalty} loading={verifying} fullWidth size="md">
                {verifying ? "Checking..." : "Verify My Penalty"}
              </Button>
              <Text className={styles.hint}>
                Run the script above, then click verify.
                <br />
                This screen won&apos;t close until your penalty is confirmed.
              </Text>
            </>
          )}
        </div>
      )}
    </Modal>
  );

  // ── Intro Modal (centered, blocking) ──────────────────────────
  const introModal = (
    <Modal
      opened={showIntro}
      onClose={() => {}}
      withCloseButton={false}
      closeOnClickOutside={false}
      closeOnEscape={false}
      size="lg"
      centered
      padding="xl"
      zIndex={99999}
      overlayProps={{ backgroundOpacity: 0.65, blur: 12 }}
    >
      <div className={styles.introBody}>
        <div style={{ textAlign: "center" }}>
          <Title order={2} mb={4}>Welcome to Intui</Title>
          <Text size="sm" c="dimmed">Two modes to sharpen your skills.</Text>
        </div>

        <div className={styles.modeCardTimer}>
          <Group gap="md" wrap="nowrap">
            <div className={styles.iconBoxTimer}>⏱</div>
            <div>
              <Text size="sm" fw={700} c="primary.4" mb={4}>Timer</Text>
              <Text size="xs" c="dimmed" style={{ lineHeight: 1.6 }}>
                Set a countdown or run a stopwatch. Track how fast you solve problems. No consequences — just you vs the clock.
              </Text>
            </div>
          </Group>
        </div>

        <div className={styles.modeCardMixer}>
          <Group gap="md" wrap="nowrap" mb="md">
            <div className={styles.iconBoxMixer}>🔥</div>
            <div>
              <Text size="sm" fw={700} c="red.4" mb={4}>Mixer</Text>
              <Text size="xs" c="dimmed" style={{ lineHeight: 1.6 }}>
                Timed challenge with real stakes. Pick a difficulty, beat the clock. Fail to submit in time and you must accept a penalty to keep coding.
              </Text>
            </div>
          </Group>

          <Stack gap={8}>
            {[
              { color: colors.primary[500], bg: "rgba(32,201,151,0.08)", label: "Easy", desc: "Your desktop wallpaper gets changed to a random image. Harmless but annoying." },
              { color: colors.warning[500], bg: "rgba(252,196,25,0.08)", label: "Medium", desc: "Prank aliases injected into your shell config. Commands like ls, cd, rm will behave differently." },
              { color: colors.danger[500], bg: "rgba(250,82,82,0.08)", label: "Hard", desc: "5000 dummy files, folder maze on desktop, rickroll tabs, notification spam, and full system chaos." },
            ].map((item) => (
              <div key={item.label} className={styles.diffRow} style={{ background: item.bg, borderColor: `${item.color}20` }}>
                <div className={styles.diffDot} style={{ background: item.color }} />
                <Text size="xs">
                  <Text component="span" fw={700} c={item.color}>{item.label}</Text>
                  <Text component="span" ml={6} c="dimmed">{item.desc}</Text>
                </Text>
              </div>
            ))}
          </Stack>

          <Text size="xs" c="dimmed" ta="center" mt="xs" style={{ lineHeight: 1.5 }}>
            First use requires one-time device verification via terminal.
            <br />
            Skip a penalty? You get shadowbanned. Only a friend&apos;s referral can unlock your account.
          </Text>
        </div>

        <Button
          onClick={() => {
            localStorage.setItem("intui_intro_seen", "true");
            setShowIntro(false);
          }}
          fullWidth
          size="md"
        >
          Got it
        </Button>
      </div>
    </Modal>
  );

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
