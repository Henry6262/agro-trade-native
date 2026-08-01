"use client";

import { AlertTriangle, Scale, FileX, ShieldCheck, UserCheck, Database } from "lucide-react";
import { B } from "../brand";
import { FadeInUp, StaggerChildren, StaggerItem } from "../animations";

const problems = [
  {
    n: "01",
    icon: AlertTriangle,
    title: "A shortage measured in hours",
    desc: "A late, short or rejected load can leave a Spanish buyer scrambling for qualified replacement fruit before a customer cutoff.",
    accent: "#EF4444",
  },
  {
    n: "02",
    icon: Scale,
    title: "Evidence split across inboxes",
    desc: "Specifications, analyses, bank details, customs files, inspections and logger records arrive through different people and channels.",
    accent: "#EF4444",
  },
  {
    n: "03",
    icon: FileX,
    title: "Claims without one record",
    desc: "Origin and arrival teams may use different defect definitions, samples and timestamps, making a fast commercial resolution harder.",
    accent: "#EF4444",
  },
];

const fixes = [
  {
    icon: ShieldCheck,
    title: "Written shortage request",
    desc: "The buyer defines the exact raspberry specification, arrival window, route, pack format, acceptance method and commercial limits first.",
    accent: "#4ADE80",
  },
  {
    icon: UserCheck,
    title: "Controlled evidence gate",
    desc: "Named operators record supplier, document, analysis, inspection and cold-chain evidence before pickup is authorized.",
    accent: "#4ADE80",
  },
  {
    icon: Database,
    title: "Mirrored inspection record",
    desc: "Origin and arrival checks use compatible defect definitions, photos, pallet IDs and temperature evidence so exceptions can be compared.",
    accent: "#4ADE80",
  },
];

