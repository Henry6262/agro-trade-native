import {
  Controller,
  Get,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { BuyerService } from "../buyer/buyer.service";

@ApiTags("Orders")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("orders")
export class OrdersController {
  constructor(private readonly buyerService: BuyerService) {}

  @Get()
  @ApiOperation({ summary: "Get orders for current user (buyer trades)" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "status", required: false })
  @ApiResponse({ status: 200, description: "Paginated list of orders" })
  async getOrders(
    @Request() req: any,
    @Query("page") page = "1",
    @Query("limit") limit = "20",
    @Query("status") status?: string,
  ) {
    try {
      const trades = await this.buyerService.getBuyerTrades(req.user.id);
      const filtered = status
        ? trades.filter((t: any) => {
            const tradeStatus = (t.status || "").toUpperCase();
            return tradeStatus === status.toUpperCase();
          })
        : trades;

      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 20;
      const offset = (pageNum - 1) * limitNum;
      const paginated = filtered.slice(offset, offset + limitNum);

      return {
        data: paginated,
        total: filtered.length,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(filtered.length / limitNum),
      };
    } catch {
      return {
        data: [],
        total: 0,
        page: 1,
        limit: parseInt(limit, 10) || 20,
        totalPages: 0,
      };
    }
  }

  @Get("stats")
  @ApiOperation({ summary: "Get order statistics for current buyer" })
  @ApiResponse({ status: 200, description: "Order statistics" })
  async getOrderStats(@Request() req: any) {
    try {
      const trades = await this.buyerService.getBuyerTrades(req.user.id);

      const total = trades.length;
      const pending = trades.filter((t: any) =>
        ["PENDING", "MATCHING"].includes((t.status || "").toUpperCase()),
      ).length;
      const active = trades.filter((t: any) =>
        ["ACTIVE", "IN_PROGRESS", "INSPECTION", "TRANSPORT"].includes(
          (t.status || "").toUpperCase(),
        ),
      ).length;
      const completed = trades.filter((t: any) =>
        ["COMPLETED", "DELIVERED"].includes((t.status || "").toUpperCase()),
      ).length;
      const cancelled = trades.filter((t: any) =>
        ["CANCELLED", "REJECTED"].includes((t.status || "").toUpperCase()),
      ).length;

      return {
        total,
        pending,
        active,
        completed,
        cancelled,
        totalSpent: 0,
      };
    } catch {
      return {
        total: 0,
        pending: 0,
        active: 0,
        completed: 0,
        cancelled: 0,
        totalSpent: 0,
      };
    }
  }
}
