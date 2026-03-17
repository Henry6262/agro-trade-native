"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Plus, Wheat } from "lucide-react";
import { useMarketplaceStore } from "@/app/stores/marketplace.store";

export default function SellerListingsPage() {
  const { myListings, fetchMyListings, isLoading } = useMarketplaceStore();

  useEffect(() => {
    fetchMyListings();
  }, [fetchMyListings]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-cream">My Listings</h1>
          <p className="text-text-muted text-sm mt-1">Manage your product listings.</p>
        </div>
        <Link href="/dashboard/seller/listings/new">
          <Button className="bg-brand-wheat text-brand-bg hover:bg-brand-wheat/90 font-semibold">
            <Plus className="h-4 w-4 mr-2" />
            New Listing
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 bg-brand-wheat/5 rounded-xl" />
          ))}
        </div>
      ) : myListings.length === 0 ? (
        <Card className="bg-card border-brand-border">
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center space-y-3">
              <Package className="h-12 w-12 text-text-muted mx-auto" />
              <p className="text-text-muted">No listings yet.</p>
              <p className="text-xs text-text-muted">
                Create your first listing to start selling.
              </p>
              <Link href="/dashboard/seller/listings/new">
                <Button className="bg-brand-wheat text-brand-bg hover:bg-brand-wheat/90 font-semibold mt-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Listing
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {myListings.map((listing) => (
            <Card key={listing.id} className="bg-card border-brand-border hover:border-brand-wheat/20 transition-colors">
              <div className="h-32 bg-brand-bg2 flex items-center justify-center border-b border-brand-border">
                {listing.images?.[0] ? (
                  <img src={listing.images[0]} alt={listing.productName} className="w-full h-full object-cover" />
                ) : (
                  <Wheat className="h-8 w-8 text-text-muted" />
                )}
              </div>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-brand-cream">{listing.productName}</h3>
                  <Badge variant="outline" className={`text-xs ${listing.isActive ? "border-green-500/30 text-green-400" : "border-red-500/30 text-red-400"}`}>
                    {listing.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="text-sm text-text-muted">
                  ${listing.price}/{listing.unit} · {listing.quantity} available
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
