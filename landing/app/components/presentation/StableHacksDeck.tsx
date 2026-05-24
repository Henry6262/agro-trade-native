"use client";

import { useEffect, useMemo, useState } from "react";

type Slide = {
  eyebrow: string;
  number: string;
  title: string;
  subtitle?: string;
  content: React.ReactNode;
  footer: string;
  timing: string;
  notes: string;
};

const Stat = ({ value, label }: { value: string; label: string }) => (
  <div className="border border-[#d6ff7b]/18 bg-[#d6ff7b]/8 px-5 py-4">
    <div className="text-[34px] font-black leading-none text-[#d6ff7b]">{value}</div>
    <div className="mt-2 text-[13px] leading-5 text-[#dfe8d2]/70">{label}</div>
  </div>
);

const Block = ({
  title,
  body,
  tone = "neutral",
}: {
  title: string;
  body: string;
  tone?: "neutral" | "danger" | "good" | "blue";
}) => {
  const toneClass = {
    neutral: "border-white/10 bg-white/[0.045]",
    danger: "border-[#ff6a3d]/25 bg-[#ff6a3d]/10",
    good: "border-[#d6ff7b]/20 bg-[#d6ff7b]/8",
    blue: "border-[#64b5ff]/22 bg-[#64b5ff]/9",
  }[tone];

  return (
    <div className={`min-h-[132px] p-5 ${toneClass}`}>
      <div className="text-[20px] font-black leading-tight text-white">{title}</div>
      <div className="mt-3 text-[14px] leading-6 text-[#dfe8d2]/72">{body}</div>
    </div>
  );
};

const Phase = ({ label, detail }: { label: string; detail: string }) => (
  <div className="min-w-[110px] flex-1 border border-white/10 bg-white/[0.045] p-4 text-center">
    <div className="text-[16px] font-black text-white">{label}</div>
    <div className="mt-1 text-[12px] leading-5 text-[#dfe8d2]/65">{detail}</div>
  </div>
);

