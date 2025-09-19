import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ProfitCalculationService } from '../services/profit-calculation.service';
import {
  ProfitCalculationRequestDto,
  ProfitEstimationDto,
  ProfitCalculationResponseDto,
  ProfitEstimationResponseDto,
  ProfitComparisonDto,
} from '../dto/profit-calculation.dto';

@ApiTags('Profit Calculations')
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard, RolesGuard) // Temporarily disabled for testing
@Controller('profit')
export class ProfitController {
  constructor(
    private readonly profitCalculationService: ProfitCalculationService,
  ) {}

  @Get(':id/profit')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Calculate real-time profit for a trade operation' })
  @ApiParam({ name: 'id', description: 'Trade operation ID' })
  @ApiQuery({ name: 'includeSensitivity', type: Boolean, required: false })
  @ApiQuery({ name: 'includeRiskAssessment', type: Boolean, required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profit calculation details',
    type: ProfitCalculationResponseDto,
  })
  async calculateProfit(
    @Param('id') tradeOperationId: string,
    @Query('includeSensitivity') includeSensitivity?: string,
    @Query('includeRiskAssessment') includeRiskAssessment?: string,
  ): Promise<ProfitCalculationResponseDto> {
    const profitCalc = await this.profitCalculationService.calculateProfit(
      tradeOperationId,
    );

    const response: ProfitCalculationResponseDto = {
      tradeOperationId,
      revenue: {
        ...profitCalc.revenue,
        currency: profitCalc.profit.currency || 'EUR',
      },
      costs: profitCalc.costs,
      profit: {
        ...profitCalc.profit,
        meetsMinimumMargin: this.profitCalculationService.validateMinimumMargin(
          profitCalc.profit.profitMargin,
        ),
        meetsTargetMargin: profitCalc.profit.profitMargin >= 7,
      },
      status: profitCalc.status,
    };

    // Add sensitivity analysis if requested
    if (includeSensitivity === 'true') {
      response.sensitivity = await this.calculateSensitivity(
        tradeOperationId,
        profitCalc,
      );
    }

    // Add risk assessment if requested
    if (includeRiskAssessment === 'true') {
      response.riskAssessment = this.assessRisk(profitCalc);
    }

    return response;
  }

