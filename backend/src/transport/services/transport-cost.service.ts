import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransportCostSettings, TruckType, Prisma } from '@prisma/client';

export interface Location {
  lat: number;
  lng: number;
}

export interface PickupPoint extends Location {
  quantity: number;
  unit?: string;
  id?: string;
}

export interface TransportEstimation {
  totalDistance: number;
  totalCost: number;
  currency: string;
  breakdown: {
    distanceCost: number;
    loadingCosts: number;
    vehicleMultiplier: number;
    appliedRate: number;
    distanceTier?: {
      tier: number;
      rateApplied: number;
    };
    bulkDiscount?: {
      applied: boolean;
      discountRate: number;
      discountAmount: number;
    };
    urgencySurcharge?: {
      applied: boolean;
      surchargeRate: number;
      surchargeAmount: number;
    };
  };
  route: {
    pickupSequence: Array<PickupPoint & { distanceToNext: number }>;
    deliveryPoint: Location;
    optimizationApplied?: boolean;
    distanceSaved?: number;
  };
  vehicleInfo: {
    type: TruckType;
    requiredCapacity: number;
    multiplier: number;
  };
  cached?: boolean;
}

export interface TransportOptions {
  vehicleType?: TruckType;
  urgency?: 'NORMAL' | 'EXPRESS';
  includeAlternatives?: boolean;
}

export interface DistanceTier {
  minKm: number;
  maxKm: number | null;
  ratePerKm: number;
}

@Injectable()
export class TransportCostService {
  private readonly logger = new Logger(TransportCostService.name);
  private cache = new Map<string, TransportEstimation>();
  private readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Estimate transport cost for a route
   */
  async estimateCost(
    pickupPoints: PickupPoint[],
    deliveryPoint: Location,
    options: TransportOptions = {},
  ): Promise<TransportEstimation> {
    // Check cache
    const cacheKey = this.generateCacheKey(pickupPoints, deliveryPoint, options);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }

    // Get active transport settings
    const settings = await this.getActiveSettings();
    
    // Calculate total distance (simplified - in production would use actual routing API)
    const totalDistance = await this.calculateTotalDistance(pickupPoints, deliveryPoint);
    
    // Calculate total quantity
    const totalQuantity = pickupPoints.reduce((sum, point) => sum + point.quantity, 0);
    
    // Get vehicle type and multiplier
    const vehicleType = options.vehicleType || 'FLATBED';
    const vehicleMultiplier = this.getVehicleMultiplier(vehicleType, settings);
    
    // Calculate base distance cost with tiers
    const { distanceCost, appliedRate, tier } = this.calculateDistanceCost(
      totalDistance,
      settings,
    );
    
    // Apply vehicle multiplier
    let cost = distanceCost * vehicleMultiplier;
    
    // Add loading costs
    const loadingCosts = this.calculateLoadingCosts(totalQuantity, settings);
    cost += loadingCosts;
    
    // Apply bulk discount if applicable
    const bulkDiscount = this.applyBulkDiscount(cost, totalQuantity, settings);
    if (bulkDiscount.applied) {
      cost -= bulkDiscount.discountAmount;
    }
    
    // Apply urgency surcharge if express
    const urgencySurcharge = this.applyUrgencySurcharge(
      cost,
      options.urgency,
      settings,
    );
    if (urgencySurcharge.applied) {
      cost += urgencySurcharge.surchargeAmount;
    }

    const estimation: TransportEstimation = {
      totalDistance,
      totalCost: Math.round(cost * 100) / 100, // Round to 2 decimals
      currency: 'EUR',
      breakdown: {
        distanceCost,
        loadingCosts,
        vehicleMultiplier,
        appliedRate,
        distanceTier: tier ? { tier: tier.tier, rateApplied: tier.rate } : undefined,
        bulkDiscount: bulkDiscount.applied ? bulkDiscount : undefined,
        urgencySurcharge: urgencySurcharge.applied ? urgencySurcharge : undefined,
      },
      route: {
        pickupSequence: this.createPickupSequence(pickupPoints, totalDistance),
        deliveryPoint,
        optimizationApplied: false, // Will be set by RouteOptimizationService
      },
      vehicleInfo: {
        type: vehicleType,
        requiredCapacity: totalQuantity,
        multiplier: vehicleMultiplier,
      },
    };

