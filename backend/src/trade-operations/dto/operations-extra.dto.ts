import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, ArrayMinSize } from 'class-validator';
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

export class CalculateTransportRequestDto {
  @ApiProperty({
    description: 'Array of seller IDs to calculate transport from',
    example: ['seller_123', 'seller_456'],
    type: [String]
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one seller ID is required' })
  @IsString({ each: true })
  sellerIds: string[];

  @ApiProperty({
    description: 'Buyer address ID to calculate transport to',
    example: 'addr_789'
  })
  @IsNotEmpty({ message: 'Buyer address ID is required' })
  @IsString()
  buyerAddressId: string;
}

export class TransportCostResultDto {
  @ApiProperty({ example: 'seller_123' })
  sellerId: string;

  @ApiProperty({ example: 145.3, description: 'Distance in kilometers' })
  distance: number;

  @ApiProperty({ example: 21.8, description: 'Transport cost in EUR' })
  transportCost: number;
}

export class CalculateTransportResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: [TransportCostResultDto] })
  results: TransportCostResultDto[];

  @ApiProperty({ example: 145.6, description: 'Total transport cost for all sellers' })
  totalCost: number;

  @ApiProperty({ example: 'EUR' })
  currency: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Optional warnings when using fallback locations or missing data',
  })
  warnings?: string[];
}
