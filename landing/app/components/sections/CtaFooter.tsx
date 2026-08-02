import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Banknote, FileCheck2, ShieldCheck, Sparkles } from 'lucide-react';
import { B } from '../brand';
import { FadeInUp } from '../animations';
import { pilotContactEmail, pilotContactHref } from '../../lib/pilotContact';

const boundaries = [
  { icon: Banknote, label: 'Buyer pays exporter directly' },
  { icon: FileCheck2, label: 'Buyer remains importer of record' },
  { icon: ShieldCheck, label: 'No AgriTek custody, title or credit' },
];

const pilotReviewHref = pilotContactHref('AgriTek trade exception review');

export function CtaFooter() {
  return (
    <footer id="contact" className="experience-section relative overflow-hidden bg-[#060806]">
      <span id="cta" className="absolute -top-24" aria-hidden="true" />
      <div className="route-grid absolute inset-0 opacity-25" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(216,179,93,0.13),transparent_34%),radial-gradient(circle_at_82%_78%,rgba(74,141,97,0.12),transparent_34%)]" />

      <div className="relative mx-auto max-w-7xl px-5 pb-14 pt-24 sm:px-8 lg:pt-36">
        <FadeInUp>
          <div className="mx-auto max-w-5xl text-center">
            <div
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border"
              style={{ color: B.wheat, borderColor: `${B.wheat}38`, background: `${B.wheat}10` }}
            >
              <Sparkles size={19} />
            </div>
            <p className="mt-7 text-xs font-extrabold uppercase tracking-[0.24em] text-white/35">
              A way of operating
            </p>
            <h2 className="mt-4 text-[clamp(2.8rem,7vw,7rem)] font-black leading-[0.92] tracking-[-0.06em] text-white/92">
              Power is not noise.
              <span
                className="block font-serif font-medium italic tracking-[-0.04em]"
                style={{ color: B.wheat }}
              >
                It is coordination.
              </span>
            </h2>
            <div className="mx-auto mt-10 grid max-w-3xl gap-2 text-lg font-semibold text-white/55 sm:grid-cols-5 sm:gap-4">
              {[
                'Keep your word.',
                'Show the evidence.',
                'Protect both sides.',
                'Name the next action.',
                'Leave the corridor stronger.',
              ].map((line) => (
                <span key={line} className="text-balance">
                  {line}
                </span>
              ))}
            </div>
          </div>
        </FadeInUp>

        <FadeInUp delay={0.12}>
          <div className="mx-auto mt-20 max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] shadow-[0_35px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
              <div className="p-7 sm:p-10 lg:p-12">
                <span className="status-chip status-chip--pilot">Private pilot</span>
                <h3 className="mt-6 text-4xl font-black leading-[0.98] tracking-[-0.045em] text-white/92 sm:text-5xl">
                  Bring us one
                  <span className="block" style={{ color: B.wheat }}>
                    real exception.
                  </span>
                </h3>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-white/52">
                  A Spanish buyer with a time-critical need. An export-capable packhouse with
                  qualified backup volume. One exact product, route and deadline. We will review
                  whether the workflow can help.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  {pilotReviewHref ? (
                    <a href={pilotReviewHref} className="btn-primary min-h-12 justify-center">
                      Request pilot review <ArrowRight size={17} />
                    </a>
                  ) : (
                    <Link href="/experience#brief" className="btn-primary min-h-12 justify-center">
                      Build your trade brief <ArrowRight size={17} />
                    </Link>
                  )}
                  <Link href="/auth/login" className="btn-secondary min-h-12 justify-center">
                    Open workflow prototype
                  </Link>
                </div>

                {!pilotReviewHref ? (
                  <p className="mt-4 text-xs leading-relaxed text-white/35">
                    The direct pilot inbox is being verified. The brief builder works locally and
                    does not submit your information.
                  </p>
                ) : null}
              </div>

              <div className="border-t border-white/10 bg-black/20 p-7 sm:p-10 lg:border-l lg:border-t-0 lg:p-12">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/32">
                  Transaction boundary
                </p>
                <div className="mt-6 space-y-5">
                  {boundaries.map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-3 text-sm text-white/58">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                        <Icon size={15} style={{ color: B.greenBright }} />
                      </div>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-8 border-t border-white/10 pt-6 text-xs leading-relaxed text-white/32">
                  Prototype only: no live trades, payments, custody, settlement, customs clearance,
                  guarantees or connected GPS tracking.
                </p>
              </div>
            </div>
          </div>
        </FadeInUp>

        <div className="mt-20 flex flex-col items-center justify-between gap-5 border-t border-white/[0.08] pt-7 text-xs text-white/34 sm:flex-row">
          <Link href="/" className="flex items-center gap-2" aria-label="AgriTek home">
            <span className="relative h-6 w-6 overflow-hidden rounded-md border border-white/10">
              <Image src="/logo.png" alt="" fill sizes="24px" className="object-contain p-0.5" />
            </span>
            <span>© 2026 AgriTek. Proof before promises.</span>
          </Link>
          <nav
            aria-label="Legal and contact links"
            className="flex flex-wrap items-center justify-center gap-5"
          >
            <Link href="/corridors/iberia-berries" className="transition-colors hover:text-white">
              Pilot corridor
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-white">
              Privacy draft
            </Link>
            <Link href="/terms" className="transition-colors hover:text-white">
              Pilot terms draft
            </Link>
            {pilotContactEmail ? (
              <a
                href={`mailto:${pilotContactEmail}`}
                className="transition-colors hover:text-white"
              >
                Contact
              </a>
            ) : null}
          </nav>
        </div>
      </div>
    </footer>
  );
}
