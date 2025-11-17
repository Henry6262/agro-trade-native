import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { NegotiationStatus } from "@prisma/client";

export class NegotiationSellerDto {
  @ApiProperty({ example: "seller_123" })
  id: string;

  @ApiProperty({ example: "Green Grain Co." })
  name: string;

  @ApiPropertyOptional({ example: "seller@example.com" })
  email?: string;
}

export class NegotiationSaleListingDto {
  @ApiProperty({ example: "listing_456" })
  id: string;

  @ApiProperty({ example: 120 })
  quantity: number;

  @ApiProperty({ example: 340 })
  askingPrice: number;
}

export class NegotiationTradeSellerDto {
  @ApiProperty({ example: "ts_123" })
  id: string;

  @ApiProperty({ example: 40 })
  requestedQuantity: number;

  @ApiProperty({ example: 50 })
  offeredQuantity: number;

  @ApiProperty({ example: "PENDING" })
  status: string;

  @ApiProperty({ type: NegotiationSellerDto })
  seller: NegotiationSellerDto;

  @ApiProperty({ type: NegotiationSaleListingDto })
  saleListing: NegotiationSaleListingDto;
}

export class OfferSnapshotDto {
  @ApiProperty({ example: 340 })
  price: number;

  @ApiProperty({ example: 40 })
  quantity: number;

  @ApiPropertyOptional({ example: "Shipment within 5 days" })
  terms?: string;

  @ApiPropertyOptional({ example: "2024-01-15T12:00:00Z" })
  createdAt?: string;

  @ApiPropertyOptional({ example: "Need higher price to cover logistics" })
  reason?: string;

  @ApiPropertyOptional({ example: true })
  isCounterOffer?: boolean;
}

export class ProfitImpactDto {
  @ApiProperty({ example: 2600 })
  estimatedProfit: number;

  @ApiProperty({ example: 6.8 })
  profitMargin: number;

  @ApiPropertyOptional({ example: -120 })
  profitChange?: number;

  @ApiPropertyOptional({ example: "Profit margin 4.9% is below minimum 5%" })
  warning?: string;
}

export class NegotiationWithDetailsDto {
  @ApiProperty({ example: "neg_123" })
  id: string;

  @ApiProperty({ example: "trade_123" })
  tradeOperationId: string;

  @ApiProperty({ example: "ts_123" })
  tradeSellerId: string;

  @ApiProperty({ enum: NegotiationStatus, example: NegotiationStatus.PENDING })
  status: NegotiationStatus;

  @ApiProperty({ type: OfferSnapshotDto })
  currentOffer: OfferSnapshotDto;

  @ApiPropertyOptional({ type: OfferSnapshotDto })
  counterOffer?: OfferSnapshotDto;

  @ApiProperty({ type: [OfferSnapshotDto] })
  offerHistory: OfferSnapshotDto[];

  @ApiPropertyOptional({ example: 340 })
  finalPrice?: number;

  @ApiPropertyOptional({ example: 40 })
  finalQuantity?: number;

  @ApiProperty({ example: "2024-01-18T15:00:00Z" })
  expiresAt: Date;

  @ApiPropertyOptional({ example: 12 })
  hoursUntilExpiry?: number;

  @ApiPropertyOptional({ example: true })
  isExpiringSoon?: boolean;

  @ApiProperty({ type: NegotiationTradeSellerDto })
  tradeSeller: NegotiationTradeSellerDto;

  @ApiPropertyOptional({ type: ProfitImpactDto })
  profitImpact?: ProfitImpactDto;
}

export class NegotiationSummaryDto {
  @ApiProperty({ example: "trade_123" })
  tradeOperationId: string;

  @ApiProperty({ example: 12 })
  totalNegotiations: number;

  @ApiProperty({ type: [NegotiationWithDetailsDto] })
  negotiations: NegotiationWithDetailsDto[];

  @ApiProperty({
    type: "object",
    properties: {
      pending: { type: "number" },
      countered: { type: "number" },
      accepted: { type: "number" },
      rejected: { type: "number" },
      expired: { type: "number" },
      withdrawn: { type: "number" },
    },
  })
  summary: {
    pending: number;
    countered: number;
    accepted: number;
    rejected: number;
    expired: number;
    withdrawn: number;
  };

  @ApiPropertyOptional({
    type: "object",
    properties: {
      totalRequestedQuantity: { type: "number" },
      totalAgreedQuantity: { type: "number" },
      averageOfferPrice: { type: "number" },
      averageAgreedPrice: { type: "number" },
      estimatedTotalCost: { type: "number" },
      estimatedProfit: { type: "number" },
      profitMargin: { type: "number" },
    },
  })
  profitAnalysis?: {
    totalRequestedQuantity: number;
    totalAgreedQuantity: number;
    averageOfferPrice: number;
    averageAgreedPrice: number;
    estimatedTotalCost: number;
    estimatedProfit: number;
    profitMargin: number;
  };

  @ApiPropertyOptional({
    type: "object",
    properties: {
      allSellersAccepted: { type: "boolean" },
      readyForNextPhase: { type: "boolean" },
      nextPhase: { type: "string" },
      message: { type: "string" },
    },
  })
  phaseTransition?: {
    allSellersAccepted: boolean;
    readyForNextPhase: boolean;
    nextPhase?: string;
    message?: string;
  };

