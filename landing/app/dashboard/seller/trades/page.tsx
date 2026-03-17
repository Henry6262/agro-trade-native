"use client";

import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { List } from "lucide-react";
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
          {sellerTrades.map((trade) => (
            <Card key={trade.id} className="bg-card border-brand-border hover:border-brand-wheat/20 transition-colors">
              <CardContent className="flex items-center justify-between p-4">
                <div className="space-y-1">
                  <p className="font-medium text-brand-cream">
                    Trade #{trade.id.slice(0, 8)}
                  </p>
                  <p className="text-sm text-text-muted">
                    {trade.quantity} {trade.unit}
                    {trade.agreedPrice && ` · $${trade.agreedPrice}`}
                  </p>
                  <p className="text-xs text-text-muted">
                    Buyer: {trade.buyer?.name || "Unknown"}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs ${PHASE_COLORS[trade.phase] || "border-brand-border text-text-muted"}`}
                >
                  {trade.phase.replace(/_/g, " ")}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
