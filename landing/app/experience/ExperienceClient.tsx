'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clipboard,
  FileCheck2,
  LockKeyhole,
  MapPin,
  PackageCheck,
  Route,
  ShieldCheck,
  ThermometerSnowflake,
  UsersRound,
} from 'lucide-react';
import { B } from '../components/brand';

const phases = [
  {
    name: 'Demand intake',
    state: 'complete',
    owner: 'Buyer',
    nextTitle: 'Confirm the acceptance method',
    nextDescription:
      'Name the specification, arrival window and evidence the buyer will use to accept—or challenge—the load before sourcing begins.',
  },
  {
    name: 'Evidence gate',
    state: 'active',
    owner: 'Operator',
    nextTitle: 'Commission origin inspection',
    nextDescription:
      'Assign a qualified inspector and attach the agreed sampling plan. Pickup remains blocked until the signed finding is reviewed.',
  },
  {
    name: 'Origin release',
    state: 'blocked',
    owner: 'Inspector',
    nextTitle: 'Review the signed finding',
    nextDescription:
      'Compare the inspection result with the buyer requirement, record every open condition and name who can authorize release.',
  },
  {
    name: 'Movement',
    state: 'waiting',
    owner: 'Carrier',
    nextTitle: 'Confirm pickup and equipment',
    nextDescription:
      'Record the vehicle, handover time and evidence source. Temperature or GPS stays unavailable until a named device supplies it.',
  },
  {
    name: 'Arrival',
    state: 'waiting',
    owner: 'Buyer',
    nextTitle: 'Record the arrival decision',
    nextDescription:
      'The buyer compares the delivered load with the agreed method and records acceptance, a reservation or a claim with evidence.',
  },
  {
    name: 'Accept / claim',
    state: 'waiting',
    owner: 'Direct parties',
    nextTitle: 'Close the operating record',
    nextDescription:
      'Buyer and exporter resolve payment or remedy through their direct contract, then preserve the outcome and responsibility trail.',
  },
] as const;

const evidence = [
  { item: 'Buyer requirement + acceptance method', owner: 'Buyer', state: 'verified' },
  { item: 'Packhouse + legal entity evidence', owner: 'Exporter', state: 'verified' },
  { item: 'Lot analysis + pesticide panel', owner: 'Laboratory', state: 'review' },
  { item: 'Bank coordinates', owner: 'Direct parties', state: 'restricted' },
  { item: 'Origin inspection record', owner: 'Inspector', state: 'missing' },
] as const;

const stateStyle: Record<string, { label: string; color: string; icon: typeof Check }> = {
  verified: { label: 'Verified', color: B.greenBright, icon: Check },
  review: { label: 'Review', color: B.wheat, icon: FileCheck2 },
  restricted: { label: 'Restricted', color: B.muted, icon: LockKeyhole },
  missing: { label: 'Missing', color: B.danger, icon: AlertTriangle },
};

