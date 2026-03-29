"use client";

import {
  ShoppingCart,
  Truck,
  ClipboardCheck,
  Wheat,
  Zap,
  Hexagon,
  Coins,
  BadgeCheck,
} from "lucide-react";
import { B } from "../brand";
import { FadeInUp } from "../animations";
import CenterFlowBase, { NodeItem } from "../CenterFlowBase";

// ── Node icon wrapper ──────────────────────────────────────────────────────
function NodeIcon({
  Icon,
  label,
  color = B.wheat,
}: {
  Icon: React.FC<{ size?: number; style?: React.CSSProperties }>;
  label: string;
  color?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <Icon size={18} style={{ color }} />
      <span
        className="text-[9px] font-bold uppercase tracking-wider leading-none text-center"
        style={{ color: `${color}99` }}
      >
        {label}
      </span>
    </div>
  );
}

// ── 8 nodes representing every participant / layer in a trade ──────────────
const nodeItems: NodeItem[] = [
  { content: <NodeIcon Icon={ShoppingCart} label="Buyer" /> },
  { content: <NodeIcon Icon={Wheat} label="Seller" /> },
  { content: <NodeIcon Icon={ClipboardCheck} label="Inspector" /> },
  { content: <NodeIcon Icon={Truck} label="Logistics" /> },
  { content: <NodeIcon Icon={Coins} label="cUSD" color="#34D399" /> },
  { content: <NodeIcon Icon={Hexagon} label="Celo" color="#60A5FA" /> },
  { content: <NodeIcon Icon={Zap} label="Auto-exec" color="#A78BFA" /> },
  { content: <NodeIcon Icon={BadgeCheck} label="Grade A" color="#FB923C" /> },
];

// ── Centre hub ─────────────────────────────────────────────────────────────
function CenterHub() {
  return (
    <div className="flex flex-col items-center gap-1">
      {/* Wheat hex icon */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        width={28}
        height={28}
        style={{ color: B.wheat }}
      >
        <path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
          fill={`${B.wheat}18`}
        />
      </svg>
      <span
        className="text-[9px] font-black uppercase tracking-[0.15em]"
        style={{ color: B.wheat }}
      >
        Escrow
      </span>
    </div>
  );
}

// ── Stats row ──────────────────────────────────────────────────────────────
const stats = [
  { label: "Trade participants", value: "4 roles" },
  { label: "Payment layers", value: "cUSD + Celo" },
  { label: "Human trust needed", value: "Zero" },
];

export function EcosystemSection() {
  return (
    <section
      className="py-24 px-6 lg:px-32 relative overflow-hidden"
      style={{ backgroundColor: B.bg }}
    >
      {/* Ambient radial glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 55% at 50% 50%, rgba(232,200,112,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <FadeInUp>
          <div className="text-center mb-4">
            <span
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: B.wheat }}
            >
              Platform Ecosystem
            </span>
            <h2
              className="text-3xl sm:text-4xl font-extrabold mt-3"
              style={{ color: B.cream }}
            >
              Every role. One smart contract.
            </h2>
            <p
              className="mt-4 text-base max-w-lg mx-auto"
              style={{ color: B.muted }}
            >
              Buyers, sellers, inspectors, and transporters all flow through a
              single on-chain escrow. No middlemen. No manual releases.
            </p>
          </div>
        </FadeInUp>

        {/* CenterFlow canvas */}
        <FadeInUp delay={0.15}>
          <div
            className="relative mx-auto rounded-3xl overflow-hidden"
            style={{
              height: "clamp(320px, 80vw, 520px)",
              maxWidth: "780px",
              background: B.glass,
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: `1px solid ${B.glassBorder}`,
              boxShadow: B.glassShadow,
            }}
          >
            <CenterFlowBase
              nodeItems={nodeItems}
              centerContent={<CenterHub />}
              centerSize={110}
              nodeSize={70}
              pulseDuration={4}
              pulseInterval={7}
              pulseLength={0.35}
              lineWidth={1.5}
              pulseWidth={1.5}
              pulseSoftness={8}
              lineColor="rgba(232,200,112,0.28)"
              pulseColor={B.wheat}
              glowColor={B.wheat}
              nodeBackground="rgba(32, 22, 6, 0.94)"
              nodeBorder="rgba(232,200,112,0.20)"
              maxGlowIntensity={30}
              glowDecay={0.94}
              borderRadius={20}
              nodeDistance={0.68}
              disableBlinking={false}
            />

            {/* Corner label */}
            <div
              className="absolute top-4 left-5 flex items-center gap-2"
            >
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: "#34D399" }}
              />
              <span
                className="text-xs font-bold tracking-widest uppercase"
                style={{ color: B.muted }}
              >
                Live network
              </span>
            </div>

            <div
              className="absolute top-4 right-5 text-xs font-mono"
              style={{ color: `${B.muted}55` }}
            >
              AgroEscrow.sol · Celo
            </div>
          </div>
        </FadeInUp>

        {/* Stats strip */}
        <FadeInUp delay={0.25}>
          <div className="mt-8 grid grid-cols-3 gap-4 max-w-xl mx-auto">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p
                  className="text-xl font-extrabold"
                  style={{ color: B.cream }}
                >
                  {s.value}
                </p>
                <p className="text-xs mt-0.5" style={{ color: B.muted }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </FadeInUp>
      </div>
    </section>
  );
}
