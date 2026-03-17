"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Shield,
  Lock,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  DollarSign,
  Loader2,
} from "lucide-react";
import { apiClient } from "@/app/lib/api";
import { toast } from "sonner";

interface TradeWithEscrow {
  id: string;
  operationNumber?: string;
  phase: string;
  status?: string;
  escrowStatus?: string;
  buyListing?: {
    product?: { name: string };
    quantity: number;
    unit: string;
    buyer?: { name: string };
  };
  sellers?: Array<{ name: string; price: number }>;
  createdAt: string;
}

const ESCROW_BADGE: Record<string, { class: string; icon: React.ElementType }> = {
  AWAITING_PAYMENT: { class: "border-yellow-500/30 text-yellow-400 bg-yellow-500/10", icon: Lock },
  AWAITING_DELIVERY: { class: "border-blue-500/30 text-blue-400 bg-blue-500/10", icon: Shield },
  COMPLETE: { class: "border-green-500/30 text-green-400 bg-green-500/10", icon: CheckCircle },
  DISPUTED: { class: "border-red-500/30 text-red-400 bg-red-500/10", icon: AlertTriangle },
  REFUNDED: { class: "border-orange-500/30 text-orange-400 bg-orange-500/10", icon: RotateCcw },
};

type EscrowAction = "release" | "dispute" | "resolve-seller" | "resolve-buyer";

