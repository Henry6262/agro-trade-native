import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ProfitCalculationService } from "./profit-calculation.service";
import { TransportCostService } from "../../transport/services/transport-cost.service";
import { TradeOperation, BuyListing, SaleListing } from "@prisma/client";

export interface PriceScenario {
  id: string;
  buyerPrice: number;
  sellerPrices: Array<{
    sellerId: string;
    sellerName: string;
    price: number;
    quantity: number;
    quality: string;
  }>;
  transportCost: number;
  estimatedProfit: number;
  profitMargin: number;
  totalRevenue: number;
  totalCosts: number;
  viability: "HIGH" | "MEDIUM" | "LOW" | "UNVIABLE";
  acceptanceProbability: number;
  rank: number;
}

export interface ScenarioGenerationParams {
  tradeOperationId: string;
  priceVariance?: number; // Percentage variance from base price (e.g., 0.1 = 10%)
  scenarioCount?: number;
  includeQualityFactors?: boolean;
  includeTransportVariations?: boolean;
  minProfitMargin?: number;
}

export interface ScenarioAnalysis {
  scenarios: PriceScenario[];
  optimal: PriceScenario;
  statistics: {
    averageMargin: number;
    medianMargin: number;
    viableCount: number;
    unviableCount: number;
    maxProfit: number;
    minProfit: number;
    riskLevel: "LOW" | "MEDIUM" | "HIGH";
  };
  recommendations: string[];
}

export interface SensitivityAnalysis {
  pricePoints: Array<{
    buyerPrice: number;
    profitMargin: number;
    viability: boolean;
  }>;
  breakEvenPrice: number;
  targetMarginPrice: number;
  maxAcceptablePrice: number;
  elasticity: number;
}

export interface QualityPriceMatrix {
  quality: string;
  priceMultiplier: number;
  acceptanceRate: number;
}

@Injectable()
export class PriceScenarioService {
  private readonly logger = new Logger(PriceScenarioService.name);
  private readonly MIN_PROFIT_MARGIN = 5;
  private readonly TARGET_PROFIT_MARGIN = 7;
  private readonly MAX_PROFIT_MARGIN = 15;

  private readonly QUALITY_MULTIPLIERS: QualityPriceMatrix[] = [
    { quality: "PREMIUM", priceMultiplier: 1.15, acceptanceRate: 0.7 },
    { quality: "STANDARD", priceMultiplier: 1.0, acceptanceRate: 0.85 },
    { quality: "ECONOMY", priceMultiplier: 0.85, acceptanceRate: 0.95 },
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly profitCalculationService: ProfitCalculationService,
    private readonly transportCostService: TransportCostService,
  ) {}

  /**
   * Generate multiple pricing scenarios
   */
  async generateScenarios(
    params: ScenarioGenerationParams,
  ): Promise<ScenarioAnalysis> {
    const {
      tradeOperationId,
      priceVariance = 0.1,
      scenarioCount = 10,
      includeQualityFactors = true,
      includeTransportVariations = true,
      minProfitMargin = this.MIN_PROFIT_MARGIN,
    } = params;

    // Get trade operation data
    const trade = await this.getTradeOperation(tradeOperationId);
    if (!trade) {
      throw new Error(`Trade operation ${tradeOperationId} not found`);
    }

    // Get available sellers
    const availableSellers = await this.getAvailableSellers(trade.buyListing);

    // Generate scenarios
    const scenarios: PriceScenario[] = [];

    for (let i = 0; i < scenarioCount; i++) {
      const scenario = await this.generateSingleScenario(
        trade,
        availableSellers,
        priceVariance,
        includeQualityFactors,
        includeTransportVariations,
        i,
      );
      scenarios.push(scenario);
    }

    // Sort and rank scenarios
    const rankedScenarios = this.rankScenarios(scenarios, minProfitMargin);

    // Find optimal scenario
    const optimal = this.findOptimalScenario(rankedScenarios);

    // Calculate statistics
    const statistics = this.calculateStatistics(rankedScenarios);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      rankedScenarios,
      statistics,
      minProfitMargin,
    );

