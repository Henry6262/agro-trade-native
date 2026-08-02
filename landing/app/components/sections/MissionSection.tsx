import { Eye, HeartHandshake, Home, Sprout } from 'lucide-react';
import { B } from '../brand';
import { FadeInUp } from '../animations';

const principles = [
  {
    icon: Eye,
    title: 'Evidence over promises',
    text: 'People deserve to see the requirement, the owner, the open condition and the proof behind every decision.',
  },
  {
    icon: Home,
    title: 'Local value, global reach',
    text: 'Cross-border demand should create stronger businesses and durable ownership in the communities that produce the harvest.',
  },
  {
    icon: HeartHandshake,
    title: 'Dignity in every role',
    text: 'Growers, buyers, inspectors, drivers and operators should be visible, accountable and paid for the value they actually create.',
  },
] as const;

export function MissionSection() {
  return (
    <section
      id="mission"
      aria-labelledby="mission-title"
      className="relative overflow-hidden px-6 py-28 lg:px-16 lg:py-40"
      style={{ backgroundColor: B.bg }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 52% 70% at 12% 45%, rgba(208,102,79,0.09) 0%, transparent 68%), radial-gradient(ellipse 55% 70% at 88% 55%, rgba(74,141,97,0.12) 0%, transparent 68%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-full w-px"
        style={{
          background: 'linear-gradient(to bottom, transparent, rgba(216,179,93,0.14), transparent)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <FadeInUp>
            <div className="lg:sticky lg:top-28 lg:self-start">
              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em]"
                style={{
                  color: B.danger,
                  background: 'rgba(196,101,74,0.07)',
                  border: '1px solid rgba(196,101,74,0.20)',
                }}
              >
                <Sprout aria-hidden="true" size={13} />
                The mission
              </div>
              <p
                className="mt-7 font-black uppercase"
                style={{
                  color: B.muted,
                  fontSize: 'clamp(0.8rem, 1.2vw, 1rem)',
                  letterSpacing: '0.2em',
                }}
              >
                The enemy is opacity.
              </p>
              <h2
                id="mission-title"
                className="mt-4"
                style={{
                  color: B.cream,
                  fontSize: 'clamp(2.8rem, 7vw, 6.6rem)',
                  fontWeight: 950,
                  letterSpacing: '-0.035em',
                  lineHeight: 0.96,
                }}
              >
                Trade should create
                <span className="block" style={{ color: B.greenBright }}>
                  home, not exile.
                </span>
              </h2>
            </div>
          </FadeInUp>

          <div>
            <FadeInUp delay={0.06}>
              <blockquote
                className="border-l-2 pl-6 text-xl font-semibold leading-relaxed sm:pl-8 sm:text-2xl"
                style={{ color: B.cream, borderColor: B.wheat }}
              >
                A young person should not have to leave home to prove their value. A family abroad
                should be able to invest back into productive work without entering a maze of hidden
                fees, fragmented records and blind trust.
              </blockquote>
              <p className="mt-8 text-base leading-relaxed sm:text-lg" style={{ color: B.muted }}>
                The goal is not trade at any cost. It is trade that strengthens the places where
                value is created: clearer ownership, visible responsibility, fairer access to
                opportunity and a record strong enough to cross borders.
              </p>
            </FadeInUp>

            <div className="mt-12 space-y-4">
              {principles.map(({ icon: Icon, title, text }, index) => (
                <FadeInUp key={title} delay={0.1 + index * 0.05}>
                  <article
                    className="grid gap-4 rounded-2xl p-5 sm:grid-cols-[auto_1fr] sm:items-start sm:p-6"
                    style={{
                      background: 'rgba(255,255,255,0.025)',
                      border: '1px solid rgba(240,229,204,0.10)',
                    }}
                  >
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-2xl"
                      style={{
                        color: B.greenBright,
                        background: 'rgba(52,211,153,0.08)',
                        border: '1px solid rgba(52,211,153,0.18)',
                      }}
                    >
                      <Icon aria-hidden="true" size={19} />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold" style={{ color: B.cream }}>
                        {title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed" style={{ color: B.muted }}>
                        {text}
                      </p>
                    </div>
                  </article>
                </FadeInUp>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
