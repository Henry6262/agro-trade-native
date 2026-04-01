"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Lock, Truck, Search, ShoppingCart, Zap } from "lucide-react";
import { B } from "../brand";
import { FadeInUp } from "../animations";

const STAGES = [
  {
    id: "listed",
    icon: ShoppingCart,
    label: "Buyer posts order",
    duration: 2200,
    color: "#E8C870",
    feed: { title: "Buy Order Created", detail: "50t Grade A Wheat · $48/t · Sofia → Istanbul", badge: "POSTED", badgeColor: "#E8C870", meta: "Ahmed K. · 0x3f2a...b91c" },
  },
  {
    id: "matched",
    icon: Zap,
    label: "Sellers auto-matched",
    duration: 2400,
    color: "#C4831A",
    feed: { title: "2 Sellers Matched", detail: "Marko V. (Serbia) 30t · Ivan R. (Romania) 20t", badge: "NEGOTIATING", badgeColor: "#C4831A", meta: "Platform auto-matched · < 4 min" },
  },
  {
    id: "escrow",
    icon: Lock,
    label: "cUSD locked in escrow",
    duration: 2000,
    color: "#E8C870",
    feed: { title: "$2,400 cUSD Locked", detail: "AgroEscrow.sol · Funds held until delivery", badge: "ON-CHAIN", badgeColor: "#E8C870", meta: "0xe5df...8735 · Celo Sepolia" },
  },
  {
    id: "inspection",
    icon: Search,
    label: "Quality inspection passed",
    duration: 2600,
    color: "#C4831A",
    feed: { title: "Quality Verified ✓", detail: "Score 89/100 · Moisture 12.4% · Grade A confirmed", badge: "PASSED", badgeColor: "#C4831A", meta: "Inspector: Nikolaj B. · Certified on-chain" },
  },
  {
    id: "transit",
    icon: Truck,
    label: "Shipment in transit",
    duration: 2200,
    color: "#E8C870",
    feed: { title: "Truck Dispatched", detail: "TK-4821 departed Sofia depot · Live GPS active", badge: "IN TRANSIT", badgeColor: "#E8C870", meta: "ETA Istanbul: 18 hrs" },
  },
  {
    id: "released",
    icon: CheckCircle2,
    label: "Escrow released automatically",
    duration: 0,
    color: "#C4831A",
    feed: { title: "Payment Released", detail: "$2,400 cUSD sent to Marko V. & Ivan R.", badge: "COMPLETE", badgeColor: "#C4831A", meta: "Smart contract auto-executed · 0 fees" },
  },
];

type FeedItem = (typeof STAGES)[number]["feed"];

