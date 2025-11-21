import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpStatus,
  BadRequestException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { PriceScenarioService } from "../services/price-scenario.service";
import {
  ScenarioGenerationRequestDto,
  ScenarioAnalysisResponseDto,
  SensitivityAnalysisRequestDto,
  SensitivityAnalysisResponseDto,
  StrategyComparisonRequestDto,
  StrategyComparisonResponseDto,
  QuickEstimateDto,
  QuickEstimateResponseDto,
  PriceScenarioDto,
} from "../dto/price-scenario.dto";

@ApiTags("Price Scenarios")
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard, RolesGuard) // Temporarily disabled for testing
@Controller("scenarios")
export class ScenarioController {
  constructor(private readonly priceScenarioService: PriceScenarioService) {}

  @Post("generate")
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: "Generate multiple pricing scenarios for optimal profit",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Generated scenarios with analysis",
    type: ScenarioAnalysisResponseDto,
  })
  async generateScenarios(
    @Body() generationDto: ScenarioGenerationRequestDto,
  ): Promise<ScenarioAnalysisResponseDto> {
    const analysis =
      await this.priceScenarioService.generateScenarios(generationDto);
    return analysis;
  }

  @Post("sensitivity-analysis")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Perform price sensitivity analysis" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Sensitivity analysis results",
    type: SensitivityAnalysisResponseDto,
  })
  async performSensitivityAnalysis(
    @Body() analysisDto: SensitivityAnalysisRequestDto,
  ): Promise<SensitivityAnalysisResponseDto> {
    const analysis = await this.priceScenarioService.performSensitivityAnalysis(
      analysisDto.tradeOperationId,
      analysisDto.baseSellerPrices,
    );

    // Add analysis insights
    const optimalRange = this.calculateOptimalRange(analysis.pricePoints);
    const riskZones = this.identifyRiskZones(analysis.pricePoints);

    return {
      ...analysis,
      analysis: {
        optimalRange,
        riskZones,
      },
    };
  }

  @Post("compare-strategies")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Compare different pricing strategies" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Strategy comparison results",
    type: StrategyComparisonResponseDto,
  })
  async compareStrategies(
    @Body() comparisonDto: StrategyComparisonRequestDto,
  ): Promise<StrategyComparisonResponseDto> {
    const comparison = await this.priceScenarioService.compareStrategies(
      comparisonDto.tradeOperationId,
      comparisonDto.strategies,
    );

    // Add insights
    const insights = this.generateStrategyInsights(comparison.comparison);

    return {
      ...comparison,
      insights,
    };
  }

  @Post("quick-estimate")
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: "Get quick profit estimate without creating trade operation",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Quick estimate results",
    type: QuickEstimateResponseDto,
  })
  async quickEstimate(
    @Body() estimateDto: QuickEstimateDto,
  ): Promise<QuickEstimateResponseDto> {
    const quantity = estimateDto.quantity;
    const revenue = estimateDto.buyerPrice * quantity;
    const purchaseCost = estimateDto.avgSellerPrice * quantity;

    // Estimate transport cost
    const transportDistance = estimateDto.transportDistance || 200;
    const transportCost = transportDistance * 0.15; // Base rate

    const estimatedProfit = revenue - purchaseCost - transportCost;
    const profitMargin = revenue > 0 ? (estimatedProfit / revenue) * 100 : 0;

    // Calculate price guidance
    const minMargin = 5;
    const targetMargin = 7;

    const minSellerPrice = estimateDto.avgSellerPrice * 0.9;
    const maxSellerPrice =
      estimateDto.buyerPrice * (1 - minMargin / 100) - transportCost / quantity;
    const targetSellerPrice =
      estimateDto.buyerPrice * (1 - targetMargin / 100) -
      transportCost / quantity;

    return {
      revenue,
      purchaseCost,
      transportCost,
      estimatedProfit,
      profitMargin: Math.round(profitMargin * 100) / 100,
      isViable: profitMargin >= minMargin,
      priceGuidance: {
        minSellerPrice: Math.round(minSellerPrice * 100) / 100,
        maxSellerPrice: Math.round(maxSellerPrice * 100) / 100,
        targetSellerPrice: Math.round(targetSellerPrice * 100) / 100,
      },
    };
  }

  @Get(":tradeOperationId/scenarios")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Get saved scenarios for a trade operation" })
  @ApiParam({ name: "tradeOperationId", description: "Trade operation ID" })
  @ApiQuery({
    name: "viability",
    enum: ["HIGH", "MEDIUM", "LOW", "UNVIABLE"],
    required: false,
  })
  @ApiQuery({ name: "limit", type: Number, required: false, example: 10 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "List of saved scenarios",
  })
  async getSavedScenarios(
    @Param("tradeOperationId") tradeOperationId: string,
    @Query("viability") viability?: string,
    @Query("limit") limit = "10",
  ): Promise<any> {
    // This would retrieve saved scenarios from the database
    // For now, generate mock data
    const scenarios: PriceScenarioDto[] = [];

    for (let i = 1; i <= parseInt(limit); i++) {
      scenarios.push({
        id: `scenario_${i}`,
        buyerPrice: 370 + i * 2,
        sellerPrices: [
          {
            sellerId: "seller1",
            sellerName: "Farm A",
            price: 340 + i,
            quantity: 50,
            quality: "STANDARD",
          },
          {
            sellerId: "seller2",
            sellerName: "Farm B",
            price: 345 + i,
            quantity: 50,
            quality: "STANDARD",
          },
        ],
        transportCost: 150 + i * 5,
        estimatedProfit: 2000 + i * 100,
        profitMargin: 5 + i * 0.2,
        totalRevenue: 37000 + i * 200,
        totalCosts: 35000 + i * 100,
        viability:
          i <= 3 ? "HIGH" : i <= 6 ? "MEDIUM" : i <= 8 ? "LOW" : "UNVIABLE",
        acceptanceProbability: 90 - i * 5,
        rank: i,
      });
    }

    return {
      tradeOperationId,
      scenarios: viability
        ? scenarios.filter((s) => s.viability === viability)
        : scenarios,
      total: scenarios.length,
    };
  }

  @Get(":tradeOperationId/optimal")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Get the optimal scenario for a trade operation" })
  @ApiParam({ name: "tradeOperationId", description: "Trade operation ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Optimal scenario details",
  })
  async getOptimalScenario(
    @Param("tradeOperationId") tradeOperationId: string,
  ): Promise<any> {
    const analysis = await this.priceScenarioService.generateScenarios({
      tradeOperationId,
      scenarioCount: 20,
      includeQualityFactors: true,
      includeTransportVariations: true,
    });

    return {
      optimal: analysis.optimal,
      reasoning: analysis.recommendations,
      alternativeCount: analysis.scenarios.length - 1,
      betterThanOptimal: analysis.scenarios.filter(
        (s) => s.profitMargin > analysis.optimal.profitMargin,
      ).length,
    };
  }

  @Post(":tradeOperationId/apply-scenario")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Apply a specific scenario to a trade operation" })
  @ApiParam({ name: "tradeOperationId", description: "Trade operation ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Scenario applied successfully",
  })
  async applyScenario(
    @Param("tradeOperationId") tradeOperationId: string,
    @Body() body: { scenarioId: string },
  ): Promise<any> {
    // This would apply the scenario prices to the actual trade operation
    // For now, return a mock response
    return {
      message: "Scenario applied successfully",
      tradeOperationId,
      scenarioId: body.scenarioId,
      appliedAt: new Date(),
      changes: {
        buyerPrice: { old: 370, new: 378 },
        sellerPrices: [
          { sellerId: "seller1", old: 350, new: 345 },
          { sellerId: "seller2", old: 355, new: 348 },
        ],
        estimatedProfit: { old: 2500, new: 2850 },
        profitMargin: { old: 6.5, new: 7.5 },
      },
    };
  }

  @Get("market-analysis")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Get market analysis for pricing decisions" })
  @ApiQuery({ name: "productId", required: true })
  @ApiQuery({ name: "region", required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Market analysis data",
  })
  async getMarketAnalysis(
    @Query("productId") productId: string,
    @Query("region") region?: string,
  ): Promise<any> {
    if (!productId) {
      throw new BadRequestException("productId is required");
    }

    // This would analyze market data for the product
    return {
      productId,
      region: region || "ALL",
      priceRange: {
        min: 320,
        max: 400,
        average: 360,
        median: 355,
      },
      volumeTrends: {
        last7Days: 1500,
        last30Days: 6500,
        trend: "INCREASING",
      },
      competitorPricing: [
        { competitor: "Company A", price: 365, volume: 200 },
        { competitor: "Company B", price: 358, volume: 150 },
        { competitor: "Company C", price: 372, volume: 180 },
      ],
      seasonalFactors: {
        currentSeason: "HIGH_DEMAND",
        priceAdjustment: 1.05,
        nextSeasonChange: "2024-03-01",
      },
      recommendations: [
        "Current market prices support 7-8% profit margins",
        "High demand season - consider premium pricing",
        "Competitor prices allow room for competitive positioning",
      ],
    };
  }

  @Post("batch-analysis")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Analyze multiple trade operations in batch" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Batch analysis results",
  })
  async batchAnalysis(
    @Body() body: { tradeOperationIds: string[] },
  ): Promise<any> {
    const results = [];

    for (const id of body.tradeOperationIds) {
      const analysis = await this.priceScenarioService.generateScenarios({
        tradeOperationId: id,
        scenarioCount: 5,
      });

      results.push({
        tradeOperationId: id,
        optimalScenario: analysis.optimal,
        averageMargin: analysis.statistics.averageMargin,
        viabilityScore:
          analysis.statistics.viableCount / analysis.scenarios.length,
        riskLevel: analysis.statistics.riskLevel,
      });
    }

    return {
      analyzed: results.length,
      results,
      summary: {
        averageMarginAcrossAll:
          results.reduce((sum, r) => sum + r.averageMargin, 0) / results.length,
        highRiskCount: results.filter((r) => r.riskLevel === "HIGH").length,
        allViable: results.every((r) => r.viabilityScore > 0.5),
      },
    };
  }

  /**
   * Calculate optimal price range
   */
  private calculateOptimalRange(pricePoints: any[]): {
    min: number;
    max: number;
  } {
    const viablePoints = pricePoints.filter((p) => p.viability);
    const targetPoints = pricePoints.filter((p) => p.profitMargin >= 7);

    return {
      min: viablePoints.length > 0 ? viablePoints[0].buyerPrice : 0,
      max:
        targetPoints.length > 0
          ? targetPoints[targetPoints.length - 1].buyerPrice
          : viablePoints[viablePoints.length - 1]?.buyerPrice || 0,
    };
  }

  /**
   * Identify risk zones in pricing
   */
  private identifyRiskZones(pricePoints: any[]): any[] {
    const zones = [];
    const minPrice = Math.min(...pricePoints.map((p) => p.buyerPrice));

    // Low risk zone (7%+ margin)
    const highMarginPoints = pricePoints.filter((p) => p.profitMargin >= 7);
    if (highMarginPoints.length > 0) {
      zones.push({
        range: `€${highMarginPoints[0].buyerPrice}-€${highMarginPoints[highMarginPoints.length - 1].buyerPrice}`,
        risk: "LOW" as const,
        description: "Optimal profit zone with target margins",
      });
    }

    // Medium risk zone (5-7% margin)
    const mediumMarginPoints = pricePoints.filter(
      (p) => p.profitMargin >= 5 && p.profitMargin < 7,
    );
    if (mediumMarginPoints.length > 0) {
      zones.push({
        range: `€${mediumMarginPoints[0].buyerPrice}-€${mediumMarginPoints[mediumMarginPoints.length - 1].buyerPrice}`,
        risk: "MEDIUM" as const,
        description: "Acceptable but below target margins",
      });
    }

    // High risk zone (<5% margin)
    const lowMarginPoints = pricePoints.filter((p) => p.profitMargin < 5);
    if (lowMarginPoints.length > 0) {
      zones.push({
        range: `€${minPrice}-€${lowMarginPoints[lowMarginPoints.length - 1].buyerPrice}`,
        risk: "HIGH" as const,
        description: "Below minimum acceptable margins",
      });
    }

    return zones;
  }

  /**
   * Generate strategy insights
   */
  private generateStrategyInsights(comparison: any[]): any {
    const bestForProfit = comparison.reduce((best, current) =>
      current.bestScenario.profitMargin > best.bestScenario.profitMargin
        ? current
        : best,
    );

    const bestForRisk = comparison.reduce((best, current) =>
      current.viablePercentage > best.viablePercentage ? current : best,
    );

    const bestForAcceptance = comparison.reduce((best, current) =>
      current.bestScenario.acceptanceProbability >
      best.bestScenario.acceptanceProbability
        ? current
        : best,
    );

    return {
      bestForProfit: bestForProfit.strategy,
      bestForRisk: bestForRisk.strategy,
      bestForAcceptance: bestForAcceptance.strategy,
    };
  }
}