export function ExperienceClient() {
  const [selectedPhase, setSelectedPhase] = useState(1);
  const [role, setRole] = useState('Spanish buyer');
  const [origin, setOrigin] = useState('Morocco');
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const brief = useMemo(
    () =>
      [
        'AGRITEK PILOT BRIEF — LOCAL DRAFT',
        `Role: ${role}`,
        'Product: Fresh raspberry',
        `Origin: ${origin}`,
        'Destination: Spain',
        'Need: Time-critical replacement load',
        'Required next detail: arrival window and acceptance method',
        'Boundary: buyer and exporter contract and pay directly',
      ].join('\n'),
    [origin, role],
  );

  async function copyBrief() {
    try {
      await navigator.clipboard.writeText(brief);
      setCopyFailed(false);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
      setCopyFailed(true);
    }
  }

  return (
    <main id="main-content" className="min-h-screen bg-[#070907] text-brand-cream">
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#070907]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1500px] items-center justify-between px-4 sm:px-7">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              aria-label="Back to AgriTek"
              className="rounded-lg p-2 text-white/45 transition-colors hover:bg-white/5 hover:text-white"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
                AgriTek experience
              </p>
              <p className="mt-0.5 text-sm font-bold text-white/88">Trade command room</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="status-chip status-chip--prototype">Simulated</span>
            <Link
              href="/auth/login"
              className="hidden rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-white/62 transition-colors hover:text-white sm:inline-flex"
            >
              Enter prototype
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-7 sm:py-8">
        <section
          className="mb-6 flex flex-col justify-between gap-5 xl:flex-row xl:items-end"
          aria-labelledby="experience-title"
        >
          <div>
            <span className="section-kicker">End-to-end simulation</span>
            <h1
              id="experience-title"
              className="mt-3 text-4xl font-black tracking-[-0.045em] text-white/92 sm:text-5xl"
            >
              One trade. Every handoff visible.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/45 sm:text-base">
              This walkthrough uses synthetic data to demonstrate the operating model. It does not
              book freight, approve suppliers, clear customs, move funds or represent a live
              customer load.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/42">
            <span className="rounded-full border border-white/10 px-3 py-2">AT-RSP-260801</span>
            <span className="rounded-full border border-white/10 px-3 py-2">DDP · Madrid</span>
            <span
              className="rounded-full border border-[rgba(208,102,79,0.24)] bg-[rgba(208,102,79,0.08)] px-3 py-2"
              style={{ color: B.danger }}
            >
              1 open condition
            </span>
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-[250px_minmax(0,1fr)_330px]">
          <nav
            aria-label="Trade phases"
            className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3"
          >
            <p className="px-3 pb-3 pt-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/28">
              Lifecycle
            </p>
            <div className="space-y-1">
              {phases.map((phase, index) => {
                const active = selectedPhase === index;
                return (
                  <button
                    key={phase.name}
                    type="button"
                    onClick={() => setSelectedPhase(index)}
                    aria-pressed={active}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors"
                    style={{ background: active ? `${B.wheat}12` : undefined }}
                  >
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-extrabold"
                      style={{
                        borderColor:
                          phase.state === 'complete'
                            ? `${B.greenBright}55`
                            : active
                              ? `${B.wheat}66`
                              : 'rgba(255,255,255,0.10)',
                        color:
                          phase.state === 'complete'
                            ? B.greenBright
                            : active
                              ? B.wheat
                              : 'rgba(255,255,255,0.28)',
                      }}
                    >
                      {phase.state === 'complete' ? <Check size={12} /> : index + 1}
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block text-xs font-bold"
                        style={{ color: active ? B.cream : 'rgba(244,238,220,0.55)' }}
                      >
                        {phase.name}
                      </span>
                      <span className="mt-0.5 block text-[10px] text-white/28">{phase.owner}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>

          <section className="space-y-4" aria-label="Trade operating record">
            <article className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] px-5 py-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/28">
                    Current phase
                  </p>
                  <h2 className="mt-1 text-lg font-extrabold text-white/88">
                    {phases[selectedPhase].name}
                  </h2>
                </div>
                <span className="status-chip status-chip--evidence">
                  Owner · {phases[selectedPhase].owner}
                </span>
              </div>

              <div className="relative min-h-56 overflow-hidden p-5 sm:p-7">
                <div className="route-grid absolute inset-0 opacity-40" />
                <div className="relative grid min-h-44 grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-3">
                  {[
                    { label: 'Origin', value: 'Agadir / Algarve', icon: PackageCheck },
                    { label: 'Control', value: 'Evidence gate', icon: ShieldCheck },
                    { label: 'Arrival', value: 'Madrid', icon: MapPin },
                  ].map(({ label, value, icon: Icon }, index) => (
                    <div key={label} className="contents">
                      <div className="text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/12 bg-black/30">
                          <Icon
                            size={18}
                            style={{ color: index === 1 ? B.wheat : B.greenBright }}
                          />
                        </div>
                        <p className="mt-3 text-[9px] font-bold uppercase tracking-[0.18em] text-white/27">
                          {label}
                        </p>
                        <p className="mt-1 text-xs font-bold text-white/72">{value}</p>
                      </div>
                      {index < 2 ? (
                        <div className="h-px min-w-5 bg-gradient-to-r from-[rgba(121,201,143,0.4)] via-[rgba(216,179,93,0.6)] to-white/10" />
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </article>

            <article className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025]">
              <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/28">
                    Controlled file
                  </p>
                  <h2 className="mt-1 text-base font-extrabold text-white/88">
                    Evidence readiness
                  </h2>
                </div>
                <span className="text-xs font-bold" style={{ color: B.wheat }}>
                  72% complete
                </span>
              </div>
              <div className="divide-y divide-white/[0.07]">
                {evidence.map((row) => {
                  const cfg = stateStyle[row.state];
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={row.item}
                      className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_130px_105px] sm:items-center"
                    >
                      <span className="text-sm font-medium text-white/66">{row.item}</span>
                      <span className="text-xs text-white/32">{row.owner}</span>
                      <span
                        className="flex items-center gap-2 text-xs font-bold"
                        style={{ color: cfg.color }}
                      >
                        <Icon size={13} /> {cfg.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </article>
          </section>

          <aside className="space-y-4" aria-label="Action and responsibility panel">
            <article
              className="rounded-2xl border p-5"
              style={{ borderColor: `${B.wheat}35`, background: `${B.wheat}0A` }}
            >
              <p
                className="text-[10px] font-extrabold uppercase tracking-[0.18em]"
                style={{ color: B.wheat }}
              >
                Next action
              </p>
              <h2 className="mt-3 text-xl font-extrabold leading-tight text-white/88">
                {phases[selectedPhase].nextTitle}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/45">
                {phases[selectedPhase].nextDescription}
              </p>
              <button
                type="button"
                onClick={() =>
                  setSelectedPhase((current) => Math.min(current + 1, phases.length - 1))
                }
                disabled={selectedPhase === phases.length - 1}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-extrabold transition-opacity disabled:cursor-not-allowed disabled:opacity-45"
                style={{ background: B.wheat, color: B.bg }}
              >
                {selectedPhase === phases.length - 1 ? 'Simulation complete' : 'Simulate handoff'}
                {selectedPhase < phases.length - 1 ? <ArrowRight size={14} /> : null}
              </button>
            </article>

            <article className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
              <div className="flex items-center gap-2 text-white/60">
                <UsersRound size={16} />
                <h2 className="text-sm font-bold">Named operators</h2>
              </div>
              <div className="mt-5 space-y-4">
                {[
                  ['Buyer', 'Acceptance owner'],
                  ['Exporter', 'Supply owner'],
                  ['Inspector', 'Not assigned'],
                  ['Carrier', 'Partner-dependent'],
                ].map(([name, state]) => (
                  <div key={name} className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-white/45">{name}</span>
                    <span className="font-semibold text-white/70">{state}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
              <div className="flex items-center gap-2 text-white/60">
                <ThermometerSnowflake size={16} />
                <h2 className="text-sm font-bold">Telemetry boundary</h2>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-white/36">
                No connected sensor is present in this simulation. Temperature and GPS become live
                only when a named device provider supplies signed data.
              </p>
            </article>
          </aside>
        </div>

        <section
          id="brief"
          aria-labelledby="brief-title"
          className="mt-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025]"
        >
          <div className="grid lg:grid-cols-[0.8fr_1.2fr]">
            <div className="border-b border-white/[0.08] p-6 sm:p-8 lg:border-b-0 lg:border-r">
              <span className="section-kicker">Local brief builder</span>
              <h2
                id="brief-title"
                className="mt-3 text-3xl font-black tracking-[-0.04em] text-white/90"
              >
                Turn urgency into a usable request.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/42">
                Choose a scenario and copy a structured starting brief. Nothing is submitted or
                stored.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-bold text-white/48">
                  Your role
                  <select
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-[#0d100c] px-3 py-3 text-sm text-white/80"
                  >
                    <option>Spanish buyer</option>
                    <option>Exporter / packhouse</option>
                    <option>Trade operator</option>
                  </select>
                </label>
                <label className="text-xs font-bold text-white/48">
                  Qualified origin
                  <select
                    value={origin}
                    onChange={(event) => setOrigin(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-[#0d100c] px-3 py-3 text-sm text-white/80"
                  >
                    <option>Morocco</option>
                    <option>Portugal</option>
                  </select>
                </label>
              </div>
            </div>
            <div className="p-6 sm:p-8">
              <pre className="overflow-x-auto whitespace-pre-wrap rounded-xl border border-white/[0.08] bg-black/25 p-5 font-mono text-xs leading-relaxed text-white/56">
                {brief}
              </pre>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={copyBrief}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-xs font-extrabold"
                  style={{ background: B.wheat, color: B.bg }}
                >
                  {copied ? <CheckCircle2 size={15} /> : <Clipboard size={15} />}
                  {copied ? 'Copied' : 'Copy local brief'}
                </button>
                <Link
                  href="/corridors/iberia-berries"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 px-5 text-xs font-bold text-white/58 transition-colors hover:text-white"
                >
                  Review corridor criteria <ArrowRight size={14} />
                </Link>
                <span aria-live="polite" className="text-xs text-white/34">
                  {copied
                    ? 'Brief copied to your clipboard.'
                    : copyFailed
                      ? 'Clipboard unavailable. Select the draft above to copy it.'
                      : 'No personal data requested.'}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
