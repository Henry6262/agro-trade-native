import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransportCostSettings, TruckType, Prisma } from '@prisma/client';

export interface TransportSettingsDto {
  baseRatePerKm: number;
  vehicleMultipliers: Record<TruckType, number>;
  distanceTiers: Array<{
    minKm: number;
    maxKm: number | null;
    ratePerKm: number;
  }>;
  loadingCostPerTon?: number;
  urgencySurcharge?: number;
  bulkDiscountThreshold?: number;
  bulkDiscountRate?: number;
  fuelSurchargeRate?: number;
  tollEstimatePerKm?: number;
  driverCostPerHour?: number;
  maintenanceCostPerKm?: number;
}

export interface CostBreakdown {
  distance: number;
  baseCost: number;
  vehicleSurcharge: number;
  loadingCost: number;
  urgencySurcharge: number;
  bulkDiscount: number;
  fuelSurcharge: number;
  tollCosts: number;
  driverCosts: number;
  maintenanceCosts: number;
  totalCost: number;
}

export interface SettingsHistory {
  id: string;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  changedBy: string;
  changeReason: string;
  settings: TransportCostSettings;
}

export interface CostComparison {
  currentCost: number;
  proposedCost: number;
  difference: number;
  percentageChange: number;
  impactAnalysis: string[];
}

@Injectable()
export class TransportCostSettingsService {
  private readonly logger = new Logger(TransportCostSettingsService.name);
  private settingsCache: TransportCostSettings | null = null;
  private cacheTimestamp: Date | null = null;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get active transport cost settings
   */
  async getActiveSettings(): Promise<TransportCostSettings> {
    // Check cache
    if (this.settingsCache && this.cacheTimestamp) {
      const cacheAge = Date.now() - this.cacheTimestamp.getTime();
      if (cacheAge < this.CACHE_TTL_MS) {
        return this.settingsCache;
      }
    }

    const settings = await this.prisma.transportCostSettings.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!settings) {
      // Create default settings if none exist
      return await this.createDefaultSettings();
    }

    // Update cache
    this.settingsCache = settings;
    this.cacheTimestamp = new Date();

