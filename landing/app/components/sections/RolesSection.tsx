"use client";

import { B } from "../brand";
import { FadeInUp, StaggerChildren, StaggerItem } from "../animations";
import { ArrowRight, Wheat, ShoppingCart, ClipboardCheck, Truck } from "lucide-react";
import { SpotlightCard } from "../reactbits/SpotlightCard";
import { Marquee } from "../reactbits/Marquee";

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
    accent: "#E8C870",
    accentRgb: "232,200,112",
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
    accent: "#E8C870",
    accentRgb: "232,200,112",
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
    accent: "#E8C870",
    accentRgb: "232,200,112",
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
    accent: "#E8C870",
    accentRgb: "232,200,112",
  },
];

const commodities = [
  { emoji: "🌾", name: "Wheat",      volume: "$18B/yr" },
  { emoji: "🌽", name: "Corn",       volume: "$12B/yr" },
  { emoji: "🌻", name: "Sunflower",  volume: "$6B/yr"  },
  { emoji: "🫘", name: "Soybeans",   volume: "$9B/yr"  },
  { emoji: "🌴", name: "Palm Oil",   volume: "$5B/yr"  },
  { emoji: "🍚", name: "Rice",       volume: "$7B/yr"  },
  { emoji: "🫙", name: "Lentils",    volume: "$4B/yr"  },
  { emoji: "🧅", name: "Onion",      volume: "$3B/yr"  },
];

export function RolesSection() {
  return (
    <section id="roles" className="relative py-28 px-6 lg:px-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0" style={{ backgroundColor: "#0C0904" }} />
      <div className="pointer-events-none absolute inset-0 z-0" style={{
        background: "radial-gradient(ellipse 80% 55% at 50% 100%, rgba(232,200,112,0.07) 0%, transparent 60%)",
      }} />

      <div className="max-w-7xl mx-auto relative z-10">

        {/* ── Header ── */}
        <FadeInUp>
          <div className="mb-16">
            <span className="text-label" style={{ color: B.wheat }}>Who It&apos;s For</span>
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
                background: "linear-gradient(135deg, #E8C870, #FFD770, #C4831A)",
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

        {/* ── Role cards ── */}
        <StaggerChildren className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5" stagger={0.1}>
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <StaggerItem key={role.title}>
                <SpotlightCard
                  className="h-full rounded-2xl overflow-hidden cursor-default"
                  spotlightColor={`rgba(${role.accentRgb},0.20)`}
                  style={{
                    background: `rgba(${role.accentRgb},0.09)`,
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    border: `1px solid rgba(${role.accentRgb},0.24)`,
                    boxShadow: `0 4px 32px rgba(0,0,0,0.6)`,
                    transition: "border-color 0.3s, box-shadow 0.3s, transform 0.3s",
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = `rgba(${role.accentRgb},0.42)`;
                    (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 50px rgba(${role.accentRgb},0.18), 0 4px 32px rgba(0,0,0,0.6)`;
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
                  }}
                  onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = `rgba(${role.accentRgb},0.24)`;
                    (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 32px rgba(0,0,0,0.6)`;
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                  }}
                >
                  {/* Colour accent top bar */}
                  <div style={{ height: 3, background: `linear-gradient(90deg, ${role.accent}00, ${role.accent}, ${role.accent}00)` }} />

                  <div className="p-6 flex-1 flex flex-col gap-4">
                    {/* Icon + stat */}
                    <div className="flex items-start justify-between">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center"
                        style={{
                          background: `rgba(${role.accentRgb},0.15)`,
                          border: `1px solid rgba(${role.accentRgb},0.28)`,
                          boxShadow: `0 0 24px rgba(${role.accentRgb},0.22)`,
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
                        background: `rgba(${role.accentRgb},0.12)`,
                        color: role.accent,
                        border: `1px solid rgba(${role.accentRgb},0.26)`,
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
                    style={{ borderTop: `1px solid rgba(${role.accentRgb},0.15)` }}>
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
                </SpotlightCard>
              </StaggerItem>
            );
          })}
        </StaggerChildren>

        {/* ── Commodities Marquee ── */}
        <FadeInUp delay={0.4}>
          <div className="mt-14 pt-8" style={{ borderTop: `1px solid rgba(232,200,112,0.10)` }}>
            <p className="text-label text-center mb-6" style={{ color: B.muted }}>Supported commodities</p>
            <Marquee duration={28} gap={12} pauseOnHover>
              {commodities.map((c) => (
                <div
                  key={c.name}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-full shrink-0"
                  style={{
                    background: "rgba(232,200,112,0.07)",
                    border: "1px solid rgba(232,200,112,0.16)",
                  }}
                >
                  <span style={{ fontSize: 18 }}>{c.emoji}</span>
                  <div>
                    <p className="text-xs font-bold" style={{ color: B.cream }}>{c.name}</p>
                    <p style={{ fontSize: 10, color: B.muted }}>{c.volume}</p>
                  </div>
                </div>
              ))}
            </Marquee>
          </div>
        </FadeInUp>

      </div>
    </section>
  );
}
