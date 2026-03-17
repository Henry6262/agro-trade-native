"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, Lock, CheckCircle, ShieldCheck, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { B } from "../brand";
import { FadeInUp, CountUp } from "../animations";
import { ParallaxBg } from "../ParallaxBg";
import Device from "../Device";
import { HERO_SCREENS } from "./HeroScreens";

const SCREENS = HERO_SCREENS;

function AnimatedPhone() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(() => { setIndex((i) => (i + 1) % SCREENS.length); }, 3000);
    return () => clearInterval(t);
  }, []);
  const { Component } = SCREENS[index];
  return (
    <Device scale={0.62} autoAnimate parallaxStrength={12} rotateStrength={2.5}>
      <AnimatePresence mode="wait">
        <motion.div key={SCREENS[index].id} className="w-full h-full"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }}
          transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}>
          <Component />
        </motion.div>
      </AnimatePresence>
    </Device>
  );
}

function FloatCard({ children, style, delay = 0, yRange = 9 }: {
  children: React.ReactNode; style?: React.CSSProperties; delay?: number; yRange?: number;
}) {
  return (
    <motion.div className="absolute z-20" style={style}
      animate={{ y: [0, -yRange, 0] }}
      transition={{ duration: 3.5 + delay, repeat: Infinity, ease: "easeInOut", delay }}>
      {children}
    </motion.div>
  );
}

// CSS particles — no external lib needed
function Particles() {
  const particles = Array.from({ length: 22 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    bottom: `${Math.random() * 30}%`,
    size: Math.random() * 3 + 1.5,
    duration: Math.random() * 8 + 6,
    delay: Math.random() * 8,
    opacity: Math.random() * 0.5 + 0.2,
  }));
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            bottom: p.bottom,
            width: p.size,
            height: p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            opacity: p.opacity,
          }}
        />
      ))}
    </div>
  );
}

function ScreenDots() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % SCREENS.length), 3000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-30">
      {SCREENS.map((s, i) => (
        <motion.div key={s.id}
          animate={{ width: i === index ? 16 : 6, opacity: i === index ? 1 : 0.3 }}
          transition={{ duration: 0.3 }}
          className="h-1.5 rounded-full"
          style={{ background: B.wheat }} />
      ))}
    </div>
  );
}

const stats = [
  { label: "Active Traders", value: 1200, suffix: "+" },
  { label: "Secured in Escrow", value: 840, prefix: "$", suffix: "K" },
  { label: "Countries", value: 12 },
];

const bullets = [
  "Payment locks in escrow the moment the deal is signed",
  "Inspector confirms delivery on-site — no dispute games",
  "Funds release automatically. Or raise a dispute in-app",
];

