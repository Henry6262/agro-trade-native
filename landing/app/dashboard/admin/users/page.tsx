"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, ShoppingCart, Package, Truck, ClipboardCheck, Mail } from "lucide-react";
import { apiClient } from "@/app/lib/api";

interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role?: string;
  phone?: string;
  isEmailVerified?: boolean;
  createdAt?: string;
  company?: { name: string };
  addresses?: Array<{ city?: string; country?: string }>;
}

const ROLES = [
  { key: "BUYER", label: "Buyers", icon: ShoppingCart, color: "text-blue-400" },
  { key: "SELLER", label: "Sellers", icon: Package, color: "text-green-400" },
  { key: "FARMER", label: "Farmers", icon: Package, color: "text-green-400" },
  { key: "TRANSPORTER", label: "Transporters", icon: Truck, color: "text-orange-400" },
  { key: "INSPECTOR", label: "Inspectors", icon: ClipboardCheck, color: "text-purple-400" },
];

export default function AdminUsersPage() {
  const [usersByRole, setUsersByRole] = useState<Record<string, PlatformUser[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState("BUYER");

  useEffect(() => {
    loadRole("BUYER");
  }, []);

  async function loadRole(role: string) {
    if (usersByRole[role]) return; // already loaded
    setLoading((prev) => ({ ...prev, [role]: true }));
    try {
      const res = await apiClient.get<{ data: PlatformUser[] } | PlatformUser[]>(
        `/simulation/users/${role}`
      );
      const list = Array.isArray(res) ? res : (res as { data: PlatformUser[] }).data || [];
      setUsersByRole((prev) => ({ ...prev, [role]: list }));
    } catch {
      setUsersByRole((prev) => ({ ...prev, [role]: [] }));
    } finally {
      setLoading((prev) => ({ ...prev, [role]: false }));
    }
  }

  function handleTabChange(role: string) {
    setActiveTab(role);
    loadRole(role);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-cream">User Management</h1>
        <p className="text-text-muted text-sm mt-1">
          View registered users by role.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="bg-brand-bg2 border border-brand-border">
          {ROLES.map((r) => (
            <TabsTrigger
              key={r.key}
              value={r.key}
              className="text-text-muted data-[state=active]:text-brand-cream data-[state=active]:bg-brand-wheat/10"
            >
              <r.icon className="h-3.5 w-3.5 mr-1.5" />
              {r.label}
              {usersByRole[r.key] && (
                <Badge variant="outline" className="ml-1.5 text-[10px] border-brand-border text-text-muted h-4 px-1">
                  {usersByRole[r.key].length}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {ROLES.map((r) => (
          <TabsContent key={r.key} value={r.key} className="mt-4">
            {loading[r.key] ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 bg-brand-wheat/5 rounded-xl" />
                ))}
              </div>
            ) : !usersByRole[r.key] || usersByRole[r.key].length === 0 ? (
              <Card className="bg-card border-brand-border">
                <CardContent className="flex items-center justify-center py-16">
                  <div className="text-center space-y-2">
                    <Users className="h-10 w-10 text-text-muted mx-auto" />
                    <p className="text-text-muted text-sm">No {r.label.toLowerCase()} registered.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {usersByRole[r.key].map((user) => (
                  <Card key={user.id} className="bg-card border-brand-border hover:border-brand-wheat/20 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-9 h-9 rounded-full bg-brand-wheat/10 border border-brand-border`}>
                          <span className="text-sm font-bold text-brand-wheat">
                            {user.name ? user.name[0].toUpperCase() : "?"}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-brand-cream">{user.name || "Unnamed"}</p>
                          <div className="flex items-center gap-2 text-xs text-text-muted">
                            <Mail className="h-3 w-3" />
                            <span>{user.email}</span>
                            {user.company?.name && (
                              <>
                                <span>·</span>
                                <span>{user.company.name}</span>
                              </>
                            )}
                            {user.addresses?.[0]?.city && (
                              <>
                                <span>·</span>
                                <span>{user.addresses[0].city}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {user.isEmailVerified && (
                          <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-400">
                            Verified
                          </Badge>
                        )}
                        {user.createdAt && (
                          <span className="text-[10px] text-text-muted">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