export function ProblemSection() {
  return (
    <section id="problem" className="relative py-28 px-6 lg:px-32 overflow-hidden">
      {/* ── Background: pure dark ── */}
      <div className="absolute inset-0 z-0" style={{ backgroundColor: "#0C0904" }} />
      {/* Red atmospheric glow — left (problem side) */}
      <div className="pointer-events-none absolute inset-0 z-0" style={{
        background: "radial-gradient(ellipse 55% 60% at 10% 50%, rgba(196,101,74,0.10) 0%, transparent 60%)",
      }} />
      {/* Green atmospheric glow — right (solution side) */}
      <div className="pointer-events-none absolute inset-0 z-0" style={{
        background: "radial-gradient(ellipse 55% 60% at 90% 50%, rgba(61,122,80,0.09) 0%, transparent 60%)",
      }} />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <FadeInUp>
          <div className="mb-20">
            <span className="text-label" style={{ color: B.wheat }}>
              The Exception
            </span>
            <h2 className="mt-4 leading-tight" style={{
              fontSize: "clamp(1.6rem, 4vw, 3rem)",
              fontWeight: 900,
              letterSpacing: "-0.02em",
            }}>
              <span style={{ color: B.cream }}>When one raspberry load fails,</span>
              <br />
              <span style={{
                background: "linear-gradient(135deg, #E8C870, #FFD770, #C4831A)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                the replacement clock starts.
              </span>
            </h2>
            <p className="mt-5 text-base max-w-2xl leading-relaxed" style={{ color: B.muted }}>
              AgriTek is testing a private exception desk for pre-sold replacement loads into Spain from
              Portugal or Morocco. The pilot begins with recent evidence and a named buyer need—not a public marketplace listing.
            </p>
          </div>
        </FadeInUp>

        {/* VS divider label */}
        <div className="flex items-center gap-4 mb-8">
          <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, transparent, rgba(239,68,68,0.30))" }} />
          <span className="text-label px-4 py-1.5 rounded-full"
            style={{ color: B.muted, border: `1px solid rgba(255,255,255,0.08)`, background: "rgba(255,255,255,0.03)" }}>
            unstructured scramble
          </span>
          <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.1)" }} />
          <span className="text-label px-4 py-1.5 rounded-full"
            style={{ color: "#4ADE80", border: `1px solid rgba(61,122,80,0.25)`, background: "rgba(61,122,80,0.05)" }}>
            with the AgriTek pilot desk
          </span>
          <div style={{ flex: 1, height: 1, background: "linear-gradient(to left, transparent, rgba(61,122,80,0.25))" }} />
        </div>

        {/* 2-col layout */}
        <div className="grid lg:grid-cols-2 gap-5 lg:gap-6">
          {/* ── Left: Problems ── */}
          <StaggerChildren stagger={0.13} className="flex flex-col gap-4">
            {problems.map((p) => {
              const Icon = p.icon;
              return (
                <StaggerItem key={p.title}>
                  <div
                    className="flex gap-5 p-6 rounded-2xl items-start relative overflow-hidden"
                    style={{
                      background: "rgba(239,68,68,0.04)",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                      border: `1px solid ${p.accent}28`,
                      boxShadow: `0 0 40px ${p.accent}0A, 0 4px 32px rgba(0,0,0,0.6)`,
                    }}
                  >
                    {/* Left danger strip */}
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r-full"
                      style={{ background: `linear-gradient(to bottom, transparent, ${p.accent}80, transparent)` }} />

                    {/* Faded number */}
                    <span className="absolute right-3 bottom-1 font-black leading-none select-none pointer-events-none"
                      style={{ fontSize: "7rem", color: p.accent, opacity: 0.06 }}>
                      {p.n}
                    </span>

                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: `${p.accent}18`, border: `1px solid ${p.accent}25` }}>
                      <Icon size={18} style={{ color: p.accent }} />
                    </div>

                    <div className="flex-1 relative z-10">
                      <h3 className="text-lg font-bold mb-1.5" style={{ color: B.cream }}>{p.title}</h3>
                      <p className="text-sm leading-relaxed" style={{ color: B.muted }}>{p.desc}</p>
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerChildren>

          {/* ── Right: Fixes ── */}
          <StaggerChildren stagger={0.13} className="flex flex-col gap-4">
            {fixes.map((f) => {
              const Icon = f.icon;
              return (
                <StaggerItem key={f.title}>
                  <div
                    className="flex gap-5 p-6 rounded-2xl items-start relative overflow-hidden"
                    style={{
                      background: "rgba(61,122,80,0.06)",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                      border: `1px solid rgba(61,122,80,0.24)`,
                      boxShadow: `0 0 40px rgba(61,122,80,0.08), 0 4px 32px rgba(0,0,0,0.55)`,
                    }}
                  >
                    {/* Green accent strip */}
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r-full"
                      style={{ background: `linear-gradient(to bottom, transparent, ${f.accent}90, transparent)` }} />

                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: `${f.accent}18`, border: `1px solid ${f.accent}28` }}>
                      <Icon size={18} style={{ color: f.accent }} />
                    </div>

                    <div className="flex-1">
                      <span className="text-label mb-2 block" style={{ color: f.accent }}>
                        Pilot control
                      </span>
                      <h3 className="text-lg font-bold mb-1.5" style={{ color: B.cream }}>{f.title}</h3>
                      <p className="text-sm leading-relaxed" style={{ color: B.muted }}>{f.desc}</p>
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerChildren>
        </div>

        {/* Bottom closing line */}
        <FadeInUp delay={0.5}>
          <div className="mt-16 text-center">
            <div className="section-divider mb-6" />
            <p className="text-sm font-semibold" style={{ color: "rgba(232,200,112,0.6)" }}>
              The pilot tests whether one controlled evidence file can make a replacement load faster and more defensible.
              It does not make AgriTek the seller, buyer, customs principal or guarantor.
            </p>
          </div>
        </FadeInUp>
      </div>
    </section>
  );
}
