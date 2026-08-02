'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import {
  PILOT_LEAD_ROLES,
  PILOT_LEAD_ROLE_LABELS,
  type PilotLeadRole,
} from '../../lib/pilotLeadContract.ts';
import { B } from '../brand';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

type PilotLeadResponse = {
  error?: string;
  reference?: string;
};

const fieldClassName =
  'mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-3.5 py-3 text-sm text-white/82 outline-none transition-colors placeholder:text-white/24 focus-visible:border-[#D8B35D]/70 focus-visible:ring-2 focus-visible:ring-[#D8B35D]/25';

export function PilotLeadForm() {
  const successRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState<PilotLeadRole | ''>('');
  const [tradeBrief, setTradeBrief] = useState('');
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState('');
  const [state, setState] = useState<FormState>('idle');
  const [feedback, setFeedback] = useState('');
  const [reference, setReference] = useState('');

  useEffect(() => {
    if (state === 'success') successRef.current?.focus();
  }, [state]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === 'submitting') return;

    setState('submitting');
    setFeedback('');
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 15_000);

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, company, role, tradeBrief, consent, website }),
        signal: controller.signal,
      });
      const payload = (await response.json().catch(() => ({}))) as PilotLeadResponse;

      if (!response.ok) {
        setState('error');
        setFeedback(payload.error ?? 'Your request could not be delivered. Please try again.');
        return;
      }

      setReference(payload.reference ?? '');
      setState('success');
    } catch (error) {
      setState('error');
      setFeedback(
        error instanceof DOMException && error.name === 'AbortError'
          ? 'Delivery could not be confirmed within 15 seconds. It may still have reached the review inbox; wait before retrying.'
          : 'Network error. Your information was not confirmed as delivered.',
      );
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  if (state === 'success') {
    return (
      <div
        ref={successRef}
        className="mt-8 rounded-2xl border px-5 py-6"
        style={{ borderColor: `${B.greenBright}42`, background: `${B.greenBright}0D` }}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        tabIndex={-1}
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 shrink-0" size={20} style={{ color: B.greenBright }} />
          <div>
            <p className="text-base font-extrabold text-white/90">Request delivered for review.</p>
            <p className="mt-2 text-xs leading-relaxed text-white/48">
              This confirms delivery only. It is not pilot acceptance or a commitment to coordinate
              a load.
            </p>
            {reference ? (
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-white/34">
                Reference {reference}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <form className="relative mt-8" aria-busy={state === 'submitting'} onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-bold text-white/52">
          Your name
          <input
            className={fieldClassName}
            type="text"
            name="name"
            autoComplete="name"
            minLength={2}
            maxLength={80}
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>

        <label className="text-xs font-bold text-white/52">
          Work email
          <input
            className={fieldClassName}
            type="email"
            name="email"
            autoComplete="email"
            maxLength={254}
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label className="text-xs font-bold text-white/52">
          Company
          <input
            className={fieldClassName}
            type="text"
            name="company"
            autoComplete="organization"
            minLength={2}
            maxLength={120}
            required
            value={company}
            onChange={(event) => setCompany(event.target.value)}
          />
        </label>

        <label className="text-xs font-bold text-white/52">
          Your role
          <select
            className={fieldClassName}
            name="role"
            required
            value={role}
            onChange={(event) => setRole(event.target.value as PilotLeadRole | '')}
          >
            <option value="" disabled>
              Select a role
            </option>
            {PILOT_LEAD_ROLES.map((roleValue) => (
              <option key={roleValue} value={roleValue}>
                {PILOT_LEAD_ROLE_LABELS[roleValue]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-4 block text-xs font-bold text-white/52">
        The trade exception
        <span className="mt-1 block font-normal leading-relaxed text-white/32">
          Include product, origin, destination, approximate volume, arrival deadline and what went
          wrong.
        </span>
        <textarea
          className={`${fieldClassName} min-h-32 resize-y`}
          name="tradeBrief"
          minLength={20}
          maxLength={1500}
          required
          value={tradeBrief}
          onChange={(event) => setTradeBrief(event.target.value)}
        />
      </label>

      <div
        className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden"
        aria-hidden="true"
      >
        <label>
          Website
          <input
            type="text"
            name="website"
            autoComplete="off"
            tabIndex={-1}
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
          />
        </label>
      </div>

      <label className="mt-5 flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-white/42">
        <input
          className="mt-0.5 h-4 w-4 shrink-0 accent-[#D8B35D]"
          type="checkbox"
          name="consent"
          required
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
        />
        <span>
          I agree that AgriTek may use this submission to review my pilot request and contact me
          about it. Read the{' '}
          <Link
            href="/privacy"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 hover:text-white"
          >
            privacy draft<span className="sr-only"> (opens in a new tab)</span>
          </Link>
          .
        </span>
      </label>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={state === 'submitting'}
          className="btn-primary min-h-12 justify-center disabled:cursor-wait disabled:opacity-65"
        >
          {state === 'submitting' ? (
            <>
              <Loader2 size={17} className="animate-spin" /> Delivering securely
            </>
          ) : (
            <>
              Send for pilot review <ArrowRight size={17} />
            </>
          )}
        </button>
        <p className="text-[11px] leading-relaxed text-white/30">
          Submission does not create a trade, contract or guarantee.
        </p>
      </div>

      <p
        className={`mt-4 min-h-5 text-xs ${state === 'error' ? 'text-[#D9826D]' : 'text-white/34'}`}
        aria-live="polite"
      >
        {state === 'error' ? feedback : ''}
      </p>
    </form>
  );
}
