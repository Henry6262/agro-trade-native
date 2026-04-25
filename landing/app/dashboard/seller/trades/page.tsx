"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, List } from "lucide-react";
import { useMarketplaceStore } from "@/app/stores/marketplace.store";

const PHASE_COLORS: Record<string, string> = {
  INITIATED: "border-blue-500/30 text-blue-400",
  NEGOTIATION: "border-purple-500/30 text-purple-400",
  AGREED: "border-brand-wheat/30 text-brand-wheat",
  IN_TRANSIT: "border-blue-500/30 text-blue-400",
  DELIVERED: "border-green-500/30 text-green-400",
  COMPLETED: "border-green-500/30 text-green-400",
  DISPUTED: "border-red-500/30 text-red-400",
  CANCELLED: "border-red-500/30 text-red-400",
  UNKNOWN: "border-gray-500/30 text-gray-400",
};

export default function SellerTradesPage() {
  const { sellerTrades, fetchSellerTrades, isLoading } = useMarketplaceStore();

  useEffect(() => {
    fetchSellerTrades();
  }, [fetchSellerTrades]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-cream">My Trades</h1>
        <p className="text-text-muted text-sm mt-1">Incoming trade requests and active trades.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 bg-brand-wheat/5 rounded-xl" />
          ))}
        </div>
      ) : sellerTrades.length === 0 ? (
        <Card className="bg-card border-brand-border">
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center space-y-3">
              <List className="h-12 w-12 text-text-muted mx-auto" />
              <p className="text-text-muted">No trades yet.</p>
              <p className="text-xs text-text-muted">
                Trades will appear when buyers request your products.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sellerTrades.map((trade) => {
            const phase = trade.tradePhase ?? trade.phase ?? "UNKNOWN";
            const quantity = trade.agreedQuantity ?? trade.requestedQuantity ?? trade.quantity;
            const escrowChain = trade.metadata?.escrowChain;
            const isSolanaEligible =
              escrowChain === "SOLANA" &&
              (phase === "DELIVERED" || phase === "COMPLETED");

            return (
            <Card key={trade.id} className="bg-card border-brand-border hover:border-brand-wheat/20 transition-colors">
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-brand-cream">
                      Trade #{(trade.tradeOperationId || trade.id).slice(0, 8)}
                    </p>
                    {escrowChain === "SOLANA" && (
                      <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-300">
                        Solana Escrow
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-text-muted">
                    {quantity} {trade.unit}
                    {trade.agreedPrice && ` · $${trade.agreedPrice}`}
                  </p>
                  <p className="text-xs text-text-muted">
                    Buyer: {trade.buyer?.name || "Unknown"}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {isSolanaEligible && (
                    <Button
                      render={<Link href="/dashboard/seller/portfolio" />}
                      variant="outline"
                      size="sm"
                      className="border-amber-500/30 text-amber-200 hover:bg-amber-500/10"
                    >
                      Invest Proceeds
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Badge
                    variant="outline"
                    className={`text-xs ${PHASE_COLORS[phase] || "border-brand-border text-text-muted"}`}
                  >
                    {phase.replace(/_/g, " ")}
                  </Badge>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
