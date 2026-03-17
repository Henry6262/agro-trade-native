"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MapPin, Wheat, Filter } from "lucide-react";
import { useMarketplaceStore } from "@/app/stores/marketplace.store";
import { TradeRequestDialog } from "@/app/components/dashboard/TradeRequestDialog";
import type { SellerListing } from "@/app/types";

export default function MarketplacePage() {
  const { listings, fetchListings, isLoading, searchQuery, setSearchQuery } =
    useMarketplaceStore();
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Trade request dialog state
  const [selectedListing, setSelectedListing] = useState<SellerListing | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchQuery(localSearch);
    }, 300);
    return () => clearTimeout(t);
  }, [localSearch, setSearchQuery]);

  const filtered = listings.filter((l) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.productName?.toLowerCase().includes(q) ||
      l.category?.toLowerCase().includes(q) ||
      l.description?.toLowerCase().includes(q)
    );
  });

  const handleRequestTrade = (listing: SellerListing) => {
    setSelectedListing(listing);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-cream">Marketplace</h1>
          <p className="text-text-muted text-sm mt-1">
            Browse available products from verified sellers.
          </p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            placeholder="Search products, categories..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-10 bg-card border-brand-border text-brand-cream placeholder:text-text-muted"
          />
        </div>
        <Button variant="outline" className="border-brand-border text-text-muted hover:text-brand-cream">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 bg-brand-wheat/5 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-card border-brand-border">
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center space-y-3">
              <Wheat className="h-12 w-12 text-text-muted mx-auto" />
              <p className="text-text-muted">No listings found.</p>
              <p className="text-xs text-text-muted">
                {searchQuery
                  ? "Try adjusting your search terms."
                  : "Check back later for new products."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onRequestTrade={handleRequestTrade}
            />
          ))}
        </div>
      )}

      {/* Trade Request Dialog */}
      <TradeRequestDialog
        listing={selectedListing}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}

function ListingCard({
  listing,
  onRequestTrade,
}: {
  listing: SellerListing;
  onRequestTrade: (listing: SellerListing) => void;
}) {
  return (
    <Card className="bg-card border-brand-border hover:border-brand-wheat/30 transition-colors group overflow-hidden">
      {/* Image placeholder */}
      <div className="h-40 bg-brand-bg2 flex items-center justify-center border-b border-brand-border">
        {listing.images?.[0] ? (
          <img
            src={listing.images[0]}
            alt={listing.productName}
            className="w-full h-full object-cover"
          />
        ) : (
          <Wheat className="h-10 w-10 text-text-muted" />
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-brand-cream group-hover:text-brand-wheat transition-colors">
              {listing.productName}
            </h3>
            <p className="text-xs text-text-muted mt-0.5">{listing.category}</p>
          </div>
          {listing.isOrganic && (
            <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">
              Organic
            </Badge>
          )}
        </div>

        <p className="text-sm text-text-muted line-clamp-2">
          {listing.description}
        </p>

        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="text-lg font-bold text-brand-wheat">
              ${listing.price}
            </span>
            <span className="text-xs text-text-muted ml-1">/ {listing.unit}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-text-muted">
            <MapPin className="h-3 w-3" />
            {listing.location?.city || "Unknown"}
          </div>
        </div>

        <div className="text-xs text-text-muted">
          Qty: {listing.quantity} {listing.unit} available
          {listing.minOrderQuantity && (
            <span> &middot; Min: {listing.minOrderQuantity}</span>
          )}
        </div>

        <Button
          onClick={() => onRequestTrade(listing)}
          className="w-full bg-brand-wheat text-brand-bg hover:bg-brand-wheat/90 font-semibold"
        >
          Request Trade
        </Button>
      </CardContent>
    </Card>
  );
}
