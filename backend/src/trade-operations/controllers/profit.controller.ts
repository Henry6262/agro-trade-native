import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { ProfitCalculationService } from '../services/profit-calculation.service';

@ApiTags('Profit Calculations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('profit')
export class ProfitController {
  constructor(private readonly profitService: ProfitCalculationService) {}

  @Get(':tradeOperationId/calculate')
  async calculateProfit(@Param('tradeOperationId') tradeOperationId: string) {
    const calculation = await this.profitService.calculateProfit(tradeOperationId);
    return {
      ...calculation,
      breakdown: {
        revenue: calculation.revenue.totalRevenue,
        purchaseCosts: calculation.costs.purchases.totalCost,
        transportCosts:
          calculation.costs.transport.actualCost ?? calculation.costs.transport.estimatedCost,
      },
    };
  }
}
