import Image from "next/image";
import { ArrowRight, Banknote, FileCheck2, ShieldCheck } from "lucide-react";
import { B } from "../brand";
import { FadeInUp } from "../animations";
import { pilotContactEmail, pilotContactHref } from "../../lib/pilotContact";

const boundaries = [
  { icon: Banknote, label: "Buyer pays exporter directly" },
  { icon: FileCheck2, label: "Buyer remains importer of record" },
  { icon: ShieldCheck, label: "No AgriTek custody, title or credit" },
];

const pilotReviewHref = pilotContactHref("AgriTek raspberry pilot review");

export function CtaFooter() {
  return (
    <section id="cta" className="relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2560&q=85')",
            backgroundSize: "cover",
            backgroundPosition: "center 65%",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(12,9,4,0.98) 0%, rgba(12,9,4,0.84) 40%, rgba(12,9,4,0.90) 70%, rgba(12,9,4,0.98) 100%)",
          }}
        />
      </div>
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 100% 50% at 50% 0%, rgba(232,200,112,0.12) 0%, transparent 55%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 40% at 50% 100%, rgba(196,131,26,0.12) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 px-4 py-28">
        <div className="mx-auto max-w-3xl text-center">
          <FadeInUp>
            <div
              className="mb-8 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold"
              style={{
                background: "rgba(232,200,112,0.07)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(232,200,112,0.20)",
                color: B.wheat,
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: B.wheat }} />
              Private raspberry pilot · not a live marketplace
            </div>

            <h2
              className="mb-5"
              style={{
                fontSize: "clamp(2.8rem, 8vw, 6.5rem)",
                fontWeight: 900,
                letterSpacing: "-0.025em",
                lineHeight: 0.96,
              }}
            >
              <span style={{ color: B.cream }}>Bring us one</span>
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg, #E8C870 0%, #FFD770 45%, #C4831A 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  filter: "drop-shadow(0 0 40px rgba(232,200,112,0.30))",
                }}
              >
                real exception.
              </span>
            </h2>

            <p className="mx-auto mb-10 max-w-2xl text-lg sm:text-xl" style={{ color: B.muted }}>
              We are speaking with Spanish buyers and importer-repackers facing time-critical raspberry shortages, plus export-capable packhouses with qualified backup volume in Portugal or Morocco.
            </p>

            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              {pilotReviewHref ? (
                <a
                  href={pilotReviewHref}
                  className="btn-primary"
                  style={{ padding: "1rem 2.5rem", fontSize: "1.05rem" }}
                >
                  Request Pilot Review <ArrowRight size={19} />
                </a>
              ) : (
                <span
                  className="btn-primary cursor-not-allowed opacity-55"
                  aria-disabled="true"
                  title="The pilot contact channel has not been verified yet."
                  style={{ padding: "1rem 2.5rem", fontSize: "1.05rem" }}
                >
                  Pilot Contact Pending
                </span>
              )}
              <a href="/auth/login" className="btn-secondary" style={{ padding: "1rem 2rem" }}>
                Open Workflow Prototype
              </a>
            </div>

            <p className="mt-4 text-xs" style={{ color: `${B.muted}99` }}>
              Prototype only: it does not execute live trades, payments, custody, settlement or GPS tracking.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-5">
              {boundaries.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-xs" style={{ color: `${B.muted}BB` }}>
                  <Icon size={13} style={{ color: B.wheat }} />
                  {label}
                </div>
              ))}
            </div>
          </FadeInUp>
        </div>
      </div>

      <div className="relative z-10 border-t px-6 py-6" style={{ borderColor: "rgba(232,200,112,0.10)" }}>
        <div
          className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row"
          style={{ color: B.muted, fontSize: "0.82rem" }}
        >
          <div className="flex items-center gap-2">
            <div className="relative h-5 w-5">
              <Image src="/logo.png" alt="AgriTek" fill sizes="20px" className="object-contain" />
            </div>
            <span>&copy; 2026 AgriTek by AgroTrade. Private pilot.</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <a href="/privacy" className="transition-colors hover:text-white">Privacy draft</a>
            <a href="/terms" className="transition-colors hover:text-white">Pilot terms draft</a>
            {pilotContactEmail ? (
              <a href={`mailto:${pilotContactEmail}`} className="transition-colors hover:text-white">
                {pilotContactEmail}
              </a>
            ) : (
              <span>Pilot contact pending verification</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