  @ApiPropertyOptional({
    description: "Price comparison for countered negotiations",
    type: "object",
    properties: {
      lowestCounter: { type: "number" },
      highestCounter: { type: "number" },
      averageCounter: { type: "number" },
      priceSpread: { type: "number" },
      bestDeal: {
        type: "object",
        nullable: true,
        properties: {
          negotiationId: { type: "string" },
          price: { type: "number" },
          seller: { type: "string" },
        },
      },
    },
  })
  priceComparison?: {
    lowestCounter: number;
    highestCounter: number;
    averageCounter: number;
    priceSpread: number;
    bestDeal: {
      negotiationId: string;
      price: number;
      seller: string;
    } | null;
  };
}

export class NegotiationErrorDto {
  @ApiProperty({ example: "NEGOTIATION_NOT_FOUND" })
  code: string;

  @ApiProperty({ example: "Negotiation not found" })
  message: string;
}

export class NegotiationResponseWrapperDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiPropertyOptional({ type: NegotiationWithDetailsDto })
  data?: NegotiationWithDetailsDto;

  @ApiPropertyOptional({ type: NegotiationErrorDto })
  error?: NegotiationErrorDto;
}

export class NegotiationSummaryWrapperDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiPropertyOptional({ type: NegotiationSummaryDto })
  data?: NegotiationSummaryDto;

  @ApiPropertyOptional({ type: NegotiationErrorDto })
  error?: NegotiationErrorDto;
}

export class BatchOfferErrorDto {
  @ApiProperty({ example: "ts_123" })
  tradeSellerId: string;

  @ApiProperty({ example: "Negotiation already exists for this seller" })
  error: string;
}

export class BatchOffersResultDto {
  @ApiProperty({ example: 2 })
  created: number;

  @ApiProperty({ example: 1 })
  failed: number;

  @ApiProperty({ type: [NegotiationWithDetailsDto] })
  negotiations: NegotiationWithDetailsDto[];

  @ApiPropertyOptional({ type: [BatchOfferErrorDto] })
  errors?: BatchOfferErrorDto[];
}

export class NegotiationBatchResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiPropertyOptional({ type: BatchOffersResultDto })
  data?: BatchOffersResultDto;

  @ApiPropertyOptional({ type: NegotiationErrorDto })
  error?: NegotiationErrorDto;
}

export class ExtendExpiryResultDto {
  @ApiProperty({ example: "neg_123" })
  id: string;

  @ApiPropertyOptional({ example: "2024-01-15T10:00:00Z" })
  previousExpiry?: string;

  @ApiPropertyOptional({ example: "2024-01-16T10:00:00Z" })
  newExpiry?: string;

  @ApiPropertyOptional({ example: 24 })
  extensionHours?: number;

  @ApiPropertyOptional({ example: 1 })
  totalExtensions?: number;
}

export class ExtendExpiryResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiPropertyOptional({ type: ExtendExpiryResultDto })
  data?: ExtendExpiryResultDto;

  @ApiPropertyOptional({ type: NegotiationErrorDto })
  error?: NegotiationErrorDto;
}

export class ExpiringNegotiationItemDto {
  @ApiProperty({ example: "neg_123" })
  id: string;

  @ApiProperty({ example: 4 })
  hoursRemaining: number;

  @ApiProperty({ example: "HIGH" })
  urgency: "HIGH" | "MEDIUM" | "LOW";

  @ApiProperty({ example: "Follow up immediately" })
  recommendedAction: string;
}

export class ExpiringSummaryDto {
  @ApiProperty({ example: 12 })
  total: number;

  @ApiProperty({ example: 3 })
  expiringSoon: number;

  @ApiProperty({ example: 2 })
  expired: number;
}

export class ExpiringNegotiationsDataDto {
  @ApiProperty({ type: [ExpiringNegotiationItemDto] })
  expiringSoon: ExpiringNegotiationItemDto[];

  @ApiProperty({ type: ExpiringSummaryDto })
  summary: ExpiringSummaryDto;
}

export class ExpiringNegotiationsResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiPropertyOptional({ type: ExpiringNegotiationsDataDto })
  data?: ExpiringNegotiationsDataDto;

  @ApiPropertyOptional({ type: NegotiationErrorDto })
  error?: NegotiationErrorDto;
}

export class NegotiationMetricsDataDto {
  @ApiProperty({ example: 12 })
  totalNegotiations: number;

  @ApiProperty({ example: 33.3 })
  counterOfferRate: number;

  @ApiProperty({ example: 50 })
  acceptanceAfterCounter: number;

  @ApiProperty({ example: 25 })
  rejectionAfterCounter: number;

  @ApiProperty({ example: 3 })
  averageRounds: number;

  @ApiProperty({ example: 5.2 })
  averagePriceMovement: number;
}

export class NegotiationMetricsResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiPropertyOptional({ type: NegotiationMetricsDataDto })
  data?: NegotiationMetricsDataDto;

  @ApiPropertyOptional({ type: NegotiationErrorDto })
  error?: NegotiationErrorDto;
}
