"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { socketService } from "@/app/lib/socket";
import { useAuthStore } from "@/app/stores/auth.store";
import { useNotificationStore } from "@/app/stores/notification.store";
import { toast } from "sonner";
import type { SocketEventPayloads } from "@/app/lib/socket";
import type { UserRole } from "@/app/types";

/**
 * Maps notification type + user role to the appropriate dashboard route.
 * Determines where clicking a toast notification navigates the user.
 */
function getNotificationRoute(
  type: "trade" | "inspection" | "offer" | "system",
  role: UserRole,
  tradeId?: string
): string {
  // TODO: This is where YOUR routing logic goes.
  // For now, sensible defaults are used — replace with your own if desired.
  if (role === "admin") return "/dashboard/admin/operations";
  if (type === "trade" && role === "buyer" && tradeId) return `/dashboard/buyer/orders/${tradeId}`;
  if (type === "trade" && role === "seller") return "/dashboard/seller/trades";
  if (type === "offer" && role === "seller") return "/dashboard/seller/offers";
  if (type === "offer" && role === "buyer") return "/dashboard/buyer/orders";
  if (type === "inspection" && role === "inspector") return "/dashboard/inspector";
  if (type === "inspection" && tradeId && role === "buyer") return `/dashboard/buyer/orders/${tradeId}`;
  return "/dashboard";
}

// Phase label formatting for toast messages
const PHASE_LABELS: Record<string, string> = {
  INITIATED: "Initiated",
  NEGOTIATION: "Negotiating",
  AGREED: "Agreed",
  INSPECTION_PENDING: "Inspection Pending",
  INSPECTION_COMPLETE: "Inspection Complete",
  IN_TRANSIT: "In Transit",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  DISPUTED: "Disputed",
  CANCELLED: "Cancelled",
};

/**
 * Connects Socket.IO when authenticated, disconnects on logout.
 * Listens for trade/inspection/offer events and pushes to notification store + fires toasts.
 */
export function useSocket() {
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.user?.id);
  const userRole = useAuthStore((s) => s.user?.role) ?? "buyer";
  const addNotification = useNotificationStore((s) => s.addNotification);
  const router = useRouter();

  useEffect(() => {
    if (!token || !userId) return;

    socketService.connect(token, userId);

    const onTradeUpdated = (payload: SocketEventPayloads["trade:updated"]) => {
      const phaseLabel = PHASE_LABELS[payload.phase] || payload.phase.replace(/_/g, " ");
      const route = getNotificationRoute("trade", userRole as UserRole, payload.tradeOperationId);

      addNotification({
        title: "Trade Updated",
        message: `Trade moved to ${phaseLabel}`,
        type: "trade",
        tradeId: payload.tradeOperationId,
      });

      toast("Trade Updated", {
        description: `Trade moved to ${phaseLabel}`,
        action: {
          label: "View",
          onClick: () => router.push(route),
        },
      });
    };

    const onSellerAdded = (payload: SocketEventPayloads["trade:seller-added"]) => {
      addNotification({
        title: "Seller Matched",
        message: `${payload.sellerCount} seller(s) matched to your trade`,
        type: "trade",
        tradeId: payload.tradeOperationId,
      });

      toast("Seller Matched", {
        description: `${payload.sellerCount} seller(s) matched to your trade`,
        action: {
          label: "View",
          onClick: () => router.push(
            getNotificationRoute("trade", userRole as UserRole, payload.tradeOperationId)
          ),
        },
      });
    };

    const onInspectionCompleted = (
      payload: SocketEventPayloads["inspection:completed"]
    ) => {
      const passed = payload.passed;
      const route = getNotificationRoute("inspection", userRole as UserRole, payload.tradeOperationId);

      addNotification({
        title: passed ? "Inspection Passed" : "Inspection Failed",
        message: `Quality score: ${payload.qualityScore}/100`,
        type: "inspection",
        tradeId: payload.tradeOperationId,
      });

      toast(passed ? "Inspection Passed ✓" : "Inspection Failed ✗", {
        description: `Quality score: ${payload.qualityScore}/100`,
        action: {
          label: "View",
          onClick: () => router.push(route),
        },
      });
    };

    const onOfferReceived = (payload: SocketEventPayloads["offer:received"]) => {
      const route = getNotificationRoute("offer", userRole as UserRole, payload.tradeOperationId);

      addNotification({
        title: "New Offer Received",
        message: `New offer on trade ${payload.tradeOperationId.slice(0, 8)}...`,
        type: "offer",
        tradeId: payload.tradeOperationId,
      });

      toast("New Offer Received", {
        description: `New offer on trade ${payload.tradeOperationId.slice(0, 8)}...`,
        action: {
          label: "View",
          onClick: () => router.push(route),
        },
      });
    };

    socketService.on("trade:updated", onTradeUpdated);
    socketService.on("trade:seller-added", onSellerAdded);
    socketService.on("inspection:completed", onInspectionCompleted);
    socketService.on("offer:received", onOfferReceived);

    return () => {
      socketService.off("trade:updated", onTradeUpdated);
      socketService.off("trade:seller-added", onSellerAdded);
      socketService.off("inspection:completed", onInspectionCompleted);
      socketService.off("offer:received", onOfferReceived);
      socketService.disconnect();
    };
  }, [token, userId, userRole, addNotification, router]);
}
