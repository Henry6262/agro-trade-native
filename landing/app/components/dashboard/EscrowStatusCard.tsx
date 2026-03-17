"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, CheckCircle, AlertTriangle, RotateCcw, Clock } from "lucide-react";
import type { EscrowStatus } from "@/app/types";

interface EscrowStatusCardProps {
  status: EscrowStatus;
  amount?: number;
  currency?: string;
  className?: string;
}

const ESCROW_CONFIG: Record<EscrowStatus, {
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  badgeClass: string;
}> = {
  NONE: {
    label: "No Escrow",
    description: "Escrow has not been initiated for this trade.",
    icon: Clock,
    color: "text-text-muted",
    badgeClass: "border-brand-border text-text-muted",
  },
  AWAITING_PAYMENT: {
    label: "Awaiting Payment",
    description: "Buyer needs to fund the escrow to proceed.",
    icon: Lock,
    color: "text-yellow-400",
    badgeClass: "border-yellow-500/30 text-yellow-400 bg-yellow-500/10",
  },
  AWAITING_DELIVERY: {
    label: "Funds Locked",
    description: "Payment is secured in escrow. Awaiting delivery confirmation.",
    icon: Shield,
    color: "text-blue-400",
    badgeClass: "border-blue-500/30 text-blue-400 bg-blue-500/10",
  },
  COMPLETE: {
    label: "Released",
    description: "Escrow funds have been released to the seller.",
    icon: CheckCircle,
    color: "text-green-400",
    badgeClass: "border-green-500/30 text-green-400 bg-green-500/10",
  },
  DISPUTED: {
    label: "Disputed",
    description: "This escrow is under dispute. An admin will resolve it.",
    icon: AlertTriangle,
    color: "text-red-400",
    badgeClass: "border-red-500/30 text-red-400 bg-red-500/10",
  },
  REFUNDED: {
    label: "Refunded",
    description: "Escrow funds have been refunded to the buyer.",
    icon: RotateCcw,
    color: "text-orange-400",
    badgeClass: "border-orange-500/30 text-orange-400 bg-orange-500/10",
  },
};

export function EscrowStatusCard({ status, amount, currency = "cUSD", className }: EscrowStatusCardProps) {
  const config = ESCROW_CONFIG[status] || ESCROW_CONFIG.NONE;
  const Icon = config.icon;

  return (
    <Card className={`bg-card border-brand-border ${className ?? ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`flex items-center justify-center w-10 h-10 rounded-lg bg-brand-bg2 border border-brand-border ${config.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-brand-cream">Escrow Protection</span>
              <Badge variant="outline" className={`text-[10px] ${config.badgeClass}`}>
                {config.label}
              </Badge>
            </div>
            <p className="text-xs text-text-muted">{config.description}</p>
            {amount != null && amount > 0 && (
              <p className="text-sm font-semibold text-brand-wheat mt-2">
                {amount.toLocaleString()} {currency}
              </p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 flex gap-1">
          {(["AWAITING_PAYMENT", "AWAITING_DELIVERY", "COMPLETE"] as const).map((step) => {
            const stepOrder = { AWAITING_PAYMENT: 1, AWAITING_DELIVERY: 2, COMPLETE: 3 };
            const currentOrder = stepOrder[status as keyof typeof stepOrder] || 0;
            const isActive = stepOrder[step] <= currentOrder;

            return (
              <div
                key={step}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  isActive ? "bg-brand-wheat" : "bg-brand-border"
                }`}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
