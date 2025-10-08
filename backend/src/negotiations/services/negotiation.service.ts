import { 
  Injectable, 
  Logger, 
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException 
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProfitCalculationService } from '../../trade-operations/services/profit-calculation.service';
import {
  NegotiationStatus,
  TradeStatus,
  SellerStatus,
  Prisma,
} from '@prisma/client';
import { CreateOfferDto, CounterOfferDto } from '../dto/negotiation.dto';

export interface NegotiationWithDetails {
  id: string;
  tradeOperationId: string;
  tradeSellerId: string;
  status: NegotiationStatus;
  currentOffer: any;
  counterOffer?: any;
  offerHistory: any[];
  finalPrice?: number;
  finalQuantity?: number;
  expiresAt: Date;
  hoursUntilExpiry?: number;
  isExpiringSoon?: boolean;
  tradeSeller: {
    id: string;
    requestedQuantity: number;
    offeredQuantity: number;
    status: string;
    seller: {
      id: string;
      name: string;
      email: string;
    };
    saleListing: {
      id: string;
      quantity: number;
      askingPrice: number;
    };
  };
  profitImpact?: {
    estimatedProfit: number;
    profitMargin: number;
    priceChange?: number;
    warning?: string;
  };
}

export interface NegotiationSummary {
  tradeOperationId: string;
  totalNegotiations: number;
  negotiations: NegotiationWithDetails[];
  summary: {
    pending: number;
    countered: number;
    accepted: number;
    rejected: number;
    expired: number;
    withdrawn: number;
  };
  profitAnalysis?: {
    totalRequestedQuantity: number;
    totalAgreedQuantity: number;
    averageOfferPrice: number;
    averageAgreedPrice: number;
    estimatedTotalCost: number;
    estimatedProfit: number;
    profitMargin: number;
  };
  phaseTransition?: {
    allSellersAccepted: boolean;
    readyForNextPhase: boolean;
    nextPhase?: string;
    message?: string;
  };
}

@Injectable()
export class NegotiationService {
  private readonly logger = new Logger(NegotiationService.name);
  private readonly MIN_PROFIT_MARGIN = 5;
  private readonly TARGET_PROFIT_MARGIN = 7;
  private readonly DEFAULT_EXPIRY_HOURS = 48;
  private readonly MAX_EXTENSIONS = 2;

  constructor(
    private readonly prisma: PrismaService,
    private readonly profitCalculationService: ProfitCalculationService,
  ) {}

  /**
   * Send initial offer to seller
   */
  async sendOffer(
    tradeOperationId: string,
    dto: CreateOfferDto,
  ): Promise<NegotiationWithDetails> {
    // Validate trade operation
    const trade = await this.prisma.tradeOperation.findUnique({
      where: { id: tradeOperationId },
      include: {
        sellers: {
          include: {
            seller: true,
            saleListing: true,
          },
        },
      },
    });

    if (!trade) {
      throw new NotFoundException('Trade operation not found');
    }

    if (trade.status !== TradeStatus.ACTIVE) {
      throw new BadRequestException('Trade operation is not active');
    }

    // Validate trade seller belongs to this trade
    const tradeSeller = trade.sellers.find(s => s.id === dto.tradeSellerId);
    if (!tradeSeller) {
      throw new BadRequestException('Trade seller not part of this trade operation');
    }

    // Check if negotiation already exists
    const existing = await this.prisma.offerNegotiation.findFirst({
      where: { 
        tradeOperationId,
        tradeSellerId: dto.tradeSellerId,
      },
    });

    if (existing) {
      throw new ConflictException('Negotiation already exists for this seller');
    }

    // Validate price and quantity
    if (dto.price <= 0) {
      throw new BadRequestException('Price must be positive');
    }

    if (dto.quantity <= 0) {
      throw new BadRequestException('Quantity must be positive');
    }

    // Create negotiation
    const offerData = {
      price: dto.price,
      quantity: dto.quantity,
      terms: dto.terms || 'Standard terms',
      createdAt: new Date().toISOString(),
    };

    const negotiation = await this.prisma.offerNegotiation.create({
      data: {
        tradeOperationId,
        tradeSellerId: dto.tradeSellerId,
        status: NegotiationStatus.PENDING,
        currentOffer: offerData,
        offerHistory: [offerData],
        expiresAt: new Date(Date.now() + this.DEFAULT_EXPIRY_HOURS * 60 * 60 * 1000),
      },
      include: {
        tradeSeller: {
          include: {
            seller: true,
            saleListing: true,
          },
        },
      },
    });

    // Update trade seller status
    await this.prisma.tradeSeller.update({
      where: { id: dto.tradeSellerId },
      data: { status: SellerStatus.NEGOTIATING },
    });

    // Calculate profit impact
    const profitImpact = await this.calculateProfitImpact(
      trade,
      dto.price,
      dto.quantity,
    );

    return this.formatNegotiationWithDetails(negotiation, profitImpact);
  }

