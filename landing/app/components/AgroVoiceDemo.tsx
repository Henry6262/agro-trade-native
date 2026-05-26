"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Sparkles, CheckCircle2, Truck, ArrowRight, Play } from "lucide-react";

// ── Brand tokens (mirrors iOS app design-system/tokens.ts) ─────────────────
const GREEN = "#4ADE80";
const GREEN_DEEP = "#16A34A";
const GOLD = "#FCD34D";
const SURFACE_BG = "linear-gradient(180deg,#021207 0%,#000a03 60%,#000 100%)";
const GLASS_FILL = "rgba(255,255,255,0.06)";
const GLASS_BORDER = "rgba(255,255,255,0.10)";
const TEXT_PRIMARY = "#FFFFFF";
const TEXT_MUTED = "rgba(255,255,255,0.55)";

// ── Conversation script (5 phases, ~5s each) ───────────────────────────────
type Phase = "ask-role" | "ask-product" | "ask-delivery" | "processing" | "done";

export const DEMO_PHASE_LABELS: { key: Phase; label: string }[] = [
  { key: "ask-role", label: "Role" },
  { key: "ask-product", label: "Product" },
  { key: "ask-delivery", label: "Delivery" },
  { key: "processing", label: "Match" },
  { key: "done", label: "Live" },
];

// global phase index store so other components (e.g. Hero phase dots) can mirror it
let _currentPhaseIdx = 0;
const _phaseListeners = new Set<(idx: number) => void>();
export function subscribePhase(cb: (idx: number) => void): () => void {
  _phaseListeners.add(cb);
  cb(_currentPhaseIdx);
  return () => { _phaseListeners.delete(cb); };
}
function _broadcastPhase(idx: number) {
  _currentPhaseIdx = idx;
  _phaseListeners.forEach((cb) => cb(idx));
}

interface VoiceBubble { id: string; duration: string; }
interface ScriptStep {
  phase: Phase;
  durationMs: number;
  agentText: string;
  recordingMs: number; // time the user is recording before the bubble lands
  userBubble?: VoiceBubble; // appears at end of recording window
}

const SCRIPT: ScriptStep[] = [
  {
    phase: "ask-role",
    durationMs: 5000,
    agentText: "Hi! What's your role — buyer, seller, inspector, or transporter?",
    recordingMs: 3200,
    userBubble: { id: "u1", duration: "0:04" },
  },
  {
    phase: "ask-product",
    durationMs: 5000,
    agentText: "Great, you're a buyer. What grain are you sourcing and how much?",
    recordingMs: 3400,
    userBubble: { id: "u2", duration: "0:06" },
  },
  {
    phase: "ask-delivery",
    durationMs: 5000,
    agentText: "Got it — 50 tons of wheat. What's your delivery timeline and location?",
    recordingMs: 3200,
    userBubble: { id: "u3", duration: "0:05" },
  },
  {
    phase: "processing",
    durationMs: 4500,
    agentText: "Perfect. Setting up your profile and matching you with verified sellers…",
    recordingMs: 0,
  },
  {
    phase: "done",
    durationMs: 5500,
    agentText: "Done! Your buyer profile is live. 4 sellers nearby ready to ship.",
    recordingMs: 0,
  },
];

// ── Live waveform bars (used both in recording bar + sent bubbles) ─────────
function Waveform({ active, color, bars = 22, height = 22 }: { active: boolean; color: string; bars?: number; height?: number }) {
  return (
    <div className="flex items-center gap-[3px]" style={{ height }} suppressHydrationWarning>
      {Array.from({ length: bars }).map((_, i) => {
        // deterministic pseudo-random heights so static bubbles render consistently
        const seed = Math.sin((i + 1) * 12.345) * 0.5 + 0.5;
        const baseH = 4 + seed * (height - 4);
        return (
          <motion.div
            key={i}
            initial={{ scaleY: 0.4 }}
            animate={active ? { scaleY: [0.3, 1, 0.45, 0.85, 0.4] } : { scaleY: baseH / height }}
            transition={
              active
                ? { duration: 0.9 + (i % 5) * 0.12, repeat: Infinity, ease: "easeInOut", delay: i * 0.04 }
                : { duration: 0 }
            }
            style={{ width: 2.5, height: baseH, borderRadius: 2, background: color, transformOrigin: "center" }}
            suppressHydrationWarning
          />
        );
      })}
    </div>
  );
}

