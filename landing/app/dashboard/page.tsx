"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * /dashboard — redirects to the role-specific dashboard.
 * If not authenticated, redirects to /auth/login.
 */
export default function DashboardIndex() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    // Redirect to role-specific dashboard
    const role = user?.role;
    switch (role) {
      case "buyer":
        router.push("/dashboard/buyer");
        break;
      case "seller":
        router.push("/dashboard/seller");
        break;
      case "inspector":
        router.push("/dashboard/inspector");
        break;
      case "transport":
        router.push("/dashboard/transporter");
        break;
      case "admin":
        router.push("/dashboard/admin");
        break;
      default:
        router.push("/dashboard/buyer");
    }
  }, [user, isAuthenticated, isLoading, router]);

  // Loading state while redirecting
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64 bg-green-600/20" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-32 bg-green-600/10 rounded-xl" />
        <Skeleton className="h-32 bg-green-600/10 rounded-xl" />
        <Skeleton className="h-32 bg-green-600/10 rounded-xl" />
      </div>
    </div>
  );
}
