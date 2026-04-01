"use client";

import { ShoppingCart, Lock, Search, CheckCircle } from "lucide-react";
import { B } from "../brand";
import { FadeInUp } from "../animations";
import { SpotlightCard } from "../reactbits/SpotlightCard";
import { BorderBeam } from "../reactbits/BorderBeam";
import { BlurText } from "../reactbits/BlurText";

const steps = [
  {
    n: "01",
    title: "List & Match",
    desc: "Sellers post produce with specs and price. Buyers browse verified listings and place orders instantly.",
    icon: ShoppingCart,
    timing: "< 5 min",
    onChain: "Transaction recorded on Celo",
    accent: "#E8C870",
    accentRgb: "232,200,112",
  },
  {
    n: "02",
    title: "Lock Funds",
    desc: "Buyer's cUSD payment locks into smart contract escrow. Seller gets confirmation. Zero counterparty risk.",
    icon: Lock,
    timing: "Instant",
    onChain: "cUSD locked in AgroEscrow.sol",
    accent: "#C4831A",
    accentRgb: "196,131,26",
  },
  {
    n: "03",
    title: "Inspect & Ship",
    desc: "Independent inspector verifies quality on pickup. Transporter bids and ships with live tracking.",
    icon: Search,
    timing: "2–24 hrs",
    onChain: "Inspector credential verified on-chain",
    accent: "#E8C870",
    accentRgb: "232,200,112",
  },
  {
    n: "04",
    title: "Confirm & Release",
    desc: "Buyer confirms receipt. Escrow releases to seller automatically. The chain records it forever.",
    icon: CheckCircle,
    timing: "Automatic",
    onChain: "Smart contract auto-executes",
    accent: "#C4831A",
    accentRgb: "196,131,26",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-28 px-4 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0" style={{ backgroundColor: "#08070A" }} />
      <div className="pointer-events-none absolute inset-0 z-0" style={{
        background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(232,200,112,0.07) 0%, transparent 65%)",
      }} />

      <div className="max-w-6xl mx-auto relative z-10">

        {/* ── Header with BlurText ── */}
        <FadeInUp>
          <div className="text-center mb-16">
            <span className="text-label" style={{ color: B.wheat }}>How It Works</span>
            <div className="mt-4" style={{
              fontSize: "clamp(2rem, 5vw, 4rem)",
              fontWeight: 900,
              letterSpacing: "-0.018em",
            }}>
              <BlurText
                text="4 steps."
                className="justify-center"
                delay={60}
                style={{ fontSize: "inherit", fontWeight: "inherit", letterSpacing: "inherit", color: B.cream, display: "inline-flex" }}
              />
              {" "}
              <span style={{
                background: "linear-gradient(135deg, #E8C870, #FFD770, #C4831A)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                Zero trust required.
              </span>
            </div>
          </div>
        </FadeInUp>

        {/* ── Step cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isLast = i === steps.length - 1;

            return (
              <div key={step.title} className="relative">
                {/* Connecting arrow */}
                {!isLast && (
                  <div className="hidden lg:flex items-center justify-center absolute top-1/2 -right-3 z-20"
                    style={{ transform: "translateY(-50%)" }}>
                    <span className="text-xl select-none" style={{ color: `${step.accent}55` }}>›</span>
                  </div>
                )}

                {/* SpotlightCard wraps the glass card */}
                <SpotlightCard
                  className="h-full rounded-2xl overflow-hidden"
                  spotlightColor={`rgba(${step.accentRgb},0.18)`}
                  style={{
                    background: `rgba(${step.accentRgb},0.09)`,
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    border: `1px solid rgba(${step.accentRgb},0.24)`,
                    boxShadow: `0 4px 32px rgba(0,0,0,0.6)`,
                    minHeight: "260px",
                    transition: "border-color 0.3s, box-shadow 0.3s",
                  }}
                >
                  {/* Traveling border beam */}
                  <BorderBeam color={step.accent} duration={6 + i * 1.2} delay={i * 0.8} />

                  {/* Accent top bar */}
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: 2,
                    background: `linear-gradient(90deg, transparent, ${step.accent}80, transparent)`,
                  }} />

                  {/* Large faded number watermark */}
                  <span className="absolute -bottom-3 -right-1 font-black leading-none select-none pointer-events-none"
                    style={{ fontSize: "7rem", color: step.accent, opacity: 0.08, lineHeight: 1 }}>
                    {step.n}
                  </span>

                  <div className="flex flex-col gap-4 p-6 h-full">
                    {/* Icon + timing badge */}
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                        style={{
                          background: `rgba(${step.accentRgb},0.15)`,
                          border: `1px solid rgba(${step.accentRgb},0.28)`,
                          boxShadow: `0 0 20px rgba(${step.accentRgb},0.20)`,
                        }}>
                        <Icon size={20} style={{ color: step.accent }} />
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
                        style={{
                          background: `rgba(${step.accentRgb},0.12)`,
                          color: step.accent,
                          border: `1px solid rgba(${step.accentRgb},0.24)`,
                        }}>
                        {step.timing}
                      </span>
                    </div>

                    {/* Step number node */}
                    <div className="w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-xs"
                      style={{
                        background: `rgba(${step.accentRgb},0.10)`,
                        border: `1.5px solid rgba(${step.accentRgb},0.40)`,
                        color: step.accent,
                      }}>
                      {i + 1}
                    </div>

                    <div className="flex-1">
                      <h3 className="text-base font-bold mb-2" style={{ color: B.cream }}>{step.title}</h3>
                      <p className="text-sm leading-relaxed" style={{ color: B.muted }}>{step.desc}</p>
                    </div>

                    <div className="pt-3 mt-auto" style={{ borderTop: `1px solid rgba(${step.accentRgb},0.16)` }}>
                      <p className="text-xs font-mono" style={{ color: `${B.muted}88` }}>
                        ⬡ {step.onChain}
                      </p>
                    </div>
                  </div>
                </SpotlightCard>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
