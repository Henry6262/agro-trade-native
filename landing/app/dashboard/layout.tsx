"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/components/dashboard/AppSidebar";
import { DashboardTopbar } from "@/app/components/dashboard/DashboardTopbar";
import { useSocket } from "@/app/hooks/useSocket";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Establish Socket.IO connection for realtime trade updates
  useSocket();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardTopbar />
        <div className="border-b border-amber-400/20 bg-amber-400/10 px-4 py-2 text-center text-xs font-medium text-amber-200">
          Prototype only — no live trades, payments, custody, settlement, GPS data or verified commercial partnerships.
        </div>
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
