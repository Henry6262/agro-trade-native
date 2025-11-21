import { ApiProperty } from "@nestjs/swagger";
import { TradePhase, TradeStatus, NegotiationStatus } from "@prisma/client";

/**
 * Active Operations Hub DTOs
 * Consolidated view for managing all active trade operations
 */

export class ActiveOperationSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  operationNumber: string;

  @ApiProperty({ enum: TradePhase })
  phase: TradePhase;

  @ApiProperty({ enum: TradeStatus })
  status: TradeStatus;

  @ApiProperty()
  buyerName: string;

  @ApiProperty()
  productName: string;

  @ApiProperty()
  requestedQuantity: number;

  @ApiProperty()
  securedQuantity: number;

  @ApiProperty()
  quantityGap: number;

  @ApiProperty()
  estimatedProfit: number;

  @ApiProperty()
  profitMargin: number;

  @ApiProperty()
  totalSellers: number;

  @ApiProperty()
  acceptedSellers: number;

  @ApiProperty()
  pendingNegotiations: number;

  @ApiProperty()
  expiringSoonCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  lastUpdated: Date;

  @ApiProperty({ required: false })
  urgency?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

  @ApiProperty({ required: false })
  nextAction?: string;
}

export class NegotiationSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tradeSellerId: string;

  @ApiProperty()
  sellerName: string;

  @ApiProperty({ enum: NegotiationStatus })
  status: NegotiationStatus;

  @ApiProperty()
  currentOfferPrice: number;

  @ApiProperty()
  requestedQuantity: number;

  @ApiProperty()
  hoursUntilExpiry: number;

  @ApiProperty()
  isExpiringSoon: boolean;

  @ApiProperty({ required: false })
  counterOfferPrice?: number;

  @ApiProperty({ required: false })
  priceChange?: number;

  @ApiProperty({ required: false })
  profitImpact?: number;
}

export class ActiveOperationDetailsDto extends ActiveOperationSummaryDto {
  @ApiProperty({ type: [NegotiationSummaryDto] })
  negotiations: NegotiationSummaryDto[];

  @ApiProperty()
  buyListingId: string;

  @ApiProperty()
  maxPricePerUnit: number;

  @ApiProperty()
  sellingPrice: number;

  @ApiProperty()
  estimatedTransportCost: number;

  @ApiProperty()
  totalRevenue: number;

  @ApiProperty()
  totalCost: number;

  @ApiProperty({ required: false })
  phaseTransition?: {
    canProgress: boolean;
    nextPhase?: TradePhase;
    blockers?: string[];
    message?: string;
  };
}

export class ActiveOperationsResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: [ActiveOperationSummaryDto] })
  operations: ActiveOperationSummaryDto[];

  @ApiProperty()
  total: number;

  @ApiProperty({
    example: {
      byPhase: {
        SELLER_MATCHING: 5,
        SELLER_NEGOTIATION: 12,
        INSPECTION_PENDING: 3,
        TRANSPORT_MATCHING: 2,
        IN_TRANSIT: 8,
      },
      byUrgency: {
        LOW: 10,
        MEDIUM: 15,
        HIGH: 4,
        CRITICAL: 1,
      },
      expiringSoon: 6,
      needsAttention: 8,
    },
  })
  summary: {
    byPhase: Record<string, number>;
    byUrgency: Record<string, number>;
    expiringSoon: number;
    needsAttention: number;
  };
}

export class ActiveOperationDetailResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: ActiveOperationDetailsDto })
  operation: ActiveOperationDetailsDto;
}

export class PotentialSellerDto {
  @ApiProperty()
  sellerId: string;

  @ApiProperty()
  sellerName: string;

  @ApiProperty()
  saleListingId: string;

  @ApiProperty()
  availableQuantity: number;

  @ApiProperty()
  askingPrice: number;

  @ApiProperty()
  distance: number;

  @ApiProperty()
  matchScore: number;

  @ApiProperty()
  estimatedProfit: number;

  @ApiProperty()
  profitMargin: number;

  @ApiProperty()
  recommendationReason: string;
}

export class PotentialSellersResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: [PotentialSellerDto] })
  sellers: PotentialSellerDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  quantityGap: number;

  @ApiProperty()
  canFulfillGap: boolean;

  @ApiProperty()
  recommendedCombination?: {
    sellerIds: string[];
    totalQuantity: number;
    avgPrice: number;
    estimatedProfit: number;
  };
}

export class OperationActionDto {
  @ApiProperty({
    enum: [
      "SEND_OFFERS",
      "FOLLOW_UP",
      "EXTEND_EXPIRY",
      "FIND_REPLACEMENT",
      "TRANSITION_PHASE",
    ],
  })
  action: string;

  @ApiProperty()
  operationId: string;

  @ApiProperty({ required: false })
  targetIds?: string[];

  @ApiProperty({ required: false })
  parameters?: Record<string, any>;
}

export class OperationActionResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  action: string;

  @ApiProperty()
  affectedCount: number;

  @ApiProperty()
  message: string;

  @ApiProperty({ required: false })
  errors?: Array<{ id: string; error: string }>;
}

export class OperationMetricsDto {
  @ApiProperty()
  operationId: string;

  @ApiProperty()
  sellerResponseRate: number;

  @ApiProperty()
  avgNegotiationDuration: number;

  @ApiProperty()
  counterOfferRate: number;

  @ApiProperty()
  acceptanceRate: number;

  @ApiProperty()
  expirationRate: number;

  @ApiProperty()
  avgPriceMovement: number;

  @ApiProperty()
  profitTrajectory: {
    initial: number;
    current: number;
    projected: number;
    trend: "IMPROVING" | "STABLE" | "DECLINING";
  };

  @ApiProperty()
  timeMetrics: {
    daysInPhase: number;
    totalDuration: number;
    estimatedCompletion: Date;
  };
}

export class OperationMetricsResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: OperationMetricsDto })
  metrics: OperationMetricsDto;
}

export class PendingInspectionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  saleListingId: string;

  @ApiProperty()
  sellerId: string;

  @ApiProperty()
  sellerName: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  priority: string;

  @ApiProperty()
  requestedDate: Date;

  @ApiProperty({ required: false })
  scheduledDate?: Date;
}

export class VerificationStatusDto {
  @ApiProperty()
  totalSellers: number;

  @ApiProperty()
  verifiedSellers: number;

  @ApiProperty()
  allVerified: boolean;

  @ApiProperty({ type: [PendingInspectionDto] })
  pendingInspections: PendingInspectionDto[];
}

export class VerificationStatusResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: VerificationStatusDto })
  data: VerificationStatusDto;
}
