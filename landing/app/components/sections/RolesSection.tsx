"use client";

import { B } from "../brand";
import { FadeInUp, StaggerChildren, StaggerItem } from "../animations";
import { ArrowRight, Wheat, ShoppingCart, ClipboardCheck, Truck } from "lucide-react";
import { ParallaxBg } from "../ParallaxBg";

// ── Per-role accent system — mirrors the LiveDealFlow stage colors ─────────────
const roles = [
  {
    icon: Wheat,
    emoji: "🌾",
    title: "Farmer / Seller",
    country: "🇷🇸 Serbia · 🇧🇦 Bosnia · 🇷🇴 Romania",
    highlight: "100% payment guarantee",
    stat: { value: "2,847", label: "active sellers" },
    benefit: "+100%",
    benefitLabel: "payment recovery",
    desc: "List produce, set your price, and get paid — every time. Escrow locks the buyer's cUSD before you ship a single kilogram.",
    features: [
      "No payment before listing",
      "Inspector verifies grade before release",
      "Dispute protection built-in",
    ],
    // green — the producer
    accent: "#059669",
    accentRgb: "5,150,105",
    bgImage: null,
  },
  {
    icon: ShoppingCart,
    emoji: "🛒",
    title: "Buyer / Importer",
    country: "🇦🇪 Dubai · 🇹🇷 Istanbul · 🇯🇴 Amman",
    highlight: "Zero capital risk",
    stat: { value: "1,103", label: "active buyers" },
    benefit: "0%",
    benefitLabel: "fraud exposure",
    desc: "Source Grade-A verified produce across the region. Your capital stays in escrow until quality and delivery are confirmed.",
    features: [
      "Grade verified by independent inspector",
      "Funds never leave escrow early",
      "Full refund if specs not met",
    ],
    // green — trust, transparency
    accent: "#34d399",
    accentRgb: "52,211,153",
    bgImage: null,
  },
  {
    icon: ClipboardCheck,
    emoji: "🔍",
    title: "Inspector",
    country: "🇷🇸 Serbia · 🇦🇪 UAE · 🇮🇳 India",
    highlight: "Earn per verification",
    stat: { value: "$50–200", label: "per inspection job" },
    benefit: "147",
    benefitLabel: "jobs completed today",
    desc: "Get paid to verify quality on-site. Build an on-chain credential that increases your earning potential with every inspection.",
    features: [
      "On-chain reputation NFT credential",
      "Flexible — bid on any job",
      "Paid immediately on submission",
    ],
    // green — precision, verification
    accent: "#10b981",
    accentRgb: "16,185,129",
    bgImage: null,
  },
  {
    icon: Truck,
    emoji: "🚛",
    title: "Transporter",
    country: "🇷🇸 Balkans · 🇹🇷 Turkey · 🇦🇪 Gulf",
    highlight: "Bid & earn",
    stat: { value: "0%", label: "intermediary cut" },
    benefit: "Direct",
    benefitLabel: "payment per delivery",
    desc: "Bid on delivery jobs, ship with real-time tracking, and receive payment guaranteed on confirmed delivery — no middlemen.",
    features: [
      "Open bid marketplace",
      "Live shipment tracking",
      "Payment locked in escrow at booking",
    ],
    // green — movement, logistics
    accent: "#6ee7b7",
    accentRgb: "110,231,183",
    bgImage: null,
  },
];

