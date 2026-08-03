'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  FileClock,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { B } from '../brand';

const checkpoints = [
  {
    label: 'Supply evidence',
    value: 'Ready for review',
    icon: CheckCircle2,
    tone: B.greenBright,
  },
  {
    label: 'Origin inspection',
    value: 'Human sign-off',
    icon: FileClock,
    tone: B.wheat,
  },
  {
    label: 'Cold-chain signal',
    value: 'Device required',
    icon: CircleDashed,
    tone: B.muted,
  },
];

function CorridorConsole() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.aside
      aria-label="Simulated pilot corridor status"
      initial={reduceMotion ? false : { opacity: 0, y: 28 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.75, delay: 0.28, ease: 'easeOut' }}
      className="hero-console"
    >
      <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">
            Corridor 01
          </p>
          <p className="mt-1 text-sm font-semibold text-white">Iberia berry exception</p>
        </div>
        <span className="status-chip status-chip--prototype">Simulated</span>
      </div>

      <div className="px-5 py-5">
        <div className="mb-5 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2">
          {[
            ['Origin', 'MA / PT'],
            ['Evidence', 'Gate'],
            ['Buyer', 'Spain'],
          ].map(([label, value], index) => (
            <div key={label} className="contents">
              <div className="min-w-0">
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/35">
                  <MapPin size={14} style={{ color: index === 1 ? B.wheat : B.greenBright }} />
                </div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/38">{label}</p>
                <p className="mt-0.5 text-xs font-bold text-white/88">{value}</p>
              </div>
              {index < 2 ? (
                <div className="relative h-px min-w-8 overflow-hidden bg-white/10">
                  <motion.span
                    className="absolute inset-y-0 left-0 w-1/2"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${B.wheat}, transparent)`,
                    }}
                    animate={reduceMotion ? undefined : { x: ['-100%', '240%'] }}
                    transition={{
                      duration: 3.2,
                      repeat: Infinity,
                      ease: 'linear',
                      delay: index * 0.7,
                    }}
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {checkpoints.map(({ label, value, icon: Icon, tone }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-black/25 px-3.5 py-3"
            >
              <Icon size={15} style={{ color: tone }} />
              <span className="min-w-0 flex-1 text-xs text-white/55">{label}</span>
              <span className="text-right text-[11px] font-semibold" style={{ color: tone }}>
                {value}
              </span>
            </div>
          ))}
        </div>

        <div
          className="mt-4 rounded-xl border px-4 py-3"
          style={{ borderColor: `${B.wheat}38`, background: `${B.wheat}0D` }}
        >
          <p
            className="text-[10px] font-bold uppercase tracking-[0.18em]"
            style={{ color: B.wheat }}
          >
            Next accountable action
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-white/72">
            Buyer confirms the acceptance method before the evidence gate can close.
          </p>
        </div>
      </div>
    </motion.aside>
  );
}

export function GlobalHero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="global-hero" aria-labelledby="global-hero-title">
      <Image
        src="/visuals/agritek-cold-chain-hero.jpg"
        alt="Raspberry packhouse operators preparing a refrigerated export load before dawn"
        fill
        priority
        sizes="100vw"
        className="global-hero__image"
      />
      <div className="global-hero__veil" />
      <div className="global-hero__grid" />

      <div className="global-hero__content">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="global-hero__copy"
        >
          <div className="mb-7 flex flex-wrap items-center gap-2">
            <span className="status-chip status-chip--pilot">Private corridor pilot</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/48">
              Morocco · Portugal → Spain
            </span>
          </div>

          <h1 id="global-hero-title" className="global-hero__title">
            <span>Move food.</span>
            <span>Move trust.</span>
            <em>Keep value close to home.</em>
          </h1>

          <p className="global-hero__lede">
            AgriTek turns cross-border produce trade into one evidence-backed workflow—from buyer
            requirement and supplier readiness to inspection, movement, acceptance and claims.
            Starting with one controlled raspberry corridor into Spain.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="#contact" className="btn-primary min-h-12 justify-center">
              Bring a real exception <ArrowRight size={17} />
            </Link>
            <Link href="/experience" className="btn-secondary min-h-12 justify-center">
              Enter the command room
            </Link>
          </div>

          <div className="mt-9 grid max-w-2xl grid-cols-2 gap-x-6 gap-y-4 border-t border-white/10 pt-5 sm:grid-cols-4">
            {[
              ['Product', 'Fresh raspberry'],
              ['Origins', 'Morocco / Portugal'],
              ['Destination', 'Spain'],
              ['Commercial rail', 'Direct parties'],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/36">
                  {label}
                </p>
                <p className="mt-1 text-xs font-semibold text-white/78">{value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <CorridorConsole />
      </div>

      <div className="global-hero__boundary">
        <ShieldCheck size={14} />
        <span>
          Workflow prototype. No live custody, settlement, customs clearance, guaranteed outcome or
          connected GPS data.
        </span>
      </div>
    </section>
  );
}
