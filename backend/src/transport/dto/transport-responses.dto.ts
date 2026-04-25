import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  TransportRequestStatus,
  BidStatus,
  TransportJobStatus,
  TruckType,
  TradePhase,
  TradeStatus,
  ProductUnit,
} from "@prisma/client";

export class TransportErrorDto {
  @ApiProperty({ example: "FORBIDDEN" })
  code: string;

  @ApiProperty({ example: "Only transporters can view transport requests" })
  message: string;
}

export class TransportPickupPointDto {
  @ApiProperty({ example: 42.6977 })
  lat: number;

  @ApiProperty({ example: 23.3219 })
  lng: number;

  @ApiPropertyOptional({ example: "123 Farm Lane, Sofia" })
  address?: string;

  @ApiPropertyOptional({ example: 80 })
  quantity?: number;

  @ApiPropertyOptional({ example: "seller_123" })
  sellerId?: string;

  @ApiPropertyOptional({ example: "Fresh Farms Ltd" })
  sellerName?: string;

  @ApiPropertyOptional({ example: "Pickup complete" })
  notes?: string;
}

export class TransportDeliveryPointDto {
  @ApiProperty({ example: 43.2141 })
  lat: number;

  @ApiProperty({ example: 27.9147 })
  lng: number;

  @ApiPropertyOptional({ example: "Warehouse 5, Varna" })
  address?: string;

  @ApiPropertyOptional({ example: "addr_456" })
  addressId?: string;
}

export class TransportBuyerSummaryDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  name?: string | null;

  @ApiPropertyOptional()
  email?: string | null;
}

export class TransportProductSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  category?: string | null;
}

export class TransportBuyListingSummaryDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional({ type: Number, example: 120 })
  quantity?: number | null;

  @ApiPropertyOptional({ enum: ProductUnit })
  unit?: ProductUnit | null;

  @ApiPropertyOptional({ type: () => TransportProductSummaryDto })
  product?: TransportProductSummaryDto | null;

  @ApiPropertyOptional({ type: () => TransportBuyerSummaryDto })
  buyer?: TransportBuyerSummaryDto | null;
}

export class TransportTradeOperationSummaryDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  operationNumber?: string | null;

  @ApiPropertyOptional({ enum: TradeStatus })
  status?: TradeStatus | null;

  @ApiPropertyOptional({ enum: TradePhase })
  phase?: TradePhase | null;

  @ApiPropertyOptional({ type: Number })
  profitMargin?: number | null;

  @ApiPropertyOptional({ type: () => TransportBuyListingSummaryDto })
  buyListing?: TransportBuyListingSummaryDto | null;
}

export class TransportCompanySummaryDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  legalName?: string | null;

  @ApiPropertyOptional()
  registrationNumber?: string | null;
}

class TransportRequestSummaryBaseDto {
  @ApiProperty({ example: "req_123" })
  id: string;

  @ApiProperty({ example: "TR-ABC123" })
  requestNumber: string;

  @ApiProperty({
    enum: TransportRequestStatus,
    example: TransportRequestStatus.OPEN,
  })
  status: TransportRequestStatus;

  @ApiProperty({ example: "trade_123" })
  tradeOperationId: string;

  @ApiProperty({ example: 120 })
  totalWeight: number;

  @ApiPropertyOptional({ example: "Potatoes in 25kg bags" })
  cargoDescription?: string;

  @ApiPropertyOptional({ enum: TruckType, example: TruckType.FLATBED })
  requiredVehicleType?: TruckType;

  @ApiProperty({ type: () => [TransportPickupPointDto] })
  pickupPoints: TransportPickupPointDto[];

  @ApiProperty({ type: () => TransportDeliveryPointDto })
  deliveryPoint: TransportDeliveryPointDto;

  @ApiPropertyOptional({ example: 320 })
  estimatedDistance?: number;

  @ApiPropertyOptional({ example: "STANDARD" })
  urgencyLevel?: string;

  @ApiProperty({ example: "2024-01-18T09:00:00Z" })
  biddingDeadline: string;

  @ApiPropertyOptional({ example: 4500 })
  maxBudget?: number;

  @ApiPropertyOptional({ example: "2024-01-15T10:00:00Z" })
  createdAt?: string;

  @ApiPropertyOptional({ example: "2024-01-16T11:45:00Z" })
  updatedAt?: string;

  @ApiPropertyOptional({ example: 5 })
  bidsCount?: number;

  @ApiPropertyOptional({ example: 3400 })
  lowestBid?: number;

  @ApiPropertyOptional({ type: () => TransportTradeOperationSummaryDto })
  tradeOperation?: TransportTradeOperationSummaryDto;
}

export class TransportRequestSummaryDto extends TransportRequestSummaryBaseDto {}

export class TransportBidTransporterSummaryDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  name?: string | null;

  @ApiPropertyOptional()
  email?: string | null;

  @ApiPropertyOptional()
  phoneNumber?: string | null;

  @ApiPropertyOptional({ type: () => TransportCompanySummaryDto })
  company?: TransportCompanySummaryDto | null;
}

export class TransportBidDto {
  @ApiProperty({ example: "bid_123" })
  id: string;

  @ApiProperty({ example: "req_123" })
  transportRequestId: string;

  @ApiProperty({ example: "trade_123" })
  tradeOperationId: string;

  @ApiProperty({ example: "transporter_456" })
  transporterId: string;

  @ApiProperty({ example: 3400 })
  bidAmount: number;

  @ApiProperty({ example: 36 })
  estimatedDuration: number;

  @ApiPropertyOptional({ enum: TruckType, example: TruckType.FLATBED })
  vehicleType?: TruckType;

  @ApiPropertyOptional({ example: 24 })
  vehicleCapacity?: number;

  @ApiProperty({ enum: BidStatus, example: BidStatus.PENDING })
  status: BidStatus;

  @ApiPropertyOptional({ example: "2024-01-19T12:00:00Z" })
  submittedAt?: string;

  @ApiPropertyOptional({ example: "2024-01-20T12:00:00Z" })
  expiresAt?: string;

  @ApiPropertyOptional({ type: () => TransportBidTransporterSummaryDto })
  transporter?: TransportBidTransporterSummaryDto;

  @ApiPropertyOptional({ type: () => TransportRequestSummaryDto })
  transportRequest?: TransportRequestSummaryDto;
}

export class TransportJobLocationDto {
  @ApiProperty({ example: 42.7 })
  lat: number;

  @ApiProperty({ example: 23.3 })
  lng: number;

  @ApiPropertyOptional({ example: "Highway A1 KM 25" })
  address?: string;

  @ApiPropertyOptional({ example: "2024-01-17T10:03:00Z" })
  timestamp?: string;
}

export class TransportPickupRecordDto {
  @ApiPropertyOptional({ example: "seller_123" })
  sellerId?: string;

  @ApiPropertyOptional({ example: 60 })
  quantity?: number;

  @ApiPropertyOptional({ example: "Pickup completed with no issues" })
  notes?: string;

  @ApiPropertyOptional({ example: "2024-01-17T09:20:00Z" })
  completedAt?: string;
}

export class TransportJobDto {
  @ApiProperty({ example: "job_123" })
  id: string;

  @ApiProperty({ example: "TRJ-2024-001" })
  jobNumber: string;

  @ApiProperty({ example: "req_123" })
  transportRequestId: string;

  @ApiProperty({
    enum: TransportJobStatus,
    example: TransportJobStatus.IN_TRANSIT,
  })
  status: TransportJobStatus;

  @ApiPropertyOptional({ example: "transporter_456" })
  transporterId?: string;

  @ApiPropertyOptional({ type: () => TransportJobLocationDto })
  currentLocation?: TransportJobLocationDto;

  @ApiPropertyOptional({ example: "2024-01-21T08:00:00Z" })
  estimatedArrival?: string;

  @ApiPropertyOptional({ type: () => [TransportPickupRecordDto] })
  pickupsCompleted?: TransportPickupRecordDto[];

  @ApiPropertyOptional({ example: true })
  allPickupsComplete?: boolean;

  @ApiPropertyOptional({ example: "2024-01-17T07:30:00Z" })
  startedAt?: string;

  @ApiPropertyOptional({ example: "2024-01-18T18:00:00Z" })
  completedAt?: string;

  @ApiPropertyOptional({ example: "2024-01-16T06:00:00Z" })
  createdAt?: string;

  @ApiPropertyOptional({ example: "2024-01-17T12:30:00Z" })
  updatedAt?: string;

  @ApiPropertyOptional({ type: [String] })
  pickupPhotos?: string[];

  @ApiPropertyOptional({ type: [String] })
  deliveryPhotos?: string[];

  @ApiPropertyOptional({ example: "https://files.example.com/pod.pdf" })
  proofOfDelivery?: string;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiPropertyOptional({ type: () => TransportRequestSummaryDto })
  transportRequest?: TransportRequestSummaryDto;
}

export class TransportRequestDto extends TransportRequestSummaryBaseDto {
  @ApiPropertyOptional({ type: () => [TransportBidDto] })
  bids?: TransportBidDto[];

  @ApiPropertyOptional({ type: () => TransportJobDto })
  transportJob?: TransportJobDto;
}

export class TransportBidComparisonRequestDto {
  @ApiProperty({ example: "req_123" })
  id: string;

