"use client";

import { useEffect, useState } from "react";
import { Coins, Lock, Scale, FileCheck, Globe, Zap } from "lucide-react";
import { B } from "../brand";
import { FadeInUp, StaggerChildren, StaggerItem } from "../animations";

// ─── Escrow Terminal ──────────────────────────────────────────────────────────

type EscrowState = 0 | 1 | 2;

const ESCROW_STATES = [
  { label: "AWAITING_PAYMENT",  status: "Waiting for buyer deposit...",         color: "#C4831A", progress: 33  },
  { label: "AWAITING_DELIVERY", status: "$2,400 cUSD locked · Sofia→Istanbul",  color: B.wheat,   progress: 66  },
  { label: "COMPLETE",          status: "Inspector confirmed · Funds released ✓", color: "#4ADE80", progress: 100 },
];

function EscrowTerminal() {
  const [stateIndex, setStateIndex] = useState<EscrowState>(0);
  // Empty string on server; live clock on client — avoids SSR/hydration mismatch (#418)
  const [timeStr, setTimeStr] = useState("");

  useEffect(() => {
    const tick = () => {
      setTimeStr(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    tick();
    const clockId = setInterval(tick, 1000);
    const stateId = setInterval(() => {
      setStateIndex((prev) => ((prev + 1) % 3) as EscrowState);
    }, 2500);
    return () => { clearInterval(clockId); clearInterval(stateId); };
  }, []);

  const current = ESCROW_STATES[stateIndex];

  return (
    <div
      className="rounded-3xl overflow-hidden w-full"
      style={{
        background: "rgba(4,6,10,0.95)",
        border: "1px solid rgba(232,200,112,0.22)",
        boxShadow: "0 0 80px rgba(232,200,112,0.12), 0 0 40px rgba(232,200,112,0.06), inset 0 1px 0 rgba(232,200,112,0.08)",
      }}
    >
      {/* Terminal header */}
      <div className="flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: "1px solid rgba(232,200,112,0.12)" }}>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#FF5F57" }} />
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#FFBD2E" }} />
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#28CA41" }} />
          </div>
          <span className="text-xs font-mono font-bold" style={{ color: B.wheat }}>
            AgroEscrow.sol
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.28)", color: "#4ADE80" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
            LIVE
          </span>
          <span className="text-xs px-2.5 py-1 rounded-md font-mono"
            style={{ background: "rgba(232,200,112,0.08)", color: B.muted, border: "1px solid rgba(232,200,112,0.14)" }}>
            Celo Sepolia
          </span>
        </div>
      </div>

      {/* State display */}
      <div className="px-5 py-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-full"
            style={{
              background: `${current.color}18`,
              border: `1px solid ${current.color}40`,
              color: current.color,
              transition: "all 0.4s ease",
              boxShadow: `0 0 16px ${current.color}20`,
            }}>
            {current.label}
          </span>
          <span className="text-xs font-mono" style={{ color: `${B.muted}66` }}>
            {timeStr}
          </span>
        </div>

        <p className="text-sm font-medium mb-5" style={{ color: B.cream, transition: "color 0.4s ease", minHeight: "1.4rem" }}>
          {current.status}
        </p>

        {/* Progress bar */}
        <div className="w-full rounded-full overflow-hidden mb-6" style={{ height: "5px", background: "rgba(232,200,112,0.08)" }}>
          <div className="h-full rounded-full"
            style={{
              width: `${current.progress}%`,
              background: `linear-gradient(90deg, ${current.color}66, ${current.color})`,
              transition: "width 0.7s ease, background 0.4s ease",
              boxShadow: `0 0 10px ${current.color}60`,
            }} />
        </div>

        {/* Contract details */}
        <div className="rounded-xl p-4 space-y-2.5"
          style={{ background: "rgba(232,200,112,0.03)", border: "1px solid rgba(232,200,112,0.08)" }}>
          <p className="text-xs font-mono mb-3" style={{ color: `${B.muted}77` }}>— Contract Details —</p>
          {[
            ["Contract", "0xD481...0F25"],
            ["Buyer",    "0x4c12...a701"],
            ["Seller",   "0x9e8d...f443"],
            ["Amount",   "$2,400 cUSD"],
            ["Network",  "Celo Sepolia"],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between items-center">
              <span className="text-xs font-mono" style={{ color: `${B.muted}66` }}>{label}</span>
              <span className="text-xs font-mono"
                style={{ color: label === "Amount" ? B.wheat : B.muted, fontWeight: label === "Amount" ? 700 : 400 }}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 flex justify-between items-center"
        style={{ borderTop: "1px solid rgba(232,200,112,0.08)" }}>
        <div className="flex items-center gap-1.5">
          <Zap size={11} style={{ color: B.muted }} />
          <span className="text-xs font-mono" style={{ color: `${B.muted}66` }}>auto-executed</span>
        </div>
        <a href="https://celoscan.io" target="_blank" rel="noopener noreferrer"
          className="text-xs font-semibold transition-opacity hover:opacity-100"
          style={{ color: B.wheat, opacity: 0.65 }}>
          View on Celoscan →
        </a>
      </div>
    </div>
  );
}

// ─── Feature list ─────────────────────────────────────────────────────────────

const vaultFeatures = [
  {
    icon: Coins,
    title: "cUSD Stablecoin",
    desc: "No volatility. 1 cUSD = 1 USD always. Your funds hold full value from listing to delivery.",
    accent: "#E8C870",
  },
  {
    icon: Lock,
    title: "Locked Until Delivery",
    desc: "Funds only release when the buyer confirms receipt. Sellers get paid. Every. Single. Time.",
    accent: "#C4831A",
  },
  {
    icon: Scale,
    title: "Dispute Resolution",
    desc: "If something goes wrong, independent arbiters step in. Fair, transparent, recorded on-chain.",
    accent: "#E8C870",
  },
  {
    icon: FileCheck,
    title: "On-Chain Audit Trail",
    desc: "Every payment, inspection and delivery is immutably recorded on the Celo blockchain.",
    accent: "#C4831A",
  },
];

// ─── Section ──────────────────────────────────────────────────────────────────

export function VaultSection() {
  return (
    <section id="vault" className="relative py-28 px-6 lg:px-32 overflow-hidden">
      {/* Pure dark background with heavy gold center glow */}
      <div className="absolute inset-0 z-0" style={{ backgroundColor: "#040608" }} />
      <div className="pointer-events-none absolute inset-0 z-0" style={{
        background: "radial-gradient(ellipse 90% 80% at 50% 50%, rgba(232,200,112,0.08) 0%, rgba(232,200,112,0.03) 40%, transparent 70%)",
      }} />
      {/* Subtle grid lines */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.018]" style={{
        backgroundImage: "linear-gradient(rgba(232,200,112,1) 1px, transparent 1px), linear-gradient(90deg, rgba(232,200,112,1) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Eyebrow */}
        <FadeInUp>
          <div className="text-center mb-16">
            <span className="text-label" style={{ color: B.wheat }}>Blockchain Escrow</span>
            <h2 className="mt-4" style={{
              fontSize: "clamp(1.5rem, 3.5vw, 3rem)",
              fontWeight: 900,
              letterSpacing: "-0.018em",
              lineHeight: 1.06,
            }}>
              <span style={{ color: B.cream }}>&ldquo;The code is the contract.&rdquo;</span>
              <br />
              <span style={{
                background: "linear-gradient(135deg, #E8C870, #FFD770, #C4831A)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                &ldquo;The chain is the record.&rdquo;
              </span>
            </h2>
            <p className="mt-5 text-lg max-w-xl mx-auto" style={{ color: B.muted }}>
              No middleman holds your funds. AgroEscrow.sol on Celo enforces every deal — automatically. No exceptions.
            </p>
          </div>
        </FadeInUp>

        {/* 2-col split */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Escrow Terminal */}
          <FadeInUp delay={0.1}>
            <EscrowTerminal />
          </FadeInUp>

          {/* Right: Feature list */}
          <FadeInUp delay={0.25}>
            <StaggerChildren stagger={0.1} className="flex flex-col gap-5">
              {vaultFeatures.map((f) => {
                const Icon = f.icon;
                return (
                  <StaggerItem key={f.title}>
                    <div
                      className="flex gap-4 items-start p-4 rounded-2xl transition-all duration-200"
                      style={{
                        borderLeft: `3px solid ${f.accent}`,
                        background: "rgba(255,255,255,0.02)",
                        paddingLeft: "1.25rem",
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                        style={{
                          background: `${f.accent}15`,
                          border: `1px solid ${f.accent}28`,
                          boxShadow: `0 0 16px ${f.accent}20`,
                        }}
                      >
                        <Icon size={16} style={{ color: f.accent }} />
                      </div>
                      <div>
                        <h3 className="font-bold text-base mb-1" style={{ color: B.cream }}>{f.title}</h3>
                        <p className="text-sm leading-relaxed" style={{ color: B.muted }}>{f.desc}</p>
                      </div>
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerChildren>

            {/* Celo attribution */}
            <div className="flex items-center gap-2 mt-8">
              <Globe size={13} style={{ color: B.muted }} />
              <span className="text-sm" style={{ color: B.muted }}>
                Powered by the{" "}
                <a href="https://celo.org" target="_blank" rel="noopener noreferrer"
                  className="hover:text-white transition-colors" style={{ color: B.wheat }}>
                  Celo blockchain
                </a>{" "}
                — mobile-first, low-fee, climate-positive
              </span>
            </div>

            {/* CTA */}
            <div className="mt-8">
              <a href="#cta" className="btn-primary">
                Get Protected Access →
              </a>
            </div>
          </FadeInUp>
        </div>
      </div>
    </section>
  );
}
