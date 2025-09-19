import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, ValidateNested, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class SellerPriceDto {
  @ApiProperty({ example: 'cmfk0hzzh0004bfffxe82z2jz' })
  @IsString()
  sellerId: string;

  @ApiProperty({ example: 350 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(0)
  quantity: number;
}

export class ProfitCalculationRequestDto {
  @ApiProperty({
    description: 'Trade operation ID to calculate profit for',
    example: 'cmfk0hzzh0004bfffxe82z2jz',
  })
  @IsString()
  tradeOperationId: string;

  @ApiPropertyOptional({
    description: 'Include sensitivity analysis in response',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  includeSensitivity?: boolean;

  @ApiPropertyOptional({
    description: 'Include risk assessment in response',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  includeRiskAssessment?: boolean;
}

export class ProfitEstimationDto {
  @ApiProperty({
    description: 'Trade operation ID',
    example: 'cmfk0hzzh0004bfffxe82z2jz',
  })
  @IsString()
  tradeOperationId: string;

  @ApiProperty({
    description: 'Proposed buyer price per unit',
    example: 380,
  })
  @IsNumber()
  @Min(0)
  buyerPrice: number;

  @ApiProperty({
    description: 'Proposed seller prices',
    type: [SellerPriceDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SellerPriceDto)
  sellerPrices: SellerPriceDto[];

  @ApiPropertyOptional({
    description: 'Override transport cost estimation',
    example: 150,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  transportCost?: number;

  @ApiPropertyOptional({
    description: 'Save this estimation for future reference',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  saveEstimation?: boolean;
}

export class RevenueBreakdownDto {
  @ApiProperty({ example: 380 })
  sellingPrice: number;

  @ApiProperty({ example: 100 })
  quantity: number;

  @ApiProperty({ example: 38000 })
  totalRevenue: number;

  @ApiProperty({ example: 'EUR' })
  currency: string;
}

export class PurchaseCostBreakdownDto {
  @ApiProperty({ example: 35200 })
  totalCost: number;

  @ApiProperty({ example: 352 })
  avgPrice: number;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        sellerId: { type: 'string' },
        quantity: { type: 'number' },
        price: { type: 'number' },
        totalCost: { type: 'number' },
      },
    },
  })
  breakdown: Array<{
    sellerId: string;
    quantity: number;
    price: number;
    totalCost: number;
  }>;
}

export class TransportCostBreakdownDto {
  @ApiProperty({ example: 150 })
  estimatedCost: number;

  @ApiPropertyOptional({ example: 155.50 })
  actualCost?: number;

  @ApiProperty({ example: 245 })
  distance: number;

  @ApiProperty({ example: 0.15 })
  ratePerKm: number;

  @ApiPropertyOptional({ example: 'FLATBED' })
  vehicleType?: string;
}

export class CostBreakdownDto {
  @ApiProperty({ type: PurchaseCostBreakdownDto })
  purchases: PurchaseCostBreakdownDto;

  @ApiProperty({ type: TransportCostBreakdownDto })
  transport: TransportCostBreakdownDto;

  @ApiProperty({ example: 35350 })
  totalCosts: number;
}

export class ProfitMetricsDto {
  @ApiProperty({ example: 2800 })
  grossProfit: number;

  @ApiProperty({ example: 2650 })
  netProfit: number;

  @ApiProperty({ example: 6.97 })
  profitMargin: number;

  @ApiProperty({ example: 'EUR' })
  currency: string;

  @ApiPropertyOptional({ example: true })
  meetsMinimumMargin?: boolean;

  @ApiPropertyOptional({ example: false })
  meetsTargetMargin?: boolean;
}

export class ProfitCalculationResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  tradeOperationId: string;

  @ApiProperty({ type: RevenueBreakdownDto })
  revenue: RevenueBreakdownDto;

  @ApiProperty({ type: CostBreakdownDto })
  costs: CostBreakdownDto;

  @ApiProperty({ type: ProfitMetricsDto })
  profit: ProfitMetricsDto;

  @ApiProperty({
    type: 'object',
    properties: {
      isEstimated: { type: 'boolean' },
      lastUpdated: { type: 'string', format: 'date-time' },
    },
  })
  status: {
    isEstimated: boolean;
    lastUpdated: Date;
  };

  @ApiPropertyOptional({
    description: 'Sensitivity analysis if requested',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        priceChange: { type: 'number' },
        newMargin: { type: 'number' },
        impact: { type: 'string' },
      },
    },
  })
  sensitivity?: Array<{
    priceChange: number;
    newMargin: number;
    impact: string;
  }>;

  @ApiPropertyOptional({
    description: 'Risk assessment if requested',
    type: 'object',
    properties: {
      level: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
      factors: { type: 'array', items: { type: 'string' } },
      mitigation: { type: 'array', items: { type: 'string' } },
    },
  })
  riskAssessment?: {
    level: 'LOW' | 'MEDIUM' | 'HIGH';
    factors: string[];
    mitigation: string[];
  };
}

export class ProfitEstimationResponseDto {
  @ApiProperty({ example: 2650 })
  estimatedProfit: number;

  @ApiProperty({ example: 6.97 })
  profitMargin: number;

  @ApiProperty({ example: true })
  isViable: boolean;

  @ApiProperty({
    type: 'array',
    items: { type: 'string' },
    example: ['Profit margin 6.97% is below target 7%'],
  })
  warnings: string[];

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  estimationId?: string;
}

export class ProfitComparisonDto {
  @ApiProperty({
    type: 'object',
    properties: {
      profit: { type: 'number' },
      margin: { type: 'number' },
    },
  })
  current: {
    profit: number;
    margin: number;
  };

  @ApiProperty({
    type: 'object',
    properties: {
      profit: { type: 'number' },
      margin: { type: 'number' },
    },
  })
  proposed: {
    profit: number;
    margin: number;
  };

  @ApiProperty({ example: 150 })
  profitDifference: number;

  @ApiProperty({ example: 0.5 })
  marginDifference: number;

  @ApiProperty({ example: 'INCREASE', enum: ['INCREASE', 'DECREASE', 'NO_CHANGE'] })
  trend: 'INCREASE' | 'DECREASE' | 'NO_CHANGE';
}