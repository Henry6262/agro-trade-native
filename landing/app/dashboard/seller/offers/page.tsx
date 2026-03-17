"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Inbox, User, Package, DollarSign, Clock } from "lucide-react";
import { apiClient } from "@/app/lib/api";

interface SellerOffer {
  id: string;
  buyListingId: string;
  tradeOperationId?: string;
  price: number;
  quantity: number;
  status: string;
  buyListing?: {
    id: string;
    quantity: number;
    unit: string;
    maxPricePerUnit: number;
    neededBy?: string;
    product?: { name: string; category: string };
    buyer?: { name: string };
  };
  product?: { name: string; category: string };
  createdAt: string;
  updatedAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "border-yellow-500/30 text-yellow-400 bg-yellow-500/10",
  ACCEPTED: "border-green-500/30 text-green-400 bg-green-500/10",
  REJECTED: "border-red-500/30 text-red-400 bg-red-500/10",
  EXPIRED: "border-zinc-500/30 text-zinc-400 bg-zinc-500/10",
  NEGOTIATING: "border-purple-500/30 text-purple-400 bg-purple-500/10",
};

export default function SellerOffersPage() {
  const [offers, setOffers] = useState<SellerOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOffers();
  }, []);

  async function loadOffers() {
    try {
      const res = await apiClient.get<SellerOffer[]>("/seller/offers");
      setOffers(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("Failed to load offers:", err);
    } finally {
      setIsLoading(false);
    }
  }

  const pendingOffers = offers.filter((o) => o.status === "PENDING" || o.status === "NEGOTIATING");
  const resolvedOffers = offers.filter((o) => o.status !== "PENDING" && o.status !== "NEGOTIATING");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-cream">Incoming Offers</h1>
        <p className="text-text-muted text-sm mt-1">
          Review offers from buyers matched to your listings.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 bg-brand-wheat/5 rounded-xl" />
          ))}
        </div>
      ) : offers.length === 0 ? (
        <Card className="bg-card border-brand-border">
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center space-y-3">
              <Inbox className="h-12 w-12 text-text-muted mx-auto" />
              <p className="text-text-muted">No offers yet.</p>
              <p className="text-xs text-text-muted">
                Offers will appear when buyers are matched to your products.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Pending section */}
          {pendingOffers.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-brand-wheat flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Awaiting Response ({pendingOffers.length})
              </h2>
              {pendingOffers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          )}

          {/* Resolved section */}
          {resolvedOffers.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-text-muted">
                Past Offers ({resolvedOffers.length})
              </h2>
              {resolvedOffers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function OfferCard({ offer }: { offer: SellerOffer }) {
  const productName =
    offer.buyListing?.product?.name || offer.product?.name || "Unknown Product";
  const buyerName = offer.buyListing?.buyer?.name || "Buyer";
  const unit = offer.buyListing?.unit || "TON";

  return (
    <Card className="bg-card border-brand-border hover:border-brand-wheat/20 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-brand-wheat" />
              <span className="font-medium text-brand-cream">{productName}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-text-muted">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {buyerName}
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                ${offer.price}/{unit}
              </span>
              <span>
                {offer.quantity} {unit}
              </span>
            </div>
            {offer.buyListing?.neededBy && (
              <p className="text-xs text-text-muted">
                Needed by: {new Date(offer.buyListing.neededBy).toLocaleDateString()}
              </p>
            )}
            <p className="text-xs text-text-muted">
              {new Date(offer.createdAt).toLocaleDateString()}
            </p>
          </div>
          <Badge
            variant="outline"
            className={`text-xs ${STATUS_STYLES[offer.status] || "border-brand-border text-text-muted"}`}
          >
            {offer.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
