"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Leaf,
  ShoppingCart,
  Store,
  Package,
  List,
  Inbox,
  ClipboardCheck,
  Truck,
  LayoutDashboard,
  Users,
  Shield,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/app/hooks/useAuth";
import type { UserRole } from "@/app/types";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  buyer: [
    { title: "Overview", href: "/dashboard/buyer", icon: LayoutDashboard },
    { title: "Marketplace", href: "/dashboard/buyer/marketplace", icon: Store },
    { title: "My Orders", href: "/dashboard/buyer/orders", icon: ShoppingCart },
  ],
  seller: [
    { title: "Overview", href: "/dashboard/seller", icon: LayoutDashboard },
    { title: "My Listings", href: "/dashboard/seller/listings", icon: Package },
    { title: "Offers", href: "/dashboard/seller/offers", icon: Inbox },
    { title: "Trades", href: "/dashboard/seller/trades", icon: List },
  ],
  inspector: [
    { title: "Dashboard", href: "/dashboard/inspector", icon: ClipboardCheck },
  ],
  transport: [
    { title: "Dashboard", href: "/dashboard/transporter", icon: Truck },
  ],
  admin: [
    { title: "Command Center", href: "/dashboard/admin", icon: LayoutDashboard },
    { title: "Operations", href: "/dashboard/admin/operations", icon: List },
    { title: "Users", href: "/dashboard/admin/users", icon: Users },
    { title: "Escrow", href: "/dashboard/admin/escrow", icon: Shield },
  ],
};

const ROLE_LABELS: Record<UserRole, string> = {
  buyer: "Buyer",
  seller: "Farmer / Seller",
  inspector: "Inspector",
  transport: "Transporter",
  admin: "Administrator",
};

const ROLE_COLORS: Record<UserRole, string> = {
  buyer: "bg-emerald-600/20 text-emerald-400 border-emerald-600/30",
  seller: "bg-green-600/20 text-green-400 border-green-600/30",
  inspector: "bg-teal-600/20 text-teal-400 border-teal-600/30",
  transport: "bg-lime-600/20 text-lime-400 border-lime-600/30",
  admin: "bg-green-500/20 text-green-400 border-green-500/30",
};

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const role = user?.role ?? "buyer";
  const navItems = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.buyer;
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "AT";

  return (
    <Sidebar className="border-r border-sidebar-border">
      {/* Header — Logo */}
      <SidebarHeader className="px-4 py-4 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-green-600/20 border border-green-600/40">
            <Leaf className="w-5 h-5 text-green-400" />
          </div>
          <span className="text-lg font-bold text-brand-cream">AgroTrade</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* Role badge */}
        <div className="px-4 pt-4 pb-2">
          <Badge
            variant="outline"
            className={`text-xs font-medium ${ROLE_COLORS[role]}`}
          >
            {ROLE_LABELS[role]}
          </Badge>
        </div>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-text-muted text-xs uppercase tracking-wider">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActive}
                      className="flex items-center gap-3"
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-text-muted text-xs uppercase tracking-wider">
            Account
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href="/dashboard/settings" />}
                  isActive={pathname === "/dashboard/settings"}
                  className="flex items-center gap-3"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer — User info + Logout */}
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 border border-green-600/40">
            <AvatarFallback className="bg-green-600/20 text-green-400 text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-brand-cream truncate">
              {user?.name || "User"}
            </p>
            <p className="text-xs text-text-muted truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-md hover:bg-green-600/20 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4 text-text-muted" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
