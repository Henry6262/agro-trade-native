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
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