    // Cache the result
    this.cacheEstimation(cacheKey, estimation);

    return estimation;
  }

  /**
   * Calculate distance-based cost with tier pricing
   */
  private calculateDistanceCost(
    distance: number,
    settings: TransportCostSettings,
  ): { distanceCost: number; appliedRate: number; tier?: { tier: number; rate: number } } {
    // Use tier-based pricing from the actual schema
    let rate: number;
    let tierIndex: number;
    
    if (distance <= settings.tier1MaxKm) {
      rate = Number(settings.tier1Rate);
      tierIndex = 1;
    } else if (distance <= settings.tier2MaxKm) {
      rate = Number(settings.tier2Rate);
      tierIndex = 2;
    } else {
      rate = Number(settings.tier3Rate);
      tierIndex = 3;
    }

    return {
      distanceCost: distance * rate,
      appliedRate: rate,
      tier: { tier: tierIndex, rate },
    };
  }

  /**
   * Get vehicle type multiplier
   */
  private getVehicleMultiplier(
    vehicleType: TruckType,
    settings: TransportCostSettings,
  ): number {
    // Use the actual multiplier fields from the schema
    switch (vehicleType) {
      case 'FLATBED':
        return settings.flatbedMultiplier;
      case 'REFRIGERATED':
        return settings.refrigeratedMultiplier;
      case 'TANKER':
        return settings.tankerMultiplier;
      case 'CONTAINER':
        return settings.containerMultiplier;
      default:
        return 1.0;
    }
  }

  /**
   * Calculate loading/unloading costs
   */
  private calculateLoadingCosts(
    quantity: number,
    settings: TransportCostSettings,
  ): number {
    const costPerTon = settings.loadingCostPerTon?.toNumber() || 0.5;
    return quantity * costPerTon;
  }

  /**
   * Apply bulk discount for large quantities
   */
  private applyBulkDiscount(
    cost: number,
    quantity: number,
    settings: TransportCostSettings,
  ): { applied: boolean; discountRate: number; discountAmount: number } {
    // Using default values as these fields are not in the current schema
    const threshold = 100;
    const discountRate = 0.1;

    if (quantity >= threshold) {
      const discountAmount = cost * discountRate;
      return {
        applied: true,
        discountRate,
        discountAmount,
      };
    }

    return {
      applied: false,
      discountRate: 0,
      discountAmount: 0,
    };
  }

  /**
   * Apply urgency surcharge for express delivery
   */
  private applyUrgencySurcharge(
    cost: number,
    urgency: string | undefined,
    settings: TransportCostSettings,
  ): { applied: boolean; surchargeRate: number; surchargeAmount: number } {
    if (urgency === 'EXPRESS') {
      // Using default value as urgencySurcharge is not in the current schema  
      const surchargeRate = Number(settings.urgencySurcharge) || 0.3;
      const surchargeAmount = cost * surchargeRate;
      return {
        applied: true,
        surchargeRate,
        surchargeAmount,
      };
    }

    return {
      applied: false,
      surchargeRate: 0,
      surchargeAmount: 0,
    };
  }

  /**
   * Calculate total distance for route (simplified)
   */
  private async calculateTotalDistance(
    pickupPoints: PickupPoint[],
    deliveryPoint: Location,
  ): Promise<number> {
    // In production, this would use a real routing API or PostGIS
    // For now, use simplified calculation
    
    let totalDistance = 0;
    
    // Assume starting from a central warehouse at (42.6977, 23.3219) - Sofia
    const warehouse = { lat: 42.6977, lng: 23.3219 };
    
    // Distance from warehouse to first pickup
    if (pickupPoints.length > 0) {
      totalDistance += this.haversineDistance(warehouse, pickupPoints[0]);
      
      // Distance between pickups
      for (let i = 0; i < pickupPoints.length - 1; i++) {
        totalDistance += this.haversineDistance(pickupPoints[i], pickupPoints[i + 1]);
      }
      
      // Distance from last pickup to delivery
      totalDistance += this.haversineDistance(
        pickupPoints[pickupPoints.length - 1],
        deliveryPoint,
      );
    } else {
      // Direct delivery
      totalDistance = this.haversineDistance(warehouse, deliveryPoint);
    }

    return Math.round(totalDistance * 10) / 10; // Round to 1 decimal
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private haversineDistance(point1: Location, point2: Location): number {
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
   * Create pickup sequence with distances
   */
  private createPickupSequence(
    pickupPoints: PickupPoint[],
    totalDistance: number,
  ): Array<PickupPoint & { distanceToNext: number }> {
    const sequence: Array<PickupPoint & { distanceToNext: number }> = [];
    
    for (let i = 0; i < pickupPoints.length; i++) {
      const distanceToNext = i < pickupPoints.length - 1
        ? this.haversineDistance(pickupPoints[i], pickupPoints[i + 1])
        : 0;
      
      sequence.push({
        ...pickupPoints[i],
        distanceToNext: Math.round(distanceToNext * 10) / 10,
      });
    }

    return sequence;
  }

  /**
   * Get active transport cost settings
   */
  private async getActiveSettings(): Promise<TransportCostSettings> {
    const settings = await this.prisma.transportCostSettings.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!settings) {
      // Return default settings if none found
      return {
        id: 'default',
        baseRatePerKm: new Prisma.Decimal(0.15),
        flatbedMultiplier: 1.0,
        refrigeratedMultiplier: 1.3,
        tankerMultiplier: 1.2,
        containerMultiplier: 1.1,
        tier1MaxKm: 50,
        tier1Rate: new Prisma.Decimal(0.15),
        tier2MaxKm: 200,
        tier2Rate: new Prisma.Decimal(0.13),
        tier3Rate: new Prisma.Decimal(0.11),
        loadingCostPerTon: new Prisma.Decimal(0.5),
        urgencySurcharge: 0.3,
        isActive: true,
        effectiveFrom: new Date(),
        effectiveTo: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as TransportCostSettings;
    }

    return settings;
  }

  /**
   * Generate cache key for estimation
   */
  private generateCacheKey(
    pickupPoints: PickupPoint[],
    deliveryPoint: Location,
    options: TransportOptions,
  ): string {
    const pickups = pickupPoints
      .map(p => `${p.lat},${p.lng},${p.quantity}`)
      .sort()
      .join('|');
    const delivery = `${deliveryPoint.lat},${deliveryPoint.lng}`;
    const opts = `${options.vehicleType || 'FLATBED'}-${options.urgency || 'NORMAL'}`;
    return `${pickups}-${delivery}-${opts}`;
  }

  /**
   * Get estimation from cache
   */
  private getFromCache(key: string): TransportEstimation | null {
    const cached = this.cache.get(key);
    if (cached) {
      const age = Date.now() - (cached as any).timestamp;
      if (age < this.CACHE_TTL) {
        this.logger.debug(`Cache hit for transport estimation: ${key}`);
        return cached;
      }
      // Remove expired entry
      this.cache.delete(key);
    }
    return null;
  }

  /**
   * Cache an estimation
   */
  private cacheEstimation(key: string, estimation: TransportEstimation): void {
    (estimation as any).timestamp = Date.now();
    this.cache.set(key, estimation);
    this.logger.debug(`Cached transport estimation: ${key}`);
  }

  /**
   * Clear cache (useful for testing or when settings change)
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.debug('Transport cost cache cleared');
  }
}