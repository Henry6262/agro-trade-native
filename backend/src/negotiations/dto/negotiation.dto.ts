import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  IsPositive,
  Min,
  ValidateNested,
  IsNotEmpty,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NegotiationStatus } from '@prisma/client';

// Request DTOs for new negotiation management

export class CreateOfferDto {
  @ApiProperty({
    description: 'Trade seller ID to send offer to',
    example: 'clxyzabc123',
  })
  @IsString()
  @IsNotEmpty()
  tradeSellerId: string;

  @ApiProperty({
    description: 'Offered price per unit',
    example: 340,
  })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({
    description: 'Quantity for negotiation',
    example: 100,
  })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiPropertyOptional({
    description: 'Additional terms or conditions',
    example: 'Payment on delivery, quality inspection required',
  })
  @IsString()
  @IsOptional()
  terms?: string;
}

export class BatchOfferDto {
  @ApiProperty({
    description: 'Array of offers to send to multiple sellers',
    type: [CreateOfferDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOfferDto)
  offers: CreateOfferDto[];
}

export class CounterOfferDto {
  @ApiProperty({
    description: 'Counter-offered price per unit',
    example: 345,
  })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({
    description: 'Counter-offered quantity',
    example: 100,
  })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiPropertyOptional({
    description: 'Counter-offer terms',
    example: 'Can deliver within 3 days at this price',
  })
  @IsString()
  @IsOptional()
  terms?: string;

  @ApiPropertyOptional({
    description: 'Reason for counter-offer',
    example: 'Current market conditions require higher price',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class AcceptOfferDto {
  @ApiPropertyOptional({
    description: 'Acceptance note',
    example: 'Terms accepted, delivery expected within 5 days',
  })
  @IsString()
  @IsOptional()
  acceptanceNote?: string;
}

export class RejectOfferDto {
  @ApiPropertyOptional({
    description: 'Reason for rejection',
    example: 'Price too low for quality offered',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class WithdrawOfferDto {
  @ApiPropertyOptional({
    description: 'Reason for withdrawal',
    example: 'Trade strategy changed',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class ExtendExpiryDto {
  @ApiProperty({
    description: 'Hours to extend the negotiation expiry',
    example: 24,
  })
  @IsNumber()
  @Min(1)
  hours: number;

  @ApiPropertyOptional({
    description: 'Reason for extension',
    example: 'Seller requested more time to review',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class BulkWithdrawDto {
  @ApiPropertyOptional({
    description: 'Reason for bulk withdrawal',
    example: 'Changing procurement strategy',
  })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Whether to notify sellers of withdrawal',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  notifySellers?: boolean;
}

// Legacy DTOs (for backward compatibility)

export class NegotiationOfferDto {
  @ApiProperty({
    description: 'Trade operation ID',
    example: 'clxyzabc123',
  })
  @IsString()
  tradeOperationId: string;

  @ApiProperty({
    description: 'Offered price per unit',
    example: 375,
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'Quantity for negotiation',
    example: 100,
  })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({
    description: 'Additional terms or conditions',
    example: 'Payment on delivery, quality inspection required',
  })
  @IsOptional()
  @IsString()
  terms?: string;
}

export class SellerNegotiationOfferDto {
  @ApiProperty({
    description: 'Trade seller ID',
    example: 'clxyzabc123',
  })
  @IsString()
  tradeSellerId: string;

  @ApiProperty({
    description: 'Offered price per unit',
    example: 345,
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'Quantity for negotiation',
    example: 50,
  })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({
    description: 'Response type',
    example: 'COUNTER',
  })
  @IsOptional()
  @IsString()
  response?: string;

  @ApiPropertyOptional({
    description: 'Response note or counter-offer explanation',
    example: 'Can accept 350 per unit for immediate payment',
  })
  @IsOptional()
  @IsString()
  responseNote?: string;
}

export class BulkNegotiationDto {
  @ApiProperty({
    description: 'Trade operation ID',
    example: 'clxyzabc123',
  })
  @IsString()
  tradeOperationId: string;

  @ApiPropertyOptional({
    description: 'Buyer offer',
    type: 'object',
  })
  @IsOptional()
  buyerOffer?: {
    price: number;
    quantity: number;
  };

  @ApiProperty({
    description: 'Seller offers',
    type: [SellerNegotiationOfferDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SellerNegotiationOfferDto)
  sellerOffers: SellerNegotiationOfferDto[];
}

// Response DTOs

export class ProfitImpactDto {
  @ApiProperty({ example: 2650 })
  estimatedProfit: number;

  @ApiProperty({ example: 6.97 })
  profitMargin: number;

  @ApiPropertyOptional({ example: -150 })
  profitChange?: number;

  @ApiPropertyOptional({ example: 'Profit margin below minimum 5%' })
  warning?: string;

  @ApiPropertyOptional({ example: false })
  isFinal?: boolean;
}

export class NegotiationRoundResponseDto {
  @ApiProperty({ example: 'clxyzabc123' })
  id: string;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;

  @ApiProperty({ example: 3 })
  roundNumber: number;

  @ApiProperty({ example: 'SELLER' })
  offerType: string;

  @ApiProperty()
  currentOffer: {
    price: number;
    quantity: number;
    terms?: string;
  };

  @ApiPropertyOptional()
  counterOffer?: {
    price: number;
    quantity: number;
    terms?: string;
  };

  @ApiPropertyOptional({ type: ProfitImpactDto })
  profitImpact?: ProfitImpactDto;

  @ApiProperty()
  timestamp: Date;
}

export class PriceSuggestionDto {
  @ApiProperty()
  buyerTarget: {
    suggestedPrice: number;
    expectedProfit: number;
    profitMargin: number;
  };

  @ApiProperty({ type: 'array' })
  sellerTargets: Array<{
    sellerId: string;
    suggestedPrice: number;
    expectedAcceptance: number;
  }>;

  @ApiProperty()
  optimalScenario: {
    totalCost: number;
    totalRevenue: number;
    estimatedProfit: number;
    profitMargin: number;
  };
}

export class NegotiationSummaryDto {
  @ApiProperty()
  tradeOperationId: string;

  @ApiPropertyOptional()
  buyerNegotiation?: {
    status: string;
    currentSellingPrice: number;
    targetSellingPrice: number;
    rounds: number;
  };

  @ApiProperty({ type: 'array' })
  sellerNegotiations: Array<{
    sellerId: string;
    sellerName: string;
    status: string;
    currentPurchasePrice: number;
    quantity: number;
    rounds: number;
  }>;

  @ApiProperty()
  profitAnalysis: {
    currentProfit: number;
    currentMargin: number;
    targetProfit: number;
    targetMargin: number;
    variance: number;
  };

  @ApiProperty()
  estimatedProfit: number;

  @ApiProperty()
  profitMargin: number;
}

export class NegotiationHistoryDto {
  @ApiProperty()
  negotiationId: string;

  @ApiProperty({ type: 'array' })
  history: Array<{
    round: number;
    timestamp: Date;
    offerType: 'INITIAL' | 'COUNTER' | 'ACCEPTANCE';
    price: number;
    quantity: number;
    terms?: string;
    note?: string;
  }>;

  @ApiProperty()
  currentStatus: string;

  @ApiPropertyOptional()
  finalAgreement?: {
    price: number;
    quantity: number;
    agreedAt: Date;
  };
}

export class ProfitTrackingDto {
  @ApiProperty()
  round: number;

  @ApiProperty()
  timestamp: Date;

  @ApiProperty()
  estimatedProfit: number;

  @ApiProperty()
  profitMargin: number;

  @ApiProperty()
  changeSinceLastRound: number;

  @ApiProperty()
  factors: {
    sellingPriceImpact?: number;
    purchasePriceImpact?: number;
    quantityImpact?: number;
    transportCostImpact?: number;
  };
}