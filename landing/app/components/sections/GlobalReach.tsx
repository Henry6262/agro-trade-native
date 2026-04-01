"use client";

import { B } from "../brand";
import { FadeInUp } from "../animations";
import { Globe, type CustomArc } from "../Globe";
import { CountUp } from "../animations";

const TRADE_ARCS: CustomArc[] = [
  { startLat: 42.7, startLng: 23.3, endLat: 41.0,  endLng: 28.9,  color: "rgba(232,200,112,0.95)" },
  { startLat: 44.8, startLng: 20.5, endLat: 25.2,  endLng: 55.3,  color: "rgba(232,200,112,0.80)" },
  { startLat: 44.4, startLng: 26.1, endLat: 24.7,  endLng: 46.7,  color: "rgba(232,200,112,0.72)" },
  { startLat: 45.8, startLng: 15.9, endLat: 32.1,  endLng: 34.8,  color: "rgba(232,200,112,0.65)" },
  { startLat: 43.8, startLng: 18.4, endLat: 31.9,  endLng: 35.9,  color: "rgba(232,200,112,0.60)" },
  { startLat: 25.2, startLng: 55.3, endLat: 19.1,  endLng: 72.9,  color: "rgba(196,131,26,0.88)"  },
  { startLat: 41.0, startLng: 28.9, endLat: 1.3,   endLng: 103.8, color: "rgba(196,131,26,0.72)"  },
  { startLat: 24.7, startLng: 46.7, endLat: 13.7,  endLng: 100.5, color: "rgba(196,131,26,0.65)"  },
  { startLat: 42.7, startLng: 23.3, endLat: 31.2,  endLng: 121.5, color: "rgba(240,229,204,0.55)" },
  { startLat: 44.8, startLng: 20.5, endLat: 35.7,  endLng: 139.7, color: "rgba(240,229,204,0.48)" },
  { startLat: 44.4, startLng: 26.1, endLat: 19.1,  endLng: 72.9,  color: "rgba(240,229,204,0.52)" },
];

const bigStats = [
  { value: 1200, suffix: "+",   label: "Active Traders" },
  { value: 840,  prefix: "$", suffix: "K", label: "Secured in Escrow" },
  { value: 12,   label: "Countries" },
  { value: 2.4,  suffix: "M+", label: "People Fed" },
];

const corridors = [
  { from: "Balkans", to: "Middle East", detail: "2,100 km · Wheat & Grain", flag: "🌾" },
  { from: "Middle East", to: "South Asia", detail: "2,700 km · Live Routes", flag: "🚢" },
  { from: "Europe", to: "East Asia", detail: "8,400 km · Long-haul", flag: "✈️" },
];

