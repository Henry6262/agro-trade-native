"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, MapPin, Shield } from "lucide-react";
import { useAuthStore } from "@/app/stores/auth.store";
import { toast } from "sonner";

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // TODO: Wire to backend PUT /users/profile
    await new Promise((r) => setTimeout(r, 500));
    toast.success("Profile updated");
    setSaving(false);
  };

  const ROLE_LABELS: Record<string, string> = {
    buyer: "Buyer",
    seller: "Farmer / Seller",
    inspector: "Inspector",
    transport: "Transporter",
    admin: "Administrator",
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-brand-cream">Settings</h1>
        <p className="text-text-muted text-sm mt-1">Manage your profile and preferences.</p>
      </div>

      {/* Profile Card */}
      <Card className="bg-card border-brand-border">
        <CardHeader>
          <CardTitle className="text-brand-cream text-sm flex items-center gap-2">
            <User className="h-4 w-4 text-brand-wheat" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-brand-cream text-sm">Name</Label>
              <Input
                defaultValue={user?.name || ""}
                className="bg-brand-bg border-brand-border text-brand-cream"
                readOnly
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-brand-cream text-sm">Role</Label>
              <div className="flex items-center h-9 px-3">
                <Badge variant="outline" className="text-xs border-brand-wheat/30 text-brand-wheat">
                  {ROLE_LABELS[user?.role || "buyer"] || user?.role}
                </Badge>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-brand-cream text-sm flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> Email
            </Label>
            <Input
              defaultValue={user?.email || ""}
              className="bg-brand-bg border-brand-border text-brand-cream"
              readOnly
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-brand-cream text-sm flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" /> Phone
            </Label>
            <Input
              defaultValue={user?.phone || ""}
              placeholder="Not set"
              className="bg-brand-bg border-brand-border text-brand-cream placeholder:text-text-muted"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-brand-cream text-sm flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> Location
            </Label>
            <Input
              defaultValue={
                user?.location
                  ? `${user.location.city}, ${user.location.country}`
                  : ""
              }
              placeholder="Not set"
              className="bg-brand-bg border-brand-border text-brand-cream placeholder:text-text-muted"
            />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="bg-card border-brand-border">
        <CardHeader>
          <CardTitle className="text-brand-cream text-sm flex items-center gap-2">
            <Shield className="h-4 w-4 text-brand-wheat" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-muted">
            Authentication is managed via Privy wallet connection. Your session
            is secured with ES256 JWT tokens.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-xs text-green-400">Wallet connected</span>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="bg-brand-wheat text-brand-bg hover:bg-brand-wheat/90 font-semibold"
      >
        {saving ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}
