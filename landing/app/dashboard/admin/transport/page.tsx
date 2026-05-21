"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Truck,
  Plus,
  X,
  Loader2,
  MapPin,
  Package,
  Calendar,
  Users,
} from "lucide-react";
import { apiClient } from "@/app/lib/api";
import type { TradeOperation } from "@/app/types";

// ── Local types ──────────────────────────────────────────────────────────────

interface PickupPoint {
  address: string;
  lat: number;
  lng: number;
  sellerName: string;
  quantity: number;
  unit: string;
}

interface DeliveryPoint {
  address: string;
  lat: number;
  lng: number;
}

interface TransportRequest {
  id: string;
  requestNumber: string;
  status: string;
  tradeOperationId: string;
  cargoDescription: string;
  totalWeight: number;
  biddingDeadline: string;
  requiredDeliveryDate: string;
  bidCount?: number;
  pickupPoints: PickupPoint[];
  deliveryPoint: DeliveryPoint;
  createdAt: string;
}

interface CreateTransportRequestPayload {
  tradeOperationId: string;
  pickupPoints: PickupPoint[];
  deliveryPoint: DeliveryPoint;
  cargoDescription: string;
  totalWeight: number;
  biddingDeadline: string;
  requiredDeliveryDate: string;
}

// ── Status badge colours ─────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  PENDING: "border-brand-wheat/30 text-brand-wheat",
  OPEN: "border-blue-500/30 text-blue-400",
  BIDDING: "border-purple-500/30 text-purple-400",
  ASSIGNED: "border-green-500/30 text-green-400",
  IN_TRANSIT: "border-blue-500/30 text-blue-400",
  DELIVERED: "border-green-500/30 text-green-400",
  CANCELLED: "border-red-500/30 text-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  OPEN: "Open",
  BIDDING: "Bidding",
  ASSIGNED: "Assigned",
  IN_TRANSIT: "In Transit",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

// ── Eligible phases ──────────────────────────────────────────────────────────

const ELIGIBLE_PHASES = new Set(["TRANSPORT_MATCHING", "INSPECTION_PENDING"]);

// ── Empty form factory ────────────────────────────────────────────────────────

function emptyForm(): CreateTransportRequestPayload {
  return {
    tradeOperationId: "",
    pickupPoints: [{ address: "", lat: 0, lng: 0, sellerName: "", quantity: 0, unit: "kg" }],
    deliveryPoint: { address: "", lat: 0, lng: 0 },
    cargoDescription: "",
    totalWeight: 0,
    biddingDeadline: "",
    requiredDeliveryDate: "",
  };
}

// ── Page component ───────────────────────────────────────────────────────────

