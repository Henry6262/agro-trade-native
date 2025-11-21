import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpStatus,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { NotificationService } from "./notification.service";
import { UserRole } from "@prisma/client";

@ApiTags("Notifications")
@Controller("notifications")
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: "Get notifications" })
  @ApiQuery({ name: "role", enum: UserRole, required: false })
  @ApiQuery({ name: "tradeOperationId", required: false })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: "List of notifications" })
  async getNotifications(
    @Query("role") role?: UserRole,
    @Query("tradeOperationId") tradeOperationId?: string,
    @Query("limit") limit?: number,
    @Request() req?: any,
  ) {
    const userId = req?.user?.id;

    return await this.notificationService.getNotifications({
      userId,
      role,
      tradeOperationId,
      limit: limit ? parseInt(limit.toString()) : undefined,
    });
  }

  @Post("mark-read")
  @ApiOperation({ summary: "Mark notifications as read" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Notifications marked as read",
  })
  async markAsRead(@Body("notificationIds") notificationIds: string[]) {
    await this.notificationService.markAsRead(notificationIds);
    return {
      success: true,
      message: `${notificationIds.length} notifications marked as read`,
    };
  }

  @Post("test")
  @ApiOperation({ summary: "Test notification system" })
  @ApiResponse({ status: HttpStatus.OK, description: "Test notification sent" })
  async testNotification(
    @Body()
    data: {
      type: "inspection" | "replacement" | "update";
      tradeOperationId?: string;
    },
  ) {
    const { type, tradeOperationId = "test-operation-id" } = data;

    if (type === "inspection") {
      await this.notificationService.notifyInspectionFailure({
        tradeOperationId,
        saleListingId: "test-listing",
        sellerId: "test-seller",
        sellerName: "Test Seller Co.",
        qualityScore: 45,
        quantityLost: 50,
        criticalFailure: true,
      });
    } else if (type === "replacement") {
      await this.notificationService.notifyReplacementNeeded({
        tradeOperationId,
        quantityNeeded: 50,
        reason: "Test inspection failure",
      });
    } else {
      await this.notificationService.notifyTradeOperationUpdate({
        tradeOperationId,
        operationNumber: "OP-2024-TEST",
        updateType: "phase_change",
        message: "Trade operation moved to transport matching phase",
        recipientRole: UserRole.ADMIN,
      });
    }

    return { success: true, message: `Test ${type} notification sent` };
  }
}
