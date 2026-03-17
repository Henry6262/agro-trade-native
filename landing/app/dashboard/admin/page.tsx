"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { List, Users, Shield, ArrowRight, LayoutDashboard } from "lucide-react";
import { apiClient } from "@/app/lib/api";

interface AdminAnalytics {
  totalOperations?: number;
  activeOperations?: number;
  completedOperations?: number;
  disputedOperations?: number;
  totalBuyListings?: number;
  totalSaleListings?: number;
  // Allow flexible shape from the backend
  [key: string]: unknown;
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<AdminAnalytics>("/trade-operations/analytics")
      .then((res) => setAnalytics(res as unknown as AdminAnalytics))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-cream">Admin Command Center</h1>
        <p className="text-text-muted text-sm mt-1">
          Monitor operations, manage users, and oversee escrow.
        </p>
      </div>

      {/* Stats — wired to /trade-operations/analytics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-card border-brand-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-text-muted">Total Trades</CardTitle>
            <LayoutDashboard className="h-4 w-4 text-brand-wheat" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16 bg-brand-wheat/10" /> : (
              <div className="text-2xl font-bold text-brand-cream">
                {analytics?.totalOperations ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-brand-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-text-muted">Active</CardTitle>
            <Users className="h-4 w-4 text-brand-green" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16 bg-brand-wheat/10" /> : (
              <div className="text-2xl font-bold text-brand-cream">
                {analytics?.activeOperations ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-brand-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-text-muted">Completed</CardTitle>
            <Shield className="h-4 w-4 text-brand-amber" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16 bg-brand-wheat/10" /> : (
              <div className="text-2xl font-bold text-brand-cream">
                {analytics?.completedOperations ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-brand-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-text-muted">Disputes</CardTitle>
            <Shield className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16 bg-brand-wheat/10" /> : (
              <div className="text-2xl font-bold text-brand-cream">
                {analytics?.disputedOperations ?? 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { title: "Operations", desc: "All trade operations", href: "/dashboard/admin/operations", icon: List, color: "text-brand-wheat bg-brand-wheat/10" },
          { title: "Users", desc: "User management", href: "/dashboard/admin/users", icon: Users, color: "text-green-400 bg-green-500/20" },
          { title: "Escrow", desc: "Escrow management", href: "/dashboard/admin/escrow", icon: Shield, color: "text-blue-400 bg-blue-500/20" },
        ].map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="bg-card border-brand-border hover:border-brand-wheat/30 transition-colors cursor-pointer group">
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`p-3 rounded-xl ${item.color}`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-brand-cream">{item.title}</p>
                  <p className="text-sm text-text-muted">{item.desc}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-text-muted group-hover:text-brand-wheat transition-colors" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
