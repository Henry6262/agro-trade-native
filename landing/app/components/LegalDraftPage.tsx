import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { B } from "./brand";
import { pilotContactEmail } from "../lib/pilotContact";

type LegalDraftPageProps = {
  title: string;
  summary: string;
  children: ReactNode;
};

export function LegalDraftPage({ title, summary, children }: LegalDraftPageProps) {
  return (
    <main className="min-h-screen px-5 py-12 sm:px-8" style={{ backgroundColor: B.bg, color: B.cream }}>
      <article className="mx-auto max-w-3xl">
        <Link href="/" className="mb-10 inline-flex items-center gap-2 text-sm transition-opacity hover:opacity-80" style={{ color: B.wheat }}>
          <ArrowLeft size={15} /> Back to AgriTek
        </Link>

        <div
          className="mb-8 rounded-2xl px-5 py-4 text-sm"
          style={{ background: "rgba(232,200,112,0.07)", border: "1px solid rgba(232,200,112,0.20)", color: B.muted }}
        >
          <strong style={{ color: B.wheat }}>Operational draft — 1 August 2026.</strong>{" "}
          This page is provided for private-pilot review and is not a final legal agreement. Final pilot documents require appropriate commercial, customs, food-law, privacy and insurance review.
        </div>

        <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em]" style={{ color: B.wheat }}>
          AgriTek raspberry exception pilot
        </p>
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-5 text-lg leading-relaxed" style={{ color: B.muted }}>{summary}</p>

        <div
          className="legal-draft mt-12 space-y-10 border-t pt-10 text-[15px] leading-7"
          style={{ borderColor: "rgba(232,200,112,0.16)", color: B.muted }}
        >
          {children}
        </div>

        <div className="mt-14 border-t pt-8 text-sm" style={{ borderColor: "rgba(232,200,112,0.16)", color: B.muted }}>
          {pilotContactEmail ? (
            <>
              Questions or correction requests: {" "}
              <a href={`mailto:${pilotContactEmail}`} style={{ color: B.wheat }}>
                {pilotContactEmail}
              </a>
            </>
          ) : (
            <>The pilot contact channel is pending verification.</>
          )}
        </div>
      </article>
    </main>
  );
}
