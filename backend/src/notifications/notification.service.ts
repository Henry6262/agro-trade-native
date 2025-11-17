import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UserRole } from "@prisma/client";

export enum NotificationType {
  INSPECTION_FAILED = "INSPECTION_FAILED",
  SELLER_REPLACEMENT_NEEDED = "SELLER_REPLACEMENT_NEEDED",
  TRADE_OPERATION_UPDATE = "TRADE_OPERATION_UPDATE",
  NEW_OFFER_RECEIVED = "NEW_OFFER_RECEIVED",
  TRANSPORT_BID_RECEIVED = "TRANSPORT_BID_RECEIVED",
  PAYMENT_RECEIVED = "PAYMENT_RECEIVED",
  DELIVERY_COMPLETED = "DELIVERY_COMPLETED",
}

export enum NotificationPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export interface NotificationPayload {
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  recipientRole?: UserRole;
  recipientId?: string;
  metadata?: any;
  tradeOperationId?: string;
  actionUrl?: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Send notification for inspection failure
   */
  async notifyInspectionFailure(data: {
    tradeOperationId: string;
    saleListingId: string;
    sellerId: string;
    sellerName: string;
    qualityScore: number;
    quantityLost: number;
    criticalFailure: boolean;
  }) {
    const notification: NotificationPayload = {
      type: NotificationType.INSPECTION_FAILED,
      priority: data.criticalFailure
        ? NotificationPriority.URGENT
        : NotificationPriority.HIGH,
      title: "⚠️ Quality Inspection Failed",
      message: `${data.sellerName} failed quality inspection with score ${data.qualityScore}%. ${data.quantityLost} tons need replacement.`,
      recipientRole: UserRole.ADMIN,
      tradeOperationId: data.tradeOperationId,
      metadata: {
        saleListingId: data.saleListingId,
        sellerId: data.sellerId,
        qualityScore: data.qualityScore,
        quantityLost: data.quantityLost,
        criticalFailure: data.criticalFailure,
      },
      actionUrl: `/operations/${data.tradeOperationId}?tab=sellers&action=find-replacement`,
    };

    await this.sendNotification(notification);

    // Also notify about need for replacement
    if (data.quantityLost > 0) {
      await this.notifyReplacementNeeded({
        tradeOperationId: data.tradeOperationId,
        quantityNeeded: data.quantityLost,
        reason: `Seller ${data.sellerName} failed inspection`,
      });
    }
  }

  /**
   * Send notification for replacement seller needed
   */
  async notifyReplacementNeeded(data: {
    tradeOperationId: string;
    quantityNeeded: number;
    reason: string;
  }) {
    const notification: NotificationPayload = {
      type: NotificationType.SELLER_REPLACEMENT_NEEDED,
      priority: NotificationPriority.URGENT,
      title: "🔄 Replacement Seller Needed",
      message: `${data.quantityNeeded} tons need replacement. Reason: ${data.reason}`,
      recipientRole: UserRole.ADMIN,
      tradeOperationId: data.tradeOperationId,
      metadata: {
        quantityNeeded: data.quantityNeeded,
        reason: data.reason,
      },
      actionUrl: `/operations/${data.tradeOperationId}?action=find-replacement`,
    };

    await this.sendNotification(notification);
  }

  /**
   * Send general trade operation update notification
   */
  async notifyTradeOperationUpdate(data: {
    tradeOperationId: string;
    operationNumber: string;
    updateType: string;
    message: string;
    recipientId?: string;
    recipientRole?: UserRole;
  }) {
    const notification: NotificationPayload = {
      type: NotificationType.TRADE_OPERATION_UPDATE,
      priority: NotificationPriority.MEDIUM,
      title: `📊 Trade Operation ${data.operationNumber} Update`,
      message: data.message,
      recipientRole: data.recipientRole,
      recipientId: data.recipientId,
      tradeOperationId: data.tradeOperationId,
      metadata: {
        updateType: data.updateType,
      },
      actionUrl: `/operations/${data.tradeOperationId}`,
    };

    await this.sendNotification(notification);
  }

  /**
   * Core notification sender
   */
  private async sendNotification(notification: NotificationPayload) {
    try {
      // Log the notification
      this.logger.log(
        `[${notification.priority}] ${notification.type}: ${notification.title} - ${notification.message}`,
      );

      // In production, emit event for real-time listeners (WebSocket, SSE, etc.)
      // this.eventEmitter.emit('notification.created', notification);

      // Store in database for persistence
      await this.storeNotification(notification);

      // In production, you would also:
      // - Send push notifications (Firebase, OneSignal, etc.)
      // - Send emails for urgent notifications
      // - Send SMS for critical failures
      // - Update dashboard notification bell/counter
    } catch (error) {
      this.logger.error("Failed to send notification:", error);
    }
  }

  /**
   * Store notification in database
   */
  private async storeNotification(notification: NotificationPayload) {
    try {
      // Since we don't have a Notification table in the schema,
      // we'll store it in the TradeNote table as a workaround
      if (notification.tradeOperationId) {
        const notificationDetails = JSON.stringify({
          type: "notification",
          notificationType: notification.type,
          priority: notification.priority,
          title: notification.title,
          actionUrl: notification.actionUrl,
          ...notification.metadata,
        });

        await this.prisma.tradeNote.create({
          data: {
            tradeOperationId: notification.tradeOperationId,
            content: `[${notification.priority}] ${notification.title}: ${notification.message} | Details: ${notificationDetails}`,
            authorId: "system", // System-generated note
          },
        });
      }
    } catch (error) {
      this.logger.error("Failed to store notification in database:", error);
    }
  }

  /**
   * Get recent notifications for a user or role
   */
  async getNotifications(params: {
    userId?: string;
    role?: UserRole;
    tradeOperationId?: string;
    limit?: number;
  }) {
    const { userId, role, tradeOperationId, limit = 20 } = params;

    const where: any = {
      authorId: "system",
      content: {
        contains: "[notification]",
      },
    };

    if (tradeOperationId) {
      where.tradeOperationId = tradeOperationId;
    }

    const notifications = await this.prisma.tradeNote.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        tradeOperation: {
          select: {
            operationNumber: true,
            phase: true,
          },
        },
      },
    });

    return notifications.map((note) => {
      // Try to extract notification details from content
      let notificationData: any = {};
      try {
        const detailsMatch = note.content.match(/Details: (.+)$/);
        if (detailsMatch) {
          notificationData = JSON.parse(detailsMatch[1]);
        }
      } catch (e) {
        // Ignore parsing errors
      }

      return {
        id: note.id,
        type: notificationData.notificationType || "TRADE_OPERATION_UPDATE",
        priority: notificationData.priority || "MEDIUM",
        title: notificationData.title || "Notification",
        message: note.content.split(" | Details:")[0],
        actionUrl: notificationData.actionUrl,
        metadata: notificationData,
        createdAt: note.createdAt,
        tradeOperation: note.tradeOperation,
      };
    });
  }

  /**
   * Mark notifications as read
   */
  async markAsRead(notificationIds: string[]) {
    // In a real implementation, you would have a NotificationRead table
    // For now, we'll just log it
    this.logger.log(`Marking ${notificationIds.length} notifications as read`);
  }
}
