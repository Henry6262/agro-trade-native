import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  Request,
  BadRequestException,
  ParseIntPipe,
  DefaultValuePipe,
  ValidationPipe,
} from '@nestjs/common';
import { NegotiationService } from '../services/negotiation.service';
import { NegotiationStatus } from '@prisma/client';
import {
  CreateOfferDto,
  BatchOfferDto,
  CounterOfferDto,
  AcceptOfferDto,
  RejectOfferDto,
  WithdrawOfferDto,
  ExtendExpiryDto,
  BulkWithdrawDto,
} from '../dto/negotiation.dto';

@Controller()
export class NegotiationController {
  constructor(private readonly negotiationService: NegotiationService) {}

  /**
   * Send offer to seller
   */
  @Post('trade-operations/:tradeOperationId/offers')
  @HttpCode(HttpStatus.CREATED)
  async sendOffer(
    @Param('tradeOperationId') tradeOperationId: string,
    @Body(ValidationPipe) dto: CreateOfferDto,
  ) {
    try {
      const negotiation = await this.negotiationService.sendOffer(
        tradeOperationId,
        dto,
      );
      return {
        success: true,
        data: negotiation,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: error.response?.statusCode === 409 ? 'NEGOTIATION_EXISTS' : 'OFFER_FAILED',
          message: error.message,
        },
      };
    }
  }

  /**
   * Send batch offers to multiple sellers
   */
  @Post('trade-operations/:tradeOperationId/offers/batch')
  @HttpCode(HttpStatus.CREATED)
  async sendBatchOffers(
    @Param('tradeOperationId') tradeOperationId: string,
    @Body(ValidationPipe) dto: BatchOfferDto,
  ) {
    try {
      const result = await this.negotiationService.sendBatchOffers(
        tradeOperationId,
        dto.offers,
      );
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'BATCH_OFFER_FAILED',
          message: error.message,
        },
      };
    }
  }

  /**
   * Get all negotiations for a trade operation
   */
  @Get('trade-operations/:tradeOperationId/negotiations')
  async getNegotiations(
    @Param('tradeOperationId') tradeOperationId: string,
    @Query('status') status?: string,
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
  ) {
    try {
      // Parse status if provided
      let statusFilter: NegotiationStatus | NegotiationStatus[] | undefined;
      if (status) {
        if (status.includes(',')) {
          statusFilter = status.split(',').map(s => s.trim().toUpperCase()) as NegotiationStatus[];
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
      if (status === 'COUNTERED') {
        const countered = summary.negotiations.filter(n => n.status === 'COUNTERED');
        if (countered.length > 0) {
          const prices = countered.map(n => n.counterOffer?.price || 0);
          const lowestCounter = Math.min(...prices);
          const highestCounter = Math.max(...prices);
          const averageCounter = prices.reduce((a, b) => a + b, 0) / prices.length;
          
          const bestDeal = countered.find(n => n.counterOffer?.price === lowestCounter);
          
          (summary as any)['priceComparison'] = {
            lowestCounter,
            highestCounter,
            averageCounter,
            priceSpread: highestCounter - lowestCounter,
            bestDeal: bestDeal ? {
              negotiationId: bestDeal.id,
              price: lowestCounter,
              seller: bestDeal.tradeSeller?.seller?.name || 'Unknown',
            } : null,
          };
        }
      }

      return {
        success: true,
        data: summary,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'GET_NEGOTIATIONS_FAILED',
          message: error.message,
        },
      };
    }
  }

  /**
   * Get single negotiation details
   */
  @Get('negotiations/:negotiationId')
  async getNegotiationById(@Param('negotiationId') negotiationId: string) {
    try {
      const negotiation = await this.negotiationService.getNegotiationById(
        negotiationId,
      );
      return {
        success: true,
        data: negotiation,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NEGOTIATION_NOT_FOUND',
          message: error.message,
        },
      };
    }
  }

  /**
   * Counter an offer
   */
  @Post('negotiations/:negotiationId/counter')
  @HttpCode(HttpStatus.CREATED)
  async counterOffer(
    @Param('negotiationId') negotiationId: string,
    @Body(ValidationPipe) dto: CounterOfferDto,
    @Request() req?: any,
  ) {
    try {
      const negotiation = await this.negotiationService.counterOffer(
        negotiationId,
        dto,
        req?.user?.id,
      );
      return {
        success: true,
        data: negotiation,
      };
    } catch (error) {
      const code = error.message.includes('expired') 
        ? 'NEGOTIATION_EXPIRED' 
        : 'COUNTER_FAILED';
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
  @Post('negotiations/:negotiationId/accept')
  async acceptOffer(
    @Param('negotiationId') negotiationId: string,
    @Body(ValidationPipe) dto: AcceptOfferDto,
    @Request() req?: any,
  ) {
    try {
      const negotiation = await this.negotiationService.acceptOffer(
        negotiationId,
        dto.acceptanceNote,
        req?.user?.id,
      );
      return {
        success: true,
        data: negotiation,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ACCEPT_FAILED',
          message: error.message,
        },
      };
    }
  }

  /**
   * Reject an offer
   */
  @Post('negotiations/:negotiationId/reject')
  async rejectOffer(
    @Param('negotiationId') negotiationId: string,
    @Body(ValidationPipe) dto: RejectOfferDto,
    @Request() req?: any,
  ) {
    try {
      const negotiation = await this.negotiationService.rejectOffer(
        negotiationId,
        dto.reason,
        req?.user?.id,
      );

      // Add cascade risk analysis for lead sellers
      const cascadeRisk = this.analyzeCascadeRisk(negotiation);
      if (cascadeRisk) {
        (negotiation as any)['cascadeRisk'] = cascadeRisk;
      }

      return {
        success: true,
        data: negotiation,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'REJECT_FAILED',
          message: error.message,
        },
      };
    }
  }

  /**
   * Withdraw an offer (admin only)
   */
  @Post('negotiations/:negotiationId/withdraw')
  async withdrawOffer(
    @Param('negotiationId') negotiationId: string,
    @Body(ValidationPipe) dto: WithdrawOfferDto,
    @Request() req?: any,
  ) {
    try {
      const negotiation = await this.negotiationService.withdrawOffer(
        negotiationId,
        dto.reason,
        req?.user?.id,
      );
      return {
        success: true,
        data: negotiation,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'WITHDRAW_FAILED',
          message: error.message,
        },
      };
    }
  }

  /**
   * Extend negotiation expiry
   */
  @Post('negotiations/:negotiationId/extend')
  async extendExpiry(
    @Param('negotiationId') negotiationId: string,
    @Body(ValidationPipe) dto: ExtendExpiryDto,
  ) {
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
      const code = error.message.includes('Maximum extensions')
        ? 'MAX_EXTENSIONS_REACHED'
        : 'EXTEND_FAILED';
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
  @Get('trade-operations/:tradeOperationId/negotiations/expiring')
  async getExpiringNegotiations(
    @Param('tradeOperationId') tradeOperationId: string,
    @Query('hours', new DefaultValuePipe(24), ParseIntPipe) hours?: number,
  ) {
    try {
      const negotiations = await this.negotiationService.getNegotiations(
        tradeOperationId,
        NegotiationStatus.PENDING,
        100, // default limit
        0,   // default offset
      );

      const now = new Date();
      const expiringThreshold = now.getTime() + hours * 60 * 60 * 1000;

      const expiringSoon = negotiations.negotiations.filter(n => {
        const expiresAt = new Date(n.expiresAt).getTime();
        return expiresAt <= expiringThreshold && expiresAt > now.getTime();
      });

      const expired = negotiations.negotiations.filter(n => {
        return new Date(n.expiresAt).getTime() <= now.getTime();
      });

      return {
        success: true,
        data: {
          expiringSoon: expiringSoon.map(n => ({
            id: n.id,
            hoursRemaining: n.hoursUntilExpiry || 0,
            urgency: (n.hoursUntilExpiry || 0) < 6 ? 'HIGH' : (n.hoursUntilExpiry || 0) < 12 ? 'MEDIUM' : 'LOW',
            recommendedAction: (n.hoursUntilExpiry || 0) < 6 ? 'Follow up immediately' : 'Schedule follow-up',
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
          code: 'GET_EXPIRING_FAILED',
          message: error.message,
        },
      };
    }
  }

  /**
   * Get negotiation metrics
   */
  @Get('trade-operations/:tradeOperationId/negotiations/metrics')
  async getNegotiationMetrics(@Param('tradeOperationId') tradeOperationId: string) {
    try {
      const negotiations = await this.negotiationService.getNegotiations(
        tradeOperationId,
        undefined, // all statuses
        100,      // default limit
        0,        // default offset
      );
      
      const total = negotiations.negotiations.length;
      const withCounters = negotiations.negotiations.filter(n => n.counterOffer).length;
      const accepted = negotiations.negotiations.filter(n => n.status === 'ACCEPTED').length;
      const rejected = negotiations.negotiations.filter(n => n.status === 'REJECTED').length;
      const acceptedAfterCounter = negotiations.negotiations.filter(
        n => n.status === 'ACCEPTED' && n.counterOffer
      ).length;
      const rejectedAfterCounter = negotiations.negotiations.filter(
        n => n.status === 'REJECTED' && n.counterOffer
      ).length;

      const totalRounds = negotiations.negotiations.reduce(
        (sum, n) => sum + (n.offerHistory?.length || 0),
        0,
      );

      const priceMovements = negotiations.negotiations
        .filter(n => n.counterOffer && n.currentOffer)
        .map(n => {
          const initial = n.currentOffer.price;
          const counter = n.counterOffer.price;
          return ((counter - initial) / initial) * 100;
        });

      const averagePriceMovement = priceMovements.length > 0
        ? priceMovements.reduce((a, b) => a + b, 0) / priceMovements.length
        : 0;

      return {
        success: true,
        data: {
          totalNegotiations: total,
          counterOfferRate: total > 0 ? (withCounters / total) * 100 : 0,
          acceptanceAfterCounter: withCounters > 0 
            ? (acceptedAfterCounter / withCounters) * 100 
            : 0,
          rejectionAfterCounter: withCounters > 0
            ? (rejectedAfterCounter / withCounters) * 100
            : 0,
          averageRounds: total > 0 ? totalRounds / total : 0,
          averagePriceMovement,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'METRICS_FAILED',
          message: error.message,
        },
      };
    }
  }

  // Helper methods

  private analyzeCascadeRisk(negotiation: any) {
    // Simple heuristic: if seller has high volume or is known leader
    const isLeadSeller = negotiation.tradeSeller.seller.name?.includes('Leader') ||
                        negotiation.tradeSeller.seller.name?.includes('Market');
    
    if (isLeadSeller) {
      return {
        level: 'HIGH',
        message: 'Lead seller rejection may influence others',
        potentialImpact: 2, // Estimate based on market position
      };
    }
    return null;
  }
}