const slides: Slide[] = [
  {
    eyebrow: "Opening",
    number: "01 / 08",
    title: "AgroTrade is the operating layer for transparent European grain trade.",
    subtitle:
      "Farmers, buyers, inspectors, transporters, escrow, and evidence in one controlled workflow.",
    content: (
      <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="grid gap-4 md:grid-cols-2">
          <Stat value="$3.4T" label="agricultural trade still priced through opaque infrastructure" />
          <Stat value="30-90d" label="common settlement delay after delivery" />
          <Stat value="5 roles" label="farmer, buyer, transporter, inspector, admin" />
          <Stat value="1 flow" label="from listing to verified delivery and release" />
        </div>
        <div className="border border-white/10 bg-[#10160f] p-7">
          <div className="text-[13px] font-black uppercase tracking-[0.22em] text-[#d6ff7b]">
            What is AgroTrade?
          </div>
          <p className="mt-5 text-[30px] font-black leading-[1.08] text-white">
            A leap from broker calls and spreadsheet trust into verified trade execution.
          </p>
          <p className="mt-5 text-[17px] leading-7 text-[#dfe8d2]/72">
            Not a generic marketplace. Not crypto speculation. A trade operating system
            where the product, the proof, and the payment move together.
          </p>
        </div>
      </div>
    ),
    footer: "Start with the category: transparent trade infrastructure",
    timing: "22s",
    notes:
      "AgroTrade is the operating layer for transparent European grain trade. Farmers, buyers, inspectors, transporters, escrow, and evidence move in one controlled workflow. The point is not another marketplace. The point is replacing broker calls, spreadsheets, and blind trust with verified execution.",
  },
  {
    eyebrow: "Why This Exists",
    number: "02 / 08",
    title: "The problem is not one broker. It is the structure.",
    subtitle:
      "Opaque middle layers create bad pricing, fraud risk, and delay between producer and buyer.",
    content: (
      <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="border border-[#ff6a3d]/25 bg-[#ff6a3d]/10 p-7">
          <div className="text-[13px] font-black uppercase tracking-[0.22em] text-[#ffad88]">
            Origin
          </div>
          <p className="mt-5 text-[28px] font-black leading-[1.1] text-white">
            The Bulgarian grain corridor showed the real enemy: information asymmetry.
          </p>
          <p className="mt-5 text-[16px] leading-7 text-[#ffe5d9]/72">
            Producers often sell into a market they cannot see. Buyers often pay into
            a supply chain they cannot verify. Everyone pays for the opacity.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Block
            tone="danger"
            title="Price inflation"
            body="Small margins extracted across layers compound into higher food prices downstream."
          />
          <Block
            tone="danger"
            title="Prepayment fraud"
            body="A buyer wires money for grain, the seller disappears, and the legal path is slow."
          />
          <Block
            tone="danger"
            title="Manual coordination"
            body="Facebook groups, calls, WhatsApp threads, Excel files, and paper certificates."
          />
          <Block
            tone="danger"
            title="No shared truth"
            body="Product quality, quantity, transport status, and payment timing live in separate places."
          />
        </div>
      </div>
    ),
    footer: "Keep the emotion, blame the structure",
    timing: "24s",
    notes:
      "This started from seeing the Bulgarian grain corridor up close. The useful insight is not that one broker is bad. It is that the structure rewards information asymmetry. Producers often cannot see the real market. Buyers cannot verify the supply chain. Those tiny margins and delays compound into higher prices and real pressure on families.",
  },
  {
    eyebrow: "The System",
    number: "03 / 08",
    title: "Five actors. One enforceable trade lifecycle.",
    subtitle:
      "AgroTrade turns a commodity deal into a sequence of visible, auditable checkpoints.",
    content: (
      <div className="space-y-6">
        <div className="flex flex-wrap items-stretch gap-3">
          <Phase label="Buyer" detail="posts demand" />
          <div className="flex items-center text-[28px] font-black text-[#d6ff7b]">→</div>
          <Phase label="Farmer" detail="lists supply" />
          <div className="flex items-center text-[28px] font-black text-[#d6ff7b]">→</div>
          <Phase label="Inspector" detail="verifies quality" />
          <div className="flex items-center text-[28px] font-black text-[#d6ff7b]">→</div>
          <Phase label="Transporter" detail="moves goods" />
          <div className="flex items-center text-[28px] font-black text-[#d6ff7b]">→</div>
          <Phase label="Admin" detail="controls release" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Block
            tone="good"
            title="Negotiation"
            body="Offers, counters, acceptance, and expiry are part of one trade operation."
          />
          <Block
            tone="good"
            title="Inspection"
            body="Quality score, quantity checks, proof photos, and pass/fail evidence."
          />
          <Block
            tone="good"
            title="Transport"
            body="Bids, assignment, pickup, in-transit status, and delivery confirmation."
          />
        </div>
      </div>
    ),
    footer: "Trade is not a payment event. It is a lifecycle.",
    timing: "22s",
    notes:
      "AgroTrade connects the buyer, farmer, inspector, transporter, and admin in one enforceable lifecycle. The buyer posts demand. The farmer lists supply. The inspector verifies quality. The transporter moves goods. The admin controls release. Every step becomes visible instead of living in private calls and spreadsheets.",
  },
  {
    eyebrow: "Escrow",
    number: "04 / 08",
    title: "The payment only moves when the real-world trade moves.",
    subtitle:
      "Escrow protects both sides: the buyer is not paying blind, and the farmer is not waiting 90 days on trust.",
    content: (
      <div className="space-y-6">
        <div className="grid gap-3 md:grid-cols-5">
          <Phase label="Lock" detail="buyer funds escrow" />
          <Phase label="Inspect" detail="quality evidence" />
          <Phase label="Pickup" detail="goods leave farm" />
          <Phase label="Deliver" detail="buyer confirms" />
          <Phase label="Release" detail="seller paid" />
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <Block
            tone="blue"
            title="Against buyer risk"
            body="No full prepayment into a black hole. Funds can be disputed or refunded if the trade fails."
          />
          <Block
            tone="blue"
            title="Against farmer risk"
            body="The buyer's commitment is visible before shipment, and release is tied to agreed checkpoints."
          />
        </div>
        <div className="border border-white/10 bg-white/[0.045] p-5 text-[18px] leading-8 text-[#dfe8d2]/78">
          The future version supports partial release by checkpoint: inspection passed,
          pickup confirmed, delivery confirmed, final acceptance.
        </div>
      </div>
    ),
    footer: "Escrow turns belief into enforceable execution",
    timing: "24s",
    notes:
      "The core mechanism is simple: the payment only moves when the real-world trade moves. A buyer locks funds, quality is verified, pickup is confirmed, delivery is confirmed, and then the seller is paid. This protects the buyer from prepayment fraud and protects the farmer from shipping into a 90-day promise.",
  },
  {
    eyebrow: "What It Replaces",
    number: "05 / 08",
    title: "From Excel-era commodity trade to a phone-based command center.",
    subtitle:
      "The operator sees where the product is, what was verified, what still needs action, and when funds release.",
    content: (
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <Block
            tone="danger"
            title="Before"
            body="Phone calls, Facebook groups, Excel CRM, paper certificates, manual validation."
          />
          <Block
            tone="good"
            title="After"
            body="Live trade status, inspection evidence, transport progress, escrow state, and notifications."
          />
        </div>
        <div className="border border-[#64b5ff]/20 bg-[#64b5ff]/8 p-6">
          <div className="mb-5 text-[13px] font-black uppercase tracking-[0.22em] text-[#64b5ff]">
            Put a product screenshot here
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Block title="Dashboard" body="Active trade cards with phase, value, and next action." />
            <Block title="Inspection proof" body="Photos, quality score, moisture/protein metrics, notes." />
            <Block title="Transport" body="Route, bid, pickup, in-transit, delivery confirmation." />
            <Block title="Escrow" body="Locked, disputed, refundable, releasable, completed." />
          </div>
        </div>
      </div>
    ),
    footer: "The app is not decorative. It replaces the operating room.",
    timing: "22s",
    notes:
      "Most commodity operators in 2026 are still coordinating serious financial flows with calls, spreadsheets, Facebook groups, and manual validation. AgroTrade puts the operating room in the phone: where the product is, what was verified, what action is next, and when money releases.",
  },
  {
    eyebrow: "Trust Layer",
    number: "06 / 08",
    title: "Stablecoin settlement with audit-ready records.",
    subtitle:
      "Celo gives mobile-first settlement access. Solana gives institutional USDC rails. The backend keeps the workflow unified.",
    content: (
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
          <Block
            tone="good"
            title="Celo"
            body="cUSD escrow for low-fee, mobile-first commodity corridors."
          />
          <Block
            tone="blue"
            title="Solana"
            body="Anchor escrow program for USDC settlement and institutional throughput."
          />
        </div>
        <div className="grid gap-4">
          <Block
            title="KYT-ready events"
            body="Every payment event can carry actor role, timestamp, amount, trade ID, and blockchain reference."
          />
          <Block
            title="AML-aware controls"
            body="No open peer-to-peer chaos. Settlement is admin-gated and tied to trade state."
          />
          <Block
            title="Travel Rule-ready records"
            body="Originator, beneficiary, amount, purpose, and trade context exist at workflow level."
          />
        </div>
      </div>
    ),
    footer: "Controlled settlement is the bridge between trade and compliance",
    timing: "23s",
    notes:
      "The trust layer is stablecoin settlement with audit-ready records. Celo gives mobile-first low-fee access. Solana gives the institutional USDC rail. The backend keeps the trade workflow unified, while every payment event can carry actor, amount, timestamp, trade purpose, and blockchain reference.",
  },
  {
    eyebrow: "Access Layer",
    number: "07 / 08",
    title: "The next user interface is voice.",
    subtitle:
      "For farmers who do not want forms, menus, and dashboards, the app must speak their language.",
    content: (
      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <div className="border border-[#d6ff7b]/20 bg-[#d6ff7b]/8 p-7">
          <div className="text-[13px] font-black uppercase tracking-[0.22em] text-[#d6ff7b]">
            AI mode
          </div>
          <p className="mt-5 text-[31px] font-black leading-[1.08] text-white">
            "I have 200 tons of wheat near Dobrich. I want offers above 220 euros per ton."
          </p>
          <p className="mt-5 text-[16px] leading-7 text-[#dfe8d2]/72">
            The assistant turns spoken intent into a profile, listing, quality requirements,
            pricing constraints, and next actions.
          </p>
        </div>
        <div className="grid gap-4">
          <Block
            tone="good"
            title="Low digital literacy"
            body="The producer should not need to understand dashboards to enter the market."
          />
          <Block
            tone="good"
            title="Live confirmation"
            body="The app repeats what it understood before any listing, offer, or payment action."
          />
          <Block
            tone="good"
            title="Same workflow underneath"
            body="Voice is the input layer; structured trade data remains the source of truth."
          />
        </div>
      </div>
    ),
    footer: "They talk. The system structures the trade.",
    timing: "22s",
    notes:
      "The next user interface is voice. A farmer should be able to open the app and say: I have 200 tons of wheat near Dobrich, I want offers above 220 euros per ton. The assistant turns that into structured trade data. Voice is the input layer; the same verified workflow underneath remains the source of truth.",
  },
  {
    eyebrow: "Future Leap",
    number: "08 / 08",
    title: "China proved autonomous agtech works. Europe needs the regulated version.",
    subtitle:
      "The moat is not the drone. The moat is trusted European trade data, inspection credentials, and settlement infrastructure.",
    content: (
      <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <Stat value="28k" label="agricultural drone flights per day in the China research frame" />
          <Stat value="EU" label="larger farm economics, data regulation, and cross-border trade pressure" />
          <Stat value="EBSI" label="path to verifiable grain-quality credentials" />
        </div>
        <div className="border border-white/10 bg-[#10160f] p-7">
          <div className="text-[13px] font-black uppercase tracking-[0.22em] text-[#d6ff7b]">
            The ask
          </div>
          <ul className="mt-5 space-y-3 text-[22px] font-black leading-8 text-white">
            <li>Pilot and design partners</li>
            <li>Audit-readiness feedback</li>
            <li>Solana ecosystem support</li>
            <li>Data and inspection partners</li>
          </ul>
          <p className="mt-8 text-[29px] font-black leading-[1.1] text-white">
            AgroTrade is the bridge between physical grain and programmable settlement.
          </p>
        </div>
      </div>
    ),
    footer: "The future of European food trade is verified, accessible, and programmable",
    timing: "21s",
    notes:
      "China proved autonomous agtech works at scale. That means Europe does not need to debate if the technology is real. Europe needs the regulated version: trusted trade data, inspection credentials, and settlement infrastructure that works across borders. AgroTrade is the bridge between physical grain and programmable settlement.",
  },
];

