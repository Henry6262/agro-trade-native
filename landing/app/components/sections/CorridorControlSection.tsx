'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Box,
  FileCheck2,
  Route,
  ThermometerSnowflake,
  UserRoundCheck,
} from 'lucide-react';
import { B } from '../brand';
import { FadeInUp, StaggerChildren, StaggerItem } from '../animations';

const corridorEvents = [
  {
    step: '01',
    title: 'Named demand',
    detail: 'Specification, volume, arrival window, acceptance method and commercial boundary.',
    icon: Box,
    state: 'Buyer-owned',
  },
  {
    step: '02',
    title: 'Supply readiness',
    detail:
      'Exporter, packhouse, lot, analysis, bank and unresolved conditions in one evidence gate.',
    icon: FileCheck2,
    state: 'Operator-reviewed',
  },
  {
    step: '03',
    title: 'Controlled movement',
    detail:
      'Origin release, pickup, border, temperature evidence and arrival events by named actors.',
    icon: ThermometerSnowflake,
    state: 'Evidence-backed',
  },
  {
    step: '04',
    title: 'Acceptance or claim',
    detail: 'The buyer records the outcome; contracted parties handle payment and remedy directly.',
    icon: UserRoundCheck,
    state: 'Direct parties',
  },
];

export function CorridorControlSection() {
  return (
    <section id="corridor" className="experience-section relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_52%_42%,rgba(216,179,93,0.09),transparent_34%),linear-gradient(180deg,#080b09_0%,#0b0905_100%)]" />
      <div className="route-grid absolute inset-0 opacity-35" />

      <div className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32">
        <FadeInUp>
          <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
            <div>
              <span className="section-kicker">The first corridor</span>
              <h2 className="section-title mt-4">
                Start narrow.
                <br />
                <span className="text-gold">Build the standard.</span>
              </h2>
            </div>
            <div className="lg:pb-2">
              <p className="max-w-2xl text-base leading-relaxed text-white/58 sm:text-lg">
                Fresh raspberry. Portugal or Morocco into Spain. One time-critical replacement load.
                The scope is narrow on purpose: prove the operating model before expanding product,
                geography or financial rails.
              </p>
              <Link
                href="/corridors/iberia-berries"
                className="mt-5 inline-flex items-center gap-2 text-sm font-bold transition-colors hover:text-white"
                style={{ color: B.wheat }}
              >
                Open the corridor brief <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </FadeInUp>

        <div
          className="corridor-map mt-14"
          aria-label="Pilot route from Morocco or Portugal to Spain"
        >
          <div className="corridor-map__rail" />
          <div className="corridor-map__origin corridor-map__node">
            <span className="corridor-map__pulse" />
            <span className="corridor-map__label">Qualified origin</span>
            <strong>Morocco / Portugal</strong>
          </div>
          <div className="corridor-map__gate corridor-map__node">
            <FileCheck2 size={18} />
            <span className="corridor-map__label">Controlled file</span>
            <strong>Evidence gate</strong>
          </div>
          <div className="corridor-map__destination corridor-map__node">
            <Route size={18} />
            <span className="corridor-map__label">Named buyer</span>
            <strong>Spain</strong>
          </div>
        </div>

        <StaggerChildren stagger={0.08} className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {corridorEvents.map(({ step, title, detail, icon: Icon, state }) => (
            <StaggerItem key={title} className="h-full">
              <article className="operator-card h-full">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-mono text-xs font-bold" style={{ color: B.wheat }}>
                    {step}
                  </span>
                  <span className="status-chip status-chip--evidence">{state}</span>
                </div>
                <Icon className="mt-8" size={22} style={{ color: B.greenBright }} />
                <h3 className="mt-4 text-lg font-bold text-white/90">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/47">{detail}</p>
              </article>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}
