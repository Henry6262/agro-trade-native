import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductUnit, SellerStatus } from '@prisma/client';

export class TradeSellerDto {
  @ApiProperty({ example: 'ts_123' })
  id: string;

  @ApiProperty({ example: 'seller_123' })
  sellerId: string;

  @ApiPropertyOptional({ example: 'Acme Farms Ltd' })
  name?: string;

  @ApiProperty({ example: 'listing_456' })
  saleListingId: string;

  @ApiProperty({ example: 40 })
  requestedQuantity: number;

  @ApiProperty({ example: 50 })
  offeredQuantity: number;

  @ApiPropertyOptional({ example: 45 })
  agreedQuantity?: number | null;

  @ApiProperty({ enum: ProductUnit, example: ProductUnit.TON })
  unit: ProductUnit;

  @ApiPropertyOptional({ example: 320 })
  price?: number;

  @ApiProperty({ enum: SellerStatus, example: SellerStatus.NEGOTIATING })
  status: SellerStatus;
}

export class AddSellersResponseDto {
  @ApiProperty({ example: 'Sellers added successfully' })
  message: string;

  @ApiProperty({ type: [TradeSellerDto] })
  sellersAdded: TradeSellerDto[];
}

export class OptimizeTransportResponseDto {
  @ApiProperty({ example: 'Transport route optimized successfully' })
  message: string;

  @ApiProperty({ description: 'Optimized route data', example: { sequence: [] } })
  optimizedRoute: Record<string, any>;

  @ApiProperty({ example: 320.5 })
  estimatedCost: number;

  @ApiProperty({ example: 45.2 })
  distanceSaved: number;
}

export class FinalizeTradeResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 1500 })
  finalProfit: number;

  @ApiProperty({ example: 7.3 })
  profitMargin: number;

  @ApiProperty({ example: 'Trade finalized successfully with 7.30% profit margin' })
  message: string;
}

export class TradeProfitResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: 'object' })
  data: Record<string, any>;
}
