"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Wheat, MapPin, Calendar } from "lucide-react";
import { apiClient } from "@/app/lib/api";
import { toast } from "sonner";
import type { SellerListing } from "@/app/types";

interface TradeRequestDialogProps {
  listing: SellerListing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UNITS = [
  { value: "TON", label: "Tons" },
  { value: "KG", label: "Kilograms" },
  { value: "LITER", label: "Liters" },
  { value: "PIECE", label: "Pieces" },
];

export function TradeRequestDialog({ listing, open, onOpenChange }: TradeRequestDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    quantity: "",
    unit: "TON",
    maxPricePerUnit: "",
    neededBy: "",
    notes: "",
    deliveryCity: "",
    deliveryCountry: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing) return;

    if (!form.quantity || parseFloat(form.quantity) <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    setIsSubmitting(true);
    try {
      // The backend expects a productId — the listing has a product reference.
      // SaleListings reference a Product by productId. We use the listing's
      // product info to create a matching BuyListing.
      const payload: Record<string, unknown> = {
        productId: (listing as unknown as { productId?: string }).productId || listing.id,
        quantity: parseFloat(form.quantity),
        unit: form.unit,
        notes: form.notes || undefined,
        neededBy: form.neededBy ? new Date(form.neededBy).toISOString() : undefined,
        maxPricePerUnit: form.maxPricePerUnit ? parseFloat(form.maxPricePerUnit) : undefined,
      };

      // Include delivery location if provided
      if (form.deliveryCity) {
        payload.deliveryLocation = {
          latitude: 0,
          longitude: 0,
          city: form.deliveryCity,
          country: form.deliveryCountry || undefined,
        };
      }

      await apiClient.post("/buyer/listings", payload);

      toast.success("Purchase request submitted!", {
        description: `Your request for ${form.quantity} ${form.unit.toLowerCase()} of ${listing.productName} has been submitted. You'll be notified when sellers respond.`,
      });

      // Reset form
      setForm({
        quantity: "",
        unit: "TON",
        maxPricePerUnit: "",
        neededBy: "",
        notes: "",
        deliveryCity: "",
        deliveryCountry: "",
      });

      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to submit request";
      toast.error("Request failed", { description: msg });
      console.error("Trade request error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!listing) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-brand-border text-brand-cream sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-brand-cream">Request Trade</DialogTitle>
          <DialogDescription className="text-text-muted">
            Submit a purchase request for this product. An operator will match you with the best seller.
          </DialogDescription>
        </DialogHeader>

        {/* Listing summary */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-brand-bg2 border border-brand-border">
          <div className="flex items-center justify-center w-10 h-10 rounded-md bg-brand-wheat/10">
            <Wheat className="w-5 h-5 text-brand-wheat" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-brand-cream truncate">{listing.productName}</p>
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span>{listing.category}</span>
              {listing.location?.city && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-0.5">
                    <MapPin className="h-3 w-3" />
                    {listing.location.city}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="text-right">
            <span className="text-brand-wheat font-bold">${listing.price}</span>
            <span className="text-xs text-text-muted ml-1">/ {listing.unit}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quantity + Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-brand-cream text-sm">Quantity *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                placeholder={listing.minOrderQuantity ? `Min: ${listing.minOrderQuantity}` : "0"}
                className="bg-brand-bg border-brand-border text-brand-cream"
              />
              {listing.quantity && (
                <p className="text-xs text-text-muted">
                  Available: {listing.quantity} {listing.unit}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-brand-cream text-sm">Unit</Label>
              <Select value={form.unit} onValueChange={(v: string | null) => setForm({ ...form, unit: v ?? "TON" })}>
                <SelectTrigger className="bg-brand-bg border-brand-border text-brand-cream">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-brand-border">
                  {UNITS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Max price */}
          <div className="space-y-1.5">
            <Label className="text-brand-cream text-sm">Max Price Per Unit (optional)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.maxPricePerUnit}
              onChange={(e) => setForm({ ...form, maxPricePerUnit: e.target.value })}
              placeholder={`Listing price: $${listing.price}`}
              className="bg-brand-bg border-brand-border text-brand-cream"
            />
            <p className="text-xs text-text-muted">Leave blank to accept any price</p>
          </div>

          {/* Delivery location */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-brand-cream text-sm">Delivery City</Label>
              <Input
                value={form.deliveryCity}
                onChange={(e) => setForm({ ...form, deliveryCity: e.target.value })}
                placeholder="e.g. Sofia"
                className="bg-brand-bg border-brand-border text-brand-cream"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-brand-cream text-sm">Country</Label>
              <Input
                value={form.deliveryCountry}
                onChange={(e) => setForm({ ...form, deliveryCountry: e.target.value })}
                placeholder="e.g. Bulgaria"
                className="bg-brand-bg border-brand-border text-brand-cream"
              />
            </div>
          </div>

          {/* Needed by date */}
          <div className="space-y-1.5">
            <Label className="text-brand-cream text-sm">Needed By (optional)</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                type="date"
                value={form.neededBy}
                onChange={(e) => setForm({ ...form, neededBy: e.target.value })}
                className="bg-brand-bg border-brand-border text-brand-cream pl-10"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-brand-cream text-sm">Notes (optional)</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Quality requirements, delivery preferences..."
              className="bg-brand-bg border-brand-border text-brand-cream min-h-[70px]"
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-brand-wheat text-brand-bg hover:bg-brand-wheat/90 font-semibold flex-1"
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-brand-border text-text-muted hover:text-brand-cream"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
