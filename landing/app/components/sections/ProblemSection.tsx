'use client';

import { Clock3, EyeOff, Scale, Trash2, ArrowDownRight, ShieldCheck } from 'lucide-react';
import { B } from '../brand';
import { FadeInUp, StaggerChildren, StaggerItem } from '../animations';

const pressurePoints = [
  {
    icon: Trash2,
    title: 'Waste',
    text: 'Qualified supply stays invisible while perishable product, time and working capital are lost.',
  },
  {
    icon: Clock3,
    title: 'Delay',
    text: 'Calls, spreadsheets and document chains move slower than fresh produce and customer cutoffs.',
  },
  {
    icon: EyeOff,
    title: 'Opacity',
    text: 'Neither side sees one complete, current version of the trade when the decision matters most.',
  },
  {
    icon: Scale,
    title: 'Exploitation',
    text: 'Information asymmetry leaves producers and buyers negotiating with unequal visibility and leverage.',
  },
];

const doctrine = [
  'Name the requirement before sourcing begins.',
  'Show the evidence behind every green light.',
  'Keep responsibility visible at every handoff.',
  'Escalate the next action before the clock wins.',
];

export function ProblemSection() {
  return (
    <section
      id="problem"
      aria-labelledby="problem-title"
      className="experience-section relative overflow-hidden bg-[#090705]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_52%,rgba(208,102,79,0.12),transparent_32%),radial-gradient(circle_at_88%_46%,rgba(74,141,97,0.10),transparent_34%)]" />
      <div className="relative mx-auto grid max-w-7xl gap-16 px-5 py-24 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-start lg:py-36">
        <FadeInUp>
          <div className="lg:sticky lg:top-28">
            <span className="section-kicker" style={{ color: B.danger }}>
              The fight
            </span>
            <h2 id="problem-title" className="section-title mt-4">
              The enemy is
              <span className="block" style={{ color: B.danger }}>
                opacity.
              </span>
            </h2>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-white/55 sm:text-lg">
              Not a country. Not a people. The fight is against preventable loss, blind commitments,
              scattered evidence and hidden extraction at the moment decisions matter most.
            </p>

            <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.025] p-5">
              <div className="flex items-center gap-2" style={{ color: B.greenBright }}>
                <ShieldCheck size={17} />
                <span className="text-xs font-extrabold uppercase tracking-[0.16em]">
                  Operating doctrine
                </span>
              </div>
              <p className="mt-4 text-xl font-semibold leading-snug text-white/84">
                Proof before promises. Dignity in every role. Responsibility at every handoff.
              </p>
            </div>
          </div>
        </FadeInUp>

        <div>
          <StaggerChildren stagger={0.08} className="grid gap-3 sm:grid-cols-2">
            {pressurePoints.map(({ icon: Icon, title, text }, index) => (
              <StaggerItem key={title} className="h-full">
                <article className="operator-card h-full min-h-56">
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[rgba(208,102,79,0.22)] bg-[rgba(208,102,79,0.08)]">
                      <Icon size={19} style={{ color: B.danger }} />
                    </div>
                    <span className="font-mono text-[10px] font-bold tracking-[0.18em] text-white/25">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-7 text-xl font-extrabold text-white/90">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/48">{text}</p>
                </article>
              </StaggerItem>
            ))}
          </StaggerChildren>

          <FadeInUp delay={0.2}>
            <div
              className="mt-4 overflow-hidden rounded-2xl border"
              style={{ borderColor: `${B.wheat}2E`, background: `${B.wheat}09` }}
            >
              {doctrine.map((item, index) => (
                <div
                  key={item}
                  className="flex items-center gap-4 px-5 py-4 text-sm text-white/65"
                  style={{ borderTop: index ? '1px solid rgba(255,255,255,0.07)' : undefined }}
                >
                  <ArrowDownRight size={15} style={{ color: B.wheat }} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </FadeInUp>
        </div>
      </div>
    </section>
  );
}