function useInitialNotes() {
  return useMemo(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("notes") === "1";
  }, []);
}

export function StableHacksDeck() {
  const [current, setCurrent] = useState(0);
  const [notesVisible, setNotesVisible] = useState(false);
  const initialNotes = useInitialNotes();

  useEffect(() => {
    setNotesVisible(initialNotes);
  }, [initialNotes]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === " ") {
        event.preventDefault();
        setCurrent((value) => Math.min(value + 1, slides.length - 1));
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setCurrent((value) => Math.max(value - 1, 0));
      }
      if (event.key === "n" || event.key === "N") {
        setNotesVisible((value) => !value);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const slide = slides[current];

  return (
    <div className="min-h-screen overflow-hidden bg-[#080b07] text-[#f6f7ee]">
      <main className="relative mx-auto flex min-h-screen w-full max-w-[1580px] flex-col justify-between px-8 py-8 md:px-12">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute left-[8%] top-[8%] h-[240px] w-[520px] bg-[#d6ff7b]/8 blur-[90px]" />
          <div className="absolute bottom-[4%] right-[6%] h-[280px] w-[520px] bg-[#64b5ff]/8 blur-[110px]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d6ff7b]/40 to-transparent" />
        </div>

        <header className="relative z-10 flex items-center justify-between border-b border-white/10 pb-5 text-[12px] font-black uppercase tracking-[0.22em] text-[#dfe8d2]/55">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 bg-[#d6ff7b]" />
            {slide.eyebrow}
          </div>
          <div className="text-right">
            <div>{slide.number}</div>
            <div className="mt-1 text-[11px] normal-case tracking-normal text-[#dfe8d2]/45">
              {slide.timing}
            </div>
          </div>
        </header>

        <section className="relative z-10 flex flex-1 flex-col justify-center gap-7 py-8">
          <div className="max-w-[1220px]">
            <h1 className="text-[52px] font-black leading-[0.98] tracking-normal text-white md:text-[74px]">
              {slide.title}
            </h1>
            {slide.subtitle ? (
              <p className="mt-5 max-w-[980px] text-[20px] leading-8 text-[#dfe8d2]/72 md:text-[25px]">
                {slide.subtitle}
              </p>
            ) : null}
          </div>
          <div>{slide.content}</div>
        </section>

        <footer className="relative z-10 flex items-center justify-between border-t border-white/10 pt-5 text-[13px] text-[#dfe8d2]/50">
          <div>{slide.footer}</div>
          <div className="hidden md:block">Arrow keys navigate · N toggles notes</div>
        </footer>
      </main>

      {notesVisible ? (
        <aside className="fixed inset-x-0 bottom-0 z-50 border-t border-[#d6ff7b]/20 bg-[#060805]/95 px-6 py-5 backdrop-blur-xl">
          <div className="mb-2 text-[12px] font-black uppercase tracking-[0.22em] text-[#d6ff7b]">
            What to say
          </div>
          <p className="max-w-[1420px] text-[15px] leading-7 text-[#dfe8d2]/82">
            {slide.notes}
          </p>
        </aside>
      ) : null}
    </div>
  );
}