    return settings;
  }

  /**
   * Update transport cost settings
   */
  async updateSettings(
    settingsDto: TransportSettingsDto,
    updatedBy: string,
    reason: string,
  ): Promise<TransportCostSettings> {
    // Validate settings
    this.validateSettings(settingsDto);

    // Deactivate current settings
    await this.prisma.transportCostSettings.updateMany({
      where: { isActive: true },
      data: {
        isActive: false,
        effectiveTo: new Date(),
      },
    });

    // Create new settings
    const newSettings = await this.prisma.transportCostSettings.create({
      data: {
        baseRatePerKm: settingsDto.baseRatePerKm,
        flatbedMultiplier: settingsDto.vehicleMultipliers?.FLATBED || 1.0,
        refrigeratedMultiplier: settingsDto.vehicleMultipliers?.REFRIGERATED || 1.3,
        tankerMultiplier: settingsDto.vehicleMultipliers?.TANKER || 1.2,
        containerMultiplier: settingsDto.vehicleMultipliers?.CONTAINER || 1.1,
        tier1MaxKm: settingsDto.distanceTiers?.[0]?.maxKm || 50,
        tier1Rate: settingsDto.distanceTiers?.[0]?.ratePerKm || 0.15,
        tier2MaxKm: settingsDto.distanceTiers?.[1]?.maxKm || 200,
        tier2Rate: settingsDto.distanceTiers?.[1]?.ratePerKm || 0.13,
        tier3Rate: settingsDto.distanceTiers?.[2]?.ratePerKm || 0.11,
        loadingCostPerTon: settingsDto.loadingCostPerTon || 0.5,
        urgencySurcharge: settingsDto.urgencySurcharge || 0.3,
        isActive: true,
        effectiveFrom: new Date(),
        // changedBy and changeReason don't exist in schema
      },
    });

    // Clear cache
    this.clearCache();

    // Log the change
    this.logger.log(
      `Transport settings updated by ${updatedBy}. Reason: ${reason}`,
    );

    return newSettings;
  }

  /**
   * Get settings history
   */
  async getSettingsHistory(
    limit: number = 10,
    offset: number = 0,
  ): Promise<SettingsHistory[]> {
    const settings = await this.prisma.transportCostSettings.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return settings.map(s => ({
      id: s.id,
      effectiveFrom: s.effectiveFrom || s.createdAt,
      effectiveTo: s.effectiveTo,
      changedBy: 'System', // field doesn't exist in schema
      changeReason: 'Settings update', // field doesn't exist in schema
      settings: s,
    }));
  }

  /**
   * Calculate cost breakdown with current settings
   */
  async calculateCostBreakdown(
    distance: number,
    quantity: number,
    vehicleType: TruckType,
    isUrgent: boolean = false,
  ): Promise<CostBreakdown> {
    const settings = await this.getActiveSettings();

    // Base distance cost with tiers
    const baseCost = this.calculateTieredDistanceCost(distance, settings);

    // Vehicle surcharge - use the specific multiplier fields
    const vehicleMultiplier = 
      vehicleType === 'FLATBED' ? settings.flatbedMultiplier :
      vehicleType === 'REFRIGERATED' ? settings.refrigeratedMultiplier :
      vehicleType === 'TANKER' ? settings.tankerMultiplier :
      vehicleType === 'CONTAINER' ? settings.containerMultiplier :
      1.0;
    const vehicleSurcharge = baseCost * (vehicleMultiplier - 1);

    // Loading cost
    const loadingCost = quantity * (settings.loadingCostPerTon?.toNumber() || 0.5);

    // Urgency surcharge
    const urgencySurcharge = isUrgent
      ? (baseCost + vehicleSurcharge) * (settings.urgencySurcharge || 0.3)
      : 0;

    // Bulk discount - using default values since not in schema
    const bulkThreshold = 100;
    const bulkRate = 0.1;
    const bulkDiscount = quantity >= bulkThreshold
      ? (baseCost + vehicleSurcharge + loadingCost) * bulkRate
      : 0;

    // Additional costs - set to 0 since not in schema
    const fuelSurcharge = 0;
    const tollCosts = 0;
    const estimatedHours = distance / 60; // Assuming 60 km/h average
    const driverCosts = 0;
    const maintenanceCosts = 0;

    // Total cost
    const totalCost = 
      baseCost +
      vehicleSurcharge +
      loadingCost +
      urgencySurcharge -
      bulkDiscount +
      fuelSurcharge +
      tollCosts +
      driverCosts +
      maintenanceCosts;

    return {
      distance,
      baseCost: Math.round(baseCost * 100) / 100,
      vehicleSurcharge: Math.round(vehicleSurcharge * 100) / 100,
      loadingCost: Math.round(loadingCost * 100) / 100,
      urgencySurcharge: Math.round(urgencySurcharge * 100) / 100,
      bulkDiscount: Math.round(bulkDiscount * 100) / 100,
      fuelSurcharge: Math.round(fuelSurcharge * 100) / 100,
      tollCosts: Math.round(tollCosts * 100) / 100,
      driverCosts: Math.round(driverCosts * 100) / 100,
      maintenanceCosts: Math.round(maintenanceCosts * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
    };
  }

  /**
   * Compare cost impact of new settings
   */
  async compareSettingsImpact(
    newSettings: TransportSettingsDto,
    sampleRoutes: Array<{
      distance: number;
      quantity: number;
      vehicleType: TruckType;
      isUrgent: boolean;
    }>,
  ): Promise<{
    comparisons: CostComparison[];
    averageChange: number;
    recommendation: string;
  }> {
    const currentSettings = await this.getActiveSettings();
    const comparisons: CostComparison[] = [];

    for (const route of sampleRoutes) {
      // Calculate with current settings
      const currentBreakdown = await this.calculateCostBreakdown(
        route.distance,
        route.quantity,
        route.vehicleType,
        route.isUrgent,
      );

      // Calculate with proposed settings (temporarily update cache)
      this.settingsCache = {
        ...currentSettings,
        baseRatePerKm: new Prisma.Decimal(newSettings.baseRatePerKm),
        flatbedMultiplier: newSettings.vehicleMultipliers?.FLATBED || 1.0,
        refrigeratedMultiplier: newSettings.vehicleMultipliers?.REFRIGERATED || 1.3,
        tankerMultiplier: newSettings.vehicleMultipliers?.TANKER || 1.2,
        containerMultiplier: newSettings.vehicleMultipliers?.CONTAINER || 1.1,
        tier1MaxKm: newSettings.distanceTiers?.[0]?.maxKm || 50,
        tier1Rate: new Prisma.Decimal(newSettings.distanceTiers?.[0]?.ratePerKm || 0.15),
        tier2MaxKm: newSettings.distanceTiers?.[1]?.maxKm || 200,
        tier2Rate: new Prisma.Decimal(newSettings.distanceTiers?.[1]?.ratePerKm || 0.13),
        tier3Rate: new Prisma.Decimal(newSettings.distanceTiers?.[2]?.ratePerKm || 0.11),
        loadingCostPerTon: new Prisma.Decimal(newSettings.loadingCostPerTon || 0.5),
        urgencySurcharge: newSettings.urgencySurcharge || 0.3,
      } as TransportCostSettings;

      const proposedBreakdown = await this.calculateCostBreakdown(
        route.distance,
        route.quantity,
        route.vehicleType,
        route.isUrgent,
      );

      // Restore cache
      this.settingsCache = currentSettings;

      const difference = proposedBreakdown.totalCost - currentBreakdown.totalCost;
      const percentageChange = 
        (difference / currentBreakdown.totalCost) * 100;

      const impactAnalysis = this.analyzeImpact(
        currentBreakdown,
        proposedBreakdown,
        route,
      );

      comparisons.push({
        currentCost: currentBreakdown.totalCost,
        proposedCost: proposedBreakdown.totalCost,
        difference: Math.round(difference * 100) / 100,
        percentageChange: Math.round(percentageChange * 100) / 100,
        impactAnalysis,
      });
    }

    // Calculate average change
    const averageChange = comparisons.reduce(
      (sum, c) => sum + c.percentageChange,
      0,
    ) / comparisons.length;

    // Generate recommendation
    const recommendation = this.generateRecommendation(averageChange, comparisons);

    return {
      comparisons,
      averageChange: Math.round(averageChange * 100) / 100,
      recommendation,
    };
  }

  /**
   * Optimize settings for target margin
   */
  async optimizeForMargin(
    targetMargin: number,
    currentAverageMargin: number,
    constraints?: {
      maxBaseRate?: number;
      minBulkDiscount?: number;
      maxUrgencySurcharge?: number;
    },
  ): Promise<TransportSettingsDto> {
    const currentSettings = await this.getActiveSettings();
    
    // Calculate adjustment factor
    const marginGap = targetMargin - currentAverageMargin;
    const adjustmentFactor = 1 - (marginGap / 100);

    // Prepare optimized settings
    const optimized: TransportSettingsDto = {
      baseRatePerKm: Math.min(
        (currentSettings.baseRatePerKm?.toNumber() || 0.15) * adjustmentFactor,
        constraints?.maxBaseRate || 0.25,
      ),
      vehicleMultipliers: {
        FLATBED: currentSettings.flatbedMultiplier || 1.0,
        REFRIGERATED: currentSettings.refrigeratedMultiplier || 1.3,
        TANKER: currentSettings.tankerMultiplier || 1.2,
        CONTAINER: currentSettings.containerMultiplier || 1.1,
        CURTAIN_SIDE: 1.05,
        BOX_TRUCK: 1.0,
        OTHER: 1.0,
      },
      distanceTiers: [
        { minKm: 0, maxKm: currentSettings.tier1MaxKm || 50, 
          ratePerKm: (currentSettings.tier1Rate?.toNumber() || 0.15) * adjustmentFactor },
        { minKm: currentSettings.tier1MaxKm || 50, maxKm: currentSettings.tier2MaxKm || 200, 
          ratePerKm: (currentSettings.tier2Rate?.toNumber() || 0.13) * adjustmentFactor },
        { minKm: currentSettings.tier2MaxKm || 200, maxKm: null, 
          ratePerKm: (currentSettings.tier3Rate?.toNumber() || 0.11) * adjustmentFactor },
      ],
      loadingCostPerTon: 
        (currentSettings.loadingCostPerTon?.toNumber() || 0.5) * adjustmentFactor,
      urgencySurcharge: Math.min(
        (currentSettings.urgencySurcharge || 0.3) * adjustmentFactor,
        constraints?.maxUrgencySurcharge || 0.5,
      ),
      bulkDiscountThreshold: 100,
      bulkDiscountRate: Math.max(
        0.1 / adjustmentFactor,
        constraints?.minBulkDiscount || 0.05,
      ),
    };

    return optimized;
  }

  /**
   * Calculate tiered distance cost
   */
  private calculateTieredDistanceCost(
    distance: number,
    settings: TransportCostSettings,
  ): number {
    // Use the tier fields from the schema
    const tier1MaxKm = settings.tier1MaxKm || 50;
    const tier2MaxKm = settings.tier2MaxKm || 200;
    const tier1Rate = settings.tier1Rate?.toNumber() || 0.15;
    const tier2Rate = settings.tier2Rate?.toNumber() || 0.13;
    const tier3Rate = settings.tier3Rate?.toNumber() || 0.11;

    let totalCost = 0;

    if (distance <= tier1MaxKm) {
      // All distance in tier 1
      totalCost = distance * tier1Rate;
    } else if (distance <= tier2MaxKm) {
      // Tier 1 + Tier 2
      totalCost = tier1MaxKm * tier1Rate;
      totalCost += (distance - tier1MaxKm) * tier2Rate;
    } else {
      // Tier 1 + Tier 2 + Tier 3
      totalCost = tier1MaxKm * tier1Rate;
      totalCost += (tier2MaxKm - tier1MaxKm) * tier2Rate;
      totalCost += (distance - tier2MaxKm) * tier3Rate;
    }

    return totalCost;
  }


  /**
   * Analyze impact of settings change
   */
  private analyzeImpact(
    current: CostBreakdown,
    proposed: CostBreakdown,
    route: any,
  ): string[] {
    const analysis: string[] = [];

    if (proposed.baseCost > current.baseCost) {
      analysis.push(
        `Base cost increased by €${(proposed.baseCost - current.baseCost).toFixed(2)}`,
      );
    } else if (proposed.baseCost < current.baseCost) {
      analysis.push(
        `Base cost decreased by €${(current.baseCost - proposed.baseCost).toFixed(2)}`,
      );
    }

    if (proposed.bulkDiscount !== current.bulkDiscount) {
      analysis.push(
        `Bulk discount changed from €${current.bulkDiscount.toFixed(2)} to €${proposed.bulkDiscount.toFixed(2)}`,
      );
    }

    if (route.isUrgent && proposed.urgencySurcharge !== current.urgencySurcharge) {
      analysis.push(
        `Urgency surcharge changed by €${Math.abs(proposed.urgencySurcharge - current.urgencySurcharge).toFixed(2)}`,
      );
    }

    return analysis;
  }

  /**
   * Generate recommendation based on comparison
   */
  private generateRecommendation(
    averageChange: number,
    comparisons: CostComparison[],
  ): string {
    if (averageChange > 10) {
      return 'Significant cost increase detected. Consider phasing implementation or adjusting rates.';
    } else if (averageChange > 5) {
      return 'Moderate cost increase. Review impact on profit margins before implementation.';
    } else if (averageChange < -5) {
      return 'Cost reduction achieved. This should improve profit margins.';
    } else {
      return 'Minimal impact on transport costs. Safe to implement.';
    }
  }

  /**
   * Validate settings
   */
  private validateSettings(settings: TransportSettingsDto): void {
    if (settings.baseRatePerKm <= 0) {
      throw new BadRequestException('Base rate must be positive');
    }

    if (settings.distanceTiers.length === 0) {
      throw new BadRequestException('At least one distance tier is required');
    }

    // Validate tier continuity
    const sortedTiers = [...settings.distanceTiers].sort((a, b) => a.minKm - b.minKm);
    for (let i = 0; i < sortedTiers.length - 1; i++) {
      const current = sortedTiers[i];
      const next = sortedTiers[i + 1];
      
      if (current.maxKm !== null && current.maxKm !== next.minKm) {
        throw new BadRequestException(
          `Gap or overlap in distance tiers between ${current.maxKm}km and ${next.minKm}km`,
        );
      }
    }

    // Validate vehicle multipliers
    const requiredVehicles: TruckType[] = [
      'FLATBED',
      'REFRIGERATED',
      'TANKER',
      'CONTAINER',
      'CURTAIN_SIDE',
      'BOX_TRUCK',
    ];

    for (const vehicle of requiredVehicles) {
      if (!settings.vehicleMultipliers[vehicle]) {
        throw new BadRequestException(`Missing multiplier for ${vehicle}`);
      }
      if (settings.vehicleMultipliers[vehicle] <= 0) {
        throw new BadRequestException(`Invalid multiplier for ${vehicle}`);
      }
    }
  }

  /**
   * Create default settings
   */
  private async createDefaultSettings(): Promise<TransportCostSettings> {
    const defaultSettings = await this.prisma.transportCostSettings.create({
      data: {
        baseRatePerKm: 0.15,
        flatbedMultiplier: 1.0,
        refrigeratedMultiplier: 1.3,
        tankerMultiplier: 1.2,
        containerMultiplier: 1.1,
        tier1MaxKm: 50,
        tier1Rate: 0.15,
        tier2MaxKm: 200,
        tier2Rate: 0.13,
        tier3Rate: 0.11,
        loadingCostPerTon: 0.5,
        urgencySurcharge: 0.3,
        isActive: true,
        effectiveFrom: new Date(),
      },
    });

    this.logger.log('Created default transport cost settings');
    return defaultSettings;
  }

  /**
   * Clear settings cache
   */
  private clearCache(): void {
    this.settingsCache = null;
    this.cacheTimestamp = null;
  }

  /**
   * Export settings as JSON
   */
  async exportSettings(): Promise<string> {
    const settings = await this.getActiveSettings();
    return JSON.stringify(
      {
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
        exportedAt: new Date().toISOString(),
      },
      null,
      2,
    );
  }

  /**
   * Import settings from JSON
   */
  async importSettings(
    jsonData: string,
    importedBy: string,
  ): Promise<TransportCostSettings> {
    try {
      const parsed = JSON.parse(jsonData);
      return await this.updateSettings(
        parsed,
        importedBy,
        'Imported from JSON configuration',
      );
    } catch (error) {
      throw new BadRequestException('Invalid JSON format for settings import');
    }
  }
}