  @ApiPropertyOptional({ example: 245 })
  distance?: number;

  @ApiPropertyOptional({ example: 120 })
  weight?: number;
}

export class TransportBidComparisonItemDto {
  @ApiProperty({ example: "bid_123" })
  bidId: string;

  @ApiProperty({ type: () => TransportBidTransporterSummaryDto })
  transporter: TransportBidTransporterSummaryDto;

  @ApiProperty({ example: 3400 })
  bidAmount: number;

  @ApiProperty({ example: 36 })
  estimatedDuration: number;

  @ApiProperty({ example: 12.5 })
  pricePerKm: number;

  @ApiProperty({ example: 28.3 })
  pricePerTon: number;

  @ApiProperty({ enum: BidStatus, example: BidStatus.PENDING })
  status: BidStatus;
}

export class TransportBidComparisonStatisticsDto {
  @ApiProperty({ example: 5 })
  totalBids: number;

  @ApiProperty({ example: 3600 })
  averagePrice: number;

  @ApiProperty({ example: 3200 })
  lowestBid: number;

  @ApiProperty({ example: 4100 })
  highestBid: number;
}

export class TransportBidComparisonDto {
  @ApiProperty({ type: TransportBidComparisonRequestDto })
  request: TransportBidComparisonRequestDto;

  @ApiProperty({ type: [TransportBidComparisonItemDto] })
  bids: TransportBidComparisonItemDto[];

  @ApiProperty({ type: TransportBidComparisonStatisticsDto })
  statistics: TransportBidComparisonStatisticsDto;
}

export class TransporterPerformanceDto {
  @ApiProperty({ example: "transporter_456" })
  transporterId: string;

  @ApiProperty({ example: 45 })
  completedJobs: number;

  @ApiProperty({ example: 60 })
  totalJobs: number;

  @ApiPropertyOptional({ example: 75 })
  completionRate?: number;

  @ApiPropertyOptional({ example: 80 })
  onTimeDeliveryRate?: number;

  @ApiProperty({ type: () => [TransportJobDto] })
  recentJobs: TransportJobDto[];
}

export class TransportAnalyticsResponseDto {
  @ApiProperty({ type: Object })
  metrics: any;

  @ApiProperty({ type: () => [TransportJobDto] })
  recentJobs: TransportJobDto[];
}

export class TransportRequestListMetaDto {
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() total: number;
  @ApiProperty() hasMore: boolean;
}

export class TransportRequestListResponseDto {
  @ApiProperty({ type: [TransportRequestDto] })
  data: TransportRequestDto[];

  @ApiPropertyOptional({ type: TransportRequestListMetaDto })
  meta?: TransportRequestListMetaDto;

  @ApiPropertyOptional({ type: TransportErrorDto })
  error?: TransportErrorDto;
}

export class TransportRequestResponseDto {
  @ApiProperty({ type: TransportRequestDto })
  data: TransportRequestDto;

  @ApiPropertyOptional({ type: TransportErrorDto })
  error?: TransportErrorDto;
}

export class TransportBidListResponseDto {
  @ApiProperty({ type: [TransportBidDto] })
  data: TransportBidDto[];

  @ApiPropertyOptional({ type: TransportErrorDto })
  error?: TransportErrorDto;
}

export class TransportBidResponseDto {
  @ApiProperty({ type: TransportBidDto })
  data: TransportBidDto;

  @ApiPropertyOptional({ type: TransportErrorDto })
  error?: TransportErrorDto;
}

export class TransportJobListResponseDto {
  @ApiProperty({ type: [TransportJobDto] })
  data: TransportJobDto[];

  @ApiPropertyOptional({ type: TransportErrorDto })
  error?: TransportErrorDto;
}

export class TransportJobResponseDto {
  @ApiProperty({ type: TransportJobDto })
  data: TransportJobDto;

  @ApiPropertyOptional({ type: TransportErrorDto })
  error?: TransportErrorDto;
}

export class TransportBidComparisonResponseDto {
  @ApiProperty({ type: TransportBidComparisonDto })
  data: TransportBidComparisonDto;

  @ApiPropertyOptional({ type: TransportErrorDto })
  error?: TransportErrorDto;
}

export class TransporterPerformanceResponseDto {
  @ApiProperty({ type: TransporterPerformanceDto })
  data: TransporterPerformanceDto;

  @ApiPropertyOptional({ type: TransportErrorDto })
  error?: TransportErrorDto;
}

export class TransportAnalyticsResponseWrapperDto {
  @ApiProperty({ type: TransportAnalyticsResponseDto })
  data: TransportAnalyticsResponseDto;

  @ApiPropertyOptional({ type: TransportErrorDto })
  error?: TransportErrorDto;
}
