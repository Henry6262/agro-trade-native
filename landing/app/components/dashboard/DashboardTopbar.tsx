"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Trash2, Package, Shield, Inbox, Info } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotificationStore, type AppNotification } from "@/app/stores/notification.store";
import { useAuthStore } from "@/app/stores/auth.store";

const TYPE_ICON: Record<string, React.ElementType> = {
  trade: Package,
  inspection: Shield,
  offer: Inbox,
  system: Info,
};

const TYPE_COLOR: Record<string, string> = {
  trade: "text-blue-400",
  inspection: "text-purple-400",
  offer: "text-yellow-400",
  system: "text-text-muted",
};

export function DashboardTopbar() {
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const notifications = useNotificationStore((s) => s.notifications);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const clear = useNotificationStore((s) => s.clear);
  const role = useAuthStore((s) => s.user?.role) ?? "buyer";
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleNotificationClick(n: AppNotification) {
    markRead(n.id);
    setOpen(false);

    if (n.tradeId) {
      if (role === "buyer") {
        router.push(`/dashboard/buyer/orders/${n.tradeId}`);
      } else if (role === "seller" && n.type === "offer") {
        router.push("/dashboard/seller/offers");
      } else if (role === "seller") {
        router.push("/dashboard/seller/trades");
      } else if (role === "admin") {
        router.push("/dashboard/admin/operations");
      } else {
        router.push("/dashboard");
      }
    }
  }

  return (
    <header className="flex items-center justify-between h-14 px-4 border-b border-brand-border bg-brand-bg/80 backdrop-blur-lg sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-text-muted hover:text-brand-cream transition-colors" />
      </div>

      <div className="flex items-center gap-3">
        {/* Notification bell + dropdown */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setOpen(!open)}
            className="relative p-2 rounded-lg hover:bg-brand-wheat/10 transition-colors"
          >
            <Bell className="w-5 h-5 text-text-muted" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[10px] font-bold bg-brand-danger text-white border-0 flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </button>

          {/* Notification Panel */}
          {open && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-card border border-brand-border rounded-xl shadow-2xl overflow-hidden z-50">
              {/* Panel header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border">
                <h3 className="text-sm font-semibold text-brand-cream">
                  Notifications
                </h3>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllRead}
                      className="text-xs text-text-muted hover:text-brand-cream h-7 px-2"
                    >
                      <CheckCheck className="w-3.5 h-3.5 mr-1" />
                      Read all
                    </Button>
                  )}
                  {notifications.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clear}
                      className="text-xs text-text-muted hover:text-red-400 h-7 px-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Notification list */}
              <ScrollArea className="max-h-80">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-text-muted">
                    <Bell className="w-8 h-8 mb-2 opacity-40" />
                    <p className="text-sm">No notifications yet</p>
                    <p className="text-xs mt-1">
                      Trade updates will appear here in real time.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-brand-border">
                    {notifications.slice(0, 20).map((n) => {
                      const Icon = TYPE_ICON[n.type] || Info;
                      const color = TYPE_COLOR[n.type] || "text-text-muted";

                      return (
                        <button
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`w-full text-left px-4 py-3 hover:bg-brand-wheat/5 transition-colors ${
                            !n.read ? "bg-brand-wheat/[0.03]" : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 ${color}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p
                                  className={`text-sm font-medium ${
                                    n.read ? "text-text-muted" : "text-brand-cream"
                                  }`}
                                >
                                  {n.title}
                                </p>
                                {!n.read && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-brand-wheat flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-text-muted mt-0.5 line-clamp-1">
                                {n.message}
                              </p>
                              <p className="text-[10px] text-text-muted/60 mt-1">
                                {formatTimeAgo(n.createdAt)}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function formatTimeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
