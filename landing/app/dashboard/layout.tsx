'use client';

import { ArrowRight, Route } from 'lucide-react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/app/components/dashboard/AppSidebar';
import { DashboardTopbar } from '@/app/components/dashboard/DashboardTopbar';
import { useSocket } from '@/app/hooks/useSocket';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  useSocket();

  return (
    <SidebarProvider className="bg-[#080806]">
      <a
        href="#dashboard-content"
        className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-lg bg-brand-wheat px-4 py-2 text-sm font-bold text-[#0C0904] transition-transform focus:translate-y-0 focus:outline-none"
      >
        Skip to workspace
      </a>
      <AppSidebar />
      <SidebarInset className="min-w-0 overflow-hidden bg-[#0A0A08]">
        <DashboardTopbar />
        <div
          className="border-b border-brand-wheat/15 bg-[linear-gradient(90deg,rgba(232,200,112,0.07),rgba(61,122,80,0.05),transparent)] px-4 py-3 sm:px-6"
          role="status"
          aria-label="Prototype and pilot context"
        >
          <div className="mx-auto flex max-w-[1600px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="shrink-0 rounded-full border border-brand-wheat/25 bg-brand-wheat/8 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-wheat">
                Prototype
              </span>
              <div className="flex min-w-0 items-center gap-2 text-xs font-medium text-brand-cream/75">
                <Route className="size-3.5 shrink-0 text-brand-wheat" aria-hidden="true" />
                <span className="truncate">Fresh raspberry · Morocco / Portugal</span>
                <ArrowRight className="size-3 shrink-0 text-brand-wheat/60" aria-hidden="true" />
                <span className="shrink-0">Spain</span>
              </div>
            </div>
            <p className="text-[11px] font-medium text-text-muted sm:text-right">
              One next action · one readiness state · one event record
            </p>
          </div>
        </div>
        <div
          id="dashboard-content"
          tabIndex={-1}
          className="relative flex-1 p-4 outline-none sm:p-6 lg:p-8"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-70"
            aria-hidden="true"
            style={{
              background:
                'radial-gradient(circle at 8% 0%, rgba(232,200,112,0.045), transparent 28%), radial-gradient(circle at 96% 8%, rgba(61,122,80,0.04), transparent 24%)',
            }}
          />
          <div className="relative mx-auto w-full max-w-[1600px]">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
