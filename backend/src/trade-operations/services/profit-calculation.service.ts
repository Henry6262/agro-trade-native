import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Decimal } from "@prisma/client/runtime/library";
import { TradeOperation, TradeSeller, ProfitEstimation } from "@prisma/client";

export interface ProfitCalculation {
  tradeOperationId: string;
  revenue: {
    sellingPrice: number;
    quantity: number;
    totalRevenue: number;
  };
  costs: {
    purchases: {
      totalCost: number;
      avgPrice: number;
      breakdown: Array<{
        sellerId: string;
        quantity: number;
        price: number;
        totalCost: number;
      }>;
    };
    transport: {
      estimatedCost: number;
      actualCost?: number;
      distance: number;
      ratePerKm: number;
    };
    totalCosts: number;
  };
  profit: {
    grossProfit: number;
    netProfit: number;
    profitMargin: number;
    currency: string;
  };
  status: {
    isEstimated: boolean;
    lastUpdated: Date;
  };
}

export interface ProfitEstimate {
  estimatedProfit: number;
  profitMargin: number;
  isViable: boolean;
  warnings: string[];
}

export interface EstimationParams {
  buyerPrice: number;
  sellerPrices: Array<{
    sellerId: string;
    price: number;
    quantity: number;
  }>;
  transportCost?: number;
  saveEstimation?: boolean;
}

export interface ProfitImpact {
  estimatedProfit: number;
  profitMargin: number;
  profitChange: number;
  cumulativeProfit?: number;
  averagePurchasePrice?: number;
  warning?: string;
}

