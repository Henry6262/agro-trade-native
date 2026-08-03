import { BriefcaseBusiness, ClipboardCheck, PackageCheck, ShoppingCart, Truck } from 'lucide-react';
import { B } from '../brand';
import { FadeInUp } from '../animations';

const journeys = [
  {
    number: '01',
    role: 'Buyer / importer',
    promise: 'Turn a requirement into a controlled decision.',
    icon: ShoppingCart,
    steps: [
      'Define specification and arrival window',
      'Review qualified supply and open conditions',
      'Accept—or raise a claim—with one evidence record',
    ],
  },
  {
    number: '02',
    role: 'Exporter / packhouse',
    promise: 'Prove readiness before fruit begins to move.',
    icon: PackageCheck,
    steps: [
      'Declare capacity, lot and pack format',
      'Complete the document and evidence gate',
      'Coordinate pickup under the direct sale contract',
    ],
  },
  {
    number: '03',
    role: 'Inspector',
    promise: 'Make professional judgment legible to every party.',
    icon: ClipboardCheck,
    steps: [
      'Receive a precise inspection scope',
      'Capture comparable photos, samples and results',
      'Sign a timestamped finding with open exceptions',
    ],
  },
  {
    number: '04',
    role: 'Logistics',
    promise: 'Move the load with milestones everyone understands.',
    icon: Truck,
    steps: [
      'Confirm equipment, route and handover plan',
      'Record pickup and transport evidence',
      'Deliver a clear arrival record to the buyer',
    ],
  },
  {
    number: '05',
    role: 'Operator',
    promise: 'Keep the chain moving without hiding responsibility.',
    icon: BriefcaseBusiness,
    steps: [
      'Watch gates, owners and deadlines',
      'Escalate exceptions to the right decision-maker',
      'Preserve the complete operational history',
    ],
  },
] as const;

export function RoleJourneysSection() {
  return (
    <section
      id="role-journeys"
      aria-labelledby="role-journeys-title"
      className="relative overflow-hidden px-6 py-24 lg:px-16 lg:py-32"
      style={{ backgroundColor: B.bg2 }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(115deg, rgba(61,122,80,0.08), transparent 38%), radial-gradient(ellipse 45% 55% at 92% 15%, rgba(232,200,112,0.07), transparent 70%)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl">
        <FadeInUp>
          <div className="grid gap-7 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <span className="text-label" style={{ color: B.wheat }}>
                Five roles. One shared reality.
              </span>
              <h2
                id="role-journeys-title"
                className="mt-4"
                style={{
                  color: B.cream,
                  fontSize: 'clamp(2.1rem, 5vw, 4.2rem)',
                  fontWeight: 900,
                  letterSpacing: '-0.025em',
                  lineHeight: 1.03,
                }}
              >
                Every person sees the next move.
              </h2>
            </div>
            <p
              className="max-w-2xl text-base leading-relaxed sm:text-lg lg:justify-self-end"
              style={{ color: B.muted }}
            >
              Global trade becomes usable when each participant can see what they own, what evidence
              is missing and who acts next—without learning a new financial language first.
            </p>
          </div>
        </FadeInUp>

        <div className="mt-14 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {journeys.map(({ number, role, promise, icon: Icon, steps }, index) => (
            <FadeInUp key={role} delay={Math.min(index * 0.05, 0.2)} className="h-full">
              <article
                className="group relative flex h-full flex-col overflow-hidden rounded-3xl p-6"
                style={{
                  background: index === 0 ? 'rgba(61,122,80,0.10)' : 'rgba(255,255,255,0.025)',
                  border:
                    index === 0
                      ? `1px solid ${B.borderStrong}`
                      : '1px solid rgba(240,229,204,0.10)',
                  boxShadow: '0 14px 45px rgba(0,0,0,0.24)',
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="font-mono text-xs font-bold tracking-[0.18em]"
                    style={{ color: B.muted }}
                  >
                    {number}
                  </span>
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{
                      color: B.greenBright,
                      background: 'rgba(52,211,153,0.09)',
                      border: '1px solid rgba(52,211,153,0.18)',
                    }}
                  >
                    <Icon aria-hidden="true" size={18} />
                  </div>
                </div>

                <h3 className="mt-8 text-lg font-extrabold" style={{ color: B.cream }}>
                  {role}
                </h3>
                <p
                  className="mt-2 text-sm font-semibold leading-relaxed"
                  style={{ color: B.wheat }}
                >
                  {promise}
                </p>

                <ol className="mt-6 space-y-4" aria-label={`${role} journey`}>
                  {steps.map((step, stepIndex) => (
                    <li
                      key={step}
                      className="flex gap-3 text-xs leading-relaxed"
                      style={{ color: B.muted }}
                    >
                      <span
                        aria-hidden="true"
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold"
                        style={{ color: B.greenBright, border: '1px solid rgba(52,211,153,0.22)' }}
                      >
                        {stepIndex + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </article>
            </FadeInUp>
          ))}
        </div>
      </div>
    </section>
  );
}
