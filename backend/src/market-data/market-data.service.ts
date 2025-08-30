import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

interface MarketPrice {
  commodity: string;
  price: number;
  currency: string;
  unit: string;
  changePercent?: number;
  timestamp: Date;
}

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);
  private cachedPrices: MarketPrice[] = [];
  private lastFetchTime: Date | null = null;
  private readonly CACHE_DURATION_MS = 300000; // 5 minutes cache

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    // Initialize with empty cache
    this.fetchLatestPrices();
  }

  // Fetch latest prices from database
  async fetchLatestPrices(): Promise<MarketPrice[]> {
    try {
      // Get all regions with their prices
      const regions = await this.prisma.region.findMany({
        where: { isActive: true },
        include: {
          prices: true,
        },
      });

      // Calculate average prices across all regions for each product
      const pricesByProduct = new Map<string, { total: number; count: number; currency: string }>();
      
      for (const region of regions) {
        for (const price of region.prices) {
          const key = price.productCategory;
          if (!pricesByProduct.has(key)) {
            pricesByProduct.set(key, { total: 0, count: 0, currency: price.currency });
          }
          const current = pricesByProduct.get(key)!;
          current.total += price.pricePerUnit.toNumber();
          current.count += 1;
        }
      }

      // Convert to MarketPrice format
      const prices: MarketPrice[] = [];
      const now = new Date();
      
      for (const [commodity, data] of pricesByProduct) {
        const avgPrice = data.total / data.count;
        prices.push({
          commodity,
          price: Math.round(avgPrice * 100) / 100,
          currency: data.currency,
          unit: 'per metric ton',
          changePercent: (Math.random() - 0.5) * 4, // Mock change for now
          timestamp: now,
        });
      }

      // Add diesel price (mock for now)
      prices.push({
        commodity: 'DIESEL',
        price: 3.45,
        currency: 'EUR',
        unit: 'per gallon',
        changePercent: (Math.random() - 0.5) * 3,
        timestamp: now,
      });

      // Add EUR/USD exchange rate (mock)
      prices.push({
        commodity: 'EUR',
        price: 1.08,
        currency: 'USD',
        unit: 'per EUR',
        changePercent: (Math.random() - 0.5) * 1,
        timestamp: now,
      });
      
      // Cache the prices
      if (prices.length > 0) {
        this.cachedPrices = prices;
        this.lastFetchTime = new Date();
        this.logger.log(`Fetched ${prices.length} prices from database`);
      }
      
      return prices;
    } catch (error) {
      this.logger.error('Error fetching prices from database:', error);
      // Return cached prices if available
      if (this.cachedPrices.length > 0) {
        return this.cachedPrices;
      }
      // Last resort: return minimal mock data
      return this.getMinimalMockPrices();
    }
  }

  // Get latest prices with caching
  async getLatestPrices(): Promise<MarketPrice[]> {
    // Check if cache is still valid
    if (this.lastFetchTime && this.cachedPrices.length > 0) {
      const cacheAge = Date.now() - this.lastFetchTime.getTime();
      if (cacheAge < this.CACHE_DURATION_MS) {
        this.logger.log('Returning cached prices');
        return this.cachedPrices;
      }
    }
    
    // Cache expired or empty, fetch new data
    return this.fetchLatestPrices();
  }

  // Get prices for a specific commodity
  async getCommodityPrice(commodity: string): Promise<MarketPrice | null> {
    const prices = await this.getLatestPrices();
    return prices.find(p => p.commodity === commodity) || null;
  }

  // Get historical prices (mock for now)
  async getHistoricalPrices(commodity: string, days: number = 30): Promise<MarketPrice[]> {
    const currentPrice = await this.getCommodityPrice(commodity);
    if (!currentPrice) {
      return [];
    }

    const prices: MarketPrice[] = [];
    const now = new Date();

    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Add some random variation
      const variation = (Math.random() - 0.5) * currentPrice.price * 0.05;
      
      prices.push({
        ...currentPrice,
        price: currentPrice.price + variation,
        timestamp: date,
      });
    }

    return prices;
  }

  // Get prices for a specific region
  async getRegionalPrices(regionName: string): Promise<MarketPrice[]> {
    try {
      const region = await this.prisma.region.findFirst({
        where: { 
          name: {
            equals: regionName,
            mode: 'insensitive',
          },
        },
        include: {
          prices: true,
        },
      });

      if (!region) {
        return [];
      }

      const now = new Date();
      return region.prices.map(price => ({
        commodity: price.productCategory,
        price: price.pricePerUnit.toNumber(),
        currency: price.currency,
        unit: 'per metric ton',
        changePercent: (Math.random() - 0.5) * 4,
        timestamp: now,
      }));
    } catch (error) {
      this.logger.error('Error fetching regional prices:', error);
      return [];
    }
  }

  // Calculate transport cost based on fuel prices
  async calculateTransportCost(distanceKm: number, weightTons: number): Promise<any> {
    // Get current diesel price
    const prices = await this.getLatestPrices();
    const dieselPrice = prices.find(p => p.commodity === 'DIESEL')?.price || 3.45;
    
    // Convert EUR/gallon to EUR/liter
    const dieselPricePerLiter = dieselPrice * 0.264172;
    
    // Typical fuel consumption: 35L/100km for a loaded truck
    const fuelConsumption = 35;
    const totalFuel = (distanceKm / 100) * fuelConsumption;
    const fuelCost = totalFuel * dieselPricePerLiter;
    
    // Add driver cost, tolls, maintenance (roughly €0.50 per km)
    const otherCosts = distanceKm * 0.50;
    
    // Total cost
    const totalCost = fuelCost + otherCosts;
    
    // Cost per ton
    const costPerTon = totalCost / weightTons;
    
    return {
      distance: distanceKm,
      weight: weightTons,
      fuelCost: Math.round(fuelCost * 100) / 100,
      otherCosts: Math.round(otherCosts * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      costPerTon: Math.round(costPerTon * 100) / 100,
      currency: 'EUR',
    };
  }

  // Get commodity list from database
  async getCommodityList(): Promise<string[]> {
    try {
      const prices = await this.prisma.regionalPrice.findMany({
        select: {
          productCategory: true,
        },
        distinct: ['productCategory'],
      });
      
      const commodities = prices.map(p => p.productCategory);
      // Add fuel and currency as any type since they're not ProductCategory
      commodities.push('DIESEL' as any, 'EUR' as any);
      return commodities;
    } catch (error) {
      this.logger.error('Error fetching commodity list:', error);
      return ['WHEAT', 'CORN', 'SUNFLOWER', 'BARLEY', 'OATS', 'RAPESEED', 'DIESEL', 'EUR'];
    }
  }

  // Refresh prices from database
  async refreshPrices(): Promise<MarketPrice[]> {
    this.logger.log('Refreshing prices from database...');
    // Clear cache to force fresh fetch
    this.lastFetchTime = null;
    return this.fetchLatestPrices();
  }

  // Get market summary with regional data
  async getMarketSummary(): Promise<any> {
    const prices = await this.getLatestPrices();
    
    // Get regions count
    const regions = await this.prisma.region.count({
      where: { isActive: true },
    });
    
    const summary = {
      timestamp: new Date(),
      totalCommodities: prices.length - 2, // Exclude DIESEL and EUR
      totalRegions: regions,
      averageChangePercent: prices.reduce((acc, p) => acc + (p.changePercent || 0), 0) / prices.length,
      topGainers: prices
        .filter(p => p.changePercent && p.changePercent > 0)
        .sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0))
        .slice(0, 3),
      topLosers: prices
        .filter(p => p.changePercent && p.changePercent < 0)
        .sort((a, b) => (a.changePercent || 0) - (b.changePercent || 0))
        .slice(0, 3),
      marketTrend: this.calculateMarketTrend(prices),
    };
    return summary;
  }

  // Calculate overall market trend
  private calculateMarketTrend(prices: MarketPrice[]): string {
    const avgChange = prices.reduce((acc, p) => acc + (p.changePercent || 0), 0) / prices.length;
    if (avgChange > 1) return 'bullish';
    if (avgChange < -1) return 'bearish';
    return 'neutral';
  }

  // Get minimal mock prices as last resort
  private getMinimalMockPrices(): MarketPrice[] {
    const now = new Date();
    return [
      {
        commodity: 'WHEAT',
        price: 245,
        currency: 'EUR',
        unit: 'per metric ton',
        changePercent: 0,
        timestamp: now,
      },
      {
        commodity: 'CORN',
        price: 189,
        currency: 'EUR',
        unit: 'per metric ton',
        changePercent: 0,
        timestamp: now,
      },
      {
        commodity: 'SUNFLOWER',
        price: 510,
        currency: 'EUR',
        unit: 'per metric ton',
        changePercent: 0,
        timestamp: now,
      },
    ];
  }

  // Scheduled task to refresh prices
  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleCron() {
    this.logger.log('Running scheduled price refresh...');
    await this.refreshPrices();
  }
}