export default function AdminEscrowPage() {
  const [trades, setTrades] = useState<TradeWithEscrow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Confirmation dialog state
  const [confirmAction, setConfirmAction] = useState<EscrowAction | null>(null);
  const [confirmTradeId, setConfirmTradeId] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    loadTrades();
  }, []);

  async function loadTrades() {
    setIsLoading(true);
    try {
      const res = await apiClient.get<{ data: TradeWithEscrow[] } | TradeWithEscrow[]>(
        "/trade-operations?limit=100"
      );
      const list = Array.isArray(res) ? res : (res as { data: TradeWithEscrow[] }).data || [];
      // Only show trades that have escrow involvement
      const withEscrow = list.filter(
        (t) => t.escrowStatus && t.escrowStatus !== "NONE"
      );
      setTrades(withEscrow.length > 0 ? withEscrow : list);
    } catch {
      // May not have access
    } finally {
      setIsLoading(false);
    }
  }

  function openConfirm(tradeId: string, action: EscrowAction) {
    setConfirmTradeId(tradeId);
    setConfirmAction(action);
  }

  async function executeAction() {
    if (!confirmTradeId || !confirmAction) return;
    setIsExecuting(true);
    try {
      switch (confirmAction) {
        case "release":
          await apiClient.post(`/escrow/${confirmTradeId}/release`);
          toast.success("Funds released to seller");
          break;
        case "dispute":
          await apiClient.post(`/escrow/${confirmTradeId}/dispute`);
          toast.success("Dispute raised");
          break;
        case "resolve-seller":
          await apiClient.post(`/escrow/${confirmTradeId}/resolve`, { releaseToBuyer: false });
          toast.success("Dispute resolved — funds released to seller");
          break;
        case "resolve-buyer":
          await apiClient.post(`/escrow/${confirmTradeId}/resolve`, { releaseToBuyer: true });
          toast.success("Dispute resolved — funds refunded to buyer");
          break;
      }
      setConfirmAction(null);
      setConfirmTradeId(null);
      await loadTrades();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Action failed";
      toast.error("Escrow action failed", { description: msg });
    } finally {
      setIsExecuting(false);
    }
  }

  const ACTION_LABELS: Record<EscrowAction, { title: string; description: string; variant: string }> = {
    release: {
      title: "Release Funds",
      description: "This will release the escrowed cUSD to the seller. This action is irreversible and triggers an on-chain transaction.",
      variant: "bg-green-600 hover:bg-green-700",
    },
    dispute: {
      title: "Raise Dispute",
      description: "This will flag the escrow as disputed. Funds remain locked until the dispute is resolved.",
      variant: "bg-red-600 hover:bg-red-700",
    },
    "resolve-seller": {
      title: "Resolve → Pay Seller",
      description: "This will resolve the dispute in the seller's favor and release funds to them. Irreversible on-chain transaction.",
      variant: "bg-green-600 hover:bg-green-700",
    },
    "resolve-buyer": {
      title: "Resolve → Refund Buyer",
      description: "This will resolve the dispute in the buyer's favor and refund their cUSD. Irreversible on-chain transaction.",
      variant: "bg-orange-600 hover:bg-orange-700",
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-cream">Escrow Management</h1>
        <p className="text-text-muted text-sm mt-1">
          Monitor and manage on-chain cUSD escrow operations.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 bg-brand-wheat/5 rounded-xl" />
          ))}
        </div>
      ) : trades.length === 0 ? (
        <Card className="bg-card border-brand-border">
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center space-y-3">
              <Shield className="h-12 w-12 text-text-muted mx-auto" />
              <p className="text-text-muted">No escrow operations yet.</p>
              <p className="text-xs text-text-muted">
                Escrow records appear when trades reach the payment phase.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {trades.map((trade) => {
            const escrow = trade.escrowStatus || "NONE";
            const badge = ESCROW_BADGE[escrow];
            const BadgeIcon = badge?.icon || Shield;
            const productName = trade.buyListing?.product?.name || `Trade #${(trade.operationNumber || trade.id).slice(0, 8)}`;
            const canRelease = escrow === "AWAITING_DELIVERY";
            const canDispute = escrow === "AWAITING_DELIVERY" || escrow === "AWAITING_PAYMENT";
            const canResolve = escrow === "DISPUTED";

            return (
              <Card key={trade.id} className="bg-card border-brand-border">
                <CardContent className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <BadgeIcon className={`h-4 w-4 ${badge ? badge.class.split(" ").find(c => c.startsWith("text-")) : "text-text-muted"}`} />
                        <span className="font-medium text-brand-cream">{productName}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-text-muted">
                        <span>ID: {trade.id.slice(0, 10)}...</span>
                        {trade.buyListing?.buyer?.name && (
                          <span>Buyer: {trade.buyListing.buyer.name}</span>
                        )}
                        <span>Phase: {trade.phase.replace(/_/g, " ")}</span>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${badge?.class || "border-brand-border text-text-muted"}`}
                    >
                      {escrow.replace(/_/g, " ")}
                    </Badge>
                  </div>

                  {/* Actions */}
                  {(canRelease || canDispute || canResolve) && (
                    <div className="flex items-center gap-2 pt-2 border-t border-brand-border">
                      {canRelease && (
                        <Button
                          size="sm"
                          onClick={() => openConfirm(trade.id, "release")}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs"
                        >
                          <DollarSign className="h-3 w-3 mr-1" />
                          Release Funds
                        </Button>
                      )}
                      {canDispute && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openConfirm(trade.id, "dispute")}
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs"
                        >
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Dispute
                        </Button>
                      )}
                      {canResolve && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => openConfirm(trade.id, "resolve-seller")}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Pay Seller
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => openConfirm(trade.id, "resolve-buyer")}
                            className="bg-orange-600 hover:bg-orange-700 text-white text-xs"
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Refund Buyer
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmAction} onOpenChange={(o) => { if (!o) { setConfirmAction(null); setConfirmTradeId(null); } }}>
        <DialogContent className="bg-card border-brand-border text-brand-cream sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-brand-cream">
              {confirmAction ? ACTION_LABELS[confirmAction].title : ""}
            </DialogTitle>
            <DialogDescription className="text-text-muted">
              {confirmAction ? ACTION_LABELS[confirmAction].description : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button
              onClick={executeAction}
              disabled={isExecuting}
              className={`flex-1 text-white font-semibold ${confirmAction ? ACTION_LABELS[confirmAction].variant : ""}`}
            >
              {isExecuting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</>
              ) : (
                "Confirm"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => { setConfirmAction(null); setConfirmTradeId(null); }}
              className="border-brand-border text-text-muted hover:text-brand-cream"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
