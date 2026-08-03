import { Building2, FileCheck2, Handshake, Layers3, Scale, ShieldCheck } from 'lucide-react';
import { B } from '../brand';
import { FadeInUp } from '../animations';

const platformCapabilities = [
  'Identity, roles and permissions',
  'Buyer requirements and qualified supply',
  'Negotiation and named approvals',
  'Document, inspection and cold-chain evidence',
  'Logistics milestones, exceptions and audit history',
];

const directPartyResponsibilities = [
  'Commercial terms and direct sale contract',
  'Importer and exporter-of-record obligations',
  'Payment instructions, title and custody',
  'Acceptance, claims and commercial remedies',
];

const partnerDependentServices = [
  'Accredited laboratories and inspectors',
  'Customs representatives and border agents',
  'Licensed carriers, insurers and payment providers',
  'KYC, sanctions and regulatory specialists',
];

const layers = [
  {
    label: 'AgriTek platform',
    eyebrow: 'Coordinates',
    icon: Layers3,
    items: platformCapabilities,
    accent: B.greenBright,
    tint: 'rgba(52,211,153,0.07)',
    border: 'rgba(52,211,153,0.22)',
  },
  {
    label: 'Buyer + exporter',
    eyebrow: 'Remain responsible',
    icon: Handshake,
    items: directPartyResponsibilities,
    accent: B.wheat,
    tint: 'rgba(216,179,93,0.06)',
    border: 'rgba(216,179,93,0.20)',
  },
  {
    label: 'Specialist partners',
    eyebrow: 'Execute when engaged',
    icon: Building2,
    items: partnerDependentServices,
    accent: B.cream,
    tint: 'rgba(240,229,204,0.04)',
    border: 'rgba(240,229,204,0.14)',
  },
] as const;

const operatingPrinciples = [
  { icon: FileCheck2, label: 'One evidence picture' },
  { icon: Scale, label: 'Responsibility stays visible' },
  { icon: ShieldCheck, label: 'No invented guarantees' },
];

export function TradeStackSection() {
  return (
    <section
      id="platform"
      aria-labelledby="trade-stack-title"
      className="relative overflow-hidden px-6 py-24 lg:px-16 lg:py-32"
      style={{ backgroundColor: B.bg }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 45%, rgba(74,141,97,0.10) 0%, transparent 68%)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl">
        <FadeInUp>
          <div className="max-w-4xl">
            <span className="text-label" style={{ color: B.greenBright }}>
              The trade stack
            </span>
            <h2
              id="trade-stack-title"
              className="mt-4"
              style={{
                color: B.cream,
                fontSize: 'clamp(2.1rem, 5vw, 4.4rem)',
                fontWeight: 900,
                letterSpacing: '-0.025em',
                lineHeight: 1.02,
              }}
            >
              Everything a serious trade needs to see—
              <span className="block" style={{ color: B.greenBright }}>
                without pretending one company does everything.
              </span>
            </h2>
            <p
              className="mt-6 max-w-3xl text-base leading-relaxed sm:text-lg"
              style={{ color: B.muted }}
            >
              AgriTek creates one operating picture across the transaction. The platform coordinates
              the workflow; the trading parties keep their legal and commercial responsibilities;
              qualified specialists perform regulated work corridor by corridor.
            </p>
          </div>
        </FadeInUp>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {layers.map(({ label, eyebrow, icon: Icon, items, accent, tint, border }, index) => (
            <FadeInUp key={label} delay={index * 0.06} className="h-full">
              <article
                className="relative h-full overflow-hidden rounded-3xl p-6 sm:p-7"
                style={{
                  background: tint,
                  border: `1px solid ${border}`,
                  boxShadow: '0 18px 55px rgba(0,0,0,0.28)',
                }}
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-px"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
                  }}
                />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-label" style={{ color: accent }}>
                      {eyebrow}
                    </p>
                    <h3 className="mt-2 text-xl font-extrabold" style={{ color: B.cream }}>
                      {label}
                    </h3>
                  </div>
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                    style={{
                      color: accent,
                      background: `${accent}12`,
                      border: `1px solid ${accent}28`,
                    }}
                  >
                    <Icon aria-hidden="true" size={20} />
                  </div>
                </div>

                <ul className="mt-7 space-y-3" aria-label={`${label} responsibilities`}>
                  {items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-sm leading-relaxed"
                      style={{ color: B.muted }}
                    >
                      <span
                        aria-hidden="true"
                        className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: accent }}
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </FadeInUp>
          ))}
        </div>

        <FadeInUp delay={0.16}>
          <div
            className="mt-6 grid gap-3 rounded-2xl px-5 py-5 sm:grid-cols-3 sm:px-7"
            style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid ${B.borderStrong}` }}
          >
            {operatingPrinciples.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-3 text-sm font-semibold"
                style={{ color: B.cream }}
              >
                <Icon aria-hidden="true" size={17} style={{ color: B.greenBright }} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </FadeInUp>
      </div>
    </section>
  );
}
