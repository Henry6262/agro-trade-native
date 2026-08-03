'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  CheckCheck,
  Inbox,
  Info,
  Package,
  Shield,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotificationStore, type AppNotification } from '@/app/stores/notification.store';
import { useAuthStore } from '@/app/stores/auth.store';

const TYPE_ICON: Record<string, LucideIcon> = {
  trade: Package,
  inspection: Shield,
  offer: Inbox,
  system: Info,
};

const TYPE_COLOR: Record<string, string> = {
  trade: 'text-emerald-400',
  inspection: 'text-green-400',
  offer: 'text-brand-wheat',
  system: 'text-text-muted',
};

const PAGE_LABELS = [
  { path: '/dashboard/admin/operations', label: 'Trade records' },
  { path: '/dashboard/admin/transport', label: 'Movement' },
  { path: '/dashboard/admin/escrow', label: 'Escrow lab' },
  { path: '/dashboard/admin/users', label: 'Participants' },
  { path: '/dashboard/admin', label: 'Operations overview' },
  { path: '/dashboard/buyer/marketplace', label: 'Supply prototype' },
  { path: '/dashboard/buyer/orders', label: 'Buyer requirements' },
  { path: '/dashboard/buyer', label: 'Buyer overview' },
  { path: '/dashboard/seller/listings', label: 'Supply records' },
  { path: '/dashboard/seller/offers', label: 'Requests and offers' },
  { path: '/dashboard/seller/trades', label: 'Trade records' },
  { path: '/dashboard/seller/portfolio', label: 'Product portfolio' },
  { path: '/dashboard/seller', label: 'Exporter overview' },
  { path: '/dashboard/inspector', label: 'Inspection workspace' },
  { path: '/dashboard/transporter', label: 'Logistics workspace' },
  { path: '/dashboard/settings', label: 'Workspace settings' },
] as const;

function getPageLabel(pathname: string) {
  return (
    PAGE_LABELS.find(({ path }) => pathname === path || pathname.startsWith(`${path}/`))?.label ??
    'Trade workspace'
  );
}

export function DashboardTopbar() {
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const notifications = useNotificationStore((state) => state.notifications);
  const markRead = useNotificationStore((state) => state.markRead);
  const markAllRead = useNotificationStore((state) => state.markAllRead);
  const clear = useNotificationStore((state) => state.clear);
  const role = useAuthStore((state) => state.user?.role) ?? 'buyer';
  const pathname = usePathname();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);
  const pageLabel = getPageLabel(pathname);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        bellRef.current?.focus();
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  function handleNotificationClick(notification: AppNotification) {
    markRead(notification.id);
    setOpen(false);

    if (!notification.tradeId) return;

    if (role === 'buyer') {
      router.push(`/dashboard/buyer/orders/${notification.tradeId}`);
    } else if (role === 'seller' && notification.type === 'offer') {
      router.push('/dashboard/seller/offers');
    } else if (role === 'seller') {
      router.push('/dashboard/seller/trades');
    } else if (role === 'admin') {
      router.push('/dashboard/admin/operations');
    } else {
      router.push('/dashboard');
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-brand-border bg-brand-bg/90 px-3 backdrop-blur-xl sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger
          className="shrink-0 text-text-muted transition-colors hover:text-brand-cream"
          aria-label="Toggle workspace navigation"
        />
        <div className="min-w-0 border-l border-white/10 pl-3">
          <p className="text-[9px] font-bold uppercase tracking-[0.17em] text-brand-wheat/70">
            AgriTek workspace
          </p>
          <h1 className="truncate text-sm font-bold text-brand-cream sm:text-base">{pageLabel}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <span className="hidden rounded-full border border-emerald-400/15 bg-emerald-400/[0.055] px-3 py-1.5 text-[10px] font-semibold text-emerald-300 lg:inline-flex">
          Evidence-backed workflow
        </span>

        <div className="relative" ref={panelRef}>
          <button
            ref={bellRef}
            type="button"
            id="notification-trigger"
            onClick={() => setOpen((current) => !current)}
            className="relative rounded-lg p-2 text-text-muted transition-colors hover:bg-brand-wheat/8 hover:text-brand-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-wheat"
            aria-label={
              unreadCount > 0 ? `Prototype activity, ${unreadCount} unread` : 'Prototype activity'
            }
            aria-expanded={open}
            aria-controls="notification-panel"
            aria-haspopup="dialog"
          >
            <Bell className="size-5" aria-hidden="true" />
            {unreadCount > 0 && (
              <Badge
                className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center border-0 bg-brand-danger px-1 text-[10px] font-bold text-white"
                aria-hidden="true"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </button>

          {open && (
            <div
              id="notification-panel"
              role="dialog"
              aria-modal="false"
              aria-labelledby="notification-panel-title"
              className="absolute right-0 top-full z-50 mt-2 w-[min(calc(100vw-2rem),24rem)] overflow-hidden rounded-2xl border border-brand-border bg-card shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-brand-border px-4 py-3">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-brand-wheat/70">
                    Prototype record
                  </p>
                  <h2
                    id="notification-panel-title"
                    className="mt-0.5 text-sm font-semibold text-brand-cream"
                  >
                    Activity
                  </h2>
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllRead}
                      className="h-8 px-2 text-xs text-text-muted hover:text-brand-cream"
                      aria-label="Mark all prototype activity as read"
                    >
                      <CheckCheck className="mr-1 size-3.5" aria-hidden="true" />
                      Read all
                    </Button>
                  )}
                  {notifications.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clear}
                      className="size-8 p-0 text-text-muted hover:text-red-400"
                      aria-label="Clear all prototype activity"
                      title="Clear all activity"
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </Button>
                  )}
                </div>
              </div>

              <ScrollArea className="max-h-80" aria-label="Prototype activity list">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-6 py-10 text-center text-text-muted">
                    <Bell className="mb-3 size-8 opacity-35" aria-hidden="true" />
                    <p className="text-sm font-semibold text-brand-cream">No activity recorded</p>
                    <p className="mt-1 max-w-56 text-xs leading-5">
                      Demonstration workflow updates will appear here when actions are recorded.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-brand-border">
                    {notifications.slice(0, 20).map((notification) => {
                      const Icon = TYPE_ICON[notification.type] || Info;
                      const color = TYPE_COLOR[notification.type] || 'text-text-muted';

                      return (
                        <button
                          type="button"
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`w-full px-4 py-3 text-left transition-colors hover:bg-brand-wheat/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-wheat ${
                            !notification.read ? 'bg-brand-wheat/[0.025]' : ''
                          }`}
                          aria-label={`${notification.title}. ${notification.message}. ${formatTimeAgo(
                            notification.createdAt,
                          )}`}
                        >
                          <div className="flex items-start gap-3">
                            <span className={`mt-0.5 ${color}`}>
                              <Icon className="size-4" aria-hidden="true" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-2">
                                <span
                                  className={`text-sm font-medium ${
                                    notification.read ? 'text-text-muted' : 'text-brand-cream'
                                  }`}
                                >
                                  {notification.title}
                                </span>
                                {!notification.read && (
                                  <span
                                    className="size-1.5 shrink-0 rounded-full bg-brand-wheat"
                                    aria-hidden="true"
                                  />
                                )}
                              </span>
                              <span className="mt-0.5 block line-clamp-2 text-xs leading-5 text-text-muted">
                                {notification.message}
                              </span>
                              <span className="mt-1 block text-[10px] text-text-muted/60">
                                {formatTimeAgo(notification.createdAt)}
                              </span>
                            </span>
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
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
