import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProfitCalculationService } from './profit-calculation.service';
import { PriceScenarioService } from './price-scenario.service';
import { TransportCostService } from '../../transport/services/transport-cost.service';
import { RouteOptimizationService } from '../../transport/services/route-optimization.service';
import { CreateTradeOperationDto } from '../dto/create-trade-operation.dto';
import { 
  TradeOperation, 
  TradePhase, 
  TradeStatus,
  BuyListing,
  SaleListing,
  TradeSeller,
  Prisma,
} from '@prisma/client';


export interface TradeOperationSummary {
  id: string;
  phase: TradePhase;
  status: TradeStatus;
  buyer: {
    id: string;
    name: string;
    requestedQuantity: number;
    maxPrice: number;
  };
  sellers: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    status: string;
  }>;
  profit: {
    estimated: number;
    margin: number;
    isViable: boolean;
  };
  transport: {
    estimatedCost: number;
    distance: number;
    optimized: boolean;
  };
  timeline: {
    created: Date;
    lastUpdated: Date;
    expectedCompletion?: Date;
  };
}

export interface SellerMatchingParams {
  productId: string;
  requiredQuantity: number;
  maxPricePerUnit: number;
  location?: { lat: number; lng: number };
  qualityPreference?: 'PREMIUM' | 'STANDARD' | 'ECONOMY' | 'ANY';
}

export interface MatchedSeller {
  sellerId: string;
  sellerName: string;
  saleListingId: string;
  availableQuantity: number;
  availability?: number; // For frontend compatibility
  askingPrice: number;
  quality: string;
  location: { 
    lat: number; 
    lng: number;
    city?: string;
    address?: string;
    displayName?: string;
  };
  distance: number;
  score: number;
}

@Injectable()
export class TradeOperationService {
  private readonly logger = new Logger(TradeOperationService.name);
  private readonly MIN_PROFIT_MARGIN = 5;
  private readonly TARGET_PROFIT_MARGIN = 7;

  constructor(
    private readonly prisma: PrismaService,
    private readonly profitCalculationService: ProfitCalculationService,
    private readonly priceScenarioService: PriceScenarioService,
    private readonly transportCostService: TransportCostService,
    private readonly routeOptimizationService: RouteOptimizationService,
  ) {}

