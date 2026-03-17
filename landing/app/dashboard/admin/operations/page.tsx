"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search, List } from "lucide-react";
import { apiClient } from "@/app/lib/api";
import type { TradeOperation } from "@/app/types";

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

export default function AdminOperationsPage() {
  const [trades, setTrades] = useState<TradeOperation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const res = await apiClient.get<TradeOperation[]>("/trade-operations");
        setTrades(Array.isArray(res) ? res : []);
      } catch {
        // API may return 404 if no trades
      } finally {
        setIsLoading(false);
      }
    };
    fetchTrades();
  }, []);

  const filtered = trades.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.id.toLowerCase().includes(q) ||
      t.phase.toLowerCase().includes(q) ||
      t.buyer?.name?.toLowerCase().includes(q) ||
      t.seller?.name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-cream">All Operations</h1>
        <p className="text-text-muted text-sm mt-1">
          Overview of all trade operations in the system.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <Input
          placeholder="Search by ID, phase, buyer, seller..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-card border-brand-border text-brand-cream placeholder:text-text-muted"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 bg-brand-wheat/5 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-card border-brand-border">
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center space-y-3">
              <List className="h-12 w-12 text-text-muted mx-auto" />
              <p className="text-text-muted">No operations found.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((trade) => (
            <Card key={trade.id} className="bg-card border-brand-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-mono text-sm text-brand-cream">{trade.id.slice(0, 12)}...</p>
                    <div className="flex gap-4 text-xs text-text-muted">
                      <span>Buyer: {trade.buyer?.name || "N/A"}</span>
                      <span>Seller: {trade.seller?.name || "N/A"}</span>
                      <span>{trade.quantity} {trade.unit}</span>
                      {trade.agreedPrice && <span>${trade.agreedPrice}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className={`text-xs ${PHASE_COLORS[trade.phase] || ""}`}>
                      {trade.phase.replace(/_/g, " ")}
                    </Badge>
                    {trade.escrowStatus && trade.escrowStatus !== "NONE" && (
                      <Badge variant="outline" className="text-xs border-brand-wheat/30 text-brand-wheat">
                        {trade.escrowStatus}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