// ── Agent (left) bubble ───────────────────────────────────────────────────
function AgentBubble({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: "spring", damping: 22, stiffness: 240 }}
      className="flex items-end gap-2 max-w-[78%]"
    >
      <div
        className="shrink-0 flex items-center justify-center"
        style={{
          width: 28, height: 28, borderRadius: 14,
          background: `linear-gradient(135deg, ${GREEN_DEEP}, ${GREEN})`,
          boxShadow: `0 0 12px ${GREEN}55`,
        }}
      >
        <Sparkles size={14} color="#0C1F12" strokeWidth={2.5} />
      </div>
      <div
        style={{
          background: GLASS_FILL,
          border: `1px solid ${GLASS_BORDER}`,
          borderRadius: 18,
          borderBottomLeftRadius: 4,
          padding: "10px 14px",
          color: TEXT_PRIMARY,
          fontSize: 13,
          lineHeight: 1.45,
          fontWeight: 500,
          backdropFilter: "blur(8px)",
        }}
      >
        {text}
      </div>
    </motion.div>
  );
}

// ── User voice bubble (right side) ────────────────────────────────────────
function VoiceBubbleView({ duration }: { duration: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ type: "spring", damping: 20, stiffness: 260 }}
      className="self-end flex items-center gap-2.5 max-w-[78%]"
      style={{
        background: `linear-gradient(135deg, ${GREEN_DEEP} 0%, ${GREEN} 100%)`,
        borderRadius: 18,
        borderBottomRightRadius: 4,
        padding: "9px 13px",
        boxShadow: `0 8px 24px -8px ${GREEN}66`,
      }}
    >
      <div
        className="flex items-center justify-center shrink-0"
        style={{ width: 26, height: 26, borderRadius: 13, background: "rgba(0,0,0,0.18)" }}
      >
        <Play size={11} color="#FFFFFF" fill="#FFFFFF" />
      </div>
      <Waveform active={false} color="rgba(255,255,255,0.92)" bars={18} height={18} />
      <span style={{ color: "rgba(255,255,255,0.92)", fontSize: 11, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
        {duration}
      </span>
    </motion.div>
  );
}

// ── Recording bar (bottom of phone) ───────────────────────────────────────
function RecordingBar({ recording, elapsedMs }: { recording: boolean; elapsedMs: number }) {
  const seconds = Math.floor(elapsedMs / 1000);
  const timer = `0:${seconds.toString().padStart(2, "0")}`;
  return (
    <div
      className="flex items-center gap-3"
      style={{
        padding: "10px 14px",
        borderRadius: 999,
        background: recording ? "rgba(248,113,113,0.10)" : GLASS_FILL,
        border: `1px solid ${recording ? "rgba(248,113,113,0.40)" : GLASS_BORDER}`,
        transition: "all 0.3s ease",
      }}
    >
      {recording ? (
        <>
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4], scale: [0.85, 1, 0.85] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            style={{ width: 10, height: 10, borderRadius: 5, background: "#F87171" }}
          />
          <Waveform active color="#F87171" bars={20} height={20} />
          <span style={{ color: "#F87171", fontSize: 12, fontWeight: 700, fontVariantNumeric: "tabular-nums", marginLeft: "auto" }}>
            {timer}
          </span>
        </>
      ) : (
        <>
          <div
            className="flex items-center justify-center"
            style={{ width: 28, height: 28, borderRadius: 14, background: `${GREEN}22`, border: `1px solid ${GREEN}55` }}
          >
            <Mic size={14} color={GREEN} />
          </div>
          <span style={{ color: TEXT_MUTED, fontSize: 12 }}>Tap to talk</span>
        </>
      )}
    </div>
  );
}