  /**
   * Create a new trade operation (admin buys from sellers, sells to buyer)
   */
  async createTradeOperation(
    dto: CreateTradeOperationDto,
    adminId: string,
  ): Promise<TradeOperation> {
    // Get buy listing
    const buyListing = await this.prisma.buyListing.findUnique({
      where: { id: dto.buyListingId },
      include: {
        buyer: true,
        product: true,
      },
    });

    if (!buyListing) {
      throw new NotFoundException('Buy listing not found');
    }

    if (buyListing.status !== 'ACTIVE') {
      throw new BadRequestException('Buy listing is not active');
    }

    // Generate unique operation number
    const operationNumber = `OP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Create trade operation
    const tradeOperation = await this.prisma.tradeOperation.create({
      data: {
        operationNumber,
        buyListingId: dto.buyListingId,
        adminId,
        phase: 'INITIATION',
        status: 'ACTIVE',
        profitMargin: dto.targetProfitMargin || this.TARGET_PROFIT_MARGIN,
        sellingPrice: buyListing.maxPricePerUnit,
        totalRevenue: buyListing.maxPricePerUnit?.toNumber() 
          ? buyListing.maxPricePerUnit.toNumber() * buyListing.quantity.toNumber() 
          : 0,
        currency: 'EUR',
      },
    });

    // Generate initial price scenarios
    await this.generateInitialScenarios(tradeOperation.id);

    this.logger.log(
      `Created trade operation ${tradeOperation.id} for buy listing ${buyListing.id}`,
    );

    return tradeOperation;
  }

  /**
   * Find and match sellers for a trade operation
   */
  async findMatchingSellers(
    tradeOperationId: string,
    params?: Partial<SellerMatchingParams>,
  ): Promise<MatchedSeller[]> {
    const trade = await this.prisma.tradeOperation.findUnique({
      where: { id: tradeOperationId },
      include: {
        buyListing: {
          include: {
            product: true,
            buyer: true,
          },
        },
      },
    });

    if (!trade) {
      throw new NotFoundException('Trade operation not found');
    }

    const matchParams: SellerMatchingParams = {
      productId: trade.buyListing.productId,
      requiredQuantity: trade.buyListing.quantity.toNumber(),
      maxPricePerUnit: trade.buyListing.maxPricePerUnit?.toNumber() || 0,
      location: params?.location || { lat: 42.6977, lng: 23.3219 }, // Default: Sofia
      qualityPreference: params?.qualityPreference || 'ANY',
    };

    // Find available sellers
    const saleListings = await this.prisma.saleListing.findMany({
      where: {
        productId: matchParams.productId,
        status: 'ACTIVE',
        quantity: { gt: 0 },
        askingPrice: { lte: matchParams.maxPricePerUnit * 0.95 }, // Max 95% of buyer price for profit margin
      },
      include: {
        seller: {
          include: {
            addresses: true,
          },
        },
        address: true,
      },
    });

    // Score and rank sellers
    const scoredSellers = saleListings.map(listing => {
      const seller = listing.seller;
      // Use listing address or first seller address
      const address = listing.address || seller.addresses?.[0];
      const sellerLocation = address 
        ? { lat: address.latitude || 0, lng: address.longitude || 0 }
        : { lat: 0, lng: 0 };
      
      // Calculate distance
      const distance = this.calculateDistance(
        matchParams.location!,
        sellerLocation,
      );

      // Calculate score (price weight: 40%, distance: 30%, quality: 20%, quantity: 10%)
      let score = 0;

      // Price score (lower is better)
      const priceRatio = listing.askingPrice?.toNumber() || 0 / matchParams.maxPricePerUnit;
      score += (1 - priceRatio) * 40;

      // Distance score (closer is better)
      const maxDistance = 500; // km
      const distanceScore = Math.max(0, 1 - distance / maxDistance);
      score += distanceScore * 30;

      // Quality score
      const qualityScore = this.getQualityScore(
        'STANDARD', // quality field doesn't exist on listing
        matchParams.qualityPreference!,
      );
      score += qualityScore * 20;

      // Quantity score (can fulfill more is better)
      const quantityRatio = Math.min(
        1,
        listing.quantity.toNumber() / matchParams.requiredQuantity,
      );
      score += quantityRatio * 10;

      // Extract city from address street field (stored as "{City} Region")
      const cityMatch = address?.street?.match(/^(.+)\s+Region$/);
      const city = cityMatch ? cityMatch[1] : 'Unknown Location';
      
      return {
        sellerId: seller.id,
        sellerName: seller.name || `Seller ${seller.id.slice(-4)}`,
        saleListingId: listing.id,
        availableQuantity: listing.quantity.toNumber(),
        availability: listing.quantity.toNumber(), // Add for frontend compatibility
        askingPrice: listing.askingPrice?.toNumber() || 0,
        quality: 'STANDARD', // quality field doesn't exist
        location: {
          lat: sellerLocation.lat,
          lng: sellerLocation.lng,
          city: city,
          address: address?.street || 'Location not specified',
          displayName: `${city} • ${Math.round(distance)}km`,
        },
        distance: Math.round(distance),
        score: Math.round(score * 100) / 100,
      };
    });

    // Sort by score descending
    return scoredSellers.sort((a, b) => b.score - a.score);
  }

  /**
   * Add sellers to trade operation
   */
  async addSellersToTrade(
    tradeOperationId: string,
    sellers: Array<{
      sellerId: string;
      saleListingId: string;
      requestedQuantity: number;
    }>,
  ): Promise<TradeSeller[]> {
    const trade = await this.prisma.tradeOperation.findUnique({
      where: { id: tradeOperationId },
      include: {
        buyListing: true,
        sellers: true,
      },
    });

    if (!trade) {
      throw new NotFoundException('Trade operation not found');
    }

    // Validate total quantity
    const currentQuantity = trade.sellers.reduce(
      (sum, s) => sum + (s.requestedQuantity?.toNumber() || 0),
      0,
    );
    const newQuantity = sellers.reduce((sum, s) => sum + s.requestedQuantity, 0);
    const totalQuantity = currentQuantity + newQuantity;

    // Allow exact match - frontend already calculates partial quantities
    const buyerRequirement = trade.buyListing.quantity.toNumber();
    
    // Log for debugging
    this.logger.log(`Adding sellers: Total quantity ${totalQuantity} vs buyer requirement ${buyerRequirement}`);
    
    // We allow exact match since frontend calculates partial quantities
    // The totalQuantity should already be adjusted by frontend
    if (totalQuantity > buyerRequirement) {
      this.logger.warn(`Total quantity ${totalQuantity} exceeds buyer requirement ${buyerRequirement}`);
      // Don't throw error, just log warning since frontend handles partial quantities
    }

    // Add sellers
    const tradeSellers: TradeSeller[] = [];
    
    for (const seller of sellers) {
      const saleListing = await this.prisma.saleListing.findUnique({
        where: { id: seller.saleListingId },
      });

      if (!saleListing) {
        throw new NotFoundException(`Sale listing ${seller.saleListingId} not found`);
      }

      const tradeSeller = await this.prisma.tradeSeller.create({
        data: {
          tradeOperationId,
          sellerId: seller.sellerId,
          saleListingId: seller.saleListingId,
          requestedQuantity: seller.requestedQuantity,
          offeredQuantity: saleListing.quantity, // Use listing quantity as offered
          unit: saleListing.unit,
          status: 'INVITED',
        },
      });
      
      this.logger.log(
        `Added seller ${seller.sellerId}: Requesting ${seller.requestedQuantity} of ${saleListing.quantity.toNumber()} available`,
      );

      tradeSellers.push(tradeSeller);
    }

    // Update trade phase if enough sellers (consider exact match as complete)
    if (Math.abs(totalQuantity - trade.buyListing.quantity.toNumber()) < 1) {
      // Exact match or very close
      await this.prisma.tradeOperation.update({
        where: { id: tradeOperationId },
        data: { phase: 'SELLER_NEGOTIATION' },
      });
      this.logger.log(
        `Trade ${tradeOperationId}: Exact quantity match achieved (${totalQuantity}/${trade.buyListing.quantity.toNumber()})`,
      );
    } else if (totalQuantity >= trade.buyListing.quantity.toNumber() * 0.8) {
      await this.prisma.tradeOperation.update({
        where: { id: tradeOperationId },
        data: { phase: 'SELLER_NEGOTIATION' },
      });
    }

    // Recalculate profit with new sellers
    await this.updateProfitCalculation(tradeOperationId);

    return tradeSellers;
  }

  /**
   * Update profit calculation for trade
   */
  async updateProfitCalculation(tradeOperationId: string): Promise<void> {
    const profitCalc = await this.profitCalculationService.calculateProfit(
      tradeOperationId,
    );

    await this.prisma.tradeOperation.update({
      where: { id: tradeOperationId },
      data: {
        totalPurchaseCost: profitCalc.costs.purchases.totalCost,
        avgPurchasePrice: profitCalc.costs.purchases.avgPrice,
        estimatedTransportCost: profitCalc.costs.transport.estimatedCost,
        estimatedProfit: profitCalc.profit.netProfit,
        profitMargin: profitCalc.profit.profitMargin,
      },
    });
  }

  /**
   * Update the phase of a trade operation
   */
  async updateTradePhase(tradeOperationId: string, newPhase: TradePhase): Promise<TradeOperation> {
    // Validate the trade operation exists
    const existingTrade = await this.prisma.tradeOperation.findUnique({
      where: { id: tradeOperationId },
    });

    if (!existingTrade) {
      throw new NotFoundException('Trade operation not found');
    }

    // Validate phase transition is allowed
    const validTransitions = this.getValidPhaseTransitions(existingTrade.phase);
    if (!validTransitions.includes(newPhase)) {
      throw new BadRequestException(
        `Invalid phase transition from ${existingTrade.phase} to ${newPhase}. Valid transitions: ${validTransitions.join(', ')}`,
      );
    }

    // Update the phase
    const updatedTrade = await this.prisma.tradeOperation.update({
      where: { id: tradeOperationId },
      data: {
        phase: newPhase,
        updatedAt: new Date(),
      },
    });

    this.logger.log(`Trade operation ${tradeOperationId} phase updated from ${existingTrade.phase} to ${newPhase}`);
    
    return updatedTrade;
  }

  /**
   * Get valid phase transitions from current phase
   */
  private getValidPhaseTransitions(currentPhase: TradePhase): TradePhase[] {
    const transitions: Record<TradePhase, TradePhase[]> = {
      [TradePhase.INITIATION]: [TradePhase.SELLER_MATCHING, TradePhase.CANCELLED],
      [TradePhase.SELLER_MATCHING]: [TradePhase.SELLER_NEGOTIATION, TradePhase.CANCELLED],
      [TradePhase.SELLER_NEGOTIATION]: [TradePhase.INSPECTION_PENDING, TradePhase.TRANSPORT_MATCHING, TradePhase.CANCELLED],
      [TradePhase.INSPECTION_PENDING]: [TradePhase.TRANSPORT_MATCHING, TradePhase.CANCELLED],
      [TradePhase.TRANSPORT_MATCHING]: [TradePhase.TRANSPORT_BIDDING, TradePhase.IN_TRANSIT, TradePhase.CANCELLED],
      [TradePhase.TRANSPORT_BIDDING]: [TradePhase.IN_TRANSIT, TradePhase.CANCELLED],
      [TradePhase.IN_TRANSIT]: [TradePhase.DELIVERED, TradePhase.CANCELLED],
      [TradePhase.DELIVERED]: [TradePhase.COMPLETED, TradePhase.CANCELLED],
      [TradePhase.COMPLETED]: [], // Final phase
      [TradePhase.CANCELLED]: [], // Final phase
    };

    return transitions[currentPhase] || [];
  }

  /**
   * Optimize transport for trade operation
   */
  async optimizeTransport(
    tradeOperationId: string,
  ): Promise<{
    optimizedRoute: any;
    estimatedCost: number;
    distanceSaved: number;
  }> {
    const trade = await this.prisma.tradeOperation.findUnique({
      where: { id: tradeOperationId },
      include: {
        buyListing: {
          include: {
            buyer: {
              include: { addresses: true },
            },
          },
        },
        sellers: {
          include: {
            seller: {
              include: { addresses: true },
            },
          },
        },
      },
    });

    if (!trade) {
      throw new NotFoundException('Trade operation not found');
    }

    // Prepare pickup points
    const pickupPoints = (trade.sellers || []).map((ts: any) => {
      const sellerAddress = ts.seller?.addresses?.[0];
      // Handle Prisma Decimal type conversion safely
      const quantity = ts.requestedQuantity
        ? (typeof ts.requestedQuantity === 'object' && 'toNumber' in ts.requestedQuantity
            ? ts.requestedQuantity.toNumber()
            : Number(ts.requestedQuantity))
        : 0;

      return {
        id: ts.sellerId,
        lat: sellerAddress?.latitude || 0,
        lng: sellerAddress?.longitude || 0,
        quantity,
      };
    });

    // Delivery location
    const buyerAddress = trade.buyListing?.buyer?.addresses?.[0];
    const deliveryLocation = {
      lat: buyerAddress?.latitude || 42.6977,
      lng: buyerAddress?.longitude || 23.3219,
    };

    // Warehouse location (default: Sofia)
    const warehouseLocation = { lat: 42.6977, lng: 23.3219 };

    // Optimize route
    const optimization = await this.routeOptimizationService.optimizeRoute(
      warehouseLocation,
      pickupPoints,
      deliveryLocation,
      'tsp_2opt',
    );

    // Calculate transport cost
    const transportEstimation = await this.transportCostService.estimateCost(
      pickupPoints,
      deliveryLocation,
      { vehicleType: 'FLATBED' },
    );

    // Update trade operation
    await this.prisma.tradeOperation.update({
      where: { id: tradeOperationId },
      data: {
        estimatedTransportCost: transportEstimation.totalCost,
        totalDistanceKm: optimization.optimizedRoute.totalDistance,
        // transportOptimized field doesn't exist in schema
      },
    });

    return {
      optimizedRoute: optimization.optimizedRoute,
      estimatedCost: transportEstimation.totalCost,
      distanceSaved: optimization.comparison.distanceSaved,
    };
  }

  /**
   * Finalize trade operation
   */
  async finalizeTrade(
    tradeOperationId: string,
  ): Promise<{
    success: boolean;
    finalProfit: number;
    profitMargin: number;
    message: string;
  }> {
    const trade = await this.prisma.tradeOperation.findUnique({
      where: { id: tradeOperationId },
      include: {
        sellers: true,
        buyListing: true,
      },
    });

    if (!trade) {
      throw new NotFoundException('Trade operation not found');
    }

    // Validate all sellers have agreed
    const allAgreed = trade.sellers.every(s => s.status === 'ACCEPTED');
    if (!allAgreed) {
      throw new BadRequestException('Not all sellers have agreed to terms');
    }

    // Calculate final profit
    const profitCalc = await this.profitCalculationService.calculateProfit(
      tradeOperationId,
    );

    // Validate minimum margin
    if (profitCalc.profit.profitMargin < this.MIN_PROFIT_MARGIN) {
      return {
        success: false,
        finalProfit: profitCalc.profit.netProfit,
        profitMargin: profitCalc.profit.profitMargin,
        message: `Profit margin ${profitCalc.profit.profitMargin.toFixed(2)}% is below minimum ${this.MIN_PROFIT_MARGIN}%`,
      };
    }

    // Update trade status
    await this.prisma.tradeOperation.update({
      where: { id: tradeOperationId },
      data: {
        phase: 'IN_TRANSIT', // Use IN_TRANSIT instead of EXECUTION
        status: 'ACTIVE', // Use ACTIVE instead of CONFIRMED
        actualProfit: profitCalc.profit.netProfit,
        profitMargin: profitCalc.profit.profitMargin, // Use profitMargin not actualProfitMargin
        // confirmedAt field doesn't exist
      },
    });

    // Update buy listing status
    await this.prisma.buyListing.update({
      where: { id: trade.buyListingId },
      data: { status: 'FULFILLED' },
    });

    // Update sale listings
    for (const seller of trade.sellers) {
      if (seller.saleListingId) {
        await this.prisma.saleListing.update({
          where: { id: seller.saleListingId },
          data: {
            quantity: {
              decrement: seller.agreedQuantity || seller.requestedQuantity || 0,
            },
          },
        });
      }
    }

    this.logger.log(
      `Finalized trade ${tradeOperationId} with profit margin ${profitCalc.profit.profitMargin.toFixed(2)}%`,
    );

    return {
      success: true,
      finalProfit: profitCalc.profit.netProfit,
      profitMargin: profitCalc.profit.profitMargin,
      message: `Trade finalized successfully with ${profitCalc.profit.profitMargin.toFixed(2)}% profit margin`,
    };
  }

  /**
   * Get trade operation summary
   */
  async getTradeOperationSummary(
    tradeOperationId: string,
  ): Promise<TradeOperationSummary> {
    const trade = await this.prisma.tradeOperation.findUnique({
      where: { id: tradeOperationId },
      include: {
        buyListing: {
          include: { buyer: true },
        },
        sellers: {
          include: { seller: true },
        },
      },
    });

    if (!trade) {
      throw new NotFoundException('Trade operation not found');
    }

    const profitCalc = await this.profitCalculationService.calculateProfit(
      tradeOperationId,
    );

    return {
      id: trade.id,
      phase: trade.phase,
      status: trade.status,
      buyer: {
        id: trade.buyListing.buyer.id,
        name: trade.buyListing.buyer.name || 'Unknown Buyer',
        requestedQuantity: trade.buyListing.quantity.toNumber(),
        maxPrice: trade.buyListing.maxPricePerUnit?.toNumber() || 0,
      },
      sellers: trade.sellers.map(ts => ({
        id: ts.id,  // TradeSeller ID (needed for negotiations)
        sellerId: ts.sellerId,  // Actual seller ID
        name: ts.seller.name || 'Unknown Seller',
        quantity: ts.agreedQuantity?.toNumber() || ts.requestedQuantity?.toNumber() || 0,
        price: ts.agreedPrice?.toNumber() || 0,
        status: ts.status,
      })),
      profit: {
        estimated: profitCalc.profit.netProfit,
        margin: profitCalc.profit.profitMargin,
        isViable: profitCalc.profit.profitMargin >= this.MIN_PROFIT_MARGIN,
      },
      transport: {
        estimatedCost: profitCalc.costs.transport.estimatedCost,
        distance: trade.totalDistanceKm || 0,
        optimized: false, // transportOptimized field doesn't exist
      },
      timeline: {
        created: trade.createdAt,
        lastUpdated: trade.updatedAt,
        expectedCompletion: undefined, // expectedDeliveryDate doesn't exist
      },
    };
  }

  /**
   * Generate initial price scenarios
   */
  private async generateInitialScenarios(tradeOperationId: string): Promise<void> {
    try {
      const scenarios = await this.priceScenarioService.generateScenarios({
        tradeOperationId,
        scenarioCount: 5,
        includeQualityFactors: true,
        includeTransportVariations: true,
      });

      // Log optimal scenario
      if (scenarios.optimal) {
        this.logger.log(
          `Generated ${scenarios.scenarios.length} scenarios. Optimal margin: ${scenarios.optimal.profitMargin}%`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to generate initial scenarios', error);
    }
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(point2.lat - point1.lat);
    const dLng = this.toRad(point2.lng - point1.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(point1.lat)) *
      Math.cos(this.toRad(point2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Get quality score for matching
   */
  private getQualityScore(
    sellerQuality: string,
    preference: string,
  ): number {
    if (preference === 'ANY') return 0.5;

    const qualityMap: Record<string, number> = {
      PREMIUM: 3,
      STANDARD: 2,
      ECONOMY: 1,
    };

    const sellerScore = qualityMap[sellerQuality] || 2;
    const preferenceScore = qualityMap[preference] || 2;

    // Perfect match = 1.0, further away = lower score
    const difference = Math.abs(sellerScore - preferenceScore);
    return Math.max(0, 1 - difference * 0.3);
  }

  /**
   * Monitor active trades
   */
  async getActiveTrades(
    filters?: {
      phase?: TradePhase;
      minProfitMargin?: number;
      adminId?: string;
    },
  ): Promise<TradeOperation[]> {
    const where: Prisma.TradeOperationWhereInput = {
      status: 'ACTIVE',
      ...(filters?.phase && { phase: filters.phase }),
      ...(filters?.minProfitMargin && {
        profitMargin: { gte: filters.minProfitMargin },
      }),
      ...(filters?.adminId && { adminId: filters.adminId }),
    };

    return await this.prisma.tradeOperation.findMany({
      where,
      include: {
        buyListing: {
          include: { buyer: true, product: true },
        },
        sellers: {
          include: { seller: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get profit analytics
   */
  async getProfitAnalytics(
    dateRange?: { start: Date; end: Date },
  ): Promise<{
    totalTrades: number;
    averageMargin: number;
    totalProfit: number;
    successRate: number;
    marginDistribution: Record<string, number>;
  }> {
    const where: Prisma.TradeOperationWhereInput = dateRange
      ? {
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
        }
      : {};

    const trades = await this.prisma.tradeOperation.findMany({ where });

    const completed = trades.filter(t => t.phase === 'COMPLETED');
    const totalProfit = completed.reduce(
      (sum, t) => sum + (t.actualProfit?.toNumber() || 0),
      0,
    );
    const averageMargin =
      completed.length > 0
        ? completed.reduce((sum, t) => sum + (t.profitMargin || 0), 0) /
          completed.length
        : 0;

    // Margin distribution
    const marginDistribution: Record<string, number> = {
      'Below 5%': 0,
      '5-7%': 0,
      '7-10%': 0,
      'Above 10%': 0,
    };

    completed.forEach(t => {
      const margin = t.profitMargin || 0;
      if (margin < 5) marginDistribution['Below 5%']++;
      else if (margin < 7) marginDistribution['5-7%']++;
      else if (margin < 10) marginDistribution['7-10%']++;
      else marginDistribution['Above 10%']++;
    });

    return {
      totalTrades: trades.length,
      averageMargin: Math.round(averageMargin * 100) / 100,
      totalProfit: Math.round(totalProfit * 100) / 100,
      successRate: trades.length > 0 ? (completed.length / trades.length) * 100 : 0,
      marginDistribution,
    };
  }

  /**
   * Request inspections for selected sellers
   */
  async requestInspections(
    tradeOperationId: string,
    sellerIds: string[],
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' = 'MEDIUM',
  ): Promise<any[]> {
    const trade = await this.prisma.tradeOperation.findUnique({
      where: { id: tradeOperationId },
      include: {
        sellers: {
          where: {
            sellerId: { in: sellerIds },
          },
          include: {
            saleListing: true,
          },
        },
      },
    });

    if (!trade) {
      throw new NotFoundException('Trade operation not found');
    }

    const inspectionRequests = [];

    for (const seller of trade.sellers) {
      if (!seller.saleListingId) continue;

      // Create inspection request
      const inspection = await this.prisma.inspectionRequest.create({
        data: {
          tradeOperationId,
          saleListingId: seller.saleListingId,
          priority: priority as any,
          requestedDate: new Date(),
          status: 'PENDING',
          latitude: 42.6977, // Default or from seller location
          longitude: 23.3219,
          address: 'To be determined',
          photos: [],
        },
        include: {
          saleListing: {
            include: {
              seller: true,
              product: true,
            },
          },
        },
      });

      inspectionRequests.push(inspection);
      this.logger.log(`Created inspection request ${inspection.id} for seller ${seller.sellerId}`);
    }

    return inspectionRequests;
  }
}