import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  LocationPricingResponseDto,
  PriceRangeDto,
} from "./dto/location-pricing.dto";

@Injectable()
export class PricingService {
  constructor(private prisma: PrismaService) {}

  async getLocationBasedPricing(
    productId: string,
    quantity: number,
    latitude: number,
    longitude: number,
  ): Promise<LocationPricingResponseDto> {
    // Check cache first
    const cached = await this.getCachedPricing(
      productId,
      latitude,
      longitude,
      quantity,
    );
    if (cached) {
      return cached;
    }

    // Generate pricing based on product, quantity, and location
    const pricing = await this.calculateLocationBasedPricing(
      productId,
      quantity,
      latitude,
      longitude,
    );

    // Cache the result
    await this.cachePricing(productId, latitude, longitude, quantity, pricing);

    return pricing;
  }

  private async getCachedPricing(
    productId: string,
    latitude: number,
    longitude: number,
    quantity: number,
  ): Promise<LocationPricingResponseDto | null> {
    try {
      const locationHash = this.generateLocationHash(latitude, longitude);

      const cached = await this.prisma.$queryRaw<any[]>`
        SELECT price_range, created_at
        FROM location_pricing_cache
        WHERE product_id = ${productId}
          AND location_hash = ${locationHash}
          AND quantity = ${quantity}
          AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
      `;

      if (cached.length > 0) {
        const priceData = cached[0].price_range as any;
        return {
          priceRange: priceData.priceRange,
          marketData: priceData.marketData,
        };
      }
    } catch (error) {
      console.error("Cache lookup failed:", error);
    }

    return null;
  }

  private async cachePricing(
    productId: string,
    latitude: number,
    longitude: number,
    quantity: number,
    pricing: LocationPricingResponseDto,
  ): Promise<void> {
    try {
      const locationHash = this.generateLocationHash(latitude, longitude);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await this.prisma.$executeRaw`
        INSERT INTO location_pricing_cache (product_id, location_hash, quantity, price_range, expires_at)
        VALUES (${productId}, ${locationHash}, ${quantity}, ${JSON.stringify(pricing)}, ${expiresAt})
        ON CONFLICT (product_id, location_hash, quantity) 
        DO UPDATE SET price_range = ${JSON.stringify(pricing)}, expires_at = ${expiresAt}
      `;
    } catch (error) {
      console.error("Cache storage failed:", error);
    }
  }

  private async calculateLocationBasedPricing(
    productId: string,
    quantity: number,
    latitude: number,
    longitude: number,
  ): Promise<LocationPricingResponseDto> {
    // This is a simplified pricing algorithm
    // In a real implementation, you would:
    // 1. Query historical prices for the region
    // 2. Factor in supply/demand dynamics
    // 3. Consider seasonal variations
    // 4. Account for transportation costs
    // 5. Apply market trends and forecasts

    const basePrices = this.getBasePriceByProduct(productId);
    const locationFactor = this.getLocationPricingFactor(latitude, longitude);
    const quantityFactor = this.getQuantityDiscount(quantity);

    const basePrice = basePrices.base;
    const adjustedPrice = basePrice * locationFactor * quantityFactor;

    const priceRange: PriceRangeDto = {
      min: Math.round(adjustedPrice * 0.85 * 100) / 100, // 15% below
      max: Math.round(adjustedPrice * 1.15 * 100) / 100, // 15% above
      currency: "EUR",
      confidence: this.getPriceConfidence(latitude, longitude),
    };

    const marketData: MarketData = {
      averagePrice: Math.round(adjustedPrice * 100) / 100,
      trend: this.getMarketTrend(productId),
      demandLevel: this.getDemandLevel(productId),
    };

    return {
      priceRange,
      marketData,
    };
  }

  private getBasePriceByProduct(productId: string): {
    base: number;
    unit: string;
  } {
    // Base prices per kg in EUR
    const productPrices: Record<string, number> = {
      wheat: 0.25,
      corn: 0.28,
      barley: 0.23,
      sunflower: 0.45,
      soybeans: 0.52,
      rapeseed: 0.48,
      sugar_beet: 0.12,
      potatoes: 0.35,
      tomatoes: 1.2,
      peppers: 1.8,
      cucumbers: 0.9,
      cabbage: 0.45,
      carrots: 0.55,
      onions: 0.4,
      apples: 0.85,
      grapes: 1.5,
      plums: 1.2,
      cherries: 2.5,
    };

    return {
      base: productPrices[productId] || 1.0, // Default price if product not found
      unit: "kg",
    };
  }

  private getLocationPricingFactor(
    latitude: number,
    longitude: number,
  ): number {
    // Simplified location-based pricing
    // In Bulgaria, prices might vary by region due to:
    // - Proximity to major cities (Sofia, Plovdiv, Varna)
    // - Transportation infrastructure
    // - Local market conditions

    // Major Bulgarian cities coordinates (approximate)
    const cities = [
      { name: "Sofia", lat: 42.7, lng: 23.3, factor: 1.05 }, // Higher prices near capital
      { name: "Plovdiv", lat: 42.1, lng: 24.7, factor: 1.02 }, // Second largest city
      { name: "Varna", lat: 43.2, lng: 27.9, factor: 1.03 }, // Port city
      { name: "Burgas", lat: 42.5, lng: 27.5, factor: 1.01 }, // Port city
    ];

    let minDistance = Infinity;
    let closestCityFactor = 0.98; // Default for rural areas

    cities.forEach((city) => {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        city.lat,
        city.lng,
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestCityFactor = city.factor;
      }
    });

    // Apply distance decay - further from cities = lower prices
    const distanceDecay = Math.max(0.95, 1 - minDistance / 500); // 500km max distance effect
    return closestCityFactor * distanceDecay;
  }

  private getQuantityDiscount(quantity: number): number {
    // Volume discounts
    if (quantity >= 500) return 0.92; // 8% discount for 500+ tons
    if (quantity >= 250) return 0.95; // 5% discount for 250+ tons
    if (quantity >= 100) return 0.97; // 3% discount for 100+ tons
    return 1.0; // No discount for smaller quantities
  }

  private getPriceConfidence(
    latitude: number,
    longitude: number,
  ): "high" | "medium" | "low" {
    // Confidence based on data availability for the region
    // In a real system, this would consider:
    // - Number of recent transactions in the area
    // - Market data quality
    // - Regional market activity

    // For now, assume higher confidence near major agricultural regions
    const agriculturalRegions = [
      { lat: 42.1, lng: 25.0 }, // Plovdiv region - major agricultural area
      { lat: 43.5, lng: 26.0 }, // Dobrich region - grain production
      { lat: 42.0, lng: 23.5 }, // Blagoevgrad region
    ];

    const minDistanceToAgriRegion = Math.min(
      ...agriculturalRegions.map((region) =>
        this.calculateDistance(latitude, longitude, region.lat, region.lng),
      ),
    );

    if (minDistanceToAgriRegion < 50) return "high";
    if (minDistanceToAgriRegion < 150) return "medium";
    return "low";
  }

  private getMarketTrend(productId: string): "rising" | "stable" | "falling" {
    // Simplified trend analysis
    // In reality, this would analyze:
    // - Historical price data
    // - Seasonal patterns
    // - Market forecasts
    // - Global commodity trends

    const trends: Record<string, "rising" | "stable" | "falling"> = {
      wheat: "stable",
      corn: "rising",
      sunflower: "rising",
      tomatoes: "stable",
      apples: "falling",
    };

    return trends[productId] || "stable";
  }

  private getDemandLevel(productId: string): "high" | "medium" | "low" {
    // Simplified demand analysis
    // Factors might include:
    // - Proximity to processing facilities
    // - Export ports
    // - Population centers
    // - Seasonal demand patterns

    const baseDemand: Record<string, "high" | "medium" | "low"> = {
      wheat: "high",
      corn: "high",
      sunflower: "medium",
      tomatoes: "high",
      apples: "medium",
    };

    return baseDemand[productId] || "medium";
  }

  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    // Haversine formula for distance calculation
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private generateLocationHash(latitude: number, longitude: number): string {
    // Round to ~1km precision for caching
    const roundedLat = Math.round(latitude * 100) / 100;
    const roundedLng = Math.round(longitude * 100) / 100;
    return `${roundedLat},${roundedLng}`;
  }
}
