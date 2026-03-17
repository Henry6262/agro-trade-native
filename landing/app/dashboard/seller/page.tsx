"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, List, Plus, ArrowRight, TrendingUp, Inbox } from "lucide-react";
import { useMarketplaceStore } from "@/app/stores/marketplace.store";
import { apiClient } from "@/app/lib/api";

interface SellerStats {
  totalListings: number;
  activeListings: number;
  totalOffers: number;
  acceptedOffers: number;
  pendingOffers: number;
  totalRevenue?: number;
}

export default function SellerDashboard() {
  const { myListings, sellerTrades, fetchMyListings, fetchSellerTrades, isLoading } =
    useMarketplaceStore();
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetchMyListings();
    fetchSellerTrades();
    loadStats();
  }, [fetchMyListings, fetchSellerTrades]);

  async function loadStats() {
    try {
      const res = await apiClient.get<SellerStats>("/seller/stats");
      setStats(res as unknown as SellerStats);
    } catch {
      // fallback to client-side
    } finally {
      setStatsLoading(false);
    }
  }

  const activeTrades = sellerTrades.filter(
    (t) => !["COMPLETED", "CANCELLED"].includes(t.phase)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-cream">Seller Dashboard</h1>
        <p className="text-text-muted text-sm mt-1">
          Manage your listings and handle incoming trades.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-card border-brand-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-text-muted">Active Listings</CardTitle>
            <Package className="h-4 w-4 text-brand-wheat" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16 bg-brand-wheat/10" /> : (
              <div className="text-2xl font-bold text-brand-cream">
                {stats?.activeListings ?? myListings.filter(l => l.isActive).length}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-brand-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-text-muted">Active Trades</CardTitle>
            <List className="h-4 w-4 text-brand-green" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16 bg-brand-wheat/10" /> : (
              <div className="text-2xl font-bold text-brand-cream">{activeTrades.length}</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-brand-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-text-muted">Pending Offers</CardTitle>
            <Inbox className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-16 bg-brand-wheat/10" /> : (
              <div className="text-2xl font-bold text-brand-cream">
                {stats?.pendingOffers ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-brand-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-text-muted">Total Trades</CardTitle>
            <TrendingUp className="h-4 w-4 text-brand-amber" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16 bg-brand-wheat/10" /> : (
              <div className="text-2xl font-bold text-brand-cream">{sellerTrades.length}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/dashboard/seller/listings/new">
          <Card className="bg-card border-brand-border hover:border-brand-wheat/30 transition-colors cursor-pointer group">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 rounded-xl bg-brand-wheat/10">
                <Plus className="h-6 w-6 text-brand-wheat" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-brand-cream">New Listing</p>
                <p className="text-sm text-text-muted">Add a product</p>
              </div>
              <ArrowRight className="h-5 w-5 text-text-muted group-hover:text-brand-wheat transition-colors" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/seller/listings">
          <Card className="bg-card border-brand-border hover:border-brand-wheat/30 transition-colors cursor-pointer group">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 rounded-xl bg-brand-green/20">
                <Package className="h-6 w-6 text-green-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-brand-cream">My Listings</p>
                <p className="text-sm text-text-muted">Manage products</p>
              </div>
              <ArrowRight className="h-5 w-5 text-text-muted group-hover:text-brand-wheat transition-colors" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/seller/offers">
          <Card className="bg-card border-brand-border hover:border-yellow-500/30 transition-colors cursor-pointer group">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 rounded-xl bg-yellow-500/20">
                <Inbox className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-brand-cream">Offers</p>
                <p className="text-sm text-text-muted">
                  {stats?.pendingOffers ? `${stats.pendingOffers} pending` : "View offers"}
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-text-muted group-hover:text-brand-wheat transition-colors" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/seller/trades">
          <Card className="bg-card border-brand-border hover:border-brand-wheat/30 transition-colors cursor-pointer group">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 rounded-xl bg-blue-500/20">
                <List className="h-6 w-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-brand-cream">View Trades</p>
                <p className="text-sm text-text-muted">Track orders</p>
              </div>
              <ArrowRight className="h-5 w-5 text-text-muted group-hover:text-brand-wheat transition-colors" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
