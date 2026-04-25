"use client";

import { motion } from "framer-motion";
import Device from "../Device";
import { B } from "../brand";
import { FadeInUp } from "../animations";
import { Bell, CheckCircle, Lock, ShieldCheck, TrendingUp, Truck } from "lucide-react";

// ── Simulated AgroTrade app UI ────────────────────────────────────────────────
function AppScreen() {
  return (
    <div
      className="w-full h-full overflow-hidden flex flex-col"
      style={{ backgroundColor: "#0C0904", fontFamily: "system-ui, -apple-system, sans-serif" }}
    >
      {/* Status bar */}
      <div className="flex items-center justify-between px-8 pt-5 pb-1" style={{ color: "#8B7B68", fontSize: "11px" }}>
        <span style={{ fontWeight: 600 }}>9:41</span>
        <div className="flex items-center gap-1">
          <svg width="16" height="10" viewBox="0 0 16 10" fill="currentColor" opacity="0.7">
            <rect x="0" y="3" width="3" height="7" rx="1" />
            <rect x="4.5" y="1.5" width="3" height="8.5" rx="1" />
            <rect x="9" y="0" width="3" height="10" rx="1" />
            <rect x="13.5" y="0.5" width="2" height="9" rx="1" opacity="0.3" />
          </svg>
          <svg width="12" height="10" viewBox="0 0 12 10" fill="currentColor" opacity="0.7">
            <path d="M6 2C8.2 2 10.1 3 11.5 4.6L12 4.1C10.4 2.3 8.3 1 6 1S1.6 2.3 0 4.1l.5.5C1.9 3 3.8 2 6 2z"/>
            <path d="M6 4c1.4 0 2.7.6 3.6 1.5l.5-.5C8.9 3.8 7.5 3 6 3S3.1 3.8 1.9 5l.5.5C3.3 4.6 4.6 4 6 4z"/>
            <circle cx="6" cy="8" r="1.2"/>
          </svg>
          <svg width="25" height="12" viewBox="0 0 25 12" fill="none" opacity="0.7">
            <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="currentColor" strokeOpacity="0.5"/>
            <rect x="2" y="2" width="16" height="8" rx="2" fill="currentColor"/>
            <path d="M23 4v4a2 2 0 000-4z" fill="currentColor" fillOpacity="0.4"/>
          </svg>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <p style={{ color: "#8B7B68", fontSize: "12px" }}>Welcome back 👋</p>
          <h2 style={{ color: "#F0E5CC", fontSize: "20px", fontWeight: 700 }}>Dashboard</h2>
        </div>
        <div className="relative">
          <div className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(232,200,112,0.10)" }}>
            <Bell size={18} style={{ color: "#E8C870" }} />
          </div>
          <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
            style={{ backgroundColor: "#E8C870", color: "#0C0904" }}>2</div>
        </div>
      </div>

      {/* Escrow balance card */}
      <div className="mx-4 p-5 rounded-3xl mb-4" style={{
        background: "rgba(232,200,112,0.06)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(232,200,112,0.18)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(232,200,112,0.08)",
      }}>
        <p style={{ color: "#8B7B68", fontSize: "11px", marginBottom: "4px" }}>ESCROW LOCKED</p>
        <p style={{ color: "#E8C870", fontSize: "28px", fontWeight: 800, letterSpacing: "-0.5px" }}>
          $840.00{" "}
          <span style={{ fontSize: "14px", color: "#8B7B68", fontWeight: 400 }}>cUSD</span>
        </p>
        <div className="flex items-center gap-1.5 mt-3" style={{ color: "#3D7A50" }}>
          <TrendingUp size={13} />
          <span style={{ fontSize: "11px", fontWeight: 600 }}>+12.4% this month</span>
        </div>
      </div>

      {/* Active Trade */}
      <div className="px-4 mb-3">
        <p style={{ color: "#8B7B68", fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", marginBottom: "8px" }}>
          ACTIVE TRADE
        </p>
        <div className="p-4 rounded-2xl" style={{
          background: "rgba(232,200,112,0.04)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(232,200,112,0.10)",
          boxShadow: "0 2px 16px rgba(0,0,0,0.4)",
        }}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <p style={{ color: "#F0E5CC", fontSize: "13px", fontWeight: 700 }}>50kg Wheat · Grade A</p>
              <p style={{ color: "#8B7B68", fontSize: "11px" }}>Trade #TRD-2891 · Sofia → Istanbul</p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ backgroundColor: "rgba(61,122,80,0.15)", color: "#3D7A50" }}>
              IN TRANSIT
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full mb-2"
            style={{ backgroundColor: "rgba(232,200,112,0.08)" }}>
            <div className="h-full rounded-full"
              style={{ width: "65%", background: "linear-gradient(to right, #C4831A, #E8C870)" }} />
          </div>
          <div className="flex justify-between" style={{ color: "#8B7B68", fontSize: "10px" }}>
            <span>Listed</span>
            <span>Inspected</span>
            <span style={{ color: "#E8C870", fontWeight: 600 }}>In Transit</span>
            <span>Delivered</span>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="px-4 grid grid-cols-2 gap-2 mb-4">
        {[
          { label: "Total Trades", value: "24", icon: "📦" },
          { label: "Completed", value: "21", icon: "✅" },
        ].map((s) => (
          <div key={s.label} className="p-3 rounded-2xl flex items-center gap-3" style={{
            background: "rgba(232,200,112,0.04)",
            border: "1px solid rgba(232,200,112,0.08)",
          }}>
            <span style={{ fontSize: "20px" }}>{s.icon}</span>
            <div>
              <p style={{ color: "#F0E5CC", fontSize: "16px", fontWeight: 700 }}>{s.value}</p>
              <p style={{ color: "#8B7B68", fontSize: "10px" }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Escrow status */}
      <div className="px-4 mb-4">
        <div className="p-3 rounded-2xl flex items-center gap-3"
          style={{ backgroundColor: "rgba(61,122,80,0.08)", border: "1px solid rgba(61,122,80,0.2)" }}>
          <CheckCircle size={16} style={{ color: "#3D7A50" }} />
          <p style={{ color: "#3D7A50", fontSize: "12px", fontWeight: 600 }}>
            Escrow secured · Celo blockchain
          </p>
          <Lock size={12} style={{ color: "#3D7A50", marginLeft: "auto" }} />
        </div>
      </div>

      {/* Bottom nav */}
      <div className="mt-auto border-t flex"
        style={{ borderColor: "rgba(232,200,112,0.08)", backgroundColor: "#0C0904" }}>
        {["🏠", "📋", "💬", "👤"].map((icon, i) => (
          <button key={i} className="flex-1 py-3 flex flex-col items-center gap-0.5"
            style={{ color: i === 0 ? "#E8C870" : "#8B7B68" }}>
            <span style={{ fontSize: "20px" }}>{icon}</span>
            <span style={{ fontSize: "9px", fontWeight: 600 }}>
              {["Home", "Orders", "Messages", "Profile"][i]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Highlights ────────────────────────────────────────────────────────────────
const highlights = [
  { icon: Lock, label: "Escrow locks at deal signing — no chasing payments" },
  { icon: Truck, label: "Real-time tracking from farm to delivery" },
  { icon: ShieldCheck, label: "Inspector confirms on-site before release" },
  { icon: CheckCircle, label: "Dispute resolution built into the app" },
];

// ── AppShowcase ───────────────────────────────────────────────────────────────
export function AppShowcase() {
  return (
    <section
      id="app"
      className="relative py-24 lg:py-32 px-6 lg:px-16 overflow-hidden"
      style={{ backgroundColor: B.bg2 }}
    >
      {/* Top edge separator */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(232,200,112,0.18) 40%, rgba(232,200,112,0.18) 60%, transparent)" }} />
      {/* Background aurora */}
      <div className="pointer-events-none absolute inset-0" style={{
        background: "radial-gradient(ellipse 70% 90% at 70% 50%, rgba(232,200,112,0.07) 0%, transparent 60%)",
      }} />
      <div className="pointer-events-none absolute inset-0" style={{
        background: "radial-gradient(ellipse 40% 50% at 20% 60%, rgba(196,131,26,0.04) 0%, transparent 55%)",
      }} />

      <div className="relative z-10 max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">

        {/* ── LEFT: copy ── */}
        <FadeInUp>
          <span className="text-xs font-bold uppercase tracking-[0.22em]" style={{ color: B.wheat }}>
            Mobile App
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mt-3 leading-[1.08]"
            style={{ color: B.cream }}>
            Your entire supply chain.
            <br />
            <span style={{ color: B.wheat }}>In your pocket.</span>
          </h2>
          <p className="mt-5 text-lg leading-relaxed max-w-lg" style={{ color: B.muted }}>
            Create trades, lock escrow, verify inspections and release payments —
            all without touching crypto. Works for buyers, sellers, inspectors and
            transporters in a single app.
          </p>

          <div className="mt-8 space-y-3.5">
            {highlights.map((h) => {
              const Icon = h.icon;
              return (
                <div key={h.label} className="flex items-start gap-3">
                  <div
                    className="mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: "rgba(232,200,112,0.08)",
                      border: `1px solid rgba(232,200,112,0.18)`,
                    }}
                  >
                    <Icon size={14} color={B.wheat} />
                  </div>
                  <span className="text-sm leading-relaxed pt-1" style={{ color: B.muted }}>
                    {h.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <a href="#cta"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-bold text-sm transition-all hover:opacity-90"
              style={{ backgroundColor: B.wheat, color: B.bg, boxShadow: `0 0 40px rgba(232,200,112,0.25)` }}>
              🍎 App Store
            </a>
            <a href="#cta"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-bold text-sm transition-all"
              style={{ background: "rgba(232,200,112,0.07)", backdropFilter: "blur(12px)", border: "1px solid rgba(232,200,112,0.22)", color: B.cream }}>
              ▶ Google Play
            </a>
          </div>
          <p className="mt-4 text-xs" style={{ color: B.muted }}>Coming soon — join the waitlist above</p>
        </FadeInUp>

        {/* ── RIGHT: phone ── */}
        <FadeInUp delay={0.15}>
          <div className="relative flex justify-center lg:justify-center items-center overflow-visible"
            style={{ perspective: "1000px", minHeight: 640 }}>

            {/* Big wheat glow behind phone */}
            <div
              className="pointer-events-none absolute rounded-full"
              style={{
                width: 480,
                height: 480,
                top: "50%",
                left: "50%",
                transform: "translate(-50%,-50%)",
                background: "radial-gradient(circle, rgba(232,200,112,0.1) 0%, rgba(232,200,112,0.04) 40%, transparent 70%)",
                filter: "blur(20px)",
              }}
            />

            {/* The phone */}
            <Device
              scale={0.64}
              autoAnimate={true}
              parallaxStrength={14}
              rotateStrength={3}
            >
              <AppScreen />
            </Device>
          </div>
        </FadeInUp>
      </div>
    </section>
  );
}
