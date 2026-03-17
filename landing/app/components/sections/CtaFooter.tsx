"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight, CheckCircle, Loader2, Shield, Link, Globe } from "lucide-react";
import { B } from "../brand";
import { FadeInUp } from "../animations";
import { ParallaxBg } from "../ParallaxBg";

const ROLES = ["Buyer", "Seller / Farmer", "Inspector", "Transporter"] as const;
type Role = (typeof ROLES)[number];
type FormState = "idle" | "loading" | "success" | "error";

function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const [state, setState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setState("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
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
      <div className="flex flex-col items-center gap-4 py-10 px-8 rounded-3xl"
        style={{
          background: "rgba(74,222,128,0.06)",
          border: "1px solid rgba(74,222,128,0.22)",
          boxShadow: "0 0 60px rgba(74,222,128,0.10)",
        }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: "rgba(74,222,128,0.12)", border: "1.5px solid rgba(74,222,128,0.30)" }}>
          <CheckCircle size={32} color="#4ADE80" />
        </div>
        <p className="text-2xl font-extrabold" style={{ color: B.cream }}>
          You&apos;re on the list.
        </p>
        <p className="text-sm text-center max-w-sm" style={{ color: B.muted }}>
          We&apos;ll reach out when AgroTrade launches in your region.
          <br />Balkans first — then the world.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto space-y-4">
      {/* Role selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {ROLES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className="px-3 py-2.5 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: role === r ? "rgba(232,200,112,0.14)" : "rgba(232,200,112,0.04)",
              border: role === r ? `1px solid ${B.wheat}` : `1px solid rgba(232,200,112,0.12)`,
              color: role === r ? B.wheat : B.muted,
              boxShadow: role === r ? "0 0 16px rgba(232,200,112,0.18)" : "none",
            }}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Email + submit */}
      <div className="flex items-center rounded-2xl overflow-hidden p-1.5 gap-2"
        style={{
          background: "rgba(232,200,112,0.05)",
          border: `1px solid rgba(232,200,112,0.18)`,
          backdropFilter: "blur(16px)",
        }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="flex-1 bg-transparent px-4 py-3 text-sm outline-none placeholder:opacity-35"
          style={{ color: B.cream }}
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95 shrink-0"
          style={{
            backgroundColor: B.wheat,
            color: B.bg,
            opacity: state === "loading" ? 0.7 : 1,
            boxShadow: "0 0 24px rgba(232,200,112,0.30)",
          }}
        >
          {state === "loading" ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>Join Waitlist <ArrowRight size={15} /></>
          )}
        </button>
      </div>

      {state === "error" && (
        <p className="text-xs text-center" style={{ color: B.danger }}>{errorMsg}</p>
      )}

      <p className="text-xs text-center" style={{ color: `${B.muted}88` }}>
        No spam. Early access only. Launching in the Balkans first.
      </p>
    </form>
  );
}

export function CtaFooter() {
  return (
    <section id="cta" className="relative overflow-hidden">
      {/* ── Background: sunset wheat field + parallax ── */}
      <ParallaxBg
        src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2070&q=80"
        overlay="linear-gradient(180deg, rgba(12,9,4,0.98) 0%, rgba(12,9,4,0.88) 35%, rgba(12,9,4,0.91) 65%, rgba(12,9,4,0.98) 100%)"
        position="center 60%"
        strength={60}
        fadeTop="#040608"
        fadeSize={260}
      />
      {/* Gold top aurora */}
      <div className="pointer-events-none absolute inset-0 z-0" style={{
        background: "radial-gradient(ellipse 100% 50% at 50% 0%, rgba(232,200,112,0.12) 0%, transparent 55%)",
      }} />
      {/* Gold bottom glow */}
      <div className="pointer-events-none absolute inset-0 z-0" style={{
        background: "radial-gradient(ellipse 80% 40% at 50% 100%, rgba(196,131,26,0.12) 0%, transparent 60%)",
      }} />

      <div className="relative z-10 py-28 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <FadeInUp>
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8"
              style={{
                background: "rgba(232,200,112,0.07)",
                backdropFilter: "blur(12px)",
                border: `1px solid rgba(232,200,112,0.20)`,
                color: B.wheat,
              }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: B.wheat }} />
              Early access — limited spots per region
            </div>

            {/* Giant headline */}
            <h2 className="mb-5" style={{
              fontSize: "clamp(2.8rem, 8vw, 6.5rem)",
              fontWeight: 900,
              letterSpacing: "-0.025em",
              lineHeight: 0.96,
            }}>
              <span style={{ color: B.cream }}>Be first to trade</span>
              <br />
              <span style={{
                background: "linear-gradient(135deg, #E8C870 0%, #FFD770 45%, #C4831A 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 0 40px rgba(232,200,112,0.30))",
              }}>
                without fear.
              </span>
            </h2>

            <p className="text-lg sm:text-xl mb-10 max-w-lg mx-auto" style={{ color: B.muted }}>
              AgroTrade is launching region by region — Balkans first, then Middle East and Asia.
              Join the waitlist and lock your early access.
            </p>

            <WaitlistForm />

            {/* Trust indicators */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-5">
              {[
                { icon: Shield, label: "Non-custodial escrow" },
                { icon: Link, label: "Celo blockchain" },
                { icon: Globe, label: "12 countries" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-xs" style={{ color: `${B.muted}99` }}>
                  <Icon size={12} style={{ color: `${B.muted}77` }} />
                  {label}
                </div>
              ))}
            </div>
          </FadeInUp>
        </div>
      </div>

      {/* Footer strip */}
      <div className="relative z-10 border-t px-6 py-6" style={{ borderColor: `rgba(232,200,112,0.10)` }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ color: B.muted, fontSize: "0.82rem" }}>
          <div className="flex items-center gap-2">
            <div className="relative w-5 h-5">
              <Image src="/logo.png" alt="AgroTrade" fill className="object-contain" />
            </div>
            <span>&copy; 2026 AgroTrade. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="mailto:hello@agrotrade.africa" className="hover:text-white transition-colors">
              hello@agrotrade.africa
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
