import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ProfitCalculationService } from '../services/profit-calculation.service';

@Controller('profit')
export class ProfitController {
  constructor(private readonly profitService: ProfitCalculationService) {}

  @Get(':tradeOperationId/calculate')
  async calculateProfit(@Param('tradeOperationId') tradeOperationId: string) {
    return this.profitService.calculateProfit(tradeOperationId);
  }

  @Post(':tradeOperationId/impact')
  async calculateProfitImpact(@Param('tradeOperationId') _tradeOperationId: string, @Body() dto: unknown) {
    return this.profitService.calculateProfitImpact(dto);
  }

  @Post(':tradeOperationId/optimize')
  async optimizeProfitMargins(@Param('tradeOperationId') _tradeOperationId: string, @Body() dto: unknown) {
    return this.profitService.optimizeProfitMargins(dto);
  }

  @Post('validate-margins')
  async validateMargins(@Body() dto: unknown) {
    return this.profitService.validateMargins(dto);
  }

  @Get('cumulative')
  async getCumulativeProfit(@Query() query: unknown) {
    return this.profitService.getCumulativeProfit(query);
  }

  @Post('forecast')
  async forecastProfit(@Body() dto: unknown) {
    return this.profitService.forecastProfit(dto);
  }

  @Get('benchmarks')
  async getBenchmarks() {
    return this.profitService.getBenchmarks();
  }
}