function AdminTransportPageContent() {
  const searchParams = useSearchParams();
  const preselectedTradeId = searchParams.get("tradeId");
  const didAutoOpen = useRef(false);

  const [requests, setRequests] = useState<TransportRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // form state
  const [form, setForm] = useState<CreateTransportRequestPayload>(emptyForm());
  const [tradeOps, setTradeOps] = useState<TradeOperation[]>([]);
  const [loadingTrades, setLoadingTrades] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Fetch existing transport requests ──────────────────────────────────────

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await apiClient.get<TransportRequest[]>("/transport/requests");
        setRequests(Array.isArray(res) ? res : []);
      } catch {
        // 404 is fine — no requests yet
      } finally {
        setIsLoading(false);
      }
    };
    fetchRequests();
  }, []);

  // ── Open modal — also fetch eligible trade operations ─────────────────────

  const openModal = async () => {
    setForm(emptyForm());
    setSubmitError(null);
    setModalOpen(true);
    if (tradeOps.length === 0) {
      setLoadingTrades(true);
      try {
        const res = await apiClient.get<TradeOperation[]>("/trade-operations");
        const eligible = Array.isArray(res)
          ? res.filter((t) => ELIGIBLE_PHASES.has(t.phase))
          : [];
        setTradeOps(eligible);
      } catch {
        setTradeOps([]);
      } finally {
        setLoadingTrades(false);
      }
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSubmitError(null);
  };

  // ── Auto-populate when trade op is selected ───────────────────────────────

  const handleTradeSelect = (tradeId: string) => {
    const trade = tradeOps.find((t) => t.id === tradeId);
    if (!trade) {
      setForm((prev) => ({ ...prev, tradeOperationId: tradeId }));
      return;
    }

    // Build a single pickup point from the trade's seller info
    const pickup: PickupPoint = {
      address: trade.seller?.location?.address ?? "",
      lat: trade.seller?.location?.latitude ?? 0,
      lng: trade.seller?.location?.longitude ?? 0,
      sellerName: trade.seller?.name ?? "",
      quantity: trade.quantity ?? 0,
      unit: trade.unit ?? "kg",
    };

    const delivery: DeliveryPoint = {
      address: trade.buyer?.location?.address ?? "",
      lat: trade.buyer?.location?.latitude ?? 0,
      lng: trade.buyer?.location?.longitude ?? 0,
    };

    setForm((prev) => ({
      ...prev,
      tradeOperationId: tradeId,
      pickupPoints: [pickup],
      deliveryPoint: delivery,
      totalWeight: trade.quantity ?? 0,
    }));
  };

  // ── Auto-open + pre-populate when navigated from operations page ─────────────
  // Runs once after tradeOps load so handleTradeSelect can find the trade object.

  useEffect(() => {
    if (!preselectedTradeId || didAutoOpen.current || tradeOps.length === 0) return;
    didAutoOpen.current = true;
    handleTradeSelect(preselectedTradeId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tradeOps, preselectedTradeId]);

  useEffect(() => {
    if (!preselectedTradeId || didAutoOpen.current || isLoading) return;
    // Open the modal and trigger trade fetch; handleTradeSelect fires via the effect above
    openModal();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedTradeId, isLoading]);

  // ── Pickup point helpers ───────────────────────────────────────────────────

  const updatePickup = (index: number, field: keyof PickupPoint, value: string | number) => {
    setForm((prev) => {
      const updated = prev.pickupPoints.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      );
      return { ...prev, pickupPoints: updated };
    });
  };

  const addPickup = () => {
    setForm((prev) => ({
      ...prev,
      pickupPoints: [
        ...prev.pickupPoints,
        { address: "", lat: 0, lng: 0, sellerName: "", quantity: 0, unit: "kg" },
      ],
    }));
  };

  const removePickup = (index: number) => {
    setForm((prev) => ({
      ...prev,
      pickupPoints: prev.pickupPoints.filter((_, i) => i !== index),
    }));
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!form.tradeOperationId) {
      setSubmitError("Please select a trade operation.");
      return;
    }
    if (!form.cargoDescription.trim()) {
      setSubmitError("Cargo description is required.");
      return;
    }
    if (!form.biddingDeadline || !form.requiredDeliveryDate) {
      setSubmitError("Both deadline fields are required.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await apiClient.post<TransportRequest>("/transport/requests", form);
      setRequests((prev) => [created, ...prev]);
      closeModal();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setSubmitError(msg ?? "Failed to create transport request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-cream">Transport Requests</h1>
            <p className="text-text-muted text-sm mt-1">
              Manage transport requests and track bidding across all trade operations.
            </p>
          </div>
          <Button
            onClick={openModal}
            className="shrink-0 bg-green-600 hover:bg-green-700 text-white border-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Request
          </Button>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 bg-brand-wheat/5 rounded-xl" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <Card className="bg-card border-brand-border">
            <CardContent className="flex items-center justify-center py-16">
              <div className="text-center space-y-3">
                <Truck className="h-12 w-12 text-text-muted mx-auto" />
                <p className="text-text-muted">No transport requests yet.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openModal}
                  className="border-green-600/40 text-green-400 hover:bg-green-600/10"
                >
                  <Plus className="h-3 w-3 mr-1.5" />
                  Create the first one
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <Card key={req.id} className="bg-card border-brand-border">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm text-brand-cream">
                          {req.requestNumber ?? req.id.slice(0, 12) + "…"}
                        </p>
                      </div>
                      <p className="text-xs text-text-muted line-clamp-1">
                        {req.cargoDescription}
                      </p>
                      <p className="text-xs text-text-muted font-mono">
                        Trade: {req.tradeOperationId.slice(0, 12)}…
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs shrink-0 ${STATUS_COLORS[req.status] ?? "border-brand-border text-text-muted"}`}
                    >
                      {STATUS_LABELS[req.status] ?? req.status.replace(/_/g, " ")}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-x-5 gap-y-1 pt-2 border-t border-brand-border/50 text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {req.totalWeight} kg
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {req.bidCount ?? 0} bid{req.bidCount !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {req.pickupPoints?.length ?? 0} pickup
                      {(req.pickupPoints?.length ?? 0) !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Bid by:{" "}
                      {req.biddingDeadline
                        ? new Date(req.biddingDeadline).toLocaleDateString()
                        : "—"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Truck className="h-3 w-3" />
                      Deliver by:{" "}
                      {req.requiredDeliveryDate
                        ? new Date(req.requiredDeliveryDate).toLocaleDateString()
                        : "—"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── Create modal ────────────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Panel */}
          <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-card border border-brand-border shadow-2xl">
            <form onSubmit={handleSubmit}>
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border sticky top-0 bg-card z-10">
                <h2 className="text-lg font-semibold text-brand-cream">
                  New Transport Request
                </h2>
                <button
                  type="button"
                  onClick={closeModal}
                  className="p-1.5 rounded-md hover:bg-green-600/10 transition-colors"
                >
                  <X className="h-4 w-4 text-text-muted" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-6">
                {/* Trade operation selector */}
                <div className="space-y-2">
                  <Label className="text-brand-cream text-sm">
                    Trade Operation <span className="text-red-400">*</span>
                  </Label>
                  {loadingTrades ? (
                    <div className="flex items-center gap-2 text-text-muted text-sm py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading eligible trades…
                    </div>
                  ) : tradeOps.length === 0 ? (
                    <p className="text-xs text-text-muted py-2">
                      No trade operations currently in TRANSPORT_MATCHING or
                      INSPECTION_PENDING phase.
                    </p>
                  ) : (
                    <select
                      required
                      value={form.tradeOperationId}
                      onChange={(e) => handleTradeSelect(e.target.value)}
                      className="w-full rounded-md border border-brand-border bg-card px-3 py-2 text-sm text-brand-cream focus:outline-none focus:ring-1 focus:ring-green-600"
                    >
                      <option value="">— Select a trade operation —</option>
                      {tradeOps.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.id.slice(0, 12)}… · {t.buyer?.name ?? "Buyer"} →{" "}
                          {t.seller?.name ?? "Seller"} · {t.quantity} {t.unit} ·{" "}
                          {t.phase.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Pickup points */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-brand-cream text-sm">Pickup Points</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addPickup}
                      className="h-7 text-xs px-2 border-green-600/40 text-green-400 hover:bg-green-600/10"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add pickup
                    </Button>
                  </div>

                  {form.pickupPoints.map((p, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-brand-border/60 p-4 space-y-3 bg-brand-wheat/3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-text-muted uppercase tracking-wide">
                          Pickup {i + 1}
                        </span>
                        {form.pickupPoints.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePickup(i)}
                            className="text-red-400/70 hover:text-red-400 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs text-text-muted">Address</Label>
                          <Input
                            value={p.address}
                            onChange={(e) => updatePickup(i, "address", e.target.value)}
                            placeholder="e.g. 123 Farm Road, Nairobi"
                            className="bg-card border-brand-border text-brand-cream placeholder:text-text-muted h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-text-muted">Latitude</Label>
                          <Input
                            type="number"
                            step="any"
                            value={p.lat || ""}
                            onChange={(e) => updatePickup(i, "lat", parseFloat(e.target.value) || 0)}
                            placeholder="0.000000"
                            className="bg-card border-brand-border text-brand-cream placeholder:text-text-muted h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-text-muted">Longitude</Label>
                          <Input
                            type="number"
                            step="any"
                            value={p.lng || ""}
                            onChange={(e) => updatePickup(i, "lng", parseFloat(e.target.value) || 0)}
                            placeholder="0.000000"
                            className="bg-card border-brand-border text-brand-border h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-text-muted">Seller Name</Label>
                          <Input
                            value={p.sellerName}
                            onChange={(e) => updatePickup(i, "sellerName", e.target.value)}
                            placeholder="Seller name"
                            className="bg-card border-brand-border text-brand-cream placeholder:text-text-muted h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-text-muted">Unit</Label>
                          <Input
                            value={p.unit}
                            onChange={(e) => updatePickup(i, "unit", e.target.value)}
                            placeholder="kg"
                            className="bg-card border-brand-border text-brand-cream placeholder:text-text-muted h-8 text-sm"
                          />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs text-text-muted">Quantity</Label>
                          <Input
                            type="number"
                            min={0}
                            value={p.quantity || ""}
                            onChange={(e) => updatePickup(i, "quantity", parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="bg-card border-brand-border text-brand-cream placeholder:text-text-muted h-8 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Delivery point */}
                <div className="space-y-3">
                  <Label className="text-brand-cream text-sm">Delivery Point</Label>
                  <div className="rounded-lg border border-brand-border/60 p-4 space-y-3 bg-brand-wheat/3">
                    <div className="space-y-1">
                      <Label className="text-xs text-text-muted">Address</Label>
                      <Input
                        value={form.deliveryPoint.address}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            deliveryPoint: { ...prev.deliveryPoint, address: e.target.value },
                          }))
                        }
                        placeholder="e.g. 45 Market Street, Kampala"
                        className="bg-card border-brand-border text-brand-cream placeholder:text-text-muted h-8 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-text-muted">Latitude</Label>
                        <Input
                          type="number"
                          step="any"
                          value={form.deliveryPoint.lat || ""}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              deliveryPoint: {
                                ...prev.deliveryPoint,
                                lat: parseFloat(e.target.value) || 0,
                              },
                            }))
                          }
                          placeholder="0.000000"
                          className="bg-card border-brand-border text-brand-cream placeholder:text-text-muted h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-text-muted">Longitude</Label>
                        <Input
                          type="number"
                          step="any"
                          value={form.deliveryPoint.lng || ""}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              deliveryPoint: {
                                ...prev.deliveryPoint,
                                lng: parseFloat(e.target.value) || 0,
                              },
                            }))
                          }
                          placeholder="0.000000"
                          className="bg-card border-brand-border text-brand-cream placeholder:text-text-muted h-8 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cargo description */}
                <div className="space-y-2">
                  <Label className="text-brand-cream text-sm">
                    Cargo Description <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    value={form.cargoDescription}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, cargoDescription: e.target.value }))
                    }
                    placeholder="e.g. 5 tonnes of Grade-A maize in 50kg bags"
                    className="bg-card border-brand-border text-brand-cream placeholder:text-text-muted"
                  />
                </div>

                {/* Total weight */}
                <div className="space-y-2">
                  <Label className="text-brand-cream text-sm">Total Weight (kg)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.totalWeight || ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        totalWeight: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="5000"
                    className="bg-card border-brand-border text-brand-cream placeholder:text-text-muted"
                  />
                </div>

                {/* Deadlines */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-brand-cream text-sm">
                      Bidding Deadline <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      type="datetime-local"
                      required
                      value={form.biddingDeadline}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, biddingDeadline: e.target.value }))
                      }
                      className="bg-card border-brand-border text-brand-cream [color-scheme:dark]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-brand-cream text-sm">
                      Required Delivery Date <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      type="datetime-local"
                      required
                      value={form.requiredDeliveryDate}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          requiredDeliveryDate: e.target.value,
                        }))
                      }
                      className="bg-card border-brand-border text-brand-cream [color-scheme:dark]"
                    />
                  </div>
                </div>

                {/* Error message */}
                {submitError && (
                  <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    {submitError}
                  </p>
                )}
              </div>

              {/* Modal footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-brand-border sticky bottom-0 bg-card">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  disabled={submitting}
                  className="border-brand-border text-text-muted hover:text-brand-cream"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || loadingTrades}
                  className="bg-green-600 hover:bg-green-700 text-white border-0 min-w-[120px]"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating…
                    </span>
                  ) : (
                    "Create Request"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}


// Suspense wrapper required for useSearchParams in Next.js 14+ static generation
export default function AdminTransportPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted">Loading transport dashboard…</div>}>
      <AdminTransportPageContent />
    </Suspense>
  );
}
