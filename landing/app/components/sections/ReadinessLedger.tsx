import { CheckCircle2, FlaskConical, RadioTower, type LucideIcon } from 'lucide-react';
import { B } from '../brand';
import { FadeInUp } from '../animations';

interface ReadinessColumn {
  status: string;
  summary: string;
  icon: LucideIcon;
  accent: string;
  tint: string;
  border: string;
  items: readonly string[];
}

const readiness: ReadinessColumn[] = [
  {
    status: 'Built',
    summary: 'Present in the working product',
    icon: CheckCircle2,
    accent: B.greenBright,
    tint: 'rgba(52,211,153,0.07)',
    border: 'rgba(52,211,153,0.22)',
    items: [
      'Role-based web and mobile workflows',
      'Structured trade lifecycle and permissions',
      'Listings, negotiation, inspection and transport surfaces',
      'Notifications, traceability and audit records',
    ],
  },
  {
    status: 'Tested',
    summary: 'Validated in controlled environments',
    icon: FlaskConical,
    accent: B.wheat,
    tint: 'rgba(216,179,93,0.06)',
    border: 'rgba(216,179,93,0.20)',
    items: [
      'Automated unit, contract and journey checks',
      'Database migrations and API contracts',
      'Escrow code paths and contract implementations',
      'Representative trade and exception scenarios',
    ],
  },
  {
    status: 'Not yet live',
    summary: 'Requires production partners or release gates',
    icon: RadioTower,
    accent: B.danger,
    tint: 'rgba(196,101,74,0.06)',
    border: 'rgba(196,101,74,0.22)',
    items: [
      'Customer-fund custody or production settlement',
      'Licensed customs, insurance and compliance services',
      'Verified global trading corridors and partnerships',
      'Live GPS, sensor or autonomous-inspection telemetry',
    ],
  },
];

export function ReadinessLedger() {
  return (
    <section
      id="readiness"
      aria-labelledby="readiness-title"
      className="relative overflow-hidden px-6 py-24 lg:px-16 lg:py-32"
      style={{ backgroundColor: '#080704' }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(216,179,93,0.22), transparent)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl">
        <FadeInUp>
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-label" style={{ color: B.greenBright }}>
              The readiness ledger
            </span>
            <h2
              id="readiness-title"
              className="mt-4"
              style={{
                color: B.cream,
                fontSize: 'clamp(2.1rem, 5vw, 4.2rem)',
                fontWeight: 900,
                letterSpacing: '-0.025em',
                lineHeight: 1.03,
              }}
            >
              Trust begins with saying what is real.
            </h2>
            <p
              className="mx-auto mt-5 max-w-2xl text-base leading-relaxed sm:text-lg"
              style={{ color: B.muted }}
            >
              A credible platform shows its progress and its boundaries in the same view. Prototype,
              pilot and vision are different stages—not interchangeable promises.
            </p>
          </div>
        </FadeInUp>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {readiness.map(({ status, summary, icon: Icon, accent, tint, border, items }, index) => (
            <FadeInUp key={status} delay={index * 0.06} className="h-full">
              <article
                aria-label={`${status}: ${summary}`}
                className="h-full rounded-3xl p-6 sm:p-7"
                style={{ background: tint, border: `1px solid ${border}` }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                    style={{
                      color: accent,
                      background: `${accent}12`,
                      border: `1px solid ${accent}2A`,
                    }}
                  >
                    <Icon aria-hidden="true" size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold" style={{ color: accent }}>
                      {status}
                    </h3>
                    <p className="mt-1 text-xs" style={{ color: B.muted }}>
                      {summary}
                    </p>
                  </div>
                </div>

                <ul className="mt-7 space-y-3" aria-label={`${status} capabilities`}>
                  {items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-sm leading-relaxed"
                      style={{ color: B.cream }}
                    >
                      <span
                        aria-hidden="true"
                        className="mt-[0.6rem] h-px w-4 shrink-0"
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

        <FadeInUp delay={0.18}>
          <p
            className="mx-auto mt-9 max-w-3xl text-center text-sm font-semibold leading-relaxed"
            style={{ color: B.muted }}
          >
            The product can demonstrate the whole trade journey today. Live commerce begins only
            when the named corridor, operators, contracts and regulated services are verified.
          </p>
        </FadeInUp>
      </div>
    </section>
  );
}