export function RolesSection() {
  return (
    <section id="roles" className="relative py-28 px-6 lg:px-32 overflow-hidden">
      {/* ── Background: outdoor market + parallax ── */}
      <ParallaxBg
        src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=2070&q=80"
        overlay="linear-gradient(180deg, rgba(12,9,4,0.97) 0%, rgba(17,13,7,0.94) 50%, rgba(12,9,4,0.97) 100%)"
        position="center 30%"
        strength={50}
        fadeTop="#0C0904"
        fadeBottom="#040608"
        fadeSize={240}
      />
      {/* Green atmosphere */}
      <div className="pointer-events-none absolute inset-0 z-0" style={{
        background: "radial-gradient(ellipse 80% 55% at 50% 100%, rgba(16,185,129,0.07) 0%, transparent 60%)",
      }} />

      <div className="max-w-7xl mx-auto relative z-10">
        <FadeInUp>
          <div className="mb-16">
            <span className="text-label" style={{ color: B.green }}>
              Who It&apos;s For
            </span>
            <h2 className="mt-4" style={{
              fontSize: "clamp(1.6rem, 4vw, 3rem)",
              fontWeight: 900,
              letterSpacing: "-0.018em",
              lineHeight: 1.06,
              color: B.cream,
            }}>
              Everyone in the chain.
              <br />
              <span style={{
                background: "linear-gradient(135deg, #059669, #10b981, #34d399)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                Finally protected.
              </span>
            </h2>
            <p className="mt-5 text-base max-w-xl" style={{ color: B.muted }}>
              Whether you grow it, buy it, inspect it, or move it —
              AgroTrade gives every participant in the supply chain a fair, guaranteed deal.
            </p>
          </div>
        </FadeInUp>

        <StaggerChildren className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5" stagger={0.1}>
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <StaggerItem key={role.title}>
                <div
                  className="group flex flex-col h-full rounded-2xl overflow-hidden transition-all duration-300 cursor-default"
                  style={{
                    background: `rgba(${role.accentRgb},0.04)`,
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    border: `1px solid rgba(${role.accentRgb},0.18)`,
                    boxShadow: `0 4px 32px rgba(0,0,0,0.6)`,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = `rgba(${role.accentRgb},0.08)`;
                    (e.currentTarget as HTMLDivElement).style.borderColor = `rgba(${role.accentRgb},0.38)`;
                    (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 50px rgba(${role.accentRgb},0.18), 0 4px 32px rgba(0,0,0,0.6)`;
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = `rgba(${role.accentRgb},0.04)`;
                    (e.currentTarget as HTMLDivElement).style.borderColor = `rgba(${role.accentRgb},0.18)`;
                    (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 32px rgba(0,0,0,0.6)`;
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                  }}
                >
                  {/* Color accent top bar */}
                  <div style={{ height: 3, background: `linear-gradient(90deg, ${role.accent}00, ${role.accent}, ${role.accent}00)` }} />

                  <div className="p-6 flex-1 flex flex-col gap-4">
                    {/* Icon + stat */}
                    <div className="flex items-start justify-between">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center"
                        style={{
                          background: `rgba(${role.accentRgb},0.12)`,
                          border: `1px solid rgba(${role.accentRgb},0.22)`,
                          boxShadow: `0 0 24px rgba(${role.accentRgb},0.20)`,
                        }}
                      >
                        <Icon size={18} style={{ color: role.accent }} />
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-extrabold leading-none" style={{ color: role.accent }}>
                          {role.stat.value}
                        </p>
                        <p className="text-[9px] mt-0.5" style={{ color: B.muted }}>{role.stat.label}</p>
                      </div>
                    </div>

                    {/* Title + location */}
                    <div>
                      <h3 className="text-sm font-extrabold" style={{ color: B.cream }}>{role.title}</h3>
                      <p className="text-[9px] mt-1 leading-relaxed" style={{ color: B.muted }}>{role.country}</p>
                    </div>

                    {/* Highlight badge */}
                    <span className="self-start text-xs px-2.5 py-1 rounded-full font-semibold"
                      style={{
                        background: `rgba(${role.accentRgb},0.10)`,
                        color: role.accent,
                        border: `1px solid rgba(${role.accentRgb},0.22)`,
                      }}>
                      {role.highlight}
                    </span>

                    <p className="text-xs leading-relaxed flex-1" style={{ color: B.muted }}>{role.desc}</p>

                    <ul className="space-y-2">
                      {role.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-xs" style={{ color: "rgba(240,229,204,0.65)" }}>
                          <span className="shrink-0 font-bold" style={{ color: role.accent }}>✓</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 flex items-center justify-between"
                    style={{ borderTop: `1px solid rgba(${role.accentRgb},0.12)` }}>
                    <div>
                      <span className="text-lg font-extrabold" style={{ color: role.accent }}>{role.benefit}</span>
                      <span className="text-xs ml-1.5" style={{ color: B.muted }}>{role.benefitLabel}</span>
                    </div>
                    <a href="#cta"
                      className="inline-flex items-center gap-1 text-xs font-bold transition-opacity hover:opacity-80"
                      style={{ color: role.accent }}
                      onClick={(e) => e.stopPropagation()}>
                      Join <ArrowRight size={12} />
                    </a>
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerChildren>

        {/* Commodities strip */}
        <FadeInUp delay={0.4}>
          <div className="mt-14 pt-8" style={{ borderTop: `1px solid rgba(232,200,112,0.10)` }}>
            <p className="text-label text-center mb-5" style={{ color: B.muted }}>Supported commodities</p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { emoji: "🌾", name: "Wheat", volume: "$18B/yr" },
                { emoji: "🌽", name: "Corn", volume: "$12B/yr" },
                { emoji: "🌻", name: "Sunflower", volume: "$6B/yr" },
                { emoji: "🫘", name: "Soybeans", volume: "$9B/yr" },
                { emoji: "🌴", name: "Palm Oil", volume: "$5B/yr" },
                { emoji: "🍚", name: "Rice", volume: "$7B/yr" },
              ].map((c) => (
                <div
                  key={c.name}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-full transition-colors"
                  style={{
                    background: "rgba(232,200,112,0.04)",
                    border: `1px solid rgba(232,200,112,0.12)`,
                  }}
                >
                  <span style={{ fontSize: 18 }}>{c.emoji}</span>
                  <div>
                    <p className="text-xs font-bold" style={{ color: B.cream }}>{c.name}</p>
                    <p style={{ fontSize: 10, color: B.muted }}>{c.volume}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeInUp>
      </div>
    </section>
  );
}
