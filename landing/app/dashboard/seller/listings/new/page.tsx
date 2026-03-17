"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient } from "@/app/lib/api";
import { toast } from "sonner";

const CATEGORIES = [
  "Grain",
  "Vegetables",
  "Fruit",
  "Livestock",
  "Dairy",
  "Processed",
  "Other",
];

const UNITS = ["kg", "tons", "bags", "boxes", "liters", "pieces"];

export default function NewListingPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    productName: "",
    category: "",
    description: "",
    price: "",
    unit: "kg",
    quantity: "",
    minOrderQuantity: "",
    isOrganic: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productName || !form.category || !form.price || !form.quantity) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post("/seller/listings", {
        productName: form.productName,
        category: form.category,
        description: form.description,
        price: parseFloat(form.price),
        unit: form.unit,
        quantity: parseFloat(form.quantity),
        minOrderQuantity: form.minOrderQuantity ? parseFloat(form.minOrderQuantity) : undefined,
        isOrganic: form.isOrganic,
        images: [],
        certifications: [],
      });
      toast.success("Listing created successfully!");
      router.push("/dashboard/seller/listings");
    } catch (err) {
      toast.error("Failed to create listing. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-cream">Create New Listing</h1>
        <p className="text-text-muted text-sm mt-1">
          Add a new product to the marketplace.
        </p>
      </div>

      <Card className="bg-card border-brand-border">
        <CardHeader>
          <CardTitle className="text-brand-cream">Product Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-brand-cream">Product Name *</Label>
              <Input
                value={form.productName}
                onChange={(e) => setForm({ ...form, productName: e.target.value })}
                placeholder="e.g. Organic Sunflower Seeds"
                className="bg-brand-bg border-brand-border text-brand-cream"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-brand-cream">Category *</Label>
                <Select value={form.category || undefined} onValueChange={(v: string | null) => setForm({ ...form, category: v ?? "" })}>
                  <SelectTrigger className="bg-brand-bg border-brand-border text-brand-cream">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-brand-border">
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-brand-cream">Unit *</Label>
                <Select value={form.unit} onValueChange={(v: string | null) => setForm({ ...form, unit: v ?? "kg" })}>
                  <SelectTrigger className="bg-brand-bg border-brand-border text-brand-cream">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-brand-border">
                    {UNITS.map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-brand-cream">Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe your product..."
                className="bg-brand-bg border-brand-border text-brand-cream min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-brand-cream">Price (USD) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0.00"
                  className="bg-brand-bg border-brand-border text-brand-cream"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-brand-cream">Quantity *</Label>
                <Input
                  type="number"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  placeholder="0"
                  className="bg-brand-bg border-brand-border text-brand-cream"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-brand-cream">Min Order</Label>
                <Input
                  type="number"
                  value={form.minOrderQuantity}
                  onChange={(e) => setForm({ ...form, minOrderQuantity: e.target.value })}
                  placeholder="Optional"
                  className="bg-brand-bg border-brand-border text-brand-cream"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="organic"
                checked={form.isOrganic}
                onChange={(e) => setForm({ ...form, isOrganic: e.target.checked })}
                className="accent-brand-wheat"
              />
              <Label htmlFor="organic" className="text-brand-cream cursor-pointer">
                This product is organic
              </Label>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-brand-wheat text-brand-bg hover:bg-brand-wheat/90 font-semibold flex-1"
              >
                {isSubmitting ? "Creating..." : "Create Listing"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="border-brand-border text-text-muted hover:text-brand-cream"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