export function Hero() {
  return (
    <section
      className="relative min-h-screen flex items-center px-6 lg:px-16 pt-24 pb-16 overflow-hidden"
    >
      {/* ── Background: golden wheat field photo + parallax ── */}
      <ParallaxBg
        src="https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=2070&q=80"
        overlay="linear-gradient(135deg, rgba(12,9,4,0.97) 0%, rgba(12,9,4,0.90) 50%, rgba(12,9,4,0.96) 100%)"
        position="center 40%"
        strength={70}
        fadeBottom="#0C0904"
        fadeSize={280}
      />
      {/* Gold atmospheric glow — left side hero */}
      <div className="pointer-events-none absolute inset-0 z-0" style={{
        background: "radial-gradient(ellipse 65% 70% at 15% 50%, rgba(232,200,112,0.12) 0%, transparent 60%)",
      }} />
      {/* Subtle grid */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.022]" style={{
        backgroundImage: "linear-gradient(rgba(232,200,112,1) 1px, transparent 1px), linear-gradient(90deg, rgba(232,200,112,1) 1px, transparent 1px)",
        backgroundSize: "80px 80px",
      }} />
      {/* Particles */}
      <Particles />

      <div className="relative z-10 w-full max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

        {/* ── LEFT: copy ── */}
        <div>
          <FadeInUp>
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-8"
              style={{ border: `1px solid ${B.glassBorder}`, color: B.wheat, background: "rgba(232,200,112,0.06)", backdropFilter: "blur(12px)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: B.wheat }} />
              Balkans · Middle East · Asia — Powered by Celo
            </div>
          </FadeInUp>

          <FadeInUp delay={0.08}>
            <h1 className="mb-6" style={{ lineHeight: 1.02, letterSpacing: "-0.02em" }}>
              <span className="block" style={{
                fontSize: "clamp(2.6rem, 7vw, 5.8rem)",
                fontWeight: 900,
                color: "rgba(240,229,204,0.45)",
              }}>
                Agricultural trade
              </span>
              <span className="block" style={{
                fontSize: "clamp(2.6rem, 7vw, 5.8rem)",
                fontWeight: 900,
                color: B.cream,
              }}>
                has always been built
              </span>
              <span className="block italic" style={{
                fontSize: "clamp(2.6rem, 7vw, 5.8rem)",
                fontWeight: 900,
                background: "linear-gradient(135deg, #E8C870 0%, #FFD770 50%, #C4831A 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                textShadow: "none",
                filter: "drop-shadow(0 0 40px rgba(232,200,112,0.35))",
              }}>
                on blind trust.
              </span>
              <span className="block mt-1" style={{
                fontSize: "clamp(1.8rem, 4.5vw, 3.8rem)",
                fontWeight: 800,
                color: B.cream,
              }}>
                We replaced trust with math.
              </span>
            </h1>
          </FadeInUp>

          <FadeInUp delay={0.18}>
            <p className="text-base sm:text-lg leading-relaxed mb-7 max-w-xl" style={{ color: B.muted }}>
              AgroTrade locks every payment in smart-contract escrow on Celo.
              Funds only release when the inspector confirms delivery —
              automatically.{" "}
              <span style={{ color: B.cream }} className="font-semibold">No trust required.</span>
            </p>
          </FadeInUp>

          <FadeInUp delay={0.26}>
            <ul className="space-y-2.5 mb-10">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <div
                    className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "rgba(232,200,112,0.12)", border: `1px solid rgba(232,200,112,0.30)` }}
                  >
                    <Check size={11} color={B.wheat} strokeWidth={2.5} />
                  </div>
                  <span className="text-sm leading-relaxed" style={{ color: "rgba(240,229,204,0.75)" }}>{b}</span>
                </li>
              ))}
            </ul>
          </FadeInUp>

          <FadeInUp delay={0.34}>
            <div className="flex flex-col sm:flex-row items-start gap-3 mb-12">
              <a href="#cta" className="btn-primary">
                Get Early Access <ArrowRight size={16} />
              </a>
              <a href="#app" className="btn-secondary">
                See the App
              </a>
            </div>
          </FadeInUp>

          <FadeInUp delay={0.42}>
            <div
              className="grid grid-cols-3 gap-6 max-w-sm"
              style={{ borderTop: `1px solid rgba(232,200,112,0.16)`, paddingTop: "1.25rem" }}
            >
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="text-2xl font-extrabold" style={{
                    color: B.wheat,
                    textShadow: "0 0 20px rgba(232,200,112,0.5)",
                  }}>
                    <CountUp target={s.value} prefix={s.prefix} suffix={s.suffix} />
                  </div>
                  <div className="text-xs mt-0.5 leading-tight" style={{ color: B.muted }}>{s.label}</div>
                </div>
              ))}
            </div>
          </FadeInUp>
        </div>

        {/* ── RIGHT: phone with animated onboarding ── */}
        <FadeInUp delay={0.15} className="hidden lg:flex justify-center">
          <div className="relative flex justify-center items-center overflow-visible"
            style={{ perspective: "1000px", minHeight: 600 }}>

            {/* Glow rings behind phone */}
            <div className="pointer-events-none absolute rounded-full" style={{
              width: 500, height: 500, top: "50%", left: "50%",
              transform: "translate(-50%,-50%)",
              background: "radial-gradient(circle, rgba(232,200,112,0.14) 0%, rgba(232,200,112,0.05) 40%, transparent 70%)",
              filter: "blur(20px)",
            }} />
            <div className="pointer-events-none absolute rounded-full" style={{
              width: 340, height: 340, top: "50%", left: "50%",
              transform: "translate(-50%,-50%)",
              border: "1px solid rgba(232,200,112,0.12)",
            }} />
            <div className="pointer-events-none absolute rounded-full" style={{
              width: 480, height: 480, top: "50%", left: "50%",
              transform: "translate(-50%,-50%)",
              border: "1px solid rgba(232,200,112,0.06)",
            }} />

            {/* Floating: Payment Locked */}
            <FloatCard delay={0} yRange={9} style={{ top: "7%", left: "-8%" }}>
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-sm font-semibold whitespace-nowrap"
                style={{
                  background: "rgba(12,9,4,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid rgba(232,200,112,0.28)",
                  boxShadow: "0 0 30px rgba(232,200,112,0.18), 0 8px 32px rgba(0,0,0,0.7)", color: B.cream,
                }}>
                <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(232,200,112,0.18)" }}>
                  <Lock size={13} color={B.wheat} />
                </div>
                <div>
                  <p style={{ color: B.wheat, fontSize: "11px", fontWeight: 700 }}>Payment Locked</p>
                  <p style={{ color: B.muted, fontSize: "10px" }}>$2,400 cUSD in escrow</p>
                </div>
              </div>
            </FloatCard>

            {/* Floating: Inspector */}
            <FloatCard delay={1.2} yRange={7} style={{ top: "30%", right: "-5%" }}>
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl whitespace-nowrap"
                style={{
                  background: "rgba(12,9,4,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid rgba(61,122,80,0.35)",
                  boxShadow: "0 0 25px rgba(61,122,80,0.20), 0 8px 32px rgba(0,0,0,0.7)",
                }}>
                <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(61,122,80,0.18)" }}>
                  <MapPin size={13} color="#4ADE80" />
                </div>
                <div>
                  <p style={{ color: "#4ADE80", fontSize: "11px", fontWeight: 700 }}>Inspector En Route</p>
                  <p style={{ color: B.muted, fontSize: "10px" }}>Grade verification pending</p>
                </div>
              </div>
            </FloatCard>

            {/* Floating: Trade Confirmed */}
            <FloatCard delay={0.6} yRange={11} style={{ bottom: "14%", left: "-10%" }}>
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl whitespace-nowrap"
                style={{
                  background: "rgba(12,9,4,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid rgba(74,222,128,0.28)",
                  boxShadow: "0 0 25px rgba(74,222,128,0.15), 0 8px 32px rgba(0,0,0,0.7)",
                }}>
                <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(74,222,128,0.12)" }}>
                  <CheckCircle size={13} color="#4ADE80" />
                </div>
                <div>
                  <p style={{ color: "#4ADE80", fontSize: "11px", fontWeight: 700 }}>Trade Confirmed ✓</p>
                  <p style={{ color: B.muted, fontSize: "10px" }}>Sofia → Istanbul · Delivered</p>
                </div>
              </div>
            </FloatCard>

            {/* Floating: Celo chip */}
            <FloatCard delay={1.8} yRange={6} style={{ bottom: "29%", right: "-2%" }}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold"
                style={{
                  background: "rgba(12,9,4,0.85)", backdropFilter: "blur(16px)",
                  border: `1px solid rgba(232,200,112,0.22)`,
                  boxShadow: "0 0 20px rgba(232,200,112,0.15)",
                  color: B.wheat,
                }}>
                <ShieldCheck size={11} color={B.wheat} />
                Celo blockchain
              </div>
            </FloatCard>

            <ScreenDots />
            <AnimatedPhone />
          </div>
        </FadeInUp>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1" style={{ opacity: 0.3 }}>
        <span className="text-xs text-label" style={{ color: B.muted }}>scroll</span>
        <div className="w-px h-8" style={{ background: `linear-gradient(to bottom, ${B.wheat}, transparent)` }} />
      </div>
    </section>
  );
}
