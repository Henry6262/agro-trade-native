import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
  ValidationPipe,
} from "@nestjs/common";
import { NegotiationService } from "../services/negotiation.service";
import { NegotiationStatus } from "@prisma/client";
import {
  CreateOfferDto,
  BatchOfferDto,
  CounterOfferDto,
  AcceptOfferDto,
  RejectOfferDto,
  WithdrawOfferDto,
  ExtendExpiryDto,
} from "../dto/negotiation.dto";
import {
  NegotiationSummaryWrapperDto,
  NegotiationResponseWrapperDto,
  NegotiationBatchResponseDto,
  ExtendExpiryResponseDto,
  ExpiringNegotiationsResponseDto,
  NegotiationMetricsResponseDto,
  NegotiationWithDetailsDto,
  NegotiationSummaryDto,
  BatchOffersResultDto,
  BatchOfferErrorDto,
  ExtendExpiryResultDto,
  ExpiringNegotiationsDataDto,
  ExpiringNegotiationItemDto,
  ExpiringSummaryDto,
  NegotiationMetricsDataDto,
  NegotiationTradeSellerDto,
  NegotiationSellerDto,
  NegotiationSaleListingDto,
  OfferSnapshotDto,
  ProfitImpactDto,
} from "../dto/negotiation-response.dto";
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiExtraModels,
} from "@nestjs/swagger";

@ApiTags("Negotiations")
@ApiBearerAuth()
@ApiExtraModels(
  NegotiationSummaryWrapperDto,
  NegotiationResponseWrapperDto,
  NegotiationBatchResponseDto,
  ExtendExpiryResponseDto,
  ExpiringNegotiationsResponseDto,
  NegotiationMetricsResponseDto,
  NegotiationWithDetailsDto,
  NegotiationSummaryDto,
  BatchOffersResultDto,
  BatchOfferErrorDto,
  ExtendExpiryResultDto,
  ExpiringNegotiationsDataDto,
  ExpiringNegotiationItemDto,
  ExpiringSummaryDto,
  NegotiationMetricsDataDto,
  NegotiationTradeSellerDto,
  NegotiationSellerDto,
  NegotiationSaleListingDto,
  OfferSnapshotDto,
  ProfitImpactDto,
)
@Controller("negotiations")
export class NegotiationController {
  constructor(private readonly negotiationService: NegotiationService) {}

  /**
   * Get all negotiations for a trade operation (frontend expected route)
   */
  @Get("trade-operation/:tradeOperationId")
  @ApiOperation({
    summary: "Get negotiations for a trade operation (frontend route)",
  })
  @ApiParam({ name: "tradeOperationId", description: "Trade operation ID" })
  @ApiQuery({
    name: "status",
    required: false,
    description: "Filter by status or comma-separated statuses",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Max number of records",
    example: 100,
  })
  @ApiQuery({
    name: "offset",
    required: false,
    description: "Skip number of records",
    example: 0,
  })
  @ApiResponse({ status: HttpStatus.OK, type: NegotiationSummaryWrapperDto })
  async getNegotiationsByTradeOperation(
    @Param("tradeOperationId") tradeOperationId: string,
    @Query("status") status?: string,
    @Query("limit", new DefaultValuePipe(100), ParseIntPipe) limit?: number,
    @Query("offset", new DefaultValuePipe(0), ParseIntPipe) offset?: number,
  ): Promise<NegotiationSummaryWrapperDto> {
    return this.getNegotiations(tradeOperationId, status, limit, offset);
  }

