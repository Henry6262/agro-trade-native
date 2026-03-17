"use client";

import { Check, Clock, Truck, Shield, Package, Handshake, AlertTriangle, X } from "lucide-react";
import type { TradePhase, EscrowStatus } from "@/app/types";

interface TimelineStep {
  phase: TradePhase;
  label: string;
  icon: React.ElementType;
}

const TIMELINE_STEPS: TimelineStep[] = [
  { phase: "INITIATED", label: "Initiated", icon: Package },
  { phase: "NEGOTIATION", label: "Negotiation", icon: Handshake },
  { phase: "AGREED", label: "Agreed", icon: Check },
  { phase: "INSPECTION_PENDING", label: "Inspection", icon: Shield },
  { phase: "INSPECTION_COMPLETE", label: "Inspected", icon: Shield },
  { phase: "IN_TRANSIT", label: "In Transit", icon: Truck },
  { phase: "DELIVERED", label: "Delivered", icon: Check },
  { phase: "COMPLETED", label: "Completed", icon: Check },
];

const PHASE_ORDER: Record<TradePhase, number> = {
  INITIATED: 0,
  NEGOTIATION: 1,
  AGREED: 2,
  INSPECTION_PENDING: 3,
  INSPECTION_COMPLETE: 4,
  IN_TRANSIT: 5,
  DELIVERED: 6,
  COMPLETED: 7,
  DISPUTED: -1,
  CANCELLED: -2,
};

interface OrderTimelineProps {
  currentPhase: TradePhase;
  escrowStatus?: EscrowStatus;
  className?: string;
}

export function OrderTimeline({ currentPhase, escrowStatus, className }: OrderTimelineProps) {
  const isTerminal = currentPhase === "DISPUTED" || currentPhase === "CANCELLED";
  const currentIndex = PHASE_ORDER[currentPhase] ?? 0;

  if (isTerminal) {
    return (
      <div className={`flex items-center gap-3 p-4 rounded-lg border ${
        currentPhase === "DISPUTED"
          ? "bg-red-500/5 border-red-500/20"
          : "bg-zinc-500/5 border-zinc-500/20"
      } ${className ?? ""}`}>
        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
          currentPhase === "DISPUTED"
            ? "bg-red-500/20 text-red-400"
            : "bg-zinc-500/20 text-zinc-400"
        }`}>
          {currentPhase === "DISPUTED" ? (
            <AlertTriangle className="w-5 h-5" />
          ) : (
            <X className="w-5 h-5" />
          )}
        </div>
        <div>
          <p className={`font-semibold ${
            currentPhase === "DISPUTED" ? "text-red-400" : "text-zinc-400"
          }`}>
            Trade {currentPhase === "DISPUTED" ? "Disputed" : "Cancelled"}
          </p>
          <p className="text-xs text-text-muted">
            {currentPhase === "DISPUTED"
              ? "This trade is under dispute resolution."
              : "This trade has been cancelled."}
          </p>
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
              {/* Connector line */}
              {i > 0 && (
                <div
                  className={`absolute top-4 right-1/2 left-[-50%] h-0.5 ${
                    isComplete ? "bg-brand-wheat" : "bg-brand-border"
                  }`}
                  style={{ width: "100%", left: "-50%" }}
                />
              )}

              {/* Step circle */}
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

              {/* Label */}
              <span
                className={`text-[10px] mt-1.5 text-center leading-tight ${
                  isCurrent
                    ? "text-brand-wheat font-medium"
                    : isComplete
                      ? "text-brand-cream"
                      : "text-text-muted"
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