export function LiveDealFlow() {
  const [activeStage, setActiveStage] = useState(-1);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [complete, setComplete] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runStage = (index: number) => {
    if (index >= STAGES.length) {
      setComplete(true);
      timerRef.current = setTimeout(() => {
        setActiveStage(-1); setFeedItems([]); setComplete(false);
        timerRef.current = setTimeout(() => runStage(0), 700);
      }, 3200);
      return;
    }
    setActiveStage(index);
    setFeedItems((prev) => [STAGES[index].feed, ...prev]);
    const duration = STAGES[index].duration;
    if (duration > 0) {
      timerRef.current = setTimeout(() => runStage(index + 1), duration);
    } else {
      timerRef.current = setTimeout(() => {
        setComplete(true);
        timerRef.current = setTimeout(() => {
          setActiveStage(-1); setFeedItems([]); setComplete(false);
          timerRef.current = setTimeout(() => runStage(0), 700);
        }, 3200);
      }, 1600);
    }
  };

  useEffect(() => {
    timerRef.current = setTimeout(() => runStage(0), 900);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const progress = activeStage < 0 ? 0 : ((activeStage + 1) / STAGES.length) * 100;

  return (
    <section className="relative py-28 px-4 overflow-hidden">
      {/* ── Background: pure dark ── */}
      <div className="absolute inset-0 z-0" style={{ backgroundColor: "#0C0904" }} />
      <div className="pointer-events-none absolute inset-0 z-0" style={{
        background: "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(232,200,112,0.06) 0%, transparent 65%)",
      }} />

      <div className="max-w-6xl mx-auto relative z-10">
        <FadeInUp>
          <div className="text-center mb-16">
            <span className="text-label" style={{ color: B.wheat }}>Live Deal Flow</span>
            <h2 className="mt-4" style={{
              fontSize: "clamp(2rem, 5vw, 4rem)",
              fontWeight: 900,
              letterSpacing: "-0.018em",
              color: B.cream,
            }}>
              Watch a trade close
              <br className="hidden sm:block" /> in real time.
            </h2>
            <p className="mt-4 text-base max-w-xl mx-auto" style={{ color: B.muted }}>
              Every step automated. Every payment protected. No middlemen, no blind trust.
            </p>
          </div>
        </FadeInUp>

        <div className="grid lg:grid-cols-[1fr_1.25fr] gap-6 items-start">
          {/* ── Left: step timeline ── */}
          <div>
            <div className="h-0.5 rounded-full mb-6 overflow-hidden" style={{ background: "rgba(232,200,112,0.10)" }}>
              <motion.div className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${B.wheat}, #C4831A)`, boxShadow: "0 0 10px rgba(232,200,112,0.40)" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }} />
            </div>

            <div className="space-y-2">
              {STAGES.map((stage, i) => {
                const Icon = stage.icon;
                const isActive = i === activeStage;
                const isDone = i < activeStage || (complete && i < STAGES.length);
                return (
                  <motion.div key={stage.id}
                    className="flex items-center gap-4 px-4 py-3 rounded-2xl"
                    animate={{
                      backgroundColor: isActive ? "rgba(232,200,112,0.07)" : isDone ? "rgba(232,200,112,0.02)" : "rgba(0,0,0,0)",
                      borderColor: isActive ? "rgba(232,200,112,0.25)" : isDone ? "rgba(232,200,112,0.08)" : "rgba(255,255,255,0.04)",
                    }}
                    style={{ border: "1px solid rgba(255,255,255,0.04)" }}
                    transition={{ duration: 0.3 }}>
                    <motion.div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      animate={{
                        backgroundColor: isActive ? `${stage.color}20` : isDone ? "rgba(196,131,26,0.10)" : "rgba(255,255,255,0.04)",
                      }}
                      transition={{ duration: 0.3 }}>
                      {isDone && !isActive
                        ? <CheckCircle2 size={16} style={{ color: "#C4831A" }} />
                        : <Icon size={16} style={{ color: isActive ? stage.color : `${B.muted}44` }} />}
                    </motion.div>
                    <motion.p className="flex-1 text-sm font-semibold"
                      animate={{ color: isActive ? B.cream : isDone ? B.muted : `${B.muted}44` }}
                      transition={{ duration: 0.3 }}>
                      {stage.label}
                    </motion.p>
                    {isActive && (
                      <motion.div className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: stage.color, boxShadow: `0 0 8px ${stage.color}` }}
                        animate={{ opacity: [1, 0.25, 1] }}
                        transition={{ repeat: Infinity, duration: 0.9 }} />
                    )}
                    {isDone && !isActive && (
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: "#C4831A" }} />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* ── Right: live activity feed ── */}
          <div className="rounded-2xl overflow-hidden"
            style={{
              background: "rgba(232,200,112,0.04)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: `1px solid rgba(232,200,112,0.14)`,
              boxShadow: "0 4px 32px rgba(0,0,0,0.65), inset 0 1px 0 rgba(232,200,112,0.07)",
              minHeight: "420px",
            }}>
            <div className="flex items-center justify-between px-5 py-3"
              style={{ borderBottom: `1px solid rgba(232,200,112,0.10)` }}>
              <div className="flex items-center gap-2">
                <motion.div className="w-2 h-2 rounded-full" style={{ background: B.wheat }}
                  animate={{ opacity: activeStage >= 0 ? [1, 0.3, 1] : [0.3, 0.3, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.4 }} />
                <span className="text-xs font-bold tracking-widest uppercase" style={{ color: B.muted }}>
                  Live · Trade #TRD-2891
                </span>
              </div>
              <span className="text-xs font-mono" style={{ color: `${B.muted}55` }}>Sofia → Istanbul</span>
            </div>

            <div className="p-4 space-y-3">
              <AnimatePresence mode="popLayout">
                {feedItems.length === 0 && !complete && (
                  <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-20 gap-3">
                    <motion.div className="w-3 h-3 rounded-full" style={{ background: B.wheat }}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                      transition={{ repeat: Infinity, duration: 1.1 }} />
                    <p className="text-sm" style={{ color: `${B.muted}55` }}>Initialising trade…</p>
                  </motion.div>
                )}

                {feedItems.map((item, i) => (
                  <motion.div key={`${item.title}-${feedItems.length - i}`}
                    layout
                    initial={{ opacity: 0, y: -20, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 280, damping: 26 }}
                    className="rounded-xl p-4"
                    style={{
                      background: i === 0 ? "rgba(232,200,112,0.06)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${i === 0 ? "rgba(232,200,112,0.16)" : "rgba(255,255,255,0.05)"}`,
                      boxShadow: i === 0 ? "0 0 20px rgba(232,200,112,0.06)" : "none",
                    }}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-bold leading-snug" style={{ color: i === 0 ? B.cream : B.muted }}>
                        {item.title}
                      </p>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"
                        style={{ background: `${item.badgeColor}18`, color: item.badgeColor, border: `1px solid ${item.badgeColor}30` }}>
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-xs mb-1 leading-relaxed" style={{ color: i === 0 ? B.muted : `${B.muted}77` }}>
                      {item.detail}
                    </p>
                    <p className="text-xs font-mono" style={{ color: `${B.muted}44` }}>{item.meta}</p>
                  </motion.div>
                ))}

                {complete && (
                  <motion.div key="complete" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="rounded-xl p-4 text-center"
                    style={{ background: "rgba(232,200,112,0.06)", border: "1px solid rgba(232,200,112,0.20)", boxShadow: "0 0 30px rgba(232,200,112,0.08)" }}>
                    <p className="text-sm font-bold" style={{ color: B.wheat }}>
                      Deal complete — $2,400 cUSD released in full
                    </p>
                    <p className="text-xs mt-1" style={{ color: `${B.muted}66` }}>Zero human intervention required</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
