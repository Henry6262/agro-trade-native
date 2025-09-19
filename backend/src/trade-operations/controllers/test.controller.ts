import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProfitCalculationService } from '../services/profit-calculation.service';

@ApiTags('Test Endpoints')
@Controller('test')
export class TestController {
  constructor(
    private readonly profitCalculationService: ProfitCalculationService,
  ) {}

  @Get('profit-demo')
  @ApiOperation({ summary: 'Demo profit calculation without authentication' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profit calculation demo',
  })
  async profitDemo() {
    // Demo calculation
    const mockTrade = {
      buyerPrice: 375, // €375/ton selling to buyer
      sellerPrices: [
        { price: 345, quantity: 50 }, // €345/ton from seller 1
        { price: 350, quantity: 50 }, // €350/ton from seller 2
      ],
      transportCost: 1000, // €1000 total transport
    };

    const totalQuantity = mockTrade.sellerPrices.reduce((sum, s) => sum + s.quantity, 0);
    const totalRevenue = mockTrade.buyerPrice * totalQuantity;
    const totalPurchaseCost = mockTrade.sellerPrices.reduce(
      (sum, s) => sum + s.price * s.quantity,
      0,
    );
    const totalCosts = totalPurchaseCost + mockTrade.transportCost;
    const profit = totalRevenue - totalCosts;
    const profitMargin = (profit / totalRevenue) * 100;

    return {
      message: 'Agro-Trade Profit Calculation Demo',
      businessModel: 'Trading Intermediary (Buy & Resell)',
      formula: 'PROFIT = Selling Price - (Purchase Price + Transport Costs)',
      example: mockTrade,
      calculation: {
        revenue: {
          sellingPrice: mockTrade.buyerPrice,
          quantity: totalQuantity,
          totalRevenue,
          currency: 'EUR',
        },
        costs: {
          purchases: {
            breakdown: mockTrade.sellerPrices,
            totalCost: totalPurchaseCost,
          },
          transport: {
            cost: mockTrade.transportCost,
          },
          totalCosts,
        },
        profit: {
          grossProfit: profit,
          netProfit: profit,
          profitMargin: Math.round(profitMargin * 100) / 100,
          meetsMinimumMargin: profitMargin >= 5,
          viability: profitMargin >= 7 ? 'GOOD' : profitMargin >= 5 ? 'ACCEPTABLE' : 'UNVIABLE',
        },
      },
      targets: {
        minimumMargin: 5,
        targetMargin: 7,
        optimalMargin: 10,
      },
      endpoints: {
        tradeOperations: '/api/trade-operations',
        profitCalculation: '/api/profit/:tradeOperationId/calculate',
        transportOptimization: '/api/transport/optimize-route',
        negotiations: '/api/negotiations/buyer-offer',
        scenarios: '/api/scenarios/generate',
      },
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service is healthy',
  })
  async health() {
    return {
      status: 'healthy',
      service: 'Agro-Trade Profit API',
      timestamp: new Date().toISOString(),
      features: [
        'Trade Operations Management',
        'Real-time Profit Calculations',
        'Transport Cost Optimization',
        'Price Negotiations',
        'Scenario Analysis',
      ],
    };
  }
}