  @Post(':id/profit/estimate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Estimate profit with proposed prices' })
  @ApiParam({ name: 'id', description: 'Trade operation ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profit estimation results',
    type: ProfitEstimationResponseDto,
  })
  async estimateProfit(
    @Param('id') tradeOperationId: string,
    @Body() estimationDto: Omit<ProfitEstimationDto, 'tradeOperationId'>,
  ): Promise<ProfitEstimationResponseDto> {
    const estimate = await this.profitCalculationService.estimateProfit(
      tradeOperationId,
      {
        buyerPrice: estimationDto.buyerPrice,
        sellerPrices: estimationDto.sellerPrices,
        transportCost: estimationDto.transportCost,
        saveEstimation: estimationDto.saveEstimation,
      },
    );

    return estimate;
  }

  @Get(':id/profit/history')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get profit estimation history for a trade' })
  @ApiParam({ name: 'id', description: 'Trade operation ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of profit estimations',
    type: 'array',
  })
  async getProfitHistory(
    @Param('id') tradeOperationId: string,
  ): Promise<any[]> {
    const history = await this.profitCalculationService.trackProfitHistory(
      tradeOperationId,
    );

    return history.map(estimation => ({
      id: estimation.id,
      buyerPrice: estimation.proposedBuyerPrice?.toNumber(),
      sellerPrices: estimation.proposedSellerPrices,
      estimatedRevenue: estimation.estimatedRevenue?.toNumber(),
      estimatedCosts: estimation.estimatedPurchaseCost?.toNumber(),
      estimatedProfit: estimation.estimatedProfit?.toNumber(),
      profitMargin: estimation.profitMargin,
      createdBy: estimation.createdBy,
      createdAt: estimation.createdAt,
    }));
  }

  @Post(':id/profit/compare')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Compare current profit with proposed changes' })
  @ApiParam({ name: 'id', description: 'Trade operation ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profit comparison',
    type: ProfitComparisonDto,
  })
  async compareProfit(
    @Param('id') tradeOperationId: string,
    @Body() proposedChanges: {
      buyerPrice?: number;
      sellerPrices?: Array<{ sellerId: string; price: number; quantity: number }>;
      transportCost?: number;
    },
  ): Promise<ProfitComparisonDto> {
    // Get current profit
    const currentProfit = await this.profitCalculationService.calculateProfit(
      tradeOperationId,
    );

    // Estimate with proposed changes
    const proposedEstimate = await this.profitCalculationService.estimateProfit(
      tradeOperationId,
      {
        buyerPrice: proposedChanges.buyerPrice || currentProfit.revenue.sellingPrice,
        sellerPrices: proposedChanges.sellerPrices || 
          currentProfit.costs.purchases.breakdown.map(b => ({
            sellerId: b.sellerId,
            price: b.price,
            quantity: b.quantity,
          })),
        transportCost: proposedChanges.transportCost || 
          currentProfit.costs.transport.estimatedCost,
      },
    );

    const profitDifference = proposedEstimate.estimatedProfit - currentProfit.profit.netProfit;
    const marginDifference = proposedEstimate.profitMargin - currentProfit.profit.profitMargin;

    return {
      current: {
        profit: currentProfit.profit.netProfit,
        margin: currentProfit.profit.profitMargin,
      },
      proposed: {
        profit: proposedEstimate.estimatedProfit,
        margin: proposedEstimate.profitMargin,
      },
      profitDifference,
      marginDifference,
      trend: profitDifference > 0 ? 'INCREASE' : 
             profitDifference < 0 ? 'DECREASE' : 
             'NO_CHANGE',
    };
  }

  @Post('profit/compare-scenarios')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Compare profit across multiple scenarios' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Scenario comparison results',
  })
  async compareScenarios(
    @Body() scenarios: ProfitEstimationResponseDto[],
  ): Promise<any> {
    const comparison = this.profitCalculationService.compareScenarios(scenarios);

    return {
      ...comparison,
      recommendation: this.generateRecommendation(comparison),
    };
  }

  @Get(':id/profit/impact/:offerId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Calculate profit impact of a specific offer' })
  @ApiParam({ name: 'id', description: 'Trade operation ID' })
  @ApiParam({ name: 'offerId', description: 'Offer ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profit impact analysis',
  })
  async calculateOfferImpact(
    @Param('id') tradeOperationId: string,
    @Param('offerId') offerId: string,
    @Query('offerPrice') offerPrice: string,
    @Query('offerQuantity') offerQuantity: string,
    @Query('offerType') offerType: 'BUYER' | 'SELLER',
  ): Promise<any> {
    if (!offerPrice || !offerQuantity || !offerType) {
      throw new BadRequestException(
        'offerPrice, offerQuantity, and offerType are required',
      );
    }

    const impact = await this.profitCalculationService.calculateProfitImpact(
      tradeOperationId,
      parseFloat(offerPrice),
      parseFloat(offerQuantity),
      offerType,
    );

    return {
      offerId,
      offerType,
      offerPrice: parseFloat(offerPrice),
      offerQuantity: parseFloat(offerQuantity),
      ...impact,
      recommendation: this.getImpactRecommendation(impact),
    };
  }

  @Get(':id/profit/validation')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Validate profit margins meet requirements' })
  @ApiParam({ name: 'id', description: 'Trade operation ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profit validation results',
  })
  async validateProfit(
    @Param('id') tradeOperationId: string,
  ): Promise<any> {
    const profitCalc = await this.profitCalculationService.calculateProfit(
      tradeOperationId,
    );

    const isValid = this.profitCalculationService.validateMinimumMargin(
      profitCalc.profit.profitMargin,
    );

    const warnings = [];
    const recommendations = [];

    if (profitCalc.profit.profitMargin < 5) {
      warnings.push(`Profit margin ${profitCalc.profit.profitMargin.toFixed(2)}% is below minimum 5%`);
      recommendations.push('Negotiate higher selling price or lower purchase prices');
    } else if (profitCalc.profit.profitMargin < 7) {
      warnings.push(`Profit margin ${profitCalc.profit.profitMargin.toFixed(2)}% is below target 7%`);
      recommendations.push('Consider optimizing transport costs or bulk purchases');
    }

    if (profitCalc.costs.transport.estimatedCost > profitCalc.profit.netProfit * 0.2) {
      warnings.push('Transport costs exceed 20% of net profit');
      recommendations.push('Optimize route or consider alternative transport options');
    }

    return {
      isValid,
      currentMargin: profitCalc.profit.profitMargin,
      minimumMargin: 5,
      targetMargin: 7,
      warnings,
      recommendations,
      breakdown: {
        revenue: profitCalc.revenue.totalRevenue,
        purchaseCosts: profitCalc.costs.purchases.totalCost,
        transportCosts: profitCalc.costs.transport.estimatedCost,
        netProfit: profitCalc.profit.netProfit,
      },
    };
  }

  /**
   * Calculate sensitivity analysis
   */
  private async calculateSensitivity(
    tradeOperationId: string,
    currentProfit: any,
  ): Promise<any[]> {
    const priceChanges = [-10, -5, 0, 5, 10]; // Percentage changes
    const sensitivity = [];

    for (const change of priceChanges) {
      const newPrice = currentProfit.revenue.sellingPrice * (1 + change / 100);
      const newRevenue = newPrice * currentProfit.revenue.quantity;
      const newProfit = newRevenue - currentProfit.costs.totalCosts;
      const newMargin = newRevenue > 0 ? (newProfit / newRevenue) * 100 : 0;

      sensitivity.push({
        priceChange: change,
        newMargin: Math.round(newMargin * 100) / 100,
        impact: change === 0 ? 'BASELINE' :
                newMargin >= 7 ? 'FAVORABLE' :
                newMargin >= 5 ? 'ACCEPTABLE' :
                'UNFAVORABLE',
      });
    }

    return sensitivity;
  }

  /**
   * Assess risk based on profit metrics
   */
  private assessRisk(profitCalc: any): any {
    const factors = [];
    const mitigation = [];
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';

    // Check profit margin
    if (profitCalc.profit.profitMargin < 5) {
      factors.push('Profit margin below minimum threshold');
      mitigation.push('Increase selling price or reduce costs');
      riskLevel = 'HIGH';
    } else if (profitCalc.profit.profitMargin < 7) {
      factors.push('Profit margin below target');
      mitigation.push('Optimize pricing strategy');
      if (riskLevel === 'LOW') riskLevel = 'MEDIUM';
    }

    // Check transport cost ratio
    const transportRatio = profitCalc.costs.transport.estimatedCost / profitCalc.revenue.totalRevenue;
    if (transportRatio > 0.15) {
      factors.push('High transport cost ratio');
      mitigation.push('Consider route optimization or bulk shipping');
      if (riskLevel === 'LOW') riskLevel = 'MEDIUM';
    }

    // Check purchase price variance
    const avgPrice = profitCalc.costs.purchases.avgPrice;
    const maxVariance = Math.max(
      ...profitCalc.costs.purchases.breakdown.map(
        (b: any) => Math.abs(b.price - avgPrice) / avgPrice,
      ),
    );
    if (maxVariance > 0.2) {
      factors.push('High price variance among sellers');
      mitigation.push('Standardize pricing agreements');
      if (riskLevel === 'LOW') riskLevel = 'MEDIUM';
    }

    if (factors.length === 0) {
      factors.push('All metrics within acceptable ranges');
      mitigation.push('Continue monitoring profit margins');
    }

    return {
      level: riskLevel,
      factors,
      mitigation,
    };
  }

  /**
   * Generate recommendation based on comparison
   */
  private generateRecommendation(comparison: any): string {
    if (comparison.viableCount === 0) {
      return 'All scenarios are unviable. Consider significant price adjustments.';
    }

    if (comparison.best.profitMargin >= 7) {
      return `Best scenario achieves ${comparison.best.profitMargin}% margin. Proceed with negotiation.`;
    }

    if (comparison.average >= 5) {
      return `Average margin of ${comparison.average}% is acceptable but below target. Look for optimization opportunities.`;
    }

    return 'Most scenarios have low margins. Review cost structure and pricing strategy.';
  }

  /**
   * Get recommendation based on profit impact
   */
  private getImpactRecommendation(impact: any): string {
    if (impact.warning) {
      return `Warning: ${impact.warning}. Consider alternative offers.`;
    }

    if (impact.profitMargin >= 7) {
      return 'Accept offer - meets target profit margin.';
    }

    if (impact.profitMargin >= 5) {
      return 'Consider accepting - meets minimum profit margin.';
    }

    return 'Reject offer - profit margin too low.';
  }
}