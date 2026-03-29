"use client";

import { Check, Clock, Truck, Shield, Package, Handshake, Search, X } from "lucide-react";
import type { TradePhase, EscrowStatus } from "@/app/types";

interface TimelineStep {
  phase: TradePhase;
  label: string;
  icon: React.ElementType;
}

const TIMELINE_STEPS: TimelineStep[] = [
  { phase: "INITIATION", label: "Initiation", icon: Package },
  { phase: "SELLER_MATCHING", label: "Sellers", icon: Search },
  { phase: "SELLER_NEGOTIATION", label: "Negotiation", icon: Handshake },
  { phase: "INSPECTION_PENDING", label: "Inspection", icon: Shield },
  { phase: "TRANSPORT_MATCHING", label: "Transport", icon: Truck },
  { phase: "TRANSPORT_BIDDING", label: "Bidding", icon: Truck },
  { phase: "IN_TRANSIT", label: "In Transit", icon: Truck },
  { phase: "DELIVERED", label: "Delivered", icon: Check },
  { phase: "COMPLETED", label: "Completed", icon: Check },
];

const PHASE_ORDER: Record<TradePhase, number> = {
  INITIATION: 0,
  SELLER_MATCHING: 1,
  SELLER_NEGOTIATION: 2,
  INSPECTION_PENDING: 3,
  TRANSPORT_MATCHING: 4,
  TRANSPORT_BIDDING: 5,
  IN_TRANSIT: 6,
  DELIVERED: 7,
  COMPLETED: 8,
  CANCELLED: -1,
};

interface OrderTimelineProps {
  currentPhase: TradePhase;
  escrowStatus?: EscrowStatus;
  className?: string;
}

export function OrderTimeline({ currentPhase, escrowStatus, className }: OrderTimelineProps) {
  const isCancelled = currentPhase === "CANCELLED";
  const currentIndex = PHASE_ORDER[currentPhase] ?? 0;

  if (isCancelled) {
    return (
      <div className={`flex items-center gap-3 p-4 rounded-lg border bg-zinc-500/5 border-zinc-500/20 ${className ?? ""}`}>
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-500/20 text-zinc-400">
          <X className="w-5 h-5" />
        </div>
        <div>
          <p className="font-semibold text-zinc-400">Trade Cancelled</p>
          <p className="text-xs text-text-muted">This trade has been cancelled.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        {TIMELINE_STEPS.map((step, i) => {
          const stepIndex = PHASE_ORDER[step.phase];
          const isComplete = stepIndex < currentIndex;
          const isCurrent = stepIndex === currentIndex;
          const Icon = step.icon;

          return (
            <div key={step.phase} className="flex flex-col items-center flex-1 relative">
              {i > 0 && (
                <div
                  className={`absolute top-4 h-0.5 ${isComplete ? "bg-brand-wheat" : "bg-brand-border"}`}
                  style={{ width: "100%", left: "-50%" }}
                />
              )}
              <div
                className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${
                  isComplete
                    ? "bg-brand-wheat border-brand-wheat text-brand-bg"
                    : isCurrent
                      ? "bg-brand-wheat/20 border-brand-wheat text-brand-wheat"
                      : "bg-brand-bg2 border-brand-border text-text-muted"
                }`}
              >
                {isComplete ? (
                  <Check className="w-4 h-4" />
                ) : isCurrent ? (
                  <Clock className="w-4 h-4 animate-pulse" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
              </div>
              <span
                className={`text-[10px] mt-1.5 text-center leading-tight ${
                  isCurrent ? "text-brand-wheat font-medium" : isComplete ? "text-brand-cream" : "text-text-muted"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
