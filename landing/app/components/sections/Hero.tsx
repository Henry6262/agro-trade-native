"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { B } from "../brand";
import { FadeInUp, CountUp } from "../animations";
import Device from "../Device";
import { HERO_SCREENS } from "./HeroScreens";
import { DecryptedText } from "../reactbits/DecryptedText";

const SCREENS = HERO_SCREENS;

function AnimatedPhone() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(() => { setIndex((i) => (i + 1) % SCREENS.length); }, 3000);
    return () => clearInterval(t);
  }, []);
  const { Component } = SCREENS[index];
  return (
    <Device scale={0.55} autoAnimate parallaxStrength={12} rotateStrength={2.5}>
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

// CSS particles — generated client-side only to avoid SSR/hydration mismatch
type Particle = { id: number; left: string; bottom: string; size: number; duration: number; delay: number; opacity: number };
function Particles() {
  const [particles, setParticles] = useState<Particle[]>([]);
  useEffect(() => {
    setParticles(Array.from({ length: 22 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      bottom: `${Math.random() * 30}%`,
      size: Math.random() * 3 + 1.5,
      duration: Math.random() * 8 + 6,
      delay: Math.random() * 8,
      opacity: Math.random() * 0.5 + 0.2,
    })));
  }, []);
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
          style={{ background: B.green }} />
      ))}
    </div>
  );
}

const stats = [
  { label: "Active Traders", value: 1200, suffix: "+" },
  { label: "Secured in Escrow", value: 840, prefix: "$", suffix: "K" },
  { label: "Countries", value: 12 },
];


export function Hero() {
  return (
    <section
      className="relative flex items-center px-6 lg:px-16 pt-24 pb-16 overflow-hidden"
      style={{ minHeight: "75vh" }}
    >
      {/* ── Background: golden grain field + dark overlay ── */}
      <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2560&q=85')",
          backgroundSize: "cover",
          backgroundPosition: "center 55%",
        }} />
        <div className="absolute inset-0" style={{
          background: "linear-gradient(135deg, rgba(12,9,4,0.95) 0%, rgba(12,9,4,0.86) 50%, rgba(12,9,4,0.93) 100%)",
        }} />
        {/* Bottom fade */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0" style={{
          height: 220,
          background: "linear-gradient(to top, #0C0904 0%, transparent 100%)",
          zIndex: 2,
        }} />
      </div>
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
            <motion.h1 className="mb-6" style={{ lineHeight: 1.05, letterSpacing: "-0.02em" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}>
              <motion.span className="block" style={{
                fontSize: "clamp(1.8rem, 5vw, 3.8rem)",
                fontWeight: 950,
                color: "rgba(240,229,204,0.5)",
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}>
                Trade grain,
              </motion.span>
              <motion.span className="block italic" style={{
                fontSize: "clamp(1.8rem, 5vw, 3.8rem)",
                fontWeight: 950,
                background: `linear-gradient(135deg, ${B.wheat} 0%, #FFD770 50%, ${B.wheat} 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                textShadow: "none",
                filter: "drop-shadow(0 0 40px rgba(232,200,112,0.35))",
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}>
                not trust.
              </motion.span>
              <motion.span className="block mt-1" style={{
                fontSize: "clamp(1.2rem, 3vw, 2.4rem)",
                fontWeight: 950,
                color: B.cream,
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}>
                <DecryptedText
                  text="Escrow-protected. Inspector-verified."
                  speed={55}
                  animateOn="view"
                  className="inline"
                  encryptedClassName="opacity-40"
                />
              </motion.span>
            </motion.h1>
          </FadeInUp>

          <FadeInUp delay={0.18}>
            <p className="text-sm sm:text-base leading-relaxed mb-10 max-w-xl" style={{ color: B.muted }}>
              Every payment locks in smart-contract escrow on Celo.
              Funds release only when an inspector confirms delivery on-site.{" "}
              <span style={{ color: B.cream }} className="font-semibold">Automatic. Trustless.</span>
            </p>
          </FadeInUp>

          <FadeInUp delay={0.26}>
            <div className="flex flex-col sm:flex-row items-start gap-3 mb-12">
              <a href="/auth/login" className="btn-primary">
                Launch Web Portal <ArrowRight size={16} />
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
