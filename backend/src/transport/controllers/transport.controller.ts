import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  BadRequestException,
  Request,
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
import { UserRole, TruckType } from '@prisma/client';
import { TransportCostService } from '../services/transport-cost.service';
import { RouteOptimizationService } from '../services/route-optimization.service';
import { TransportCostSettingsService } from '../services/transport-settings.service';
import {
  TransportEstimationRequestDto,
  RouteOptimizationRequestDto,
  TransportEstimationResponseDto,
  RouteOptimizationResponseDto,
} from '../dto/transport-estimation.dto';

@ApiTags('Transport')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('transport')
export class TransportController {
  constructor(
    private readonly transportCostService: TransportCostService,
    private readonly routeOptimizationService: RouteOptimizationService,
    private readonly transportSettingsService: TransportCostSettingsService,
  ) {}

  @Post('estimate')
  @Roles(UserRole.ADMIN, UserRole.TRANSPORTER)
  @ApiOperation({ summary: 'Estimate transport cost for a route' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transport cost estimation',
    type: TransportEstimationResponseDto,
  })
  async estimateCost(
    @Body() estimationDto: TransportEstimationRequestDto,
  ): Promise<TransportEstimationResponseDto> {
    const estimation = await this.transportCostService.estimateCost(
      estimationDto.pickupPoints,
      estimationDto.deliveryPoint,
      {
        vehicleType: estimationDto.vehicleType,
        urgency: estimationDto.urgency,
        includeAlternatives: estimationDto.includeAlternatives,
      },
    );

    // Add alternatives if requested
    if (estimationDto.includeAlternatives) {
      const alternatives = await this.calculateAlternatives(
        estimationDto,
        estimation.totalCost,
      );
      return { ...estimation, alternatives };
    }

    return estimation;
  }

  @Post('optimize-route')
  @Roles(UserRole.ADMIN, UserRole.TRANSPORTER)
  @ApiOperation({ summary: 'Optimize transport route for multiple pickups' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Optimized route details',
    type: RouteOptimizationResponseDto,
  })
  async optimizeRoute(
    @Body() optimizationDto: RouteOptimizationRequestDto,
  ): Promise<RouteOptimizationResponseDto> {
    // Map pickups to ensure they have IDs
    const pickupsWithIds = optimizationDto.pickups.map((p, index) => ({
      ...p,
      id: p.id || `pickup-${index}`,
    }));
    
    const result = await this.routeOptimizationService.optimizeRoute(
      optimizationDto.warehouseLocation,
      pickupsWithIds,
      optimizationDto.deliveryLocation,
      optimizationDto.algorithm || 'tsp_2opt',
      {
        maxDistance: optimizationDto.maxDistance,
        maxDuration: optimizationDto.maxDuration,
        priorityPickupsFirst: optimizationDto.priorityPickupsFirst,
        vehicleCapacity: optimizationDto.vehicleCapacity,
      },
    );

    // Check for multi-trip requirement
    let multiTripSuggestion;
    if (optimizationDto.vehicleCapacity) {
      const suggestion = this.routeOptimizationService.handleCapacityConstraints(
        pickupsWithIds,
        optimizationDto.vehicleCapacity,
      );
      
      if (suggestion) {
        multiTripSuggestion = {
          requiredTrips: suggestion.requiredTrips,
          trips: suggestion.trips.map(t => ({
            tripNumber: t.tripNumber,
            totalQuantity: t.totalQuantity,
            distance: t.distance,
          })),
        };
      }
    }

    return {
      ...result,
      multiTripSuggestion,
    };
  }

