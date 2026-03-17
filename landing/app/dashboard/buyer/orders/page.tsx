"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, ChevronRight } from "lucide-react";
import { useMarketplaceStore } from "@/app/stores/marketplace.store";

const PHASE_COLORS: Record<string, string> = {
  INITIATED: "border-blue-500/30 text-blue-400",
  NEGOTIATION: "border-purple-500/30 text-purple-400",
  AGREED: "border-brand-wheat/30 text-brand-wheat",
  INSPECTION_PENDING: "border-orange-500/30 text-orange-400",
  INSPECTION_COMPLETE: "border-green-500/30 text-green-400",
  IN_TRANSIT: "border-blue-500/30 text-blue-400",
  DELIVERED: "border-green-500/30 text-green-400",
  COMPLETED: "border-green-500/30 text-green-400",
  DISPUTED: "border-red-500/30 text-red-400",
  CANCELLED: "border-red-500/30 text-red-400",
};

export default function BuyerOrdersPage() {
  const { buyerTrades, fetchBuyerTrades, isLoading } = useMarketplaceStore();

  useEffect(() => {
    fetchBuyerTrades();
  }, [fetchBuyerTrades]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-cream">My Orders</h1>
        <p className="text-text-muted text-sm mt-1">Track your trade operations.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 bg-brand-wheat/5 rounded-xl" />
          ))}
        </div>
      ) : buyerTrades.length === 0 ? (
        <Card className="bg-card border-brand-border">
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center space-y-3">
              <ShoppingCart className="h-12 w-12 text-text-muted mx-auto" />
              <p className="text-text-muted">No orders yet.</p>
              <p className="text-xs text-text-muted">
                Browse the marketplace to start trading.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {buyerTrades.map((trade) => (
            <Link
              key={trade.id}
              href={`/dashboard/buyer/orders/${trade.id}`}
              className="block"
            >
              <Card className="bg-card border-brand-border hover:border-brand-wheat/20 transition-colors cursor-pointer group">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="space-y-1">
                    <p className="font-medium text-brand-cream group-hover:text-brand-wheat transition-colors">
                      Trade #{trade.id.slice(0, 8)}
                    </p>
                    <p className="text-sm text-text-muted">
                      {trade.quantity} {trade.unit}
                      {trade.agreedPrice && ` · $${trade.agreedPrice}`}
                    </p>
                    <p className="text-xs text-text-muted">
                      {new Date(trade.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        variant="outline"
                        className={`text-xs ${PHASE_COLORS[trade.phase] || "border-brand-border text-text-muted"}`}
                      >
                        {trade.phase.replace(/_/g, " ")}
                      </Badge>
                      {trade.escrowStatus && trade.escrowStatus !== "NONE" && (
                        <Badge variant="outline" className="text-xs border-brand-wheat/30 text-brand-wheat">
                          Escrow: {trade.escrowStatus.replace(/_/g, " ")}
                        </Badge>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-brand-wheat transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
