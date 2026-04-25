import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { TransportCostSettings, TruckType, Prisma } from "@prisma/client";

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
  urgency?: "NORMAL" | "EXPRESS";
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
    // Validate inputs
    if (!pickupPoints || pickupPoints.length === 0) {
      throw new BadRequestException("At least one pickup point is required");
    }
    if (!deliveryPoint || !deliveryPoint.lat || !deliveryPoint.lng) {
      throw new BadRequestException("Valid delivery point is required");
    }

    // Check cache
    const cacheKey = this.generateCacheKey(
      pickupPoints,
      deliveryPoint,
      options,
    );
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }

    // Get active transport settings
    const settings = await this.getActiveSettings();

    // Calculate total distance
    const totalDistance = await this.calculateTotalDistance(
      pickupPoints,
      deliveryPoint,
    );

    // Calculate total quantity
    const totalQuantity = pickupPoints.reduce(
      (sum, point) => sum + point.quantity,
      0,
    );

    // Get rate based on distance tiers
    let appliedRate = Number(settings.baseRatePerKm);
    if (totalDistance <= settings.tier1MaxKm) {
      appliedRate = Number(settings.tier1Rate);
    } else if (totalDistance <= settings.tier2MaxKm) {
      appliedRate = Number(settings.tier2Rate);
    } else {
      appliedRate = Number(settings.tier3Rate);
    }

    // Apply vehicle multiplier
    const vehicleType = options.vehicleType || "FLATBED";
    let vehicleMultiplier = 1.0;
    if (vehicleType === "REFRIGERATED") vehicleMultiplier = settings.refrigeratedMultiplier;
    else if (vehicleType === "TANKER") vehicleMultiplier = settings.tankerMultiplier;
    else if (vehicleType === "CONTAINER") vehicleMultiplier = settings.containerMultiplier;
    else vehicleMultiplier = settings.flatbedMultiplier;

    // Calculate costs
    const distanceCost = totalDistance * appliedRate * vehicleMultiplier;
    const loadingCosts = totalQuantity * Number(settings.loadingCostPerTon);
    
    // Apply urgency surcharge if applicable
    let urgencySurcharge = 0;
    if (options.urgency === "EXPRESS") {
      urgencySurcharge = distanceCost * settings.urgencySurcharge;
    }

    const subtotal = distanceCost + loadingCosts + urgencySurcharge;
    const totalCost = Math.round(subtotal * 100) / 100;

    const estimation: TransportEstimation = {
      totalDistance,
      totalCost,
      currency: "EUR",
      breakdown: {
        distanceCost,
        loadingCosts,
        vehicleMultiplier,
        appliedRate,
        urgencySurcharge: urgencySurcharge > 0 ? urgencySurcharge : undefined,
      },
      route: {
        pickupSequence: this.createPickupSequence(pickupPoints),
        deliveryPoint,
        optimizationApplied: false,
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
        totalDistance += this.haversineDistance(
          pickupPoints[i],
          pickupPoints[i + 1],
        );
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
   * Calculate distance between two coordinates (public method for controllers)
   */
  calculateDistanceBetweenCoordinates(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    return this.haversineDistance(
      { lat: lat1, lng: lng1 },
      { lat: lat2, lng: lng2 },
    );
  }

  /**
   * Calculate transport costs for multiple seller addresses to a buyer address
   */
  async calculateTransportCosts(
    sellerAddresses: Array<{ id: string; lat: number; lng: number }>,
    buyerAddress: { lat: number; lng: number },
  ): Promise<
    Array<{ sellerId: string; distance: number; transportCost: number }>
  > {
    const results = [];
    const settings = await this.getActiveSettings();
    const costPerKm = Number(settings.baseRatePerKm) || 0.15;

    for (const seller of sellerAddresses) {
      const distance = this.haversineDistance(
        { lat: seller.lat, lng: seller.lng },
        buyerAddress,
      );
      const transportCost = distance * costPerKm;

      results.push({
        sellerId: seller.id,
        distance: Math.round(distance * 10) / 10,
        transportCost: Math.round(transportCost * 100) / 100,
      });
    }

    return results;
  }

  /**
   * Calculate distance between two points using Haversine formula
   * Public method for external use
   */
  public calculateDistance(point1: Location, point2: Location): number {
    return this.haversineDistance(point1, point2);
  }

  /**
   * Calculate distance between two points using Haversine formula (internal)
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
  ): Array<PickupPoint & { distanceToNext: number }> {
    const sequence: Array<PickupPoint & { distanceToNext: number }> = [];

    for (let i = 0; i < pickupPoints.length; i++) {
      const distanceToNext =
        i < pickupPoints.length - 1
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
      orderBy: { createdAt: "desc" },
    });

    if (!settings) {
      // Return default settings if none found
      return {
        id: "default",
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
      .map((p) => `${p.lat},${p.lng},${p.quantity}`)
      .sort()
      .join("|");
    const delivery = `${deliveryPoint.lat},${deliveryPoint.lng}`;
    const opts = `${options.vehicleType || "FLATBED"}-${options.urgency || "NORMAL"}`;
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
    this.logger.debug("Transport cost cache cleared");
  }
}
