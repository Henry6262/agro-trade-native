import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Param,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { MarketDataService } from './market-data.service';
import { Public } from '../auth/decorators/public.decorator';

interface TransportCostDto {
  distanceKm: number;
  weightTons: number;
}

@Controller('market-data')
export class MarketDataController {
  constructor(private readonly marketDataService: MarketDataService) {}

  // Get latest market prices for all commodities
  @Public()
  @Get('prices')
  async getLatestPrices() {
    const prices = await this.marketDataService.getLatestPrices();
    return {
      success: true,
      data: prices,
      timestamp: new Date(),
    };
  }

  // Get historical prices for a specific commodity
  @Public()
  @Get('prices/history/:commodity')
  async getHistoricalPrices(
    @Param('commodity') commodity: string,
    @Query('days') days?: string,
  ) {
    const daysCount = days ? parseInt(days, 10) : 30;
    const history = await this.marketDataService.getHistoricalPrices(
      commodity.toUpperCase(),
      daysCount,
    );
    
    return {
      success: true,
      commodity: commodity.toUpperCase(),
      days: daysCount,
      data: history,
    };
  }

  // Get price for specific commodity
  @Public()
  @Get('prices/:commodity')
  async getCommodityPrice(@Param('commodity') commodity: string) {
    const prices = await this.marketDataService.getLatestPrices();
    const price = prices.find(
      p => p.commodity === commodity.toUpperCase()
    );
    
    if (!price) {
      return {
        success: false,
        message: `Price not available for commodity: ${commodity}`,
      };
    }
    
    return {
      success: true,
      data: price,
    };
  }

  // Calculate transport cost based on distance and weight
  @Public()
  @Post('transport-cost')
  @HttpCode(HttpStatus.OK)
  async calculateTransportCost(@Body() dto: TransportCostDto) {
    const { distanceKm, weightTons } = dto;
    
    if (distanceKm <= 0 || weightTons <= 0) {
      return {
        success: false,
        message: 'Distance and weight must be positive values',
      };
    }
    
    const cost = await this.marketDataService.calculateTransportCost(
      distanceKm,
      weightTons,
    );
    
    return {
      success: true,
      data: cost,
    };
  }

  // Get available commodities list
  @Public()
  @Get('commodities')
  async getAvailableCommodities() {
    const { TRACKED_COMMODITIES } = await import('./market-data.service');
    
    return {
      success: true,
      data: {
        agricultural: [
          'WHEAT',
          'CORN',
          'SUNFLOWER',
          'BARLEY',
          'OATS',
          'RAPESEED',
          'SOYBEAN',
        ],
        fuel: ['DIESEL', 'GASOLINE', 'CRUDEOIL'],
        currency: ['EUR', 'USD'],
      },
      total: Object.keys(TRACKED_COMMODITIES).length,
    };
  }

  // Force refresh prices (admin only in production)
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshPrices() {
    const prices = await this.marketDataService.fetchLatestPrices();
    
    return {
      success: true,
      message: 'Prices refreshed successfully',
      count: prices.length,
      data: prices,
    };
  }

  // Get market summary (dashboard data)
  @Public()
  @Get('summary')
  async getMarketSummary() {
    const prices = await this.marketDataService.getLatestPrices();
    
    // Group by category
    const agricultural = prices.filter(p => 
      ['WHEAT', 'CORN', 'SUNFLOWER', 'BARLEY', 'OATS', 'RAPESEED', 'SOYBEAN'].includes(p.commodity)
    );
    
    const fuel = prices.filter(p => 
      ['DIESEL', 'GASOLINE', 'CRUDEOIL'].includes(p.commodity)
    );
    
    const currency = prices.filter(p => 
      ['EUR', 'USD'].includes(p.commodity)
    );
    
    return {
      success: true,
      data: {
        agricultural: {
          items: agricultural,
          average: agricultural.reduce((sum, p) => sum + p.price, 0) / agricultural.length,
        },
        fuel: {
          items: fuel,
          average: fuel.reduce((sum, p) => sum + p.price, 0) / fuel.length,
        },
        currency: {
          items: currency,
        },
        lastUpdate: prices[0]?.timestamp || new Date(),
      },
    };
  }
}