export function GlobalReach() {
  return (
    <section className="relative overflow-hidden">
      {/* ── Background: pure dark ── */}
      <div className="absolute inset-0 z-0" style={{ backgroundColor: "#08080A" }} />
      {/* Aurora behind globe */}
      <div className="pointer-events-none absolute inset-0 z-0" style={{
        background: "radial-gradient(ellipse 80% 80% at 75% 50%, rgba(232,200,112,0.09) 0%, rgba(196,131,26,0.04) 35%, transparent 65%)",
      }} />

      <div className="relative z-10">
        {/* ── FULL-WIDTH TITLE ── */}
        <div className="px-8 sm:px-12 lg:px-16 pt-24 pb-8">
          <FadeInUp>
            <span className="text-label block mb-5" style={{ color: B.wheat }}>
              Global Trade Network
            </span>
            <h2 className="leading-[1.05] mb-4" style={{
              fontSize: "clamp(2.2rem, 5vw, 4.2rem)",
              fontWeight: 900,
              letterSpacing: "-0.018em",
              color: B.cream,
            }}>
              Connecting Farms to Markets{" "}
              <span style={{
                background: "linear-gradient(135deg, #E8C870, #FFD770, #C4831A)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                Across Three Continents.
              </span>
            </h2>
            <p className="text-lg leading-relaxed max-w-2xl" style={{ color: B.muted }}>
              Live trade corridors from Eastern Europe through the Middle East
              to South and East Asia — every payment on Celo, every shipment tracked.
            </p>
          </FadeInUp>
        </div>

        {/* ── CONTENT + GLOBE GRID ── */}
        <div className="grid lg:grid-cols-[1fr_1.3fr] items-center">
          {/* ── LEFT: Stats + Corridors ── */}
          <div className="px-8 sm:px-12 lg:px-16 pb-24 pt-4">
            {/* Stats grid */}
            <FadeInUp delay={0.1}>
              <div className="grid grid-cols-2 gap-4 mb-10">
                {bigStats.map((s) => (
                  <div key={s.label} className="rounded-2xl px-5 py-4"
                    style={{
                      background: "rgba(232,200,112,0.05)",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                      border: `1px solid rgba(232,200,112,0.16)`,
                      boxShadow: "0 4px 32px rgba(0,0,0,0.6)",
                    }}>
                    <div className="font-extrabold" style={{
                      fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
                      color: B.wheat,
                      textShadow: "0 0 20px rgba(232,200,112,0.40)",
                    }}>
                      <CountUp target={s.value} prefix={s.prefix} suffix={s.suffix} />
                    </div>
                    <p className="text-xs mt-1" style={{ color: B.muted }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </FadeInUp>

            {/* Corridor pills */}
            <FadeInUp delay={0.2}>
              <div className="space-y-3">
                {corridors.map((c) => (
                  <div key={c.from} className="flex items-center gap-4 px-4 py-3 rounded-2xl"
                    style={{
                      background: "rgba(232,200,112,0.03)",
                      border: `1px solid rgba(232,200,112,0.12)`,
                      backdropFilter: "blur(16px)",
                    }}>
                    <span style={{ fontSize: 22 }}>{c.flag}</span>
                    <div>
                      <p className="text-sm font-bold" style={{ color: B.cream }}>{c.from} → {c.to}</p>
                      <p className="text-xs" style={{ color: B.muted }}>{c.detail}</p>
                    </div>
                    <div className="ml-auto w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ backgroundColor: B.wheat }} />
                  </div>
                ))}
              </div>
            </FadeInUp>
          </div>

          {/* ── RIGHT: Globe — desktop only ── */}
          <div className="hidden lg:relative lg:flex items-center justify-center" style={{ minHeight: "55vh" }}>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="rounded-full" style={{
                width: "100%", aspectRatio: "1",
                background: "radial-gradient(circle, rgba(232,200,112,0.14) 0%, rgba(196,131,26,0.05) 40%, transparent 68%)",
              }} />
            </div>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="rounded-full" style={{
                width: "68%", aspectRatio: "1",
                border: "1px solid rgba(232,200,112,0.14)",
              }} />
            </div>

            <Globe
              width="auto" height={480}
              primaryColor="rgba(232,200,112,1)"
              neutralColor="rgba(200,168,72,0.72)"
              atmosphereColor="rgba(232,200,112,0.28)"
              globeColor="#020510"
              globeOpacity={0.96}
              showAtmosphere={true}
              atmosphereAltitude={0.32}
              autoRotateSpeed={0.5}
              enableZoom={false}
              interactive={true}
              arcAnimationDuration={1800}
              cameraAltitude={1.75}
              landDotRows={260}
              pointSize={0.32}
              arcStroke={0.65}
              labelDotRadius={0.6}
              customArcs={TRADE_ARCS}
              className="w-full"
            />

            <div className="absolute top-8 right-8 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{
                background: "rgba(12,9,4,0.85)", backdropFilter: "blur(12px)",
                border: `1px solid rgba(232,200,112,0.22)`,
                color: B.wheat,
                boxShadow: "0 0 20px rgba(232,200,112,0.15)",
              }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: B.wheat }} />
              11 live routes
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