  @Get('settings')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get current transport cost settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Current transport cost settings',
  })
  async getSettings(): Promise<any> {
    const settings = await this.transportSettingsService.getActiveSettings();
    
    return {
      id: settings.id,
      baseRatePerKm: settings.baseRatePerKm?.toNumber(),
      vehicleMultipliers: {
        FLATBED: settings.flatbedMultiplier,
        REFRIGERATED: settings.refrigeratedMultiplier,
        TANKER: settings.tankerMultiplier,
        CONTAINER: settings.containerMultiplier,
        CURTAIN_SIDE: 1.05,
        BOX_TRUCK: 1.0,
        OTHER: 1.0,
      },
      distanceTiers: [
        { minKm: 0, maxKm: settings.tier1MaxKm, ratePerKm: settings.tier1Rate?.toNumber() },
        { minKm: settings.tier1MaxKm, maxKm: settings.tier2MaxKm, ratePerKm: settings.tier2Rate?.toNumber() },
        { minKm: settings.tier2MaxKm, maxKm: null, ratePerKm: settings.tier3Rate?.toNumber() },
      ],
      loadingCostPerTon: settings.loadingCostPerTon?.toNumber(),
      urgencySurcharge: settings.urgencySurcharge,
      bulkDiscountThreshold: 100, // default value
      bulkDiscountRate: 0.1, // default value
      isActive: settings.isActive,
      effectiveFrom: settings.effectiveFrom,
    };
  }

  @Put('settings')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update transport cost settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Settings updated successfully',
  })
  async updateSettings(
    @Body() settingsDto: any,
    @Request() req: any,
  ): Promise<any> {
    const updatedSettings = await this.transportSettingsService.updateSettings(
      settingsDto,
      req.user.id,
      settingsDto.changeReason || 'Manual update',
    );

    return {
      message: 'Transport settings updated successfully',
      settings: {
        id: updatedSettings.id,
        baseRatePerKm: updatedSettings.baseRatePerKm?.toNumber(),
        effectiveFrom: updatedSettings.effectiveFrom,
      },
    };
  }

  @Get('settings/history')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get transport settings history' })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 10 })
  @ApiQuery({ name: 'offset', type: Number, required: false, example: 0 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Settings history',
  })
  async getSettingsHistory(
    @Query('limit') limit = '10',
    @Query('offset') offset = '0',
  ): Promise<any> {
    const history = await this.transportSettingsService.getSettingsHistory(
      parseInt(limit),
      parseInt(offset),
    );

    return {
      data: history,
      total: history.length,
    };
  }

  @Post('settings/compare')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Compare impact of new transport settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Settings comparison results',
  })
  async compareSettings(
    @Body() body: {
      newSettings: any;
      sampleRoutes: Array<{
        distance: number;
        quantity: number;
        vehicleType: TruckType;
        isUrgent: boolean;
      }>;
    },
  ): Promise<any> {
    const comparison = await this.transportSettingsService.compareSettingsImpact(
      body.newSettings,
      body.sampleRoutes,
    );

    return comparison;
  }

  @Post('settings/optimize')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Optimize transport settings for target margin' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Optimized settings',
  })
  async optimizeSettings(
    @Body() body: {
      targetMargin: number;
      currentAverageMargin: number;
      constraints?: {
        maxBaseRate?: number;
        minBulkDiscount?: number;
        maxUrgencySurcharge?: number;
      };
    },
  ): Promise<any> {
    const optimized = await this.transportSettingsService.optimizeForMargin(
      body.targetMargin,
      body.currentAverageMargin,
      body.constraints,
    );

    return {
      message: 'Settings optimized for target margin',
      optimizedSettings: optimized,
      expectedImpact: {
        targetMargin: body.targetMargin,
        currentMargin: body.currentAverageMargin,
        marginIncrease: body.targetMargin - body.currentAverageMargin,
      },
    };
  }

  @Get('cost-breakdown')
  @Roles(UserRole.ADMIN, UserRole.TRANSPORTER)
  @ApiOperation({ summary: 'Get detailed cost breakdown for a route' })
  @ApiQuery({ name: 'distance', type: Number, required: true })
  @ApiQuery({ name: 'quantity', type: Number, required: true })
  @ApiQuery({ name: 'vehicleType', enum: TruckType, required: true })
  @ApiQuery({ name: 'isUrgent', type: Boolean, required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Detailed cost breakdown',
  })
  async getCostBreakdown(
    @Query('distance') distance: string,
    @Query('quantity') quantity: string,
    @Query('vehicleType') vehicleType: TruckType,
    @Query('isUrgent') isUrgent?: string,
  ): Promise<any> {
    if (!distance || !quantity || !vehicleType) {
      throw new BadRequestException(
        'distance, quantity, and vehicleType are required',
      );
    }

    const breakdown = await this.transportSettingsService.calculateCostBreakdown(
      parseFloat(distance),
      parseFloat(quantity),
      vehicleType,
      isUrgent === 'true',
    );

    return {
      inputs: {
        distance: parseFloat(distance),
        quantity: parseFloat(quantity),
        vehicleType,
        isUrgent: isUrgent === 'true',
      },
      breakdown,
      summary: {
        totalCost: breakdown.totalCost,
        costPerKm: breakdown.totalCost / parseFloat(distance),
        costPerTon: breakdown.totalCost / parseFloat(quantity),
      },
    };
  }

  @Get('settings/export')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Export transport settings as JSON' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Settings exported as JSON',
  })
  async exportSettings(): Promise<any> {
    const json = await this.transportSettingsService.exportSettings();
    return {
      data: JSON.parse(json),
      exportedAt: new Date().toISOString(),
    };
  }

  @Post('settings/import')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Import transport settings from JSON' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Settings imported successfully',
  })
  async importSettings(
    @Body() jsonData: any,
    @Request() req: any,
  ): Promise<any> {
    const imported = await this.transportSettingsService.importSettings(
      JSON.stringify(jsonData),
      req.user.id,
    );

    return {
      message: 'Settings imported successfully',
      settings: {
        id: imported.id,
        effectiveFrom: imported.effectiveFrom,
      },
    };
  }

  @Post('clear-cache')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Clear transport cost cache' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cache cleared',
  })
  async clearCache(): Promise<any> {
    this.transportCostService.clearCache();
    return {
      message: 'Transport cost cache cleared successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Calculate alternative vehicle costs
   */
  private async calculateAlternatives(
    estimationDto: TransportEstimationRequestDto,
    baseCost: number,
  ): Promise<any[]> {
    const vehicleTypes: TruckType[] = [
      'FLATBED',
      'REFRIGERATED',
      'TANKER',
      'CONTAINER',
      'CURTAIN_SIDE',
      'BOX_TRUCK',
    ];

    const alternatives = [];
    
    for (const type of vehicleTypes) {
      if (type === estimationDto.vehicleType) continue;
      
      const estimation = await this.transportCostService.estimateCost(
        estimationDto.pickupPoints,
        estimationDto.deliveryPoint,
        {
          vehicleType: type,
          urgency: estimationDto.urgency,
        },
      );

      alternatives.push({
        vehicleType: type,
        cost: estimation.totalCost,
        difference: estimation.totalCost - baseCost,
      });
    }

    return alternatives.sort((a, b) => a.cost - b.cost);
  }
}