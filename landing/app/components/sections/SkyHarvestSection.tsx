"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle, Loader2, Plane, Sprout, ShieldCheck, Wallet, MapPin, TrendingUp } from "lucide-react";
import { B } from "../brand";
import { FadeInUp } from "../animations";

const PILOT_ROLES = ["Pilot Farmer", "HarvestShares Buyer"] as const;
type PilotRole = (typeof PILOT_ROLES)[number];
type FormState = "idle" | "loading" | "success" | "error";

function PilotSignupForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<PilotRole | "">("");
  const [location, setLocation] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !role) return;
    setState("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: `${role}${location ? ` — ${location}` : ""}` }),
      });
      if (res.ok) {
        setState("success");
      } else {
        const data = await res.json();
        setErrorMsg(data.error ?? "Something went wrong");
        setState("error");
      }
    } catch {
      setErrorMsg("Network error — please try again");
      setState("error");
    }
  };

  if (state === "success") {
    return (
      <div className="flex flex-col items-center gap-4 py-8 px-6 rounded-2xl"
        style={{
          background: "rgba(61,122,80,0.08)",
          border: "1px solid rgba(61,122,80,0.22)",
          boxShadow: "0 0 40px rgba(61,122,80,0.10)",
        }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: "rgba(61,122,80,0.12)", border: "1.5px solid rgba(61,122,80,0.30)" }}>
          <CheckCircle size={24} color={B.green} />
        </div>
        <p className="text-xl font-extrabold" style={{ color: B.cream }}>
          You&apos;re on the pilot list.
        </p>
        <p className="text-sm text-center max-w-sm" style={{ color: B.muted }}>
          We&apos;ll reach out when the SkyHarvest pilot launches in your region.
          <br />Balkans & Spain first.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {PILOT_ROLES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className="px-3 py-2.5 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: role === r ? "rgba(61,122,80,0.14)" : "rgba(61,122,80,0.04)",
              border: role === r ? `1px solid ${B.green}` : `1px solid rgba(61,122,80,0.12)`,
              color: role === r ? B.green : B.muted,
              boxShadow: role === r ? "0 0 16px rgba(61,122,80,0.18)" : "none",
            }}
          >
            {r}
          </button>
        ))}
      </div>

      <input
        type="text"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Location (e.g., Dobrich, Badajoz...)"
        className="w-full rounded-xl px-4 py-2.5 text-sm outline-none placeholder:opacity-35"
        style={{
          background: "rgba(61,122,80,0.04)",
          border: `1px solid rgba(61,122,80,0.14)`,
          color: B.cream,
        }}
      />

      <div className="flex items-center rounded-2xl overflow-hidden p-1.5 gap-2"
        style={{
          background: "rgba(61,122,80,0.05)",
          border: `1px solid rgba(61,122,80,0.18)`,
          backdropFilter: "blur(16px)",
        }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="flex-1 bg-transparent px-4 py-2.5 text-sm outline-none placeholder:opacity-35"
          style={{ color: B.cream }}
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95 shrink-0"
          style={{
            backgroundColor: B.green,
            color: B.bg,
            opacity: state === "loading" ? 0.7 : 1,
            boxShadow: "0 0 24px rgba(61,122,80,0.30)",
          }}
        >
          {state === "loading" ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <>Apply <ArrowRight size={14} /></>
          )}
        </button>
      </div>

      {state === "error" && (
        <p className="text-xs text-center" style={{ color: B.danger }}>{errorMsg}</p>
      )}

      <p className="text-xs text-center" style={{ color: `${B.muted}88` }}>
        Pilot launches Q3 2026. No commitment required.
      </p>
    </form>
  );
}

export function SkyHarvestSection() {
  return (
    <section id="skyharvest" className="relative overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 z-0" style={{
        background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(61,122,80,0.10) 0%, transparent 60%)",
      }} />

      <div className="relative z-10 py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <FadeInUp>
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
              style={{
                background: "rgba(61,122,80,0.07)",
                backdropFilter: "blur(12px)",
                border: `1px solid rgba(61,122,80,0.20)`,
                color: B.green,
              }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: B.green }} />
              Coming Q3 2026 — Pilot Program
            </div>
          </FadeInUp>

          <FadeInUp delay={0.06}>
            <h2 className="mb-4" style={{
              fontSize: "clamp(2.2rem, 6vw, 4.2rem)",
              fontWeight: 900,
              letterSpacing: "-0.025em",
              lineHeight: 1.05,
            }}>
              <span style={{ color: B.cream }}>SkyInspect</span>
              <span style={{ color: B.muted }}> + </span>
              <span style={{
                background: `linear-gradient(135deg, ${B.greenLight} 0%, ${B.greenBright} 50%, ${B.green} 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                HarvestShares
              </span>
            </h2>
          </FadeInUp>

          <FadeInUp delay={0.1}>
            <p className="text-base sm:text-lg leading-relaxed mb-4 max-w-2xl" style={{ color: B.muted }}>
              China flies <span className="font-semibold" style={{ color: B.cream }}>28,000 agricultural drones every day</span>.
              They proved autonomous crop inspection works. Pinduoduo proved farmers can get paid before harvest.
            </p>
            <p className="text-base sm:text-lg leading-relaxed mb-10 max-w-2xl" style={{ color: B.muted }}>
              We&apos;re building the <span className="font-semibold" style={{ color: B.cream }}>EU-compliant, institutional-grade version</span> —
              with EBSI-verifiable credentials, cross-border stablecoin settlement, and FINMA-ready custody.
              For the Balkans and Spain.
            </p>
          </FadeInUp>

          {/* Feature cards */}
          <FadeInUp delay={0.14}>
            <div className="grid sm:grid-cols-3 gap-4 mb-10">
              {[
                {
                  icon: Plane,
                  title: "45-Second Inspection",
                  desc: "Drone lands, extracts sample, runs NIR spectrometry. Result on dashboard before the inspector would have left the office.",
                },
                {
                  icon: Sprout,
                  title: "HarvestShares",
                  desc: "Buyers purchase fractional crop ownership before planting. Farmers get working capital in winter — no predatory loans.",
                },
                {
                  icon: ShieldCheck,
                  title: "EBSI Verified",
                  desc: "Every inspection issues a verifiable credential on the European Blockchain Services Infrastructure. Cross-border recognized.",
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-2xl p-5 transition-all hover:brightness-110"
                  style={{
                    background: B.card,
                    border: `1px solid ${B.border}`,
                    boxShadow: B.glassShadow,
                  }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: "rgba(61,122,80,0.10)", border: `1px solid rgba(61,122,80,0.18)` }}>
                    <Icon size={20} style={{ color: B.green }} />
                  </div>
                  <h3 className="text-sm font-bold mb-1.5" style={{ color: B.cream }}>{title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: B.muted }}>{desc}</p>
                </div>
              ))}
            </div>
          </FadeInUp>

          {/* Pilot stats bar */}
          <FadeInUp delay={0.18}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
              {[
                { icon: MapPin, label: "Pilot Regions", value: "Bulgaria & Spain" },
                { icon: Wallet, label: "Settlement", value: "cUSD / 3 seconds" },
                { icon: TrendingUp, label: "Cost Reduction", value: "80% vs manual" },
                { icon: ShieldCheck, label: "Compliance", value: "Data Act + EBSI" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-2.5 rounded-xl px-4 py-3"
                  style={{ background: "rgba(61,122,80,0.04)", border: `1px solid ${B.border}` }}>
                  <Icon size={16} style={{ color: B.green, opacity: 0.8 }} />
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: B.muted }}>{label}</div>
                    <div className="text-xs font-bold" style={{ color: B.cream }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </FadeInUp>

          {/* Signup form */}
          <FadeInUp delay={0.22}>
            <div className="max-w-md mx-auto">
              <p className="text-center text-sm font-semibold mb-3" style={{ color: B.cream }}>
                Apply for the SkyHarvest pilot
              </p>
              <PilotSignupForm />
            </div>
          </FadeInUp>
        </div>
      </div>
    </section>
  );
}
