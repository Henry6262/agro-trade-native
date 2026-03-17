"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Store, ShoppingCart, TrendingUp, ArrowRight, FileText } from "lucide-react";
import { useMarketplaceStore } from "@/app/stores/marketplace.store";
import { apiClient } from "@/app/lib/api";

interface BuyerStats {
  totalListings: number;
  activeListings: number;
  totalOffers: number;
  acceptedOffers: number;
  pendingOffers: number;
}

export default function BuyerDashboard() {
  const { buyerTrades, fetchBuyerTrades, isLoading } = useMarketplaceStore();
  const [stats, setStats] = useState<BuyerStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetchBuyerTrades();
    loadStats();
  }, [fetchBuyerTrades]);

  async function loadStats() {
    try {
      const res = await apiClient.get<BuyerStats>("/buyer/stats");
      setStats(res as unknown as BuyerStats);
    } catch {
      // Stats endpoint might not be available — fall back to client-side
    } finally {
      setStatsLoading(false);
    }
  }

  const activeTrades = buyerTrades.filter(
    (t) => !["COMPLETED", "CANCELLED"].includes(t.phase)
  );
  const completedTrades = buyerTrades.filter((t) => t.phase === "COMPLETED");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-cream">Buyer Dashboard</h1>
        <p className="text-text-muted text-sm mt-1">
          Browse the marketplace and manage your orders.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-card border-brand-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-text-muted">
              Active Orders
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-brand-wheat" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16 bg-brand-wheat/10" />
            ) : (
              <div className="text-2xl font-bold text-brand-cream">
                {activeTrades.length}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-brand-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-text-muted">
              Completed
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-brand-green" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16 bg-brand-wheat/10" />
            ) : (
              <div className="text-2xl font-bold text-brand-cream">
                {completedTrades.length}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-brand-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-text-muted">
              My Listings
            </CardTitle>
            <FileText className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16 bg-brand-wheat/10" />
            ) : (
              <div className="text-2xl font-bold text-brand-cream">
                {stats?.activeListings ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-brand-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-text-muted">
              Pending Offers
            </CardTitle>
            <Store className="h-4 w-4 text-brand-amber" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16 bg-brand-wheat/10" />
            ) : (
              <div className="text-2xl font-bold text-brand-cream">
                {stats?.pendingOffers ?? 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/dashboard/buyer/marketplace">
          <Card className="bg-card border-brand-border hover:border-brand-wheat/30 transition-colors cursor-pointer group">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-brand-wheat/10">
                  <Store className="h-6 w-6 text-brand-wheat" />
                </div>
                <div>
                  <p className="font-semibold text-brand-cream">Browse Marketplace</p>
                  <p className="text-sm text-text-muted">Find products from verified sellers</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-text-muted group-hover:text-brand-wheat transition-colors" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/buyer/orders">
          <Card className="bg-card border-brand-border hover:border-brand-wheat/30 transition-colors cursor-pointer group">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-brand-green/20">
                  <ShoppingCart className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <p className="font-semibold text-brand-cream">View Orders</p>
                  <p className="text-sm text-text-muted">Track your active trades</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-text-muted group-hover:text-brand-wheat transition-colors" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Orders */}
      {activeTrades.length > 0 && (
        <Card className="bg-card border-brand-border">
          <CardHeader>
            <CardTitle className="text-brand-cream">Active Orders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeTrades.slice(0, 5).map((trade) => (
              <Link
                key={trade.id}
                href={`/dashboard/buyer/orders/${trade.id}`}
                className="flex items-center justify-between p-3 rounded-lg bg-brand-bg2/50 border border-brand-border hover:border-brand-wheat/20 transition-colors group"
              >
                <div>
                  <p className="text-sm font-medium text-brand-cream group-hover:text-brand-wheat transition-colors">
                    Trade #{trade.id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-text-muted">
                    {trade.quantity} {trade.unit}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="text-xs border-brand-wheat/30 text-brand-wheat"
                >
                  {trade.phase.replace(/_/g, " ")}
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