// ── Processing pills (phase 4) ────────────────────────────────────────────
function ProcessingPills({ visible }: { visible: boolean }) {
  if (!visible) return null;
  const items = [
    { label: "Profile complete", delay: 0.3 },
    { label: "4 sellers matched", delay: 1.1 },
  ];
  return (
    <div className="self-start flex flex-col gap-1.5 ml-9">
      {items.map((it) => (
        <motion.div
          key={it.label}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: it.delay, duration: 0.35 }}
          className="flex items-center gap-2"
          style={{
            background: `${GREEN}14`,
            border: `1px solid ${GREEN}33`,
            borderRadius: 999,
            padding: "5px 11px",
            width: "fit-content",
          }}
        >
          <CheckCircle2 size={12} color={GREEN} />
          <span style={{ color: GREEN, fontSize: 11, fontWeight: 700 }}>{it.label}</span>
        </motion.div>
      ))}
    </div>
  );
}

// ── Done CTA bubble (phase 5) ─────────────────────────────────────────────
function DoneCTA({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.8, type: "spring", damping: 18, stiffness: 220 }}
      className="self-start flex items-center gap-2 ml-9"
      style={{
        background: `linear-gradient(135deg, ${GREEN_DEEP}, ${GREEN})`,
        borderRadius: 14,
        padding: "10px 14px",
        boxShadow: `0 8px 20px -8px ${GREEN}66`,
      }}
    >
      <Truck size={14} color="#0C1F12" strokeWidth={2.5} />
      <span style={{ color: "#0C1F12", fontSize: 12, fontWeight: 800 }}>View matches</span>
      <ArrowRight size={13} color="#0C1F12" strokeWidth={2.5} />
    </motion.div>
  );
}

