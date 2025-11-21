import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TradePhase, TradeStatus } from "@prisma/client";

export class SellerInspectionSummaryDto {
  @ApiProperty({ example: "insp_123" })
  id: string;

  @ApiProperty({ example: "PENDING" })
  status: string;

  @ApiProperty({ example: "MEDIUM" })
  priority: string;

  @ApiPropertyOptional({ example: "2025-11-05T14:44:52.510Z" })
  requestedDate?: Date;

  @ApiPropertyOptional({ example: "2025-11-06T09:00:00.000Z" })
  scheduledDate?: Date;

  @ApiPropertyOptional({ example: "2025-11-06T15:30:00.000Z" })
  completedDate?: Date;

  @ApiPropertyOptional({
    example: {
      id: "user_123",
      name: "Ivan Petrov",
      email: "inspector@agro.bg",
    },
  })
  inspector?: {
    id: string;
    name: string | null;
    email?: string | null;
  } | null;
}

export class SellerSummaryDto {
  @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
  id: string;

  @ApiProperty({ example: "seller_123" })
  sellerId: string;

  @ApiProperty({ example: "listing_456" })
  saleListingId: string;

  @ApiProperty({ example: "John Farm" })
  name: string;

  @ApiProperty({ example: 50 })
  requestedQuantity: number;

  @ApiProperty({ example: 60 })
  offeredQuantity: number;

  @ApiPropertyOptional({ example: 48 })
  agreedQuantity?: number | null;

  @ApiPropertyOptional({ example: "TON" })
  unit?: string;

  @ApiProperty({ example: 50 })
  quantity: number;

  @ApiProperty({ example: 350 })
  price: number;

  @ApiProperty({ example: "ACCEPTED" })
  status: string;

  @ApiPropertyOptional({ example: "STANDARD" })
  quality?: string;

  @ApiPropertyOptional({ example: 120 })
  distance?: number;

  @ApiPropertyOptional({ type: SellerInspectionSummaryDto })
  inspection?: SellerInspectionSummaryDto;
}

export class BuyerSummaryDto {
  @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
  id: string;

  @ApiProperty({ example: "ABC Distributors" })
  name: string;

  @ApiProperty({ example: 100 })
  requestedQuantity: number;

  @ApiProperty({ example: 380 })
  maxPrice: number;

  @ApiPropertyOptional({ example: "Sofia, Bulgaria" })
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

export class TransportPickupPointDto {
  @ApiPropertyOptional()
  sellerId?: string;

  @ApiPropertyOptional()
  saleListingId?: string;

  @ApiPropertyOptional()
  sellerName?: string;

  @ApiPropertyOptional()
  quantity?: number;

  @ApiPropertyOptional()
  unit?: string;

  @ApiPropertyOptional()
  address?: string;

  @ApiPropertyOptional()
  lat?: number;

  @ApiPropertyOptional()
  lng?: number;
}

export class TransportDeliveryPointDetailsDto {
  @ApiPropertyOptional()
  buyerId?: string;

  @ApiPropertyOptional()
  buyerName?: string;

  @ApiPropertyOptional()
  address?: string;

  @ApiPropertyOptional()
  lat?: number;

  @ApiPropertyOptional()
  lng?: number;
}

export class TransportBidSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  bidAmount?: number;

  @ApiPropertyOptional()
  transporterId?: string;

  @ApiPropertyOptional()
  transporterName?: string;

  @ApiPropertyOptional()
  transportCompanyName?: string;

  @ApiPropertyOptional()
  vehicleType?: string;

  @ApiPropertyOptional()
  vehicleCapacity?: number;

  @ApiPropertyOptional()
  estimatedDuration?: number;

  @ApiPropertyOptional()
  submittedAt?: Date;
}

export class TransportJobSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  jobNumber: string;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  startedAt?: Date;

  @ApiPropertyOptional()
  estimatedArrival?: Date;

  @ApiPropertyOptional()
  actualDelivery?: Date;

  @ApiPropertyOptional()
  progress?: number;
}

export class TransportRequestDetailsDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  requestNumber: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  totalWeight: number;

  @ApiPropertyOptional()
  biddingDeadline?: Date;

  @ApiPropertyOptional()
  deliveryDeadline?: Date;

  @ApiPropertyOptional()
  urgencyLevel?: string;

  @ApiProperty({ type: [TransportPickupPointDto] })
  pickupPoints: TransportPickupPointDto[];

  @ApiPropertyOptional({ type: TransportDeliveryPointDetailsDto })
  deliveryPoint?: TransportDeliveryPointDetailsDto;

  @ApiProperty({ type: [TransportBidSummaryDto] })
  bids: TransportBidSummaryDto[];

  @ApiPropertyOptional({ type: TransportJobSummaryDto })
  job?: TransportJobSummaryDto;
}

export class TransportSummaryDto {
  @ApiProperty({ example: 150 })
  estimatedCost: number;

  @ApiProperty({ example: 245 })
  distance: number;

  @ApiProperty({ example: true })
  optimized: boolean;

  @ApiPropertyOptional({ example: "FLATBED" })
  vehicleType?: string;

  @ApiPropertyOptional({ example: 155.5 })
  actualCost?: number;

  @ApiPropertyOptional({ type: () => TransportRequestDetailsDto })
  request?: TransportRequestDetailsDto;
}

export class TradeOperationResponseDto {
  @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
  id: string;

  @ApiProperty({ enum: TradePhase, example: "NEGOTIATION" })
  phase: TradePhase;

  @ApiProperty({ enum: TradeStatus, example: "ACTIVE" })
  status: TradeStatus;

  @ApiProperty({ type: BuyerSummaryDto })
  buyer: BuyerSummaryDto;

  @ApiProperty({ type: [SellerSummaryDto] })
  sellers: SellerSummaryDto[];

  @ApiProperty({ type: ProfitSummaryDto })
  profit: ProfitSummaryDto;

  @ApiProperty({ type: TransportSummaryDto })
  transport: TransportSummaryDto;

  @ApiProperty({ example: "2024-01-15T10:30:00Z" })
  createdAt: Date;

  @ApiProperty({ example: "2024-01-15T14:45:00Z" })
  updatedAt: Date;

  @ApiPropertyOptional({ example: "2024-01-20T12:00:00Z" })
  expectedDeliveryDate?: Date;

  @ApiPropertyOptional({ example: "2024-01-18T16:30:00Z" })
  confirmedAt?: Date;

  @ApiPropertyOptional({ example: "2024-01-20T14:30:00Z" })
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
      "Below 5%": 5,
      "5-7%": 35,
      "7-10%": 45,
      "Above 10%": 15,
    },
  })
  marginDistribution: Record<string, number>;

  @ApiPropertyOptional({ example: "2024-01-01T00:00:00Z" })
  periodStart?: Date;

  @ApiPropertyOptional({ example: "2024-12-31T23:59:59Z" })
  periodEnd?: Date;
}