    return {
      scenarios: rankedScenarios,
      optimal,
      statistics,
      recommendations,
    };
  }

  /**
   * Perform sensitivity analysis
   */
  async performSensitivityAnalysis(
    tradeOperationId: string,
    baseSellerPrices: Array<{
      sellerId: string;
      price: number;
      quantity: number;
    }>,
  ): Promise<SensitivityAnalysis> {
    const trade = await this.getTradeOperation(tradeOperationId);
    if (!trade) {
      throw new Error(`Trade operation ${tradeOperationId} not found`);
    }

    const quantity = trade.buyListing.quantity.toNumber();
    const transportCost =
      trade.estimatedTransportCost?.toNumber() || quantity * 1.5;

    // Calculate total purchase cost
    const totalPurchaseCost = baseSellerPrices.reduce(
      (sum, s) => sum + s.price * s.quantity,
      0,
    );

    // Generate price points for analysis
    const pricePoints: SensitivityAnalysis["pricePoints"] = [];
    const minPrice = trade.buyListing.minPricePerUnit?.toNumber() || 300;
    const maxPrice = trade.buyListing.maxPricePerUnit.toNumber();
    const step = (maxPrice - minPrice) / 20;

    for (let price = minPrice; price <= maxPrice; price += step) {
      const revenue = price * quantity;
      const profit = revenue - totalPurchaseCost - transportCost;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

      pricePoints.push({
        buyerPrice: Math.round(price * 100) / 100,
        profitMargin: Math.round(margin * 100) / 100,
        viability: margin >= this.MIN_PROFIT_MARGIN,
      });
    }

    // Calculate key price points
    const breakEvenPrice = (totalPurchaseCost + transportCost) / quantity;
    const targetMarginPrice =
      (totalPurchaseCost + transportCost) /
      (quantity * (1 - this.TARGET_PROFIT_MARGIN / 100));
    const maxAcceptablePrice = maxPrice;

    // Calculate price elasticity
    const elasticity = this.calculatePriceElasticity(pricePoints);

    return {
      pricePoints,
      breakEvenPrice: Math.round(breakEvenPrice * 100) / 100,
      targetMarginPrice: Math.round(targetMarginPrice * 100) / 100,
      maxAcceptablePrice,
      elasticity,
    };
  }

  /**
   * Generate a single scenario
   */
  private async generateSingleScenario(
    trade: any,
    availableSellers: any[],
    priceVariance: number,
    includeQualityFactors: boolean,
    includeTransportVariations: boolean,
    scenarioIndex: number,
  ): Promise<PriceScenario> {
    const quantity = trade.buyListing.quantity.toNumber();
    const basePrice = trade.buyListing.maxPricePerUnit.toNumber();

    // Generate buyer price with variance
    const buyerPriceVariance = (Math.random() - 0.5) * 2 * priceVariance;
    let buyerPrice = basePrice * (1 + buyerPriceVariance);

    // Apply quality factor if enabled
    if (includeQualityFactors) {
      const qualityFactor =
        this.QUALITY_MULTIPLIERS[
          Math.floor(Math.random() * this.QUALITY_MULTIPLIERS.length)
        ];
      buyerPrice *= qualityFactor.priceMultiplier;
    }

    // Select and price sellers
    const selectedSellers = this.selectSellersForScenario(
      availableSellers,
      quantity,
      priceVariance,
    );

    // Calculate transport cost with variations
    let transportCost =
      trade.estimatedTransportCost?.toNumber() || quantity * 1.5;
    if (includeTransportVariations) {
      const transportVariance = (Math.random() - 0.5) * 0.2; // ±10% variance
      transportCost *= 1 + transportVariance;
    }

    // Calculate profit metrics
    const totalRevenue = buyerPrice * quantity;
    const purchaseCost = selectedSellers.reduce(
      (sum, s) => sum + s.price * s.quantity,
      0,
    );
    const totalCosts = purchaseCost + transportCost;
    const estimatedProfit = totalRevenue - totalCosts;
    const profitMargin =
      totalRevenue > 0 ? (estimatedProfit / totalRevenue) * 100 : 0;

    // Determine viability
    const viability = this.determineViability(profitMargin);

    // Calculate acceptance probability
    const acceptanceProbability = this.calculateAcceptanceProbability(
      buyerPrice,
      basePrice,
      selectedSellers,
      profitMargin,
    );

    return {
      id: `scenario_${scenarioIndex + 1}`,
      buyerPrice: Math.round(buyerPrice * 100) / 100,
      sellerPrices: selectedSellers,
      transportCost: Math.round(transportCost * 100) / 100,
      estimatedProfit: Math.round(estimatedProfit * 100) / 100,
      profitMargin: Math.round(profitMargin * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalCosts: Math.round(totalCosts * 100) / 100,
      viability,
      acceptanceProbability: Math.round(acceptanceProbability * 100) / 100,
      rank: 0, // Will be set during ranking
    };
  }

  /**
   * Select sellers for a scenario
   */
  private selectSellersForScenario(
    availableSellers: any[],
    requiredQuantity: number,
    priceVariance: number,
  ): PriceScenario["sellerPrices"] {
    const selected: PriceScenario["sellerPrices"] = [];
    let remainingQuantity = requiredQuantity;

    // Shuffle sellers for variety
    const shuffled = [...availableSellers].sort(() => Math.random() - 0.5);

    for (const seller of shuffled) {
      if (remainingQuantity <= 0) break;

      const availableQty = seller.quantity.toNumber();
      const basePrice = seller.askingPrice.toNumber();

      // Apply price variance
      const variance = (Math.random() - 0.5) * 2 * priceVariance;
      const price = basePrice * (1 + variance);

      const quantity = Math.min(availableQty, remainingQuantity);

      selected.push({
        sellerId: seller.sellerId,
        sellerName: seller.seller.name || `Seller ${seller.sellerId.slice(-4)}`,
        price: Math.round(price * 100) / 100,
        quantity,
        quality: seller.quality || "STANDARD",
      });

      remainingQuantity -= quantity;
    }

    return selected;
  }

  /**
   * Rank scenarios by profitability and viability
   */
  private rankScenarios(
    scenarios: PriceScenario[],
    minProfitMargin: number,
  ): PriceScenario[] {
    return scenarios
      .map((scenario) => {
        // Calculate score based on multiple factors
        let score = 0;

        // Profit margin weight (40%)
        score += (scenario.profitMargin / 100) * 40;

        // Acceptance probability weight (30%)
        score += scenario.acceptanceProbability * 0.3;

        // Viability weight (20%)
        const viabilityScore = {
          HIGH: 20,
          MEDIUM: 15,
          LOW: 10,
          UNVIABLE: 0,
        };
        score += viabilityScore[scenario.viability];

        // Absolute profit weight (10%)
        const maxProfit = Math.max(...scenarios.map((s) => s.estimatedProfit));
        score += (scenario.estimatedProfit / maxProfit) * 10;

        return { ...scenario, score };
      })
      .sort((a, b) => b.score - a.score)
      .map((scenario, index) => ({
        ...scenario,
        rank: index + 1,
      }));
  }

  /**
   * Find optimal scenario
   */
  private findOptimalScenario(scenarios: PriceScenario[]): PriceScenario {
    // Find scenario closest to target margin with high acceptance probability
    const targetScenarios = scenarios.filter(
      (s) =>
        s.profitMargin >= this.TARGET_PROFIT_MARGIN &&
        s.profitMargin <= this.MAX_PROFIT_MARGIN &&
        s.acceptanceProbability >= 70,
    );

    if (targetScenarios.length > 0) {
      return targetScenarios[0]; // Already sorted by rank
    }

    // Fallback to highest viable scenario
    const viableScenarios = scenarios.filter((s) => s.viability !== "UNVIABLE");
    return viableScenarios[0] || scenarios[0];
  }

  /**
   * Calculate statistics for scenarios
   */
  private calculateStatistics(
    scenarios: PriceScenario[],
  ): ScenarioAnalysis["statistics"] {
    const margins = scenarios.map((s) => s.profitMargin);
    const profits = scenarios.map((s) => s.estimatedProfit);

    const viableCount = scenarios.filter(
      (s) => s.viability !== "UNVIABLE",
    ).length;
    const unviableCount = scenarios.length - viableCount;

    // Calculate average and median
    const averageMargin =
      margins.reduce((sum, m) => sum + m, 0) / margins.length;
    const sortedMargins = [...margins].sort((a, b) => a - b);
    const medianMargin = sortedMargins[Math.floor(sortedMargins.length / 2)];

    // Determine risk level
    let riskLevel: "LOW" | "MEDIUM" | "HIGH";
    if (viableCount >= scenarios.length * 0.7) {
      riskLevel = "LOW";
    } else if (viableCount >= scenarios.length * 0.4) {
      riskLevel = "MEDIUM";
    } else {
      riskLevel = "HIGH";
    }

    return {
      averageMargin: Math.round(averageMargin * 100) / 100,
      medianMargin: Math.round(medianMargin * 100) / 100,
      viableCount,
      unviableCount,
      maxProfit: Math.max(...profits),
      minProfit: Math.min(...profits),
      riskLevel,
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    scenarios: PriceScenario[],
    statistics: ScenarioAnalysis["statistics"],
    minProfitMargin: number,
  ): string[] {
    const recommendations: string[] = [];

    // Risk assessment
    if (statistics.riskLevel === "HIGH") {
      recommendations.push(
        "High risk: Most scenarios are unviable. Consider adjusting price expectations or finding lower-cost suppliers.",
      );
    }

    // Margin recommendations
    if (statistics.averageMargin < minProfitMargin) {
      recommendations.push(
        `Average margin ${statistics.averageMargin}% is below minimum ${minProfitMargin}%. Negotiate better prices.`,
      );
    } else if (statistics.averageMargin < this.TARGET_PROFIT_MARGIN) {
      recommendations.push(
        `Average margin ${statistics.averageMargin}% is below target ${this.TARGET_PROFIT_MARGIN}%. Room for improvement.`,
      );
    }

    // Optimal scenario recommendation
    const optimal = scenarios.find((s) => s.rank === 1);
    if (optimal && optimal.viability === "HIGH") {
      recommendations.push(
        `Optimal scenario offers ${optimal.profitMargin}% margin with ${optimal.acceptanceProbability}% acceptance probability.`,
      );
    }

    // Transport optimization
    const avgTransportCost =
      scenarios.reduce((sum, s) => sum + s.transportCost, 0) / scenarios.length;
    const avgRevenue =
      scenarios.reduce((sum, s) => sum + s.totalRevenue, 0) / scenarios.length;
    const transportPercentage = (avgTransportCost / avgRevenue) * 100;

    if (transportPercentage > 10) {
      recommendations.push(
        `Transport costs represent ${transportPercentage.toFixed(1)}% of revenue. Consider route optimization.`,
      );
    }

    // Quality vs price analysis
    const premiumScenarios = scenarios.filter((s) =>
      s.sellerPrices.some((sp) => sp.quality === "PREMIUM"),
    );
    if (premiumScenarios.length > 0) {
      const avgPremiumMargin =
        premiumScenarios.reduce((sum, s) => sum + s.profitMargin, 0) /
        premiumScenarios.length;
      if (avgPremiumMargin > statistics.averageMargin) {
        recommendations.push(
          "Premium quality products yield higher margins. Consider targeting quality-conscious buyers.",
        );
      }
    }

    return recommendations;
  }

  /**
   * Determine viability level
   */
  private determineViability(profitMargin: number): PriceScenario["viability"] {
    if (profitMargin >= this.TARGET_PROFIT_MARGIN) {
      return "HIGH";
    } else if (profitMargin >= this.MIN_PROFIT_MARGIN) {
      return "MEDIUM";
    } else if (profitMargin > 0) {
      return "LOW";
    } else {
      return "UNVIABLE";
    }
  }

  /**
   * Calculate acceptance probability
   */
  private calculateAcceptanceProbability(
    buyerPrice: number,
    maxBuyerPrice: number,
    sellers: PriceScenario["sellerPrices"],
    profitMargin: number,
  ): number {
    let probability = 100;

    // Buyer acceptance based on price
    const buyerPriceRatio = buyerPrice / maxBuyerPrice;
    if (buyerPriceRatio > 1) {
      probability *= Math.exp(-2 * (buyerPriceRatio - 1)); // Exponential decay
    } else {
      probability *= 1 - (1 - buyerPriceRatio) * 0.3; // Linear increase
    }

    // Seller acceptance based on their asking prices
    for (const seller of sellers) {
      // Assume sellers more likely to accept higher prices
      const sellerAcceptance = Math.min(100, 70 + (seller.price / 100) * 5);
      probability *= sellerAcceptance / 100;
    }

    // Adjust for profit margin
    if (profitMargin < this.MIN_PROFIT_MARGIN) {
      probability *= 0.5; // Low probability if below minimum margin
    }

    return Math.max(0, Math.min(100, probability));
  }

  /**
   * Calculate price elasticity
   */
  private calculatePriceElasticity(
    pricePoints: SensitivityAnalysis["pricePoints"],
  ): number {
    if (pricePoints.length < 2) return 0;

    // Calculate average elasticity using midpoint method
    let totalElasticity = 0;
    let count = 0;

    for (let i = 1; i < pricePoints.length; i++) {
      const p1 = pricePoints[i - 1];
      const p2 = pricePoints[i];

      const priceChange =
        (p2.buyerPrice - p1.buyerPrice) / ((p2.buyerPrice + p1.buyerPrice) / 2);
      const marginChange =
        (p2.profitMargin - p1.profitMargin) /
        ((p2.profitMargin + p1.profitMargin) / 2);

      if (priceChange !== 0) {
        totalElasticity += Math.abs(marginChange / priceChange);
        count++;
      }
    }

    return count > 0 ? totalElasticity / count : 0;
  }

  /**
   * Get trade operation with relations
   */
  private async getTradeOperation(tradeOperationId: string): Promise<any> {
    return await this.prisma.tradeOperation.findUnique({
      where: { id: tradeOperationId },
      include: {
        buyListing: {
          include: {
            buyer: true,
            product: true,
          },
        },
        sellers: {
          include: {
            seller: true,
            saleListing: true,
          },
        },
      },
    });
  }

  /**
   * Get available sellers for the product
   */
  private async getAvailableSellers(buyListing: any): Promise<any[]> {
    return await this.prisma.saleListing.findMany({
      where: {
        productId: buyListing.productId,
        status: "ACTIVE",
        quantity: {
          gt: 0,
        },
      },
      include: {
        seller: true,
      },
      orderBy: {
        askingPrice: "asc",
      },
    });
  }

  /**
   * Compare scenarios between different strategies
   */
  async compareStrategies(
    tradeOperationId: string,
    strategies: Array<{
      name: string;
      params: Partial<ScenarioGenerationParams>;
    }>,
  ): Promise<{
    comparison: Array<{
      strategy: string;
      bestScenario: PriceScenario;
      averageMargin: number;
      viablePercentage: number;
    }>;
    winner: string;
  }> {
    const results = [];

    for (const strategy of strategies) {
      const analysis = await this.generateScenarios({
        tradeOperationId,
        ...strategy.params,
      });

      results.push({
        strategy: strategy.name,
        bestScenario: analysis.optimal,
        averageMargin: analysis.statistics.averageMargin,
        viablePercentage:
          (analysis.statistics.viableCount / analysis.scenarios.length) * 100,
      });
    }

    // Determine winner based on average margin
    const winner = results.reduce((best, current) =>
      current.averageMargin > best.averageMargin ? current : best,
    );

    return {
      comparison: results,
      winner: winner.strategy,
    };
  }
}