// ── External phase indicator (renders next to / under the phone) ───────────
export function PhaseDots() {
  const [idx, setIdx] = useState(0);
  useEffect(() => subscribePhase(setIdx), []);
  return (
    <div className="flex items-center gap-3">
      {DEMO_PHASE_LABELS.map((p, i) => {
        const isActive = i === idx;
        const isPast = i < idx;
        return (
          <div key={p.key} className="flex items-center gap-2.5">
            <motion.div
              animate={{
                scale: isActive ? 1.15 : 1,
                opacity: isActive ? 1 : isPast ? 0.7 : 0.3,
              }}
              transition={{ duration: 0.35 }}
              className="rounded-full"
              style={{
                width: isActive ? 26 : 8,
                height: 8,
                background: isActive
                  ? "linear-gradient(90deg,#9945FF,#14F195)"
                  : isPast ? "#14F195" : "rgba(255,255,255,0.20)",
                boxShadow: isActive ? "0 0 12px rgba(20,241,149,0.55)" : "none",
                transition: "width 0.35s cubic-bezier(0.4,0,0.2,1)",
              }}
            />
            <motion.span
              animate={{ opacity: isActive ? 1 : 0.45 }}
              transition={{ duration: 0.35 }}
              className="text-xs font-bold tracking-wider"
              style={{
                color: isActive ? "#FFFFFF" : "rgba(255,255,255,0.45)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              {p.label}
            </motion.span>
          </div>
        );
      })}
    </div>
  );
}

// ── Phone chat screen content (lives inside Device's inset) ───────────────
export function AgroVoiceChat() {
  const [mounted, setMounted] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [stepElapsedMs, setStepElapsedMs] = useState(0);
  const [visibleSteps, setVisibleSteps] = useState<number[]>([0]);
  const stepStartRef = useRef<number>(Date.now());

  useEffect(() => { setMounted(true); }, []);

  // master phase ticker — only runs after mount to avoid SSR hydration mismatch
  useEffect(() => {
    if (!mounted) return;
    const step = SCRIPT[phaseIdx];
    stepStartRef.current = Date.now();
    setStepElapsedMs(0);
    const tick = setInterval(() => setStepElapsedMs(Date.now() - stepStartRef.current), 100);
    const next = setTimeout(() => {
      const nextIdx = (phaseIdx + 1) % SCRIPT.length;
      if (nextIdx === 0) {
        // restart loop
        setVisibleSteps([0]);
      } else {
        setVisibleSteps((s) => Array.from(new Set([...s, nextIdx])));
      }
      setPhaseIdx(nextIdx);
      _broadcastPhase(nextIdx);
    }, step.durationMs);
    return () => { clearInterval(tick); clearTimeout(next); };
  }, [phaseIdx, mounted]);

  const currentStep = SCRIPT[phaseIdx];
  const recordingActive =
    currentStep.recordingMs > 0 && stepElapsedMs < currentStep.recordingMs;
  const userBubbleLanded =
    currentStep.userBubble && stepElapsedMs >= currentStep.recordingMs;

  return (
    <div
      className="w-full h-full flex flex-col"
      style={{ background: SURFACE_BG }}
    >
      {/* Subtle orb backdrop */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: 60, right: -80, width: 240, height: 240,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${GREEN}22 0%, transparent 70%)`,
          filter: "blur(10px)",
        }}
      />

      {/* Header */}
      <div
        className="flex items-center gap-2.5 px-5 pt-14 pb-3 shrink-0"
        style={{ borderBottom: `1px solid ${GLASS_BORDER}` }}
      >
        <div
          className="flex items-center justify-center"
          style={{
            width: 36, height: 36, borderRadius: 18,
            background: `linear-gradient(135deg, ${GREEN_DEEP}, ${GREEN})`,
            boxShadow: `0 0 16px ${GREEN}55`,
          }}
        >
          <Sparkles size={16} color="#0C1F12" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <p style={{ color: TEXT_PRIMARY, fontSize: 13, fontWeight: 800, lineHeight: 1.1 }}>
            AgroTrade Assistant
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              style={{ width: 6, height: 6, borderRadius: 3, background: GREEN }}
            />
            <span style={{ color: TEXT_MUTED, fontSize: 11 }}>Online · Voice mode</span>
          </div>
        </div>
        <div
          style={{
            padding: "3px 8px",
            borderRadius: 999,
            background: `${GOLD}1A`,
            border: `1px solid ${GOLD}55`,
          }}
        >
          <span style={{ color: GOLD, fontSize: 9, fontWeight: 800, letterSpacing: 0.8 }}>AI</span>
        </div>
      </div>

      {/* Chat scroll area */}
      <div className="flex-1 overflow-hidden px-4 py-4 flex flex-col gap-3 relative z-10">
        <AnimatePresence initial={false}>
          {visibleSteps.map((idx) => {
            const s = SCRIPT[idx];
            const isCurrent = idx === phaseIdx;
            const bubbleLanded = !isCurrent || (s.userBubble && stepElapsedMs >= s.recordingMs);
            return (
              <div key={`step-${idx}`} className="flex flex-col gap-2.5">
                <AgentBubble text={s.agentText} />
                {s.userBubble && bubbleLanded && (
                  <VoiceBubbleView duration={s.userBubble.duration} />
                )}
                {s.phase === "processing" && isCurrent && (
                  <ProcessingPills visible={stepElapsedMs > 300} />
                )}
                {s.phase === "done" && isCurrent && (
                  <DoneCTA visible={stepElapsedMs > 200} />
                )}
              </div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Bottom recording bar */}
      <div className="px-4 pb-6 pt-2 shrink-0">
        <RecordingBar recording={!!recordingActive} elapsedMs={stepElapsedMs} />
      </div>
    </div>
  );
}
