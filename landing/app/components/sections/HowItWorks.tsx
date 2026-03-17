"use client";

import { ShoppingCart, Lock, Search, CheckCircle } from "lucide-react";
import { B } from "../brand";
import { FadeInUp, StaggerChildren, StaggerItem } from "../animations";

const steps = [
  {
    n: "01",
    title: "List & Match",
    desc: "Sellers post produce with specs and price. Buyers browse verified listings and place orders instantly.",
    icon: ShoppingCart,
    timing: "< 5 min",
    onChain: "Transaction recorded on Celo",
    accent: "#60A5FA",
    accentRgb: "96,165,250",
  },
  {
    n: "02",
    title: "Lock Funds",
    desc: "Buyer's cUSD payment locks into smart contract escrow. Seller gets confirmation. Zero counterparty risk.",
    icon: Lock,
    timing: "Instant",
    onChain: "cUSD locked in AgroEscrow.sol",
    accent: "#E8C870",
    accentRgb: "232,200,112",
  },
  {
    n: "03",
    title: "Inspect & Ship",
    desc: "Independent inspector verifies quality on pickup. Transporter bids and ships with live tracking.",
    icon: Search,
    timing: "2–24 hrs",
    onChain: "Inspector credential verified on-chain",
    accent: "#A78BFA",
    accentRgb: "167,139,250",
  },
  {
    n: "04",
    title: "Confirm & Release",
    desc: "Buyer confirms receipt. Escrow releases to seller automatically. The chain records it forever.",
    icon: CheckCircle,
    timing: "Automatic",
    onChain: "Smart contract auto-executes",
    accent: "#4ADE80",
    accentRgb: "74,222,128",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-28 px-4 overflow-hidden">
      {/* Dark with heavy gold-center glow */}
      <div className="absolute inset-0 z-0" style={{ backgroundColor: "#08070A" }} />
      <div className="pointer-events-none absolute inset-0 z-0" style={{
        background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(232,200,112,0.07) 0%, transparent 65%)",
      }} />

      <div className="max-w-6xl mx-auto relative z-10">
        <FadeInUp>
          <div className="text-center mb-16">
            <span className="text-label" style={{ color: B.wheat }}>How It Works</span>
            <h2 className="mt-4" style={{
              fontSize: "clamp(2rem, 5vw, 4rem)",
              fontWeight: 900,
              letterSpacing: "-0.018em",
              color: B.cream,
            }}>
              4 steps.{" "}
              <span style={{
                background: "linear-gradient(135deg, #E8C870, #FFD770, #C4831A)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                Zero trust required.
              </span>
            </h2>
          </div>
        </FadeInUp>

        <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" stagger={0.13}>
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isLast = i === steps.length - 1;

            return (
              <StaggerItem key={step.title} className="relative">
                {/* Connecting arrow */}
                {!isLast && (
                  <div className="hidden lg:flex items-center justify-center absolute top-1/2 -right-3 z-20"
                    style={{ transform: "translateY(-50%)" }}>
                    <span className="text-xl select-none" style={{ color: `${step.accent}55` }}>›</span>
                  </div>
                )}

                <div className="relative flex flex-col gap-4 p-6 rounded-2xl h-full overflow-hidden transition-all duration-200"
                  style={{
                    background: `rgba(${step.accentRgb},0.04)`,
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    border: `1px solid rgba(${step.accentRgb},0.16)`,
                    boxShadow: `0 4px 32px rgba(0,0,0,0.6)`,
                    minHeight: "260px",
                  }}>
                  {/* Accent top bar */}
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2,
                    background: `linear-gradient(90deg, transparent, ${step.accent}60, transparent)` }} />

                  {/* Large faded step number */}
                  <span className="absolute -bottom-3 -right-1 font-black leading-none select-none pointer-events-none"
                    style={{ fontSize: "7rem", color: step.accent, opacity: 0.06, lineHeight: 1 }}>
                    {step.n}
                  </span>

                  {/* Icon + timing */}
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                      style={{
                        background: `rgba(${step.accentRgb},0.12)`,
                        border: `1px solid rgba(${step.accentRgb},0.22)`,
                        boxShadow: `0 0 20px rgba(${step.accentRgb},0.18)`,
                      }}>
                      <Icon size={20} style={{ color: step.accent }} />
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
                      style={{
                        background: `rgba(${step.accentRgb},0.10)`,
                        color: step.accent,
                        border: `1px solid rgba(${step.accentRgb},0.20)`,
                      }}>
                      {step.timing}
                    </span>
                  </div>

                  {/* Step number node */}
                  <div className="w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-xs"
                    style={{
                      background: `rgba(${step.accentRgb},0.08)`,
                      border: `1.5px solid rgba(${step.accentRgb},0.35)`,
                      color: step.accent,
                    }}>
                    {i + 1}
                  </div>

                  <div className="flex-1 relative z-10">
                    <h3 className="text-base font-bold mb-2" style={{ color: B.cream }}>{step.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: B.muted }}>{step.desc}</p>
                  </div>

                  <div className="relative z-10 pt-3 mt-auto" style={{ borderTop: `1px solid rgba(${step.accentRgb},0.12)` }}>
                    <p className="text-xs font-mono" style={{ color: `${B.muted}88` }}>
                      ⬡ {step.onChain}
                    </p>
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerChildren>
      </div>
    </section>
  );
}