  /**
   * Create new negotiation/offer (frontend expected route)
   */
  @Post("trade-operation/:tradeOperationId")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create negotiation (frontend route)" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: NegotiationResponseWrapperDto,
  })
  async createNegotiation(
    @Param("tradeOperationId") tradeOperationId: string,
    @Body(ValidationPipe) dto: CreateOfferDto,
  ): Promise<NegotiationResponseWrapperDto> {
    return this.sendOffer(tradeOperationId, dto);
  }

  /**
   * Send offer to seller
   */
  @Post("trade-operations/:tradeOperationId/offers")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Send offer to seller" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: NegotiationResponseWrapperDto,
  })
  async sendOffer(
    @Param("tradeOperationId") tradeOperationId: string,
    @Body(ValidationPipe) dto: CreateOfferDto,
  ): Promise<NegotiationResponseWrapperDto> {
    try {
      const negotiation = await this.negotiationService.sendOffer(
        tradeOperationId,
        dto,
      );
      return {
        success: true,
        data: negotiation as any,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code:
            error.response?.statusCode === 409
              ? "NEGOTIATION_EXISTS"
              : "OFFER_FAILED",
          message: error.message,
        },
      };
    }
  }

  /**
   * Send batch offers to multiple sellers
   */
  @Post("trade-operations/:tradeOperationId/offers/batch")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Send batch offers to multiple sellers" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: NegotiationBatchResponseDto,
  })
  async sendBatchOffers(
    @Param("tradeOperationId") tradeOperationId: string,
    @Body(ValidationPipe) dto: BatchOfferDto,
  ): Promise<NegotiationBatchResponseDto> {
    try {
      const result = await this.negotiationService.sendBatchOffers(
        tradeOperationId,
        dto.offers,
      );
      return {
        success: true,
        data: {
          created: result.created,
          failed: result.failed,
          negotiations: result.negotiations as any,
          errors: result.errors,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "BATCH_OFFER_FAILED",
          message: error.message,
        },
      };
    }
  }

  /**
   * Get all negotiations for a trade operation
   */
  @Get("trade-operations/:tradeOperationId/negotiations")
  @ApiOperation({ summary: "Get negotiations for a trade operation" })
  @ApiParam({ name: "tradeOperationId", description: "Trade operation ID" })
  @ApiQuery({ name: "status", required: false })
  @ApiQuery({ name: "limit", required: false, example: 100 })
  @ApiQuery({ name: "offset", required: false, example: 0 })
  @ApiResponse({ status: HttpStatus.OK, type: NegotiationSummaryWrapperDto })
  async getNegotiations(
    @Param("tradeOperationId") tradeOperationId: string,
    @Query("status") status?: string,
    @Query("limit", new DefaultValuePipe(100), ParseIntPipe) limit?: number,
    @Query("offset", new DefaultValuePipe(0), ParseIntPipe) offset?: number,
  ): Promise<NegotiationSummaryWrapperDto> {
    try {
      // Parse status if provided
      let statusFilter: NegotiationStatus | NegotiationStatus[] | undefined;
      if (status) {
        if (status.includes(",")) {
          statusFilter = status
            .split(",")
            .map((s) => s.trim().toUpperCase()) as NegotiationStatus[];
        } else {
          statusFilter = status.toUpperCase() as NegotiationStatus;
        }
      }

      const summary = await this.negotiationService.getNegotiations(
        tradeOperationId,
        statusFilter,
        limit,
        offset,
      );

      // Add price comparison for COUNTERED negotiations
      if (status === "COUNTERED") {
        const countered = summary.negotiations.filter(
          (n) => n.status === "COUNTERED",
        );
        if (countered.length > 0) {
          const prices = countered.map((n) => n.counterOffer?.price || 0);
          const lowestCounter = Math.min(...prices);
          const highestCounter = Math.max(...prices);
          const averageCounter =
            prices.reduce((a, b) => a + b, 0) / prices.length;

          const bestDeal = countered.find(
            (n) => n.counterOffer?.price === lowestCounter,
          );

          (summary as any)["priceComparison"] = {
            lowestCounter,
            highestCounter,
            averageCounter,
            priceSpread: highestCounter - lowestCounter,
            bestDeal: bestDeal
              ? {
                  negotiationId: bestDeal.id,
                  price: lowestCounter,
                  seller: bestDeal.tradeSeller?.seller?.name || "Unknown",
                }
              : null,
          };
        }
      }

      return {
        success: true,
        data: summary as any,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "GET_NEGOTIATIONS_FAILED",
          message: error.message,
        },
      };
    }
  }


  /**
   * Get analytics/overview for negotiations (stub - must come before :negotiationId route)
   */
  @Get("analytics")
  @ApiOperation({ summary: "Get negotiation analytics summary" })
  @ApiQuery({ name: "tradeOperationId", required: false })
  @ApiResponse({ status: HttpStatus.OK })
  async getAnalytics(
    @Query("tradeOperationId") tradeOperationId?: string,
  ) {
    try {
      if (tradeOperationId) {
        const negotiations = await this.negotiationService.getNegotiations(
          tradeOperationId,
          undefined,
          100,
          0,
        );
        const total = negotiations.negotiations.length;
        const accepted = negotiations.negotiations.filter(
          (n) => n.status === "ACCEPTED",
        ).length;
        const pending = negotiations.negotiations.filter(
          (n) => n.status === "PENDING",
        ).length;

        return {
          totalNegotiations: total,
          successRate: total > 0 ? (accepted / total) * 100 : 0,
          averageDuration: 0,
          pendingCount: pending,
          acceptedCount: accepted,
        };
      }
      return {
        totalNegotiations: 0,
        successRate: 0,
        averageDuration: 0,
        pendingCount: 0,
        acceptedCount: 0,
      };
    } catch {
      return {
        totalNegotiations: 0,
        successRate: 0,
        averageDuration: 0,
        pendingCount: 0,
        acceptedCount: 0,
      };
    }
  }

  /**
   * Get single negotiation details
   */
  @Get(":negotiationId")
  @ApiOperation({ summary: "Get single negotiation details" })
  @ApiParam({ name: "negotiationId", description: "Negotiation ID" })
  @ApiResponse({ status: HttpStatus.OK, type: NegotiationWithDetailsDto })
  async getNegotiationById(
    @Param("negotiationId") negotiationId: string,
  ): Promise<NegotiationWithDetailsDto> {
    return await this.negotiationService.getNegotiationById(negotiationId);
  }

  /**
   * Counter an offer
   */
  @Post(":negotiationId/counter")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Counter an offer" })
  @ApiParam({ name: "negotiationId", description: "Negotiation ID" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: NegotiationResponseWrapperDto,
  })
  async counterOffer(
    @Param("negotiationId") negotiationId: string,
    @Body(ValidationPipe) dto: CounterOfferDto,
    @Request() req?: any,
  ): Promise<NegotiationResponseWrapperDto> {
    try {
      const negotiation = await this.negotiationService.counterOffer(
        negotiationId,
        dto,
        req?.user?.id,
      );
      return {
        success: true,
        data: negotiation as any,
      };
    } catch (error) {
      const code = error.message.includes("expired")
        ? "NEGOTIATION_EXPIRED"
        : "COUNTER_FAILED";
      return {
        success: false,
        error: {
          code,
          message: error.message,
        },
      };
    }
  }

  /**
   * Accept an offer
   */
  @Post(":negotiationId/accept")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Accept an offer" })
  @ApiParam({ name: "negotiationId", description: "Negotiation ID" })
  @ApiResponse({ status: HttpStatus.OK, type: NegotiationWithDetailsDto })
  async acceptOffer(
    @Param("negotiationId") negotiationId: string,
    @Body(ValidationPipe) dto: AcceptOfferDto,
    @Request() req?: any,
  ): Promise<NegotiationWithDetailsDto> {
    return await this.negotiationService.acceptOffer(
      negotiationId,
      dto.acceptanceNote,
      req?.user?.id,
    );
  }

  /**
   * Reject an offer
   */
  @Post(":negotiationId/reject")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reject an offer" })
  @ApiParam({ name: "negotiationId", description: "Negotiation ID" })
  @ApiResponse({ status: HttpStatus.OK, type: NegotiationResponseWrapperDto })
  async rejectOffer(
    @Param("negotiationId") negotiationId: string,
    @Body(ValidationPipe) dto: RejectOfferDto,
    @Request() req?: any,
  ): Promise<NegotiationResponseWrapperDto> {
    try {
      const negotiation = await this.negotiationService.rejectOffer(
        negotiationId,
        dto.reason,
        req?.user?.id,
      );

      // Add cascade risk analysis for lead sellers
      const cascadeRisk = this.analyzeCascadeRisk(negotiation);
      if (cascadeRisk) {
        (negotiation as any)["cascadeRisk"] = cascadeRisk;
      }

      return {
        success: true,
        data: negotiation as any,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "REJECT_FAILED",
          message: error.message,
        },
      };
    }
  }

  /**
   * Withdraw an offer (admin only)
   */
  @Post(":negotiationId/withdraw")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Withdraw an offer" })
  @ApiParam({ name: "negotiationId", description: "Negotiation ID" })
  @ApiResponse({ status: HttpStatus.OK, type: NegotiationResponseWrapperDto })
  async withdrawOffer(
    @Param("negotiationId") negotiationId: string,
    @Body(ValidationPipe) dto: WithdrawOfferDto,
    @Request() req?: any,
  ): Promise<NegotiationResponseWrapperDto> {
    try {
      const negotiation = await this.negotiationService.withdrawOffer(
        negotiationId,
        dto.reason,
        req?.user?.id,
      );
      return {
        success: true,
        data: negotiation as any,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "WITHDRAW_FAILED",
          message: error.message,
        },
      };
    }
  }

  /**
   * Extend negotiation expiry
   */
  @Post(":negotiationId/extend")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Extend negotiation expiry" })
  @ApiParam({ name: "negotiationId", description: "Negotiation ID" })
  @ApiResponse({ status: HttpStatus.OK, type: ExtendExpiryResponseDto })
  async extendExpiry(
    @Param("negotiationId") negotiationId: string,
    @Body(ValidationPipe) dto: ExtendExpiryDto,
  ): Promise<ExtendExpiryResponseDto> {
    try {
      const negotiation = await this.negotiationService.extendExpiry(
        negotiationId,
        dto.hours,
        dto.reason,
      );
      return {
        success: true,
        data: {
          id: negotiation.id,
          previousExpiry: (negotiation as any).extension?.previousExpiry,
          newExpiry: (negotiation as any).extension?.newExpiry,
          extensionHours: (negotiation as any).extension?.extensionHours,
          totalExtensions: (negotiation as any).extension?.totalExtensions,
        },
      };
    } catch (error) {
      const code = error.message.includes("Maximum extensions")
        ? "MAX_EXTENSIONS_REACHED"
        : "EXTEND_FAILED";
      return {
        success: false,
        error: {
          code,
          message: error.message,
        },
      };
    }
  }

  /**
   * Get expiring negotiations
   */
  @Get("trade-operations/:tradeOperationId/negotiations/expiring")
  @ApiOperation({ summary: "Get expiring negotiations" })
  @ApiParam({ name: "tradeOperationId", description: "Trade operation ID" })
  @ApiQuery({ name: "hours", required: false, example: 24 })
  @ApiResponse({ status: HttpStatus.OK, type: ExpiringNegotiationsResponseDto })
  async getExpiringNegotiations(
    @Param("tradeOperationId") tradeOperationId: string,
    @Query("hours", new DefaultValuePipe(24), ParseIntPipe) hours?: number,
  ): Promise<ExpiringNegotiationsResponseDto> {
    try {
      const negotiations = await this.negotiationService.getNegotiations(
        tradeOperationId,
        NegotiationStatus.PENDING,
        100, // default limit
        0, // default offset
      );

      const now = new Date();
      const expiringThreshold = now.getTime() + (hours || 24) * 60 * 60 * 1000;

      const expiringSoon = negotiations.negotiations.filter((n) => {
        const expiresAt = new Date(n.expiresAt).getTime();
        return expiresAt <= expiringThreshold && expiresAt > now.getTime();
      });

      const expired = negotiations.negotiations.filter((n) => {
        return new Date(n.expiresAt).getTime() <= now.getTime();
      });

      return {
        success: true,
        data: {
          expiringSoon: expiringSoon.map((n) => ({
            id: n.id,
            hoursRemaining: n.hoursUntilExpiry || 0,
            urgency:
              (n.hoursUntilExpiry || 0) < 6
                ? "HIGH"
                : (n.hoursUntilExpiry || 0) < 12
                  ? "MEDIUM"
                  : "LOW",
            recommendedAction:
              (n.hoursUntilExpiry || 0) < 6
                ? "Follow up immediately"
                : "Schedule follow-up",
          })),
          summary: {
            total: negotiations.negotiations.length,
            expiringSoon: expiringSoon.length,
            expired: expired.length,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "GET_EXPIRING_FAILED",
          message: error.message,
        },
      };
    }
  }

  /**
   * Get negotiation metrics
   */
  @Get("trade-operations/:tradeOperationId/negotiations/metrics")
  @ApiOperation({ summary: "Get negotiation metrics" })
  @ApiParam({ name: "tradeOperationId", description: "Trade operation ID" })
  @ApiResponse({ status: HttpStatus.OK, type: NegotiationMetricsResponseDto })
  async getNegotiationMetrics(
    @Param("tradeOperationId") tradeOperationId: string,
  ) {
    try {
      const negotiations = await this.negotiationService.getNegotiations(
        tradeOperationId,
        undefined, // all statuses
        100, // default limit
        0, // default offset
      );

      const total = negotiations.negotiations.length;
      const withCounters = negotiations.negotiations.filter(
        (n) => n.counterOffer,
      ).length;
      const acceptedAfterCounter = negotiations.negotiations.filter(
        (n) => n.status === "ACCEPTED" && n.counterOffer,
      ).length;
      const rejectedAfterCounter = negotiations.negotiations.filter(
        (n) => n.status === "REJECTED" && n.counterOffer,
      ).length;

      const totalRounds = negotiations.negotiations.reduce(
        (sum, n) => sum + (n.offerHistory?.length || 0),
        0,
      );

      const priceMovements = negotiations.negotiations
        .filter((n) => n.counterOffer && n.currentOffer)
        .map((n) => {
          const initial = n.currentOffer.price;
          const counter = n.counterOffer.price;
          return ((counter - initial) / initial) * 100;
        });

      const averagePriceMovement =
        priceMovements.length > 0
          ? priceMovements.reduce((a, b) => a + b, 0) / priceMovements.length
          : 0;

      return {
        success: true,
        data: {
          totalNegotiations: total,
          counterOfferRate: total > 0 ? (withCounters / total) * 100 : 0,
          acceptanceAfterCounter:
            withCounters > 0 ? (acceptedAfterCounter / withCounters) * 100 : 0,
          rejectionAfterCounter:
            withCounters > 0 ? (rejectedAfterCounter / withCounters) * 100 : 0,
          averageRounds: total > 0 ? totalRounds / total : 0,
          averagePriceMovement,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "METRICS_FAILED",
          message: error.message,
        },
      };
    }
  }

  // Helper methods

  private analyzeCascadeRisk(negotiation: any) {
    // Simple heuristic: if seller has high volume or is known leader
    const isLeadSeller =
      negotiation.tradeSeller.seller.name?.includes("Leader") ||
      negotiation.tradeSeller.seller.name?.includes("Market");

    if (isLeadSeller) {
      return {
        level: "HIGH",
        message: "Lead seller rejection may influence others",
        potentialImpact: 2, // Estimate based on market position
      };
    }
    return null;
  }
}
