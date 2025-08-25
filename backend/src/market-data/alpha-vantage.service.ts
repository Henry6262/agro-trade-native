import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface AlphaVantagePrice {
  commodity: string;
  price: number;
  currency: string;
  unit: string;
  timestamp: Date;
  changePercent?: number;
}

@Injectable()
export class AlphaVantageService {
  private readonly logger = new Logger(AlphaVantageService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://www.alphavantage.co/query';
  
  // Map our commodity names to Alpha Vantage function names
  private readonly commodityFunctions: Record<string, string> = {
    WHEAT: 'WHEAT',
    CORN: 'CORN',
    COTTON: 'COTTON',
    SUGAR: 'SUGAR',
    COFFEE: 'COFFEE',
    // Energy commodities for fuel price estimation
    WTI: 'WTI', // West Texas Intermediate crude oil
    BRENT: 'BRENT', // Brent crude oil
    NATURAL_GAS: 'NATURAL_GAS',
  };

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.apiKey = this.configService.get('ALPHA_VANTAGE_API_KEY', 'demo');
  }

  // Fetch commodity price from Alpha Vantage
  async fetchCommodityPrice(commodity: string): Promise<AlphaVantagePrice | null> {
    try {
      const functionName = this.commodityFunctions[commodity];
      if (!functionName) {
        this.logger.warn(`Commodity ${commodity} not supported by Alpha Vantage`);
        return null;
      }

      const response = await firstValueFrom(
        this.httpService.get(this.baseUrl, {
          params: {
            function: functionName,
            interval: 'monthly',
            apikey: this.apiKey,
          },
        }),
      );

      return this.parseCommodityResponse(commodity, response.data);
    } catch (error) {
      this.logger.error(`Failed to fetch ${commodity} price:`, error);
      return null;
    }
  }

  // Fetch foreign exchange rate
  async fetchExchangeRate(from: string, to: string): Promise<number | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(this.baseUrl, {
          params: {
            function: 'CURRENCY_EXCHANGE_RATE',
            from_currency: from,
            to_currency: to,
            apikey: this.apiKey,
          },
        }),
      );

      const data = response.data['Realtime Currency Exchange Rate'];
      if (data) {
        return parseFloat(data['5. Exchange Rate']);
      }
      return null;
    } catch (error) {
      this.logger.error(`Failed to fetch exchange rate ${from}/${to}:`, error);
      return null;
    }
  }

  // Fetch all commodity prices (with rate limiting consideration)
  async fetchAllCommodities(): Promise<AlphaVantagePrice[]> {
    const prices: AlphaVantagePrice[] = [];
    
    // Alpha Vantage free tier: 25 requests per day
    // We'll fetch the most important commodities
    const priorityCommodities = ['WHEAT', 'CORN', 'WTI', 'BRENT'];
    
    for (const commodity of priorityCommodities) {
      const price = await this.fetchCommodityPrice(commodity);
      if (price) {
        prices.push(price);
      }
      
      // Add delay to respect rate limits (5 calls per minute on free tier)
      await new Promise(resolve => setTimeout(resolve, 12000)); // 12 seconds between calls
    }
    
    return prices;
  }

  // Parse commodity response from Alpha Vantage
  private parseCommodityResponse(commodity: string, data: any): AlphaVantagePrice | null {
    try {
      // Alpha Vantage returns data with a "data" array
      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        const latestData = data.data[0]; // Most recent data point
        const previousData = data.data[1]; // Previous data point for change calculation
        
        const currentPrice = parseFloat(latestData.value);
        let changePercent = 0;
        
        if (previousData) {
          const previousPrice = parseFloat(previousData.value);
          changePercent = ((currentPrice - previousPrice) / previousPrice) * 100;
        }
        
        return {
          commodity,
          price: currentPrice,
          currency: 'USD',
          unit: this.getUnit(commodity),
          timestamp: new Date(latestData.date),
          changePercent,
        };
      }
      
      return null;
    } catch (error) {
      this.logger.error(`Failed to parse response for ${commodity}:`, error);
      return null;
    }
  }

  // Get unit for commodity
  private getUnit(commodity: string): string {
    const units: Record<string, string> = {
      WHEAT: 'per bushel',
      CORN: 'per bushel',
      COTTON: 'per lb',
      SUGAR: 'per lb',
      COFFEE: 'per lb',
      WTI: 'per barrel',
      BRENT: 'per barrel',
      NATURAL_GAS: 'per MMBtu',
    };
    return units[commodity] || 'per unit';
  }

  // Convert commodity prices to more common units
  convertToMetricTon(commodity: string, pricePerUnit: number): number {
    // Conversion factors to metric ton
    const conversions: Record<string, number> = {
      WHEAT: 36.7437, // bushels per metric ton
      CORN: 39.3683, // bushels per metric ton
      COTTON: 2204.62, // lbs per metric ton
      SUGAR: 2204.62, // lbs per metric ton
      COFFEE: 2204.62, // lbs per metric ton
    };
    
    const factor = conversions[commodity];
    if (factor) {
      return pricePerUnit * factor;
    }
    return pricePerUnit;
  }

  // Estimate diesel price from crude oil
  estimateDieselFromCrude(crudePrice: number): number {
    // Rough estimation: Diesel price = (Crude price / 42) * 1.3 + refining margin
    // 42 gallons per barrel, 1.3x markup, $0.50 refining margin
    const pricePerGallon = (crudePrice / 42) * 1.3 + 0.50;
    return pricePerGallon;
  }
}