import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { AlphaVantageService } from './alpha-vantage.service';
import { firstValueFrom } from 'rxjs';

// Define the commodities we track
export const TRACKED_COMMODITIES = {
  // Agricultural
  WHEAT: 'WHEAT',
  CORN: 'CORN',
  SUNFLOWER: 'SUNFLOWER',
  BARLEY: 'BARLEY',
  OATS: 'OATS',
  RAPESEED: 'RAPESEED',
  SOYBEAN: 'SOYBEAN',
  // Fuel
  DIESEL: 'DIESEL',
  GASOLINE: 'GASOLINE',
  CRUDEOIL: 'CRUDEOIL',
  // Currency
  EUR: 'EUR',
  USD: 'USD',
};

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
  private readonly useAlphaVantage: boolean;
  private cachedPrices: MarketPrice[] = [];
  private lastFetchTime: Date | null = null;
  private readonly CACHE_DURATION_MS = 3600000; // 1 hour cache

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private prisma: PrismaService,
    private alphaVantageService: AlphaVantageService,
  ) {
    const apiKey = this.configService.get('ALPHA_VANTAGE_API_KEY', '');
    this.useAlphaVantage = apiKey && apiKey !== 'demo';
    
    // Initialize with mock data
    this.cachedPrices = this.getMockPrices();
    this.lastFetchTime = new Date();
  }

  // Fetch latest prices from API
  async fetchLatestPrices(): Promise<MarketPrice[]> {
    try {
      if (!this.useAlphaVantage) {
        this.logger.log('Using mock data (no Alpha Vantage API key configured)');
        return this.getMockPrices();
      }

      this.logger.log('Fetching real market data from Alpha Vantage...');
      const prices: MarketPrice[] = [];
      
      // Fetch agricultural commodities
      const wheat = await this.alphaVantageService.fetchCommodityPrice('WHEAT');
      if (wheat) {
        prices.push({
          commodity: 'WHEAT',
          price: this.alphaVantageService.convertToMetricTon('WHEAT', wheat.price),
          currency: 'USD',
          unit: 'per metric ton',
          changePercent: wheat.changePercent,
          timestamp: wheat.timestamp,
        });
      }
      
      const corn = await this.alphaVantageService.fetchCommodityPrice('CORN');
      if (corn) {
        prices.push({
          commodity: 'CORN',
          price: this.alphaVantageService.convertToMetricTon('CORN', corn.price),
          currency: 'USD',
          unit: 'per metric ton',
          changePercent: corn.changePercent,
          timestamp: corn.timestamp,
        });
      }
      
      // Fetch crude oil for diesel estimation
      const wti = await this.alphaVantageService.fetchCommodityPrice('WTI');
      if (wti) {
        const dieselPrice = this.alphaVantageService.estimateDieselFromCrude(wti.price);
        prices.push({
          commodity: 'DIESEL',
          price: dieselPrice,
          currency: 'USD',
          unit: 'per gallon',
          changePercent: wti.changePercent, // Use crude oil change as proxy
          timestamp: wti.timestamp,
        });
      }
      
      // Fetch EUR/USD exchange rate
      const eurUsd = await this.alphaVantageService.fetchExchangeRate('EUR', 'USD');
      if (eurUsd) {
        prices.push({
          commodity: 'EUR',
          price: eurUsd,
          currency: 'USD',
          unit: 'per EUR',
          timestamp: new Date(),
        });
      }
      
      // If we got real data, cache it
      if (prices.length > 0) {
        this.cachedPrices = prices;
        this.lastFetchTime = new Date();
        return prices;
      }
      
      // Fallback to mock data if API fails
      return this.getMockPrices();
    } catch (error) {
      this.logger.error('Failed to fetch market prices:', error);
      return this.getMockPrices();
    }
  }

  // Transform API response to our format
  private transformApiResponse(data: any): MarketPrice[] {
    const { rates, timestamp } = data;
    const prices: MarketPrice[] = [];

    for (const [commodity, price] of Object.entries(rates)) {
      prices.push({
        commodity,
        price: 1 / (price as number), // API returns inverted rates
        currency: 'USD',
        unit: this.getUnit(commodity),
        timestamp: new Date(timestamp * 1000),
      });
    }

    return prices;
  }

  // Get unit for commodity
  private getUnit(commodity: string): string {
    const units: Record<string, string> = {
      WHEAT: 'per metric ton',
      CORN: 'per metric ton',
      SUNFLOWER: 'per metric ton',
      BARLEY: 'per metric ton',
      OATS: 'per metric ton',
      RAPESEED: 'per metric ton',
      SOYBEAN: 'per metric ton',
      DIESEL: 'per gallon',
      GASOLINE: 'per gallon',
      CRUDEOIL: 'per barrel',
      EUR: 'per EUR',
      USD: 'per USD',
    };
    return units[commodity] || 'per unit';
  }

  // Mock prices for development/demo
  private getMockPrices(): MarketPrice[] {
    const now = new Date();
    return [
      {
        commodity: 'WHEAT',
        price: 245.50 + Math.random() * 10 - 5,
        currency: 'USD',
        unit: 'per metric ton',
        changePercent: Math.random() * 4 - 2,
        timestamp: now,
      },
      {
        commodity: 'CORN',
        price: 189.25 + Math.random() * 8 - 4,
        currency: 'USD',
        unit: 'per metric ton',
        changePercent: Math.random() * 4 - 2,
        timestamp: now,
      },
      {
        commodity: 'SUNFLOWER',
        price: 510.00 + Math.random() * 15 - 7.5,
        currency: 'USD',
        unit: 'per metric ton',
        changePercent: Math.random() * 4 - 2,
        timestamp: now,
      },
      {
        commodity: 'BARLEY',
        price: 220.00 + Math.random() * 10 - 5,
        currency: 'USD',
        unit: 'per metric ton',
        changePercent: Math.random() * 4 - 2,
        timestamp: now,
      },
      {
        commodity: 'DIESEL',
        price: 3.45 + Math.random() * 0.2 - 0.1,
        currency: 'USD',
        unit: 'per gallon',
        changePercent: Math.random() * 3 - 1.5,
        timestamp: now,
      },
      {
        commodity: 'EUR',
        price: 1.08 + Math.random() * 0.02 - 0.01,
        currency: 'USD',
        unit: 'per EUR',
        changePercent: Math.random() * 1 - 0.5,
        timestamp: now,
      },
    ];
  }

  // Get latest prices from cache/database
  async getLatestPrices(): Promise<any[]> {
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

  // Get historical prices
  async getHistoricalPrices(
    commodity: string,
    days: number = 30,
  ): Promise<any[]> {
    // For demo, generate mock historical data
    const prices: MarketPrice[] = [];
    const basePrice = this.getBasePrice(commodity);
    const now = new Date();

    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Add some random variation
      const variation = (Math.random() - 0.5) * basePrice * 0.05;
      
      prices.push({
        commodity,
        price: basePrice + variation,
        currency: 'USD',
        unit: this.getUnit(commodity),
        timestamp: date,
      });
    }

    return prices;
  }

  private getBasePrice(commodity: string): number {
    const basePrices: Record<string, number> = {
      WHEAT: 245,
      CORN: 189,
      SUNFLOWER: 510,
      BARLEY: 220,
      OATS: 200,
      RAPESEED: 480,
      SOYBEAN: 420,
      DIESEL: 3.45,
      GASOLINE: 3.20,
      CRUDEOIL: 85,
      EUR: 1.08,
    };
    return basePrices[commodity] || 100;
  }

  // Calculate transport cost based on fuel prices
  async calculateTransportCost(
    distanceKm: number,
    weightTons: number,
  ): Promise<any> {
    // Get current diesel price
    const prices = await this.getLatestPrices();
    const dieselPrice = prices.find(p => p.commodity === 'DIESEL')?.price || 3.45;
    
    // Convert USD/gallon to EUR/liter (approximately)
    const dieselPricePerLiter = dieselPrice * 0.264172 * 0.92; // gallons to liters * USD to EUR
    
    // Calculate fuel consumption
    // Average truck consumes ~35L/100km when loaded
    const fuelConsumption = 35; // liters per 100km
    const totalFuelNeeded = (distanceKm / 100) * fuelConsumption;
    const fuelCost = totalFuelNeeded * dieselPricePerLiter;
    
    // Add driver cost, maintenance, margin
    const driverCost = distanceKm * 0.5; // €0.50 per km
    const maintenanceCost = distanceKm * 0.2; // €0.20 per km
    const margin = (fuelCost + driverCost + maintenanceCost) * 0.15; // 15% margin
    
    const totalCost = fuelCost + driverCost + maintenanceCost + margin;
    
    return {
      distance: distanceKm,
      weight: weightTons,
      fuelNeeded: totalFuelNeeded.toFixed(2),
      fuelCost: fuelCost.toFixed(2),
      driverCost: driverCost.toFixed(2),
      maintenanceCost: maintenanceCost.toFixed(2),
      margin: margin.toFixed(2),
      totalCost: totalCost.toFixed(2),
      costPerTon: (totalCost / weightTons).toFixed(2),
      costPerKm: (totalCost / distanceKm).toFixed(2),
      currency: 'EUR',
    };
  }

  // Scheduled job to update prices (runs 3 times daily)
  @Cron('0 6,12,18 * * *')
  async updatePricesJob() {
    this.logger.log('Running scheduled price update...');
    try {
      const prices = await this.fetchLatestPrices();
      // In production, store these in database
      this.logger.log(`Updated ${prices.length} commodity prices`);
    } catch (error) {
      this.logger.error('Failed to update prices:', error);
    }
  }
}