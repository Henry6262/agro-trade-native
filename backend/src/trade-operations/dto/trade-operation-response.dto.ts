import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TradePhase, TradeStatus } from '@prisma/client';

export class SellerSummaryDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'John Farm' })
  name: string;

  @ApiProperty({ example: 50 })
  quantity: number;

  @ApiProperty({ example: 350 })
  price: number;

  @ApiProperty({ example: 'ACCEPTED' })
  status: string;

  @ApiPropertyOptional({ example: 'STANDARD' })
  quality?: string;

  @ApiPropertyOptional({ example: 120 })
  distance?: number;
}

export class BuyerSummaryDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'ABC Distributors' })
  name: string;

  @ApiProperty({ example: 100 })
  requestedQuantity: number;

  @ApiProperty({ example: 380 })
  maxPrice: number;

  @ApiPropertyOptional({ example: 'Sofia, Bulgaria' })
  location?: string;
}

export class ProfitSummaryDto {
  @ApiProperty({ example: 2650 })
  estimated: number;

  @ApiProperty({ example: 6.97 })
  margin: number;

  @ApiProperty({ example: true })
  isViable: boolean;

  @ApiPropertyOptional({ example: 2750 })
  actual?: number;

  @ApiPropertyOptional({ example: 7.24 })
  actualMargin?: number;
}

export class TransportSummaryDto {
  @ApiProperty({ example: 150 })
  estimatedCost: number;

  @ApiProperty({ example: 245 })
  distance: number;

  @ApiProperty({ example: true })
  optimized: boolean;

  @ApiPropertyOptional({ example: 'FLATBED' })
  vehicleType?: string;

  @ApiPropertyOptional({ example: 155.50 })
  actualCost?: number;
}

export class TradeOperationResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ enum: TradePhase, example: 'NEGOTIATION' })
  phase: TradePhase;

  @ApiProperty({ enum: TradeStatus, example: 'ACTIVE' })
  status: TradeStatus;

  @ApiProperty({ type: BuyerSummaryDto })
  buyer: BuyerSummaryDto;

  @ApiProperty({ type: [SellerSummaryDto] })
  sellers: SellerSummaryDto[];

  @ApiProperty({ type: ProfitSummaryDto })
  profit: ProfitSummaryDto;

  @ApiProperty({ type: TransportSummaryDto })
  transport: TransportSummaryDto;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T14:45:00Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ example: '2024-01-20T12:00:00Z' })
  expectedDeliveryDate?: Date;

  @ApiPropertyOptional({ example: '2024-01-18T16:30:00Z' })
  confirmedAt?: Date;

  @ApiPropertyOptional({ example: '2024-01-20T14:30:00Z' })
  completedAt?: Date;
}

export class TradeOperationListResponseDto {
  @ApiProperty({ type: [TradeOperationResponseDto] })
  data: TradeOperationResponseDto[];

  @ApiProperty({ example: 25 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;
}

export class TradeAnalyticsDto {
  @ApiProperty({ example: 150 })
  totalTrades: number;

  @ApiProperty({ example: 7.5 })
  averageMargin: number;

  @ApiProperty({ example: 45000 })
  totalProfit: number;

  @ApiProperty({ example: 92.5 })
  successRate: number;

  @ApiProperty({
    example: {
      'Below 5%': 5,
      '5-7%': 35,
      '7-10%': 45,
      'Above 10%': 15,
    },
  })
  marginDistribution: Record<string, number>;

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00Z' })
  periodStart?: Date;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59Z' })
  periodEnd?: Date;
}