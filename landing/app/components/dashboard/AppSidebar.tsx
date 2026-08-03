'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  CandlestickChart,
  ClipboardCheck,
  Inbox,
  LayoutDashboard,
  List,
  LogOut,
  Package,
  Route,
  Settings,
  Shield,
  ShoppingCart,
  Store,
  Truck,
  Users,
  Wheat,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/app/hooks/useAuth';
import type { UserRole } from '@/app/types';

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
}

const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  buyer: [
    { title: 'Overview', href: '/dashboard/buyer', icon: LayoutDashboard, exact: true },
    { title: 'Supply prototype', href: '/dashboard/buyer/marketplace', icon: Store },
    { title: 'Requirements', href: '/dashboard/buyer/orders', icon: ShoppingCart },
  ],
  seller: [
    { title: 'Overview', href: '/dashboard/seller', icon: LayoutDashboard, exact: true },
    { title: 'Supply records', href: '/dashboard/seller/listings', icon: Package },
    { title: 'Requests & offers', href: '/dashboard/seller/offers', icon: Inbox },
    { title: 'Trade records', href: '/dashboard/seller/trades', icon: List },
    {
      title: 'Product portfolio',
      href: '/dashboard/seller/portfolio',
      icon: CandlestickChart,
    },
  ],
  inspector: [
    { title: 'Inspection workspace', href: '/dashboard/inspector', icon: ClipboardCheck },
  ],
  transport: [{ title: 'Logistics workspace', href: '/dashboard/transporter', icon: Truck }],
  admin: [
    {
      title: 'Operations overview',
      href: '/dashboard/admin',
      icon: LayoutDashboard,
      exact: true,
    },
    { title: 'Trade records', href: '/dashboard/admin/operations', icon: List },
    { title: 'Participants', href: '/dashboard/admin/users', icon: Users },
    { title: 'Escrow lab', href: '/dashboard/admin/escrow', icon: Shield },
    { title: 'Movement', href: '/dashboard/admin/transport', icon: Truck },
  ],
};

const ROLE_LABELS: Record<UserRole, string> = {
  buyer: 'Buyer workspace',
  seller: 'Exporter / seller',
  inspector: 'Inspector',
  transport: 'Logistics operator',
  admin: 'Trade operator',
};

const ROLE_COLORS: Record<UserRole, string> = {
  buyer: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
  seller: 'border-green-500/25 bg-green-500/10 text-green-300',
  inspector: 'border-teal-500/25 bg-teal-500/10 text-teal-300',
  transport: 'border-lime-500/25 bg-lime-500/10 text-lime-300',
  admin: 'border-brand-wheat/25 bg-brand-wheat/8 text-brand-wheat',
};

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const role = user?.role ?? 'buyer';
  const navItems = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.buyer;
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((name) => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'AT';

  return (
    <Sidebar className="border-r border-white/10">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-wheat"
          aria-label="AgriTek homepage"
        >
          <span className="flex size-10 items-center justify-center rounded-xl border border-brand-wheat/30 bg-brand-wheat/8 shadow-[0_0_24px_rgba(232,200,112,0.08)]">
            <Wheat className="size-5 text-brand-wheat" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-black tracking-tight text-brand-cream">
              AgriTek
            </span>
            <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted">
              Trade operations
            </span>
          </span>
          <Badge
            variant="outline"
            className="border-brand-wheat/20 bg-brand-wheat/5 px-2 text-[9px] font-bold uppercase tracking-[0.12em] text-brand-wheat"
          >
            Prototype
          </Badge>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <div className="px-3 pt-4">
          <div className="rounded-2xl border border-brand-wheat/15 bg-[linear-gradient(145deg,rgba(232,200,112,0.07),rgba(61,122,80,0.035))] p-3.5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.17em] text-brand-wheat/75">
                Private pilot context
              </p>
              <Route className="size-3.5 text-brand-wheat" aria-hidden="true" />
            </div>
            <p className="mt-2 text-xs font-bold leading-5 text-brand-cream">Fresh raspberry</p>
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-text-muted">
              <span>Morocco / Portugal</span>
              <ArrowRight className="size-3 text-brand-wheat/60" aria-hidden="true" />
              <span>Spain</span>
            </div>
            <p className="mt-2.5 border-t border-white/8 pt-2.5 text-[10px] leading-4 text-text-muted">
              Demonstration data · no live commercial execution
            </p>
          </div>
        </div>

        <div className="px-4 pb-2 pt-4">
          <Badge variant="outline" className={`text-xs font-medium ${ROLE_COLORS[role]}`}>
            {ROLE_LABELS[role]}
          </Badge>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-[0.14em] text-text-muted">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href || (!item.exact && pathname.startsWith(`${item.href}/`));

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={
                        <Link href={item.href} aria-current={isActive ? 'page' : undefined} />
                      }
                      isActive={isActive}
                      className="flex items-center gap-3"
                    >
                      <item.icon className="size-4" aria-hidden="true" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-[0.14em] text-text-muted">
            Account
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={
                    <Link
                      href="/dashboard/settings"
                      aria-current={pathname === '/dashboard/settings' ? 'page' : undefined}
                    />
                  }
                  isActive={pathname === '/dashboard/settings'}
                  className="flex items-center gap-3"
                >
                  <Settings className="size-4" aria-hidden="true" />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-9 border border-brand-wheat/25">
            <AvatarFallback className="bg-brand-wheat/8 text-xs font-bold text-brand-wheat">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-brand-cream">
              {user?.name || 'Prototype user'}
            </p>
            <p className="truncate text-[11px] text-text-muted">
              {user?.email || ROLE_LABELS[role]}
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg p-2 text-text-muted transition-colors hover:bg-brand-wheat/8 hover:text-brand-wheat focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-wheat"
            title="Sign out"
            aria-label="Sign out of the AgriTek prototype"
          >
            <LogOut className="size-4" aria-hidden="true" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
