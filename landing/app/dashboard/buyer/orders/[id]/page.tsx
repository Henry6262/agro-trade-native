"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, Package, User, MapPin, DollarSign } from "lucide-react";
import { apiClient } from "@/app/lib/api";
import { toast } from "sonner";
import { OrderTimeline } from "@/app/components/dashboard/OrderTimeline";
import { EscrowStatusCard } from "@/app/components/dashboard/EscrowStatusCard";
import type { TradePhase, EscrowStatus } from "@/app/types";

// Backend trade operation response shape (simplified for buyer view)
interface TradeDetail {
  id: string;
  operationNumber?: string;
  phase: TradePhase;
  status: string;
  escrowStatus?: EscrowStatus;
  buyer?: {
    id: string;
    name: string;
    requestedQuantity: number;
    maxPrice: number;
    location?: string;
  };
  sellers?: Array<{
    id: string;
    sellerId: string;
    name: string;
    quantity: number;
    price: number;
    status: string;
    unit?: string;
  }>;
  profit?: {
    estimated: number;
    margin: number;
  };
  transport?: {
    estimatedCost: number;
    distance: number;
  };
  createdAt: string;
  updatedAt: string;
  expectedDeliveryDate?: string;
  completedAt?: string;
}

// Buyer offer shape from GET /buyer/trades
interface BuyerTrade {
  id: string;
  buyListingId: string;
  tradeOperationId?: string;
  price: number;
  quantity: number;
  status: string;
  saleListing?: {
    id: string;
    sellerId: string;
    quantity: number;
    askingPrice: number;
    product?: { id: string; name: string; category: string };
  };
  product?: { id: string; name: string; category: string };
  buyListing?: {
    id: string;
    quantity: number;
    unit: string;
    maxPricePerUnit: number;
    neededBy?: string;
    deliveryAddress?: {
      city?: string;
      region?: string;
      country?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

const PHASE_COLORS: Record<string, string> = {
  INITIATED: "border-blue-500/30 text-blue-400 bg-blue-500/10",
  NEGOTIATION: "border-purple-500/30 text-purple-400 bg-purple-500/10",
  AGREED: "border-brand-wheat/30 text-brand-wheat bg-brand-wheat/10",
  INSPECTION_PENDING: "border-orange-500/30 text-orange-400 bg-orange-500/10",
  INSPECTION_COMPLETE: "border-green-500/30 text-green-400 bg-green-500/10",
  IN_TRANSIT: "border-blue-500/30 text-blue-400 bg-blue-500/10",
  DELIVERED: "border-green-500/30 text-green-400 bg-green-500/10",
  COMPLETED: "border-green-500/30 text-green-400 bg-green-500/10",
  DISPUTED: "border-red-500/30 text-red-400 bg-red-500/10",
  CANCELLED: "border-zinc-500/30 text-zinc-400 bg-zinc-500/10",
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [trade, setTrade] = useState<BuyerTrade | null>(null);
  const [tradeDetail, setTradeDetail] = useState<TradeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchOrder = async () => {
      setIsLoading(true);
      try {
        // Try fetching from buyer trades first
        const trades = await apiClient.get<BuyerTrade[]>("/buyer/trades");
        const arr = Array.isArray(trades) ? trades : [];
        const match = arr.find((t) => t.id === id || t.tradeOperationId === id || t.buyListingId === id);

        if (match) {
          setTrade(match);

          // If we have a tradeOperationId, fetch the full trade operation detail
          if (match.tradeOperationId) {
            try {
              const detail = await apiClient.get<TradeDetail>(
                `/trade-operations/${match.tradeOperationId}`
              );
              setTradeDetail(detail as unknown as TradeDetail);
            } catch {
              // May not have access to trade operation detail (admin-only)
            }
          }
        } else {
          // Fallback: try to load directly as a trade operation
          try {
            const detail = await apiClient.get<TradeDetail>(`/trade-operations/${id}`);
            setTradeDetail(detail as unknown as TradeDetail);
          } catch {
            toast.error("Order not found");
          }
        }
      } catch (err) {
        console.error("Failed to load order:", err);
        toast.error("Failed to load order details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const handleConfirmDelivery = async () => {
    const opId = trade?.tradeOperationId || tradeDetail?.id;
    if (!opId) return;

    setIsConfirming(true);
    try {
      await apiClient.post(`/buyer/orders/${opId}/confirm-receipt`, {});
      toast.success("Delivery confirmed! Escrow funds will be released.");

      // Refresh data
      if (tradeDetail) {
        setTradeDetail({ ...tradeDetail, phase: "COMPLETED" });
      }
    } catch (err) {
      toast.error("Failed to confirm delivery. Please try again.");
      console.error(err);
    } finally {
      setIsConfirming(false);
    }
  };

  // Determine display values from either source
  const phase: TradePhase = tradeDetail?.phase || "INITIATED";
  const escrowStatus: EscrowStatus = tradeDetail?.escrowStatus || "NONE";
  const productName =
    trade?.saleListing?.product?.name ||
    trade?.product?.name ||
    `Trade #${(tradeDetail?.operationNumber || id).slice(0, 8)}`;
  const quantity =
    trade?.buyListing?.quantity || tradeDetail?.buyer?.requestedQuantity || trade?.quantity;
  const unit = trade?.buyListing?.unit || "TON";
  const price = trade?.price || tradeDetail?.buyer?.maxPrice;
  const createdAt = trade?.createdAt || tradeDetail?.createdAt;
  const deliveryDate = tradeDetail?.expectedDeliveryDate;

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48 bg-brand-wheat/5" />
        <Skeleton className="h-32 bg-brand-wheat/5 rounded-xl" />
        <Skeleton className="h-64 bg-brand-wheat/5 rounded-xl" />
      </div>
    );
  }

  if (!trade && !tradeDetail) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="text-text-muted hover:text-brand-cream">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Button>
        <Card className="bg-card border-brand-border">
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center space-y-2">
              <Package className="h-12 w-12 text-text-muted mx-auto" />
              <p className="text-text-muted">Order not found.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => router.back()} className="text-text-muted hover:text-brand-cream p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-brand-cream">{productName}</h1>
            <p className="text-sm text-text-muted">
              {tradeDetail?.operationNumber
                ? `Operation #${tradeDetail.operationNumber}`
                : `Order ${id.slice(0, 8)}`}
            </p>
          </div>
        </div>
        <Badge variant="outline" className={`text-xs ${PHASE_COLORS[phase] || "border-brand-border text-text-muted"}`}>
          {phase.replace(/_/g, " ")}
        </Badge>
      </div>

      {/* Timeline */}
      <Card className="bg-card border-brand-border">
        <CardHeader>
          <CardTitle className="text-brand-cream text-sm">Trade Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderTimeline currentPhase={phase} escrowStatus={escrowStatus} />
        </CardContent>
      </Card>

      {/* Escrow Status */}
      {escrowStatus && escrowStatus !== "NONE" && (
        <EscrowStatusCard
          status={escrowStatus}
          amount={price ? Number(price) * Number(quantity || 1) : undefined}
          currency="cUSD"
        />
      )}

      {/* Order Details */}
      <Card className="bg-card border-brand-border">
        <CardHeader>
          <CardTitle className="text-brand-cream text-sm">Order Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-text-muted" />
              <div>
                <p className="text-xs text-text-muted">Quantity</p>
                <p className="text-sm font-medium text-brand-cream">
                  {quantity} {unit}
                </p>
              </div>
            </div>

            {price && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-text-muted" />
                <div>
                  <p className="text-xs text-text-muted">Price</p>
                  <p className="text-sm font-medium text-brand-wheat">
                    ${Number(price).toFixed(2)} / {unit}
                  </p>
                </div>
              </div>
            )}

            {createdAt && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-text-muted" />
                <div>
                  <p className="text-xs text-text-muted">Created</p>
                  <p className="text-sm font-medium text-brand-cream">
                    {new Date(createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}

            {deliveryDate && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-text-muted" />
                <div>
                  <p className="text-xs text-text-muted">Expected Delivery</p>
                  <p className="text-sm font-medium text-brand-cream">
                    {new Date(deliveryDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Delivery address */}
          {trade?.buyListing?.deliveryAddress && (
            <div className="flex items-start gap-2 pt-2 border-t border-brand-border">
              <MapPin className="w-4 h-4 text-text-muted mt-0.5" />
              <div>
                <p className="text-xs text-text-muted">Delivery Location</p>
                <p className="text-sm text-brand-cream">
                  {[
                    trade.buyListing.deliveryAddress.city,
                    trade.buyListing.deliveryAddress.region,
                    trade.buyListing.deliveryAddress.country,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sellers involved */}
      {tradeDetail?.sellers && tradeDetail.sellers.length > 0 && (
        <Card className="bg-card border-brand-border">
          <CardHeader>
            <CardTitle className="text-brand-cream text-sm">Matched Sellers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tradeDetail.sellers.map((seller) => (
              <div
                key={seller.id}
                className="flex items-center justify-between p-3 rounded-lg bg-brand-bg2 border border-brand-border"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/10 border border-green-500/20">
                    <User className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-brand-cream">{seller.name}</p>
                    <p className="text-xs text-text-muted">
                      {seller.quantity} {seller.unit || "TON"} · ${Number(seller.price).toFixed(2)}/{seller.unit || "TON"}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    seller.status === "ACCEPTED"
                      ? "border-green-500/30 text-green-400"
                      : seller.status === "PENDING"
                        ? "border-yellow-500/30 text-yellow-400"
                        : "border-brand-border text-text-muted"
                  }`}
                >
                  {seller.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Confirm Delivery Action */}
      {phase === "DELIVERED" && (
        <Card className="bg-card border-brand-border border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-brand-cream">Goods Delivered</p>
                <p className="text-xs text-text-muted">
                  Confirm receipt to release escrow funds to the seller.
                </p>
              </div>
              <Button
                onClick={handleConfirmDelivery}
                disabled={isConfirming}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold"
              >
                {isConfirming ? "Confirming..." : "Confirm Receipt"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