  /**
   * Send batch offers to multiple sellers
   */
  async sendBatchOffers(
    tradeOperationId: string,
    offers: CreateOfferDto[],
  ): Promise<{
    created: number;
    failed: number;
    negotiations: NegotiationWithDetails[];
    errors?: Array<{ tradeSellerId: string; error: string }>;
  }> {
    const results = {
      created: 0,
      failed: 0,
      negotiations: [] as NegotiationWithDetails[],
      errors: [] as Array<{ tradeSellerId: string; error: string }>,
    };

    for (const offer of offers) {
      try {
        const negotiation = await this.sendOffer(tradeOperationId, offer);
        results.created++;
        results.negotiations.push(negotiation);
      } catch (error) {
        results.failed++;
        results.errors.push({
          tradeSellerId: offer.tradeSellerId,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Get all negotiations for a trade operation
   */
  async getNegotiations(
    tradeOperationId: string,
    status?: NegotiationStatus | NegotiationStatus[],
    limit?: number,
    offset?: number,
  ): Promise<NegotiationSummary> {
    const trade = await this.prisma.tradeOperation.findUnique({
      where: { id: tradeOperationId },
      include: {
        buyListing: true,
      },
    });

    if (!trade) {
      throw new NotFoundException('Trade operation not found');
    }

    // Build where clause
    const where: Prisma.OfferNegotiationWhereInput = {
      tradeOperationId,
    };

    if (status) {
      where.status = Array.isArray(status) 
        ? { in: status }
        : status;
    }

    // Get negotiations with details
    const [negotiations, total] = await Promise.all([
      this.prisma.offerNegotiation.findMany({
        where,
        include: {
          tradeSeller: {
            include: {
              seller: true,
              saleListing: true,
            },
          },
        },
        orderBy: [
          { status: 'asc' }, // Priority order
          { expiresAt: 'asc' },
        ],
        take: limit,
        skip: offset,
      }),
      this.prisma.offerNegotiation.count({ where }),
    ]);

    // Calculate summary
    const summary: Record<string, number> = {
      pending: 0,
      countered: 0,
      accepted: 0,
      rejected: 0,
      expired: 0,
      withdrawn: 0,
    };

    const formattedNegotiations: NegotiationWithDetails[] = [];
    
    for (const nego of negotiations) {
      const statusKey = nego.status.toLowerCase();
      summary[statusKey] = (summary[statusKey] || 0) + 1;
      
      // Calculate profit impact for each
      const currentOffer = nego.currentOffer as any;
      const profitImpact = await this.calculateProfitImpact(
        trade,
        currentOffer?.price || 0,
        currentOffer?.quantity || 0,
      );

      formattedNegotiations.push(this.formatNegotiationWithDetails(nego, profitImpact));
    }

    // Calculate profit analysis
    const profitAnalysis = await this.calculateProfitAnalysis(trade, negotiations);

    // Check phase transition
    const phaseTransition = await this.checkPhaseTransition(trade, negotiations);

    return {
      tradeOperationId,
      totalNegotiations: total,
      negotiations: formattedNegotiations,
      summary: {
        pending: summary.pending || 0,
        countered: summary.countered || 0,
        accepted: summary.accepted || 0,
        rejected: summary.rejected || 0,
        expired: summary.expired || 0,
        withdrawn: summary.withdrawn || 0,
      },
      profitAnalysis,
      phaseTransition,
    };
  }

  /**
   * Get single negotiation details
   */
  async getNegotiationById(negotiationId: string): Promise<NegotiationWithDetails> {
    const negotiation = await this.prisma.offerNegotiation.findUnique({
      where: { id: negotiationId },
      include: {
        tradeSeller: {
          include: {
            seller: true,
            saleListing: true,
          },
        },
        tradeOperation: true,
      },
    });

    if (!negotiation) {
      throw new NotFoundException('Negotiation not found');
    }

    const currentOffer = negotiation.currentOffer as any;
    const profitImpact = await this.calculateProfitImpact(
      negotiation.tradeOperation,
      currentOffer?.price || 0,
      currentOffer?.quantity || 0,
    );

    return this.formatNegotiationWithDetails(negotiation, profitImpact);
  }

  /**
   * Counter an offer
   */
  async counterOffer(
    negotiationId: string,
    dto: CounterOfferDto,
    userId?: string,
  ): Promise<NegotiationWithDetails> {
    const negotiation = await this.prisma.offerNegotiation.findUnique({
      where: { id: negotiationId },
      include: {
        tradeSeller: {
          include: {
            seller: true,
            saleListing: true,
          },
        },
        tradeOperation: true,
      },
    });

    if (!negotiation) {
      throw new NotFoundException('Negotiation not found');
    }

    // Validate status
    if (negotiation.status === NegotiationStatus.ACCEPTED) {
      throw new BadRequestException('Cannot counter an accepted negotiation');
    }

    if (negotiation.status === NegotiationStatus.REJECTED) {
      throw new BadRequestException('Cannot counter a rejected negotiation');
    }

    if (negotiation.status === NegotiationStatus.EXPIRED) {
      throw new BadRequestException('Negotiation has expired');
    }

    // Validate price and quantity
    if (dto.price <= 0) {
      throw new BadRequestException('Price must be positive');
    }

    if (dto.quantity <= 0) {
      throw new BadRequestException('Quantity must be positive');
    }

    // Create counter offer
    const counterOfferData = {
      price: dto.price,
      quantity: dto.quantity,
      terms: dto.terms || 'Counter offer',
      reason: dto.reason,
      receivedAt: new Date().toISOString(),
      offeredBy: this.determineOfferedBy(negotiation, userId),
    };

    // Add to offer history
    const offerHistory = [...(negotiation.offerHistory as any[] || [])];
    offerHistory.push({
      ...counterOfferData,
      isCounterOffer: true,
      createdAt: new Date().toISOString(),
    });

    // Update negotiation
    const updated = await this.prisma.offerNegotiation.update({
      where: { id: negotiationId },
      data: {
        status: NegotiationStatus.COUNTERED,
        counterOffer: counterOfferData,
        offerHistory,
        respondedAt: new Date(),
      },
      include: {
        tradeSeller: {
          include: {
            seller: true,
            saleListing: true,
          },
        },
        tradeOperation: true,
      },
    });

    // Calculate profit impact
    const profitImpact = await this.calculateProfitImpact(
      updated.tradeOperation,
      dto.price,
      dto.quantity,
      (negotiation.currentOffer as any)?.price,
    );

    // Add warning if profit too low
    if (profitImpact.profitMargin < this.MIN_PROFIT_MARGIN) {
      profitImpact.warning = `Profit margin below minimum ${this.MIN_PROFIT_MARGIN}%`;
    }

    return this.formatNegotiationWithDetails(updated, profitImpact);
  }

  /**
   * Accept an offer
   */
  async acceptOffer(
    negotiationId: string,
    acceptanceNote?: string,
    userId?: string,
  ): Promise<NegotiationWithDetails> {
    const negotiation = await this.prisma.offerNegotiation.findUnique({
      where: { id: negotiationId },
      include: {
        tradeSeller: {
          include: {
            seller: true,
            saleListing: true,
          },
        },
        tradeOperation: {
          include: {
            sellers: true,
          },
        },
      },
    });

    if (!negotiation) {
      throw new NotFoundException('Negotiation not found');
    }

    // Validate status
    if (negotiation.status === NegotiationStatus.ACCEPTED) {
      throw new BadRequestException('Negotiation already accepted');
    }

    if (negotiation.status === NegotiationStatus.REJECTED) {
      throw new BadRequestException('Cannot accept a rejected negotiation');
    }

    if (negotiation.status === NegotiationStatus.EXPIRED) {
      throw new BadRequestException('Negotiation has expired');
    }

    // Determine final price and quantity
    const finalOffer = negotiation.status === NegotiationStatus.COUNTERED 
      ? negotiation.counterOffer as any
      : negotiation.currentOffer as any;

    const finalPrice = finalOffer.price;
    const finalQuantity = finalOffer.quantity;

    // Update negotiation
    const updated = await this.prisma.offerNegotiation.update({
      where: { id: negotiationId },
      data: {
        status: NegotiationStatus.ACCEPTED,
        finalPrice,
        finalQuantity,
        respondedAt: new Date(),
        concludedAt: new Date(),
      },
      include: {
        tradeSeller: {
          include: {
            seller: true,
            saleListing: true,
          },
        },
        tradeOperation: {
          include: {
            sellers: true,
          },
        },
      },
    });

    // Update trade seller
    await this.prisma.tradeSeller.update({
      where: { id: negotiation.tradeSellerId },
      data: {
        status: SellerStatus.ACCEPTED,
        agreedPrice: finalPrice,
        agreedQuantity: finalQuantity,
      },
    });

    // Update trade operation totals
    await this.updateTradeOperationTotals(negotiation.tradeOperationId);

    // Check if all sellers accepted
    const updatedWithRelations = updated as any;
    const allAccepted = updatedWithRelations.tradeOperation?.sellers?.every(
      (s: any) => s.status === SellerStatus.ACCEPTED
    ) || false;

    // Calculate final profit impact
    const profitImpact = await this.calculateProfitImpact(
      updatedWithRelations.tradeOperation,
      finalPrice,
      finalQuantity,
    );
    profitImpact.isFinal = true;

    const result = this.formatNegotiationWithDetails(updated, profitImpact);

    // Add phase transition info
    if (allAccepted) {
      (result as any)['phaseTransition'] = {
        allSellersAccepted: true,
        readyForNextPhase: true,
        nextPhase: 'INSPECTION_REQUIRED',
        message: 'All sellers have accepted. Ready to proceed to inspection phase.',
      };
    }

    // Add quantity gap info if partial
    const requestedQty = Number(negotiation.tradeSeller.requestedQuantity);
    if (finalQuantity < requestedQty) {
      (result as any)['quantityGap'] = {
        requested: requestedQty,
        secured: finalQuantity,
        shortfall: requestedQty - finalQuantity,
        message: `${requestedQty - finalQuantity} tons still needed`,
      };
    }

    return result;
  }

  /**
   * Reject an offer
   */
  async rejectOffer(
    negotiationId: string,
    reason?: string,
    userId?: string,
  ): Promise<NegotiationWithDetails> {
    const negotiation = await this.prisma.offerNegotiation.findUnique({
      where: { id: negotiationId },
      include: {
        tradeSeller: {
          include: {
            seller: true,
            saleListing: true,
          },
        },
        tradeOperation: true,
      },
    });

    if (!negotiation) {
      throw new NotFoundException('Negotiation not found');
    }

    // Validate status
    if (negotiation.status === NegotiationStatus.ACCEPTED) {
      throw new BadRequestException('Cannot reject an accepted negotiation');
    }

    if (negotiation.status === NegotiationStatus.REJECTED) {
      throw new BadRequestException('Negotiation already rejected');
    }

    // Update negotiation
    const updated = await this.prisma.offerNegotiation.update({
      where: { id: negotiationId },
      data: {
        status: NegotiationStatus.REJECTED,
        respondedAt: new Date(),
        concludedAt: new Date(),
      },
      include: {
        tradeSeller: {
          include: {
            seller: true,
            saleListing: true,
          },
        },
        tradeOperation: true,
      },
    });

    // Update trade seller
    await this.prisma.tradeSeller.update({
      where: { id: negotiation.tradeSellerId },
      data: {
        status: SellerStatus.REJECTED,
      },
    });

    // Re-activate sale listing
    await this.prisma.saleListing.update({
      where: { id: negotiation.tradeSeller.saleListingId },
      data: { status: 'ACTIVE' },
    });

    const result = this.formatNegotiationWithDetails(updated);

    // Add seller release info
    (result as any)['sellerRelease'] = {
      released: true,
      sellerId: negotiation.tradeSeller.sellerId,
      message: 'Seller released and available for other trades',
    };

    // Add replacement suggestions
    const replacements = await this.findReplacementSellers(
      negotiation.tradeOperation,
      Number(negotiation.tradeSeller.requestedQuantity),
    );
    
    if (replacements.length > 0) {
      (result as any)['replacementSuggestions'] = {
        available: true,
        suggestions: replacements,
      };
    }

    return result;
  }

  /**
   * Withdraw an offer (admin only)
   */
  async withdrawOffer(
    negotiationId: string,
    reason?: string,
    userId?: string,
  ): Promise<NegotiationWithDetails> {
    const negotiation = await this.prisma.offerNegotiation.findUnique({
      where: { id: negotiationId },
      include: {
        tradeSeller: {
          include: {
            seller: true,
            saleListing: true,
          },
        },
        tradeOperation: true,
      },
    });

    if (!negotiation) {
      throw new NotFoundException('Negotiation not found');
    }

    // Only admins can withdraw
    // TODO: Verify user is admin

    // Validate status
    if (negotiation.status === NegotiationStatus.ACCEPTED) {
      throw new BadRequestException('Cannot withdraw accepted negotiation');
    }

    if (negotiation.status === NegotiationStatus.WITHDRAWN) {
      throw new BadRequestException('Negotiation already withdrawn');
    }

    // Update negotiation
    const updated = await this.prisma.offerNegotiation.update({
      where: { id: negotiationId },
      data: {
        status: NegotiationStatus.WITHDRAWN,
        concludedAt: new Date(),
      },
      include: {
        tradeSeller: {
          include: {
            seller: true,
            saleListing: true,
          },
        },
        tradeOperation: true,
      },
    });

    // Update trade seller
    await this.prisma.tradeSeller.update({
      where: { id: negotiation.tradeSellerId },
      data: {
        status: SellerStatus.WITHDRAWN,
      },
    });

    // Re-activate sale listing
    await this.prisma.saleListing.update({
      where: { id: negotiation.tradeSeller.saleListingId },
      data: { status: 'ACTIVE' },
    });

    const result = this.formatNegotiationWithDetails(updated);

    // Add metrics
    const offerHistory = negotiation.offerHistory as any[] || [];
    (result as any)['negotiationMetrics'] = {
      rounds: offerHistory.length,
      priceRange: {
        min: Math.min(...offerHistory.map(h => h.price)),
        max: Math.max(...offerHistory.map(h => h.price)),
      },
      negotiationDuration: new Date().getTime() - new Date((negotiation as any).createdAt || new Date()).getTime(),
    };

    return result;
  }

  /**
   * Extend negotiation expiry
   */
  async extendExpiry(
    negotiationId: string,
    hours: number,
    reason?: string,
  ): Promise<NegotiationWithDetails> {
    const negotiation = await this.prisma.offerNegotiation.findUnique({
      where: { id: negotiationId },
      include: {
        tradeSeller: {
          include: {
            seller: true,
            saleListing: true,
          },
        },
        tradeOperation: true,
      },
    });

    if (!negotiation) {
      throw new NotFoundException('Negotiation not found');
    }

    // Check extension count
    const extensionCount = (negotiation as any).extensionCount || 0;
    if (extensionCount >= this.MAX_EXTENSIONS) {
      throw new BadRequestException('Maximum extensions reached');
    }

    const currentExpiry = new Date(negotiation.expiresAt);
    const newExpiry = new Date(currentExpiry.getTime() + hours * 60 * 60 * 1000);

    const updated = await this.prisma.offerNegotiation.update({
      where: { id: negotiationId },
      data: {
        expiresAt: newExpiry
      },
      include: {
        tradeSeller: {
          include: {
            seller: true,
            saleListing: true,
          },
        },
        tradeOperation: true,
      },
    });

    const result = this.formatNegotiationWithDetails(updated);
    
    (result as any)['extension'] = {
      previousExpiry: currentExpiry.toISOString(),
      newExpiry: newExpiry.toISOString(),
      extensionHours: hours,
      totalExtensions: extensionCount + 1,
    };

    return result;
  }

  // Helper methods

  private formatNegotiationWithDetails(
    negotiation: any,
    profitImpact?: any,
  ): NegotiationWithDetails {
    const now = new Date();
    const expiresAt = new Date(negotiation.expiresAt);
    const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);

    return {
      id: negotiation.id,
      tradeOperationId: negotiation.tradeOperationId,
      tradeSellerId: negotiation.tradeSellerId,
      status: negotiation.status,
      currentOffer: negotiation.currentOffer,
      counterOffer: negotiation.counterOffer,
      offerHistory: negotiation.offerHistory || [],
      finalPrice: negotiation.finalPrice,
      finalQuantity: negotiation.finalQuantity,
      expiresAt: negotiation.expiresAt,
      hoursUntilExpiry: Math.max(0, hoursUntilExpiry),
      isExpiringSoon: hoursUntilExpiry < 12 && hoursUntilExpiry > 0,
      tradeSeller: negotiation.tradeSeller,
      profitImpact,
    };
  }

  private async calculateProfitImpact(
    trade: any,
    price: number,
    quantity: number,
    previousPrice?: number,
  ): Promise<any> {
    const sellingPrice = trade.sellingPrice || 0;
    const totalRevenue = sellingPrice * quantity;
    const purchaseCost = price * quantity;
    const transportCost = trade.estimatedTransportCost || 0;
    
    const estimatedProfit = totalRevenue - purchaseCost - transportCost;
    const profitMargin = totalRevenue > 0 ? (estimatedProfit / totalRevenue) * 100 : 0;

    const result: any = {
      estimatedProfit,
      profitMargin,
    };

    if (previousPrice) {
      result.newPurchasePrice = price;
      result.previousPurchasePrice = previousPrice;
      result.priceChange = price - previousPrice;
      
      const previousProfit = totalRevenue - (previousPrice * quantity) - transportCost;
      result.profitReduction = previousProfit - estimatedProfit;
    }

    return result;
  }

  private async calculateProfitAnalysis(trade: any, negotiations: any[]): Promise<any> {
    let totalRequestedQuantity = 0;
    let totalAgreedQuantity = 0;
    let totalOfferValue = 0;
    let totalAgreedValue = 0;
    let offerCount = 0;
    let agreedCount = 0;

    for (const nego of negotiations) {
      const quantity = nego.currentOffer?.quantity || 0;
      const price = nego.currentOffer?.price || 0;
      
      totalRequestedQuantity += quantity;
      totalOfferValue += price * quantity;
      offerCount++;

      if (nego.status === NegotiationStatus.ACCEPTED && nego.finalPrice) {
        totalAgreedQuantity += nego.finalQuantity || 0;
        totalAgreedValue += nego.finalPrice * (nego.finalQuantity || 0);
        agreedCount++;
      }
    }

    const averageOfferPrice = offerCount > 0 ? totalOfferValue / totalRequestedQuantity : 0;
    const averageAgreedPrice = agreedCount > 0 ? totalAgreedValue / totalAgreedQuantity : 0;

    const sellingPrice = trade.sellingPrice || 0;
    const totalRevenue = sellingPrice * trade.buyListing.quantity;
    const estimatedTotalCost = totalAgreedValue || totalOfferValue;
    const transportCost = trade.estimatedTransportCost || 0;
    const estimatedProfit = totalRevenue - estimatedTotalCost - transportCost;
    const profitMargin = totalRevenue > 0 ? (estimatedProfit / totalRevenue) * 100 : 0;

    return {
      totalRequestedQuantity,
      totalAgreedQuantity,
      averageOfferPrice,
      averageAgreedPrice,
      estimatedTotalCost,
      estimatedProfit,
      profitMargin,
    };
  }

  private async checkPhaseTransition(trade: any, negotiations: any[]): Promise<any> {
    const allSellers = await this.prisma.tradeSeller.count({
      where: { tradeOperationId: trade.id },
    });

    const acceptedSellers = await this.prisma.tradeSeller.count({
      where: {
        tradeOperationId: trade.id,
        status: SellerStatus.ACCEPTED,
      },
    });

    const allAccepted = allSellers === acceptedSellers && allSellers > 0;

    return {
      allSellersAccepted: allAccepted,
      readyForNextPhase: allAccepted,
      nextPhase: allAccepted ? 'INSPECTION_REQUIRED' : undefined,
      message: allAccepted 
        ? 'All sellers have accepted. Ready for inspection phase.'
        : `${acceptedSellers} of ${allSellers} sellers accepted`,
    };
  }

  private async updateTradeOperationTotals(tradeOperationId: string): Promise<void> {
    const trade = await this.prisma.tradeOperation.findUnique({
      where: { id: tradeOperationId },
      include: {
        sellers: true,
        buyListing: true,
      },
    });

    if (!trade) return;

    let totalPurchaseCost = 0;
    let totalQuantity = 0;

    for (const seller of trade.sellers) {
      if (seller.agreedPrice && seller.agreedQuantity) {
        const price = Number(seller.agreedPrice);
        const quantity = Number(seller.agreedQuantity);
        totalPurchaseCost += price * quantity;
        totalQuantity += quantity;
      }
    }

    const sellingPrice = Number(trade.sellingPrice || 0);
    const totalRevenue = sellingPrice * Number(trade.buyListing.quantity);
    const transportCost = Number(trade.estimatedTransportCost || 0);
    const estimatedProfit = totalRevenue - totalPurchaseCost - transportCost;
    const actualProfitMargin = totalRevenue > 0 ? (estimatedProfit / totalRevenue) * 100 : 0;

    await this.prisma.tradeOperation.update({
      where: { id: tradeOperationId },
      data: {
        totalPurchaseCost,
        estimatedProfit,
        actualProfit: estimatedProfit,
      },
    });
  }

  private async findReplacementSellers(
    trade: any,
    quantity: number,
  ): Promise<any[]> {
    // Find available sellers not in current trade
    const existingSellerIds = await this.prisma.tradeSeller.findMany({
      where: { tradeOperationId: trade.id },
      select: { sellerId: true },
    });

    const availableListings = await this.prisma.saleListing.findMany({
      where: {
        status: 'ACTIVE',
        quantity: { gte: quantity * 0.8 }, // At least 80% of needed quantity
        productId: trade.buyListing?.productId,
        sellerId: {
          notIn: existingSellerIds.map(s => s.sellerId),
        },
      },
      include: {
        seller: true,
      },
      orderBy: {
        askingPrice: 'asc',
      },
      take: 3,
    });

    return availableListings.map(listing => ({
      sellerId: listing.sellerId,
      name: listing.seller.name,
      quantity: listing.quantity,
      askingPrice: listing.askingPrice,
      priceComparison: `+${Number(listing.askingPrice || 0) - Number(trade.avgPurchasePrice || 0)} EUR vs average`,
    }));
  }

  private determineOfferedBy(negotiation: any, userId?: string): string {
    // TODO: Implement proper user role detection
    // For now, simple logic based on negotiation state
    if (negotiation.status === NegotiationStatus.PENDING) {
      return 'BUYER';
    }
    if (negotiation.status === NegotiationStatus.COUNTERED) {
      return negotiation.counterOffer?.offeredBy === 'SELLER' ? 'BUYER' : 'SELLER';
    }
    return 'BUYER';
  }
}