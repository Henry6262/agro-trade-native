'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  Route,
  ShieldCheck,
  Wheat,
} from 'lucide-react';
import { useAuth } from '@/app/hooks/useAuth';

const trustBoundaries = [
  {
    icon: FileCheck2,
    title: 'Evidence coordination',
    detail: 'A structured workflow for requirements, documents and handoffs.',
  },
  {
    icon: ShieldCheck,
    title: 'Direct commercial relationship',
    detail: 'The buyer and exporter contract and pay each other directly.',
  },
  {
    icon: CheckCircle2,
    title: 'Honest prototype boundary',
    detail: 'No live trade, custody, settlement, customs clearance or GPS data.',
  },
];

export default function LoginPage() {
  const { login, isAuthenticated, isLoading, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  return (
    <main className="relative min-h-svh overflow-hidden bg-[#080704] text-brand-cream">
      <div className="absolute inset-0 lg:right-[39%]" aria-hidden="true">
        <Image
          src="/visuals/agritek-cold-chain-hero.jpg"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 61vw, 100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,7,4,0.42)_0%,rgba(8,7,4,0.74)_70%,#080704_100%)] lg:bg-[linear-gradient(90deg,rgba(8,7,4,0.38)_0%,rgba(8,7,4,0.58)_58%,#080704_100%)]" />
      </div>
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(circle at 16% 34%, rgba(232,200,112,0.16), transparent 34%), radial-gradient(circle at 86% 18%, rgba(61,122,80,0.12), transparent 28%)',
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-svh w-full max-w-[1600px] flex-col">
        <header className="flex items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
          <Link
            href="/"
            className="group inline-flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-wheat focus-visible:ring-offset-4 focus-visible:ring-offset-[#080704]"
            aria-label="AgriTek homepage"
          >
            <span className="flex size-10 items-center justify-center rounded-xl border border-brand-wheat/30 bg-[#0C0904]/80 shadow-[0_0_30px_rgba(232,200,112,0.12)] backdrop-blur-xl">
              <Wheat className="size-5 text-brand-wheat" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-base font-black tracking-tight text-brand-cream">
                AgriTek
              </span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-wheat/70">
                Trade operations
              </span>
            </span>
          </Link>

          <span className="rounded-full border border-brand-wheat/25 bg-[#0C0904]/75 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-wheat backdrop-blur-xl">
            Prototype
          </span>
        </header>

        <div className="grid flex-1 items-center gap-12 px-5 pb-12 pt-6 sm:px-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.72fr)] lg:px-12 lg:pb-16 lg:pt-0">
          <section className="max-w-3xl pt-16 sm:pt-24 lg:pt-0" aria-labelledby="login-mission">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-3 py-1.5 text-xs font-semibold text-brand-cream/80 backdrop-blur-xl">
              <Route className="size-3.5 text-brand-wheat" aria-hidden="true" />
              Morocco / Portugal
              <ArrowRight className="size-3 text-brand-wheat/70" aria-hidden="true" />
              Spain
            </div>

            <h1
              id="login-mission"
              className="max-w-3xl text-5xl font-black leading-[0.96] tracking-[-0.045em] text-brand-cream sm:text-6xl lg:text-7xl xl:text-[5.4rem]"
            >
              Move food.
              <br />
              Move trust.
              <br />
              <span className="text-brand-wheat">Keep value close to home.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-7 text-brand-cream/70 sm:text-lg">
              A calm, evidence-backed workspace for cross-border produce operations—starting with a
              controlled raspberry replacement-load pilot into Spain.
            </p>

            <div className="mt-9 grid max-w-2xl gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4 backdrop-blur-xl">
                <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-brand-wheat/75">
                  Mission
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-brand-cream">
                  Trade should create home, not exile.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4 backdrop-blur-xl">
                <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-brand-wheat/75">
                  Working principle
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-brand-cream">
                  One next action. One readiness state. One event record.
                </p>
              </div>
            </div>
          </section>

          <section
            className="w-full max-w-lg justify-self-end rounded-[1.75rem] border border-white/12 bg-[#0C0A06]/90 p-5 shadow-[0_28px_100px_rgba(0,0,0,0.58)] backdrop-blur-2xl sm:p-7"
            aria-labelledby="prototype-entry-title"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-wheat">
                  Controlled access
                </p>
                <h2 id="prototype-entry-title" className="mt-2 text-2xl font-black tracking-tight">
                  Enter the workflow
                </h2>
              </div>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/8 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-300">
                Prototype
              </span>
            </div>

            <div className="mt-5 rounded-2xl border border-brand-wheat/15 bg-brand-wheat/[0.045] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-brand-cream">Private pilot context</p>
                  <p className="mt-1 text-xs leading-5 text-text-muted">
                    Fresh raspberry · Morocco / Portugal → Spain
                  </p>
                </div>
                <Route className="size-5 shrink-0 text-brand-wheat" aria-hidden="true" />
              </div>
            </div>

            <div id="prototype-boundary" className="mt-5 space-y-4">
              {trustBoundaries.map(({ icon: Icon, title, detail }) => (
                <div key={title} className="flex gap-3">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.035]">
                    <Icon className="size-4 text-brand-wheat" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-brand-cream">{title}</p>
                    <p className="mt-0.5 text-xs leading-5 text-text-muted">{detail}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={login}
              disabled={isLoading}
              aria-busy={isLoading}
              aria-describedby="prototype-boundary"
              className="btn-primary mt-7 w-full justify-center py-4 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-wheat focus-visible:ring-offset-2 focus-visible:ring-offset-[#0C0A06] disabled:cursor-wait disabled:opacity-60"
            >
              {isLoading ? (
                <span className="flex items-center gap-2" aria-live="polite">
                  <svg className="size-5 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Connecting securely…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Enter Prototype <ArrowRight className="size-4" aria-hidden="true" />
                </span>
              )}
            </button>

            {error && (
              <p
                className="mt-4 rounded-xl border border-red-400/20 bg-red-400/8 px-3 py-2 text-center text-sm text-red-300"
                role="alert"
              >
                {error}
              </p>
            )}

            <p className="mt-4 text-center text-xs leading-5 text-text-muted">
              Authentication provides access to demonstration role flows only.
            </p>

            <Link
              href="/"
              className="mt-6 flex items-center justify-center gap-2 border-t border-white/10 pt-5 text-sm font-semibold text-text-muted transition-colors hover:text-brand-wheat focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-wheat"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Return to the public pilot page
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}
