'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { B } from '../brand';
import { FadeInUp } from '../animations';
import Device from '../Device';
import { AgroVoiceChat, PhaseDots } from '../AgroVoiceDemo';
import { DecryptedText } from '../reactbits/DecryptedText';
import { pilotContactHref } from '../../lib/pilotContact';

function AnimatedPhone() {
  return (
    <Device scale={0.55} autoAnimate parallaxStrength={10} rotateStrength={2}>
      <AgroVoiceChat />
    </Device>
  );
}

// CSS particles — generated client-side only to avoid SSR/hydration mismatch
type Particle = {
  id: number;
  left: string;
  bottom: string;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
};
function Particles() {
  const [particles, setParticles] = useState<Particle[]>([]);
  useEffect(() => {
    setParticles(
      Array.from({ length: 22 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        bottom: `${Math.random() * 30}%`,
        size: Math.random() * 3 + 1.5,
        duration: Math.random() * 8 + 6,
        delay: Math.random() * 8,
        opacity: Math.random() * 0.5 + 0.2,
      })),
    );
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

const pilotScope = [
  { label: 'Product', value: 'Fresh raspberry' },
  { label: 'Supply', value: 'Portugal / Morocco' },
  { label: 'Destination', value: 'Spain' },
];

const pilotReviewHref = pilotContactHref('AgriTek raspberry pilot review');

export function Hero() {
  return (
    <section
      className="relative flex items-center px-6 lg:px-16 pt-24 pb-16 overflow-hidden"
      style={{ minHeight: '75vh' }}
    >
      {/* ── Background: controlled cold-chain corridor ── */}
      <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <Image
          src="/visuals/agritek-cold-chain-hero.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, rgba(7,9,7,0.97) 0%, rgba(7,9,7,0.82) 52%, rgba(7,9,7,0.72) 100%)',
          }}
        />
        {/* Bottom fade */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0"
          style={{
            height: 220,
            background: 'linear-gradient(to top, #0C0904 0%, transparent 100%)',
            zIndex: 2,
          }}
        />
      </div>
      {/* Gold atmospheric glow — left side hero */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 65% 70% at 15% 50%, rgba(232,200,112,0.12) 0%, transparent 60%)',
        }}
      />
      {/* Subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.022]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(232,200,112,1) 1px, transparent 1px), linear-gradient(90deg, rgba(232,200,112,1) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />
      {/* Particles */}
      <Particles />

      <div className="relative z-10 w-full max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* ── LEFT: copy ── */}
        <div>
          <FadeInUp>
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold mb-6 tracking-wide"
              style={{
                border: `1px solid rgba(232,200,112,0.30)`,
                color: B.wheat,
                background: 'rgba(232,200,112,0.08)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <span className="w-1 h-1 rounded-full" style={{ backgroundColor: B.wheat }} />
              Private pilot · controlled access
            </div>
          </FadeInUp>

          <FadeInUp delay={0.08}>
            <motion.h1
              className="mb-6"
              style={{ lineHeight: 1.05, letterSpacing: '-0.02em' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <motion.span
                className="block"
                style={{
                  fontSize: 'clamp(3rem, 8vw, 6.5rem)',
                  fontWeight: 950,
                  color: 'rgba(240,229,204,0.92)',
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.05 }}
              >
                Fix the load,
              </motion.span>
              <motion.span
                className="block italic"
                style={{
                  fontSize: 'clamp(3rem, 8vw, 6.5rem)',
                  fontWeight: 950,
                  backgroundImage: `linear-gradient(135deg, ${B.wheat} 0%, ${B.cream} 50%, ${B.wheat} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textShadow: 'none',
                  filter: 'drop-shadow(0 0 50px rgba(232,200,112,0.45))',
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                before the shortage does.
              </motion.span>
              <motion.span
                className="block mt-3"
                style={{
                  fontSize: 'clamp(1.5rem, 3.5vw, 2.8rem)',
                  fontWeight: 800,
                  color: B.cream,
                  lineHeight: 1.15,
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
              >
                <DecryptedText
                  text="The raspberry exception desk."
                  speed={55}
                  animateOn="view"
                  className="inline"
                  encryptedClassName="opacity-40"
                />
              </motion.span>
            </motion.h1>
          </FadeInUp>

          <FadeInUp delay={0.18}>
            <p
              className="text-lg sm:text-xl leading-relaxed mb-10 max-w-xl"
              style={{ color: 'rgba(240,229,204,0.7)' }}
            >
              AgriTek coordinates the evidence and execution for a pre-sold replacement load when a
              Spanish buyer faces a time-critical raspberry supply gap.{' '}
              <span style={{ color: B.cream }} className="font-semibold">
                One request. One gated file. Named operators.
              </span>
            </p>
          </FadeInUp>

          <FadeInUp delay={0.26}>
            <div className="flex flex-col sm:flex-row items-start gap-3 mb-12">
              {pilotReviewHref ? (
                <a href={pilotReviewHref} className="btn-primary">
                  Request Pilot Review <ArrowRight size={16} />
                </a>
              ) : (
                <span
                  className="btn-primary cursor-not-allowed opacity-55"
                  aria-disabled="true"
                  title="The pilot contact channel has not been verified yet."
                >
                  Pilot Contact Pending
                </span>
              )}
              <a href="#how-it-works" className="btn-secondary">
                See the Exception Workflow
              </a>
            </div>
          </FadeInUp>

          <FadeInUp delay={0.42}>
            <div
              className="grid grid-cols-3 gap-6 max-w-sm"
              style={{ borderTop: `1px solid rgba(232,200,112,0.16)`, paddingTop: '1.25rem' }}
            >
              {pilotScope.map((item) => (
                <div key={item.label}>
                  <div
                    className="text-sm font-extrabold leading-tight"
                    style={{
                      color: B.wheat,
                      textShadow: '0 0 20px rgba(232,200,112,0.5)',
                    }}
                  >
                    {item.value}
                  </div>
                  <div className="text-xs mt-1 leading-tight" style={{ color: B.muted }}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </FadeInUp>
        </div>

        {/* ── RIGHT: phone with animated onboarding ── */}
        <FadeInUp delay={0.15} className="hidden lg:flex justify-start">
          <div
            className="relative flex flex-col justify-center items-center overflow-visible"
            style={{ perspective: '1000px', minHeight: 600, transform: 'translateX(-40px)' }}
          >
            {/* Glow rings behind phone */}
            <div
              className="pointer-events-none absolute rounded-full"
              style={{
                width: 460,
                height: 460,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%,-50%)',
                background:
                  'radial-gradient(circle, rgba(216,179,93,0.14) 0%, rgba(74,141,97,0.07) 40%, transparent 70%)',
                filter: 'blur(20px)',
              }}
            />
            <div
              className="pointer-events-none absolute rounded-full"
              style={{
                width: 320,
                height: 320,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%,-50%)',
                border: '1px solid rgba(216,179,93,0.18)',
              }}
            />
            <div
              className="pointer-events-none absolute rounded-full"
              style={{
                width: 440,
                height: 440,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%,-50%)',
                border: '1px solid rgba(121,201,143,0.12)',
              }}
            />

            <AnimatedPhone />
            <div className="mt-4 relative z-10">
              <PhaseDots />
            </div>
            <div
              className="mt-4 max-w-xs rounded-full px-4 py-2 text-center text-[11px] font-medium"
              style={{
                color: B.muted,
                border: `1px solid ${B.glassBorder}`,
                background: 'rgba(12,9,4,0.72)',
              }}
            >
              Workflow prototype · no live trade, payment, settlement or GPS data
            </div>
          </div>
        </FadeInUp>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
        style={{ opacity: 0.3 }}
      >
        <span className="text-xs text-label" style={{ color: B.muted }}>
          scroll
        </span>
        <div
          className="w-px h-8"
          style={{ background: `linear-gradient(to bottom, ${B.wheat}, transparent)` }}
        />
      </div>
    </section>
  );
}