@Injectable()
export class ProfitCalculationService {
  private readonly logger = new Logger(ProfitCalculationService.name);
  private readonly MIN_PROFIT_MARGIN = 5; // 5% minimum
  private readonly TARGET_PROFIT_MARGIN = 7; // 7% target
  private readonly DEFAULT_TRANSPORT_RATE = 0.15; // €0.15/km

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate real-time profit for a trade operation
   */
  async calculateProfit(tradeOperationId: string): Promise<ProfitCalculation> {
    const trade = await this.prisma.tradeOperation.findUnique({
      where: { id: tradeOperationId },
      include: {
        buyListing: true,
        sellers: true,
        transportCostCalculations: {
          orderBy: { calculatedAt: "desc" },
          take: 1,
        },
      },
    });

    if (!trade) {
      throw new Error(`Trade operation ${tradeOperationId} not found`);
    }

    // Calculate revenue
    const quantity = trade.buyListing?.quantity?.toNumber() || 0;
    const sellingPrice = trade.sellingPrice?.toNumber() || 0;
    const totalRevenue =
      trade.totalRevenue?.toNumber() || sellingPrice * quantity;

    // Calculate purchase costs
    const purchaseBreakdown = await this.calculatePurchaseCosts(
      trade.sellers || [],
    );

    // Calculate transport costs
    const transportCosts = this.calculateTransportCosts(trade);

    // Calculate total costs
    const totalCosts =
      purchaseBreakdown.totalCost + transportCosts.estimatedCost;

    // Calculate profit
    const grossProfit = totalRevenue - purchaseBreakdown.totalCost;
    const netProfit = totalRevenue - totalCosts;
    const profitMargin =
      totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      tradeOperationId,
      revenue: {
        sellingPrice,
        quantity,
        totalRevenue,
      },
      costs: {
        purchases: purchaseBreakdown,
        transport: transportCosts,
        totalCosts,
      },
      profit: {
        grossProfit,
        netProfit,
        profitMargin,
        currency: trade.currency || "EUR",
      },
      status: {
        isEstimated: trade.phase !== "COMPLETED",
        lastUpdated: new Date(),
      },
    };
  }

  /**
   * Estimate profit with proposed prices
   */
  async estimateProfit(
    tradeOperationId: string,
    params: EstimationParams,
  ): Promise<ProfitEstimate> {
    const trade = await this.prisma.tradeOperation.findUnique({
      where: { id: tradeOperationId },
      include: { buyListing: true },
    });

    if (!trade) {
      throw new Error(`Trade operation ${tradeOperationId} not found`);
    }

    const quantity = trade.buyListing.quantity.toNumber();
    const totalRevenue = params.buyerPrice * quantity;

    // Calculate total purchase cost
    const totalPurchaseCost = params.sellerPrices.reduce(
      (sum, seller) => sum + seller.price * seller.quantity,
      0,
    );

    // Use provided transport cost or estimate
    const transportCost =
      params.transportCost || this.estimateTransportCost(quantity);

    // Calculate profit
    const estimatedProfit = totalRevenue - totalPurchaseCost - transportCost;
    const profitMargin =
      totalRevenue > 0 ? (estimatedProfit / totalRevenue) * 100 : 0;

    // Check viability
    const isViable = profitMargin >= this.MIN_PROFIT_MARGIN;
    const warnings = this.generateWarnings(profitMargin, estimatedProfit);

    // Save estimation if requested
    if (params.saveEstimation) {
      await this.saveEstimation(tradeOperationId, {
        buyerPrice: params.buyerPrice,
        sellerPrices: params.sellerPrices,
        estimatedProfit,
        profitMargin,
      });
    }

    return {
      estimatedProfit,
      profitMargin,
      isViable,
      warnings,
    };
  }

  /**
   * Validate minimum profit margin
   */
  validateMinimumMargin(profitMargin: number): boolean {
    return profitMargin >= this.MIN_PROFIT_MARGIN;
  }

  /**
   * Track profit history for a trade
   */
  async trackProfitHistory(
    tradeOperationId: string,
  ): Promise<ProfitEstimation[]> {
    return await this.prisma.profitEstimation.findMany({
      where: { tradeOperationId },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Compare multiple scenarios
   */
  compareScenarios(scenarios: ProfitEstimate[]): {
    best: ProfitEstimate;
    worst: ProfitEstimate;
    average: number;
    viableCount: number;
  } {
    const sorted = scenarios.sort((a, b) => b.profitMargin - a.profitMargin);
    const viable = scenarios.filter((s) => s.isViable);
    const average =
      scenarios.reduce((sum, s) => sum + s.profitMargin, 0) / scenarios.length;

    return {
      best: sorted[0],
      worst: sorted[sorted.length - 1],
      average,
      viableCount: viable.length,
    };
  }

  /**
   * Calculate profit impact of an offer
   */
  async calculateProfitImpact(
    tradeOperationId: string,
    offerPrice: number,
    offerQuantity: number,
    offerType: "BUYER" | "SELLER",
  ): Promise<ProfitImpact> {
    const currentProfit = await this.calculateProfit(tradeOperationId);

    // Calculate new profit with the offer
    let newRevenue = currentProfit.revenue.totalRevenue;
    let newCosts = currentProfit.costs.totalCosts;

    if (offerType === "BUYER") {
      newRevenue = offerPrice * currentProfit.revenue.quantity;
    } else {
      // Recalculate purchase costs with new seller price
      const currentPurchaseCost = currentProfit.costs.purchases.totalCost;
      const priceDifference =
        offerPrice - currentPurchaseCost / currentProfit.revenue.quantity;
      newCosts = currentPurchaseCost + priceDifference * offerQuantity;
    }

    const newProfit = newRevenue - newCosts;
    const newMargin = newRevenue > 0 ? (newProfit / newRevenue) * 100 : 0;
    const profitChange = newProfit - currentProfit.profit.netProfit;

    // Generate warning if needed
    let warning: string | undefined;
    if (newMargin < this.MIN_PROFIT_MARGIN) {
      warning = `Profit margin ${newMargin.toFixed(2)}% is below minimum ${this.MIN_PROFIT_MARGIN}%`;
    }

    return {
      estimatedProfit: newProfit,
      profitMargin: newMargin,
      profitChange,
      warning,
    };
  }

  /**
   * Calculate purchase costs from sellers
   */
  private async calculatePurchaseCosts(sellers: TradeSeller[]): Promise<{
    totalCost: number;
    avgPrice: number;
    breakdown: Array<{
      sellerId: string;
      quantity: number;
      price: number;
      totalCost: number;
    }>;
  }> {
    const breakdown = sellers.map((seller) => {
      const quantity =
        seller.agreedQuantity?.toNumber() ||
        seller.requestedQuantity?.toNumber() ||
        0;
      const price = seller.agreedPrice?.toNumber() || 0;
      const totalCost = quantity * price;

      return {
        sellerId: seller.sellerId,
        quantity,
        price,
        totalCost,
      };
    });

    const totalCost = breakdown.reduce((sum, item) => sum + item.totalCost, 0);
    const totalQuantity = breakdown.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    const avgPrice = totalQuantity > 0 ? totalCost / totalQuantity : 0;

    return {
      totalCost,
      avgPrice,
      breakdown,
    };
  }

  /**
   * Calculate transport costs
   */
  private calculateTransportCosts(trade: any): {
    estimatedCost: number;
    actualCost?: number;
    distance: number;
    ratePerKm: number;
  } {
    const estimatedCost = trade.estimatedTransportCost?.toNumber() || 0;
    const actualCost = trade.actualTransportCost?.toNumber();
    const distance = trade.totalDistanceKm || 0;

    // Get rate from latest calculation or use default
    const latestCalc = trade.transportCalculations?.[0];
    const ratePerKm =
      latestCalc?.baseRatePerKm?.toNumber() || this.DEFAULT_TRANSPORT_RATE;

    return {
      estimatedCost,
      actualCost,
      distance,
      ratePerKm,
    };
  }

  /**
   * Estimate transport cost based on quantity
   */
  private estimateTransportCost(quantity: number): number {
    // Simple estimation: €1.5 per ton as average
    return quantity * 1.5;
  }

  /**
   * Generate warnings based on profit metrics
   */
  private generateWarnings(profitMargin: number, profit: number): string[] {
    const warnings: string[] = [];

    if (profitMargin < this.MIN_PROFIT_MARGIN) {
      warnings.push(
        `Profit margin ${profitMargin.toFixed(2)}% is below minimum ${this.MIN_PROFIT_MARGIN}%`,
      );
    }

    if (profitMargin < this.TARGET_PROFIT_MARGIN) {
      warnings.push(
        `Profit margin ${profitMargin.toFixed(2)}% is below target ${this.TARGET_PROFIT_MARGIN}%`,
      );
    }

    if (profit < 0) {
      warnings.push(`Negative profit of €${Math.abs(profit).toFixed(2)}`);
    }

    return warnings;
  }

  /**
   * Save profit estimation for future reference
   */
  private async saveEstimation(
    tradeOperationId: string,
    data: {
      buyerPrice: number;
      sellerPrices: Array<{
        sellerId: string;
        price: number;
        quantity: number;
      }>;
      estimatedProfit: number;
      profitMargin: number;
    },
  ): Promise<void> {
    await this.prisma.profitEstimation.create({
      data: {
        tradeOperationId,
        proposedBuyerPrice: data.buyerPrice,
        proposedSellerPrices: data.sellerPrices,
        estimatedRevenue:
          data.buyerPrice *
          data.sellerPrices.reduce((sum, s) => sum + s.quantity, 0),
        estimatedPurchaseCost: data.sellerPrices.reduce(
          (sum, s) => sum + s.price * s.quantity,
          0,
        ),
        estimatedTransportCost: 0, // Should be calculated properly
        estimatedProfit: data.estimatedProfit,
        profitMargin: data.profitMargin,
        createdBy: "system", // Should be actual admin ID in production
      },
    });
  }
}
