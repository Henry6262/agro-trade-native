import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, IsDateString, IsArray, ValidateNested, IsBoolean, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { TruckType, UrgencyLevel, TransportRequestStatus, BidStatus, TransportJobStatus } from '@prisma/client';

// ==================== TRANSPORT REQUEST DTOs ====================

export class CreateTransportRequestDto {
  @ApiProperty({ description: 'Trade operation ID' })
  @IsString()
  tradeOperationId: string;

  @ApiProperty({ description: 'Total weight to transport in tons' })
  @IsNumber()
  @Min(0.1)
  totalWeight: number;

  @ApiPropertyOptional({ enum: TruckType, description: 'Required vehicle type' })
  @IsOptional()
  @IsEnum(TruckType)
  requiredVehicleType?: TruckType;

  @ApiPropertyOptional({ description: 'Special requirements', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialRequirements?: string[];

  @ApiPropertyOptional({ description: 'Pickup window start time' })
  @IsOptional()
  @IsDateString()
  pickupWindowStart?: string;

  @ApiPropertyOptional({ description: 'Pickup window end time' })
  @IsOptional()
  @IsDateString()
  pickupWindowEnd?: string;

  @ApiPropertyOptional({ description: 'Delivery deadline' })
  @IsOptional()
  @IsDateString()
  deliveryDeadline?: string;

  @ApiPropertyOptional({ enum: UrgencyLevel, description: 'Urgency level' })
  @IsOptional()
  @IsEnum(UrgencyLevel)
  urgencyLevel?: UrgencyLevel;

  @ApiProperty({ description: 'Bidding deadline' })
  @IsDateString()
  biddingDeadline: string;

  @ApiPropertyOptional({ description: 'Maximum budget for transport' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxBudget?: number;
}

export class TransportRequestResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  requestNumber: string;

  @ApiProperty()
  tradeOperationId: string;

  @ApiProperty()
  totalWeight: number;

  @ApiPropertyOptional({ enum: TruckType })
  requiredVehicleType?: TruckType;

  @ApiProperty({ type: [String] })
  specialRequirements: string[];

  @ApiProperty()
  pickupPoints: any;

  @ApiProperty()
  deliveryPoint: any;

  @ApiPropertyOptional()
  estimatedDistance?: number;

  @ApiPropertyOptional()
  pickupWindowStart?: Date;

  @ApiPropertyOptional()
  pickupWindowEnd?: Date;

  @ApiPropertyOptional()
  deliveryDeadline?: Date;

  @ApiProperty({ enum: UrgencyLevel })
  urgencyLevel: UrgencyLevel;

  @ApiProperty({ enum: TransportRequestStatus })
  status: TransportRequestStatus;

  @ApiProperty()
  biddingDeadline: Date;

  @ApiPropertyOptional()
  maxBudget?: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  bidsCount?: number;

  @ApiPropertyOptional()
  lowestBid?: number;

  @ApiPropertyOptional()
  averageBid?: number;
}

// ==================== TRANSPORT BID DTOs ====================

export class CreateTransportBidDto {
  @ApiProperty({ description: 'Transport request ID' })
  @IsString()
  transportRequestId: string;

  @ApiProperty({ description: 'Bid amount in EUR' })
  @IsNumber()
  @Min(1)
  bidAmount: number;

  @ApiProperty({ description: 'Estimated duration in hours' })
  @IsNumber()
  @Min(1)
  @Max(72)
  estimatedDuration: number;

  @ApiProperty({ enum: TruckType, description: 'Vehicle type for this bid' })
  @IsEnum(TruckType)
  vehicleType: TruckType;

  @ApiProperty({ description: 'Vehicle capacity in tons' })
  @IsNumber()
  @Min(1)
  vehicleCapacity: number;

  @ApiPropertyOptional({ description: 'Assigned truck ID' })
  @IsOptional()
  @IsString()
  assignedTruckId?: string;

  @ApiPropertyOptional({ description: 'Special equipment available', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialEquipment?: string[];

  @ApiPropertyOptional({ description: 'Insurance coverage amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  insuranceCoverage?: number;

  @ApiPropertyOptional({ description: 'Proposed route details' })
  @IsOptional()
  proposedRoute?: any;

  @ApiPropertyOptional({ description: 'Detailed pickup schedule' })
  @IsOptional()
  pickupSchedule?: any;

  @ApiProperty({ description: 'Bid expiry date' })
  @IsDateString()
  expiresAt: string;
}

export class TransportBidResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  transportRequestId: string;

  @ApiProperty()
  tradeOperationId: string;

  @ApiProperty()
  transporterId: string;

  @ApiProperty()
  transporter: {
    id: string;
    name: string;
    email: string;
    phoneNumber?: string;
  };

  @ApiProperty()
  bidAmount: number;

  @ApiProperty()
  estimatedDuration: number;

  @ApiProperty({ enum: TruckType })
  vehicleType: TruckType;

  @ApiProperty()
  vehicleCapacity: number;

  @ApiPropertyOptional()
  assignedTruck?: {
    id: string;
    plateNumber: string;
    capacity: number;
    type: TruckType;
  };

  @ApiProperty({ type: [String] })
  specialEquipment: string[];

  @ApiPropertyOptional()
  insuranceCoverage?: number;

  @ApiPropertyOptional()
  proposedRoute?: any;

  @ApiPropertyOptional()
  pickupSchedule?: any;

  @ApiProperty({ enum: BidStatus })
  status: BidStatus;

  @ApiProperty()
  submittedAt: Date;

  @ApiProperty()
  expiresAt: Date;

  @ApiPropertyOptional()
  evaluatedAt?: Date;

  @ApiPropertyOptional()
  acceptedAt?: Date;

  @ApiPropertyOptional()
  ranking?: number;

  @ApiPropertyOptional()
  competitiveness?: 'LOWEST' | 'COMPETITIVE' | 'HIGH' | 'OVERPRICED';
}

// ==================== TRANSPORT JOB DTOs ====================

export class CreateTransportJobDto {
  @ApiProperty({ description: 'Transport request ID' })
  @IsString()
  transportRequestId: string;

  @ApiProperty({ description: 'Selected transport bid ID' })
  @IsString()
  transportBidId: string;
}

export class UpdateTransportJobStatusDto {
  @ApiProperty({ enum: TransportJobStatus, description: 'New job status' })
  @IsEnum(TransportJobStatus)
  status: TransportJobStatus;

  @ApiPropertyOptional({ description: 'Current location' })
  @IsOptional()
  currentLocation?: {
    lat: number;
    lng: number;
    address?: string;
    timestamp: string;
  };

  @ApiPropertyOptional({ description: 'Estimated arrival time' })
  @IsOptional()
  @IsDateString()
  estimatedArrival?: string;

  @ApiPropertyOptional({ description: 'Status update notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CompletePickupDto {
  @ApiProperty({ description: 'Seller ID for this pickup' })
  @IsString()
  sellerId: string;

  @ApiProperty({ description: 'Actual quantity picked up' })
  @IsNumber()
  @Min(0)
  quantityPickedUp: number;

  @ApiPropertyOptional({ description: 'Photos of the pickup', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pickupPhotos?: string[];

  @ApiPropertyOptional({ description: 'Pickup notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Pickup completion time' })
  @IsDateString()
  completedAt: string;
}

export class CompleteDeliveryDto {
  @ApiPropertyOptional({ description: 'Photos of the delivery', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deliveryPhotos?: string[];

  @ApiPropertyOptional({ description: 'Proof of delivery document URL' })
  @IsOptional()
  @IsString()
  proofOfDelivery?: string;

  @ApiPropertyOptional({ description: 'Customer rating (1-5)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  customerRating?: number;

  @ApiPropertyOptional({ description: 'Delivery notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Delivery completion time' })
  @IsDateString()
  completedAt: string;
}

export class TransportJobResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  jobNumber: string;

  @ApiProperty()
  transportRequestId: string;

  @ApiProperty()
  transportBidId: string;

  @ApiProperty()
  tradeOperationId: string;

  @ApiProperty()
  transporterId: string;

  @ApiProperty()
  transporter: {
    id: string;
    name: string;
    email: string;
    phoneNumber?: string;
  };

  @ApiProperty({ enum: TransportJobStatus })
  status: TransportJobStatus;

  @ApiProperty()
  pickupsCompleted: any[];

  @ApiProperty()
  allPickupsComplete: boolean;

  @ApiPropertyOptional()
  currentLocation?: any;

  @ApiPropertyOptional()
  estimatedArrival?: Date;

  @ApiPropertyOptional()
  actualDelivery?: Date;

  @ApiProperty({ type: [String] })
  pickupPhotos: string[];

  @ApiProperty({ type: [String] })
  deliveryPhotos: string[];

  @ApiPropertyOptional()
  proofOfDelivery?: string;

  @ApiPropertyOptional()
  onTimePickup?: boolean;

  @ApiPropertyOptional()
  onTimeDelivery?: boolean;

  @ApiPropertyOptional()
  customerRating?: number;

  @ApiPropertyOptional()
  notes?: string;

  @ApiPropertyOptional()
  startedAt?: Date;

  @ApiPropertyOptional()
  completedAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

// ==================== QUERY DTOs ====================

export class GetTransportRequestsQueryDto {
  @ApiPropertyOptional({ enum: TransportRequestStatus })
  @IsOptional()
  @IsEnum(TransportRequestStatus)
  status?: TransportRequestStatus;

  @ApiPropertyOptional({ enum: UrgencyLevel })
  @IsOptional()
  @IsEnum(UrgencyLevel)
  urgencyLevel?: UrgencyLevel;

  @ApiPropertyOptional({ description: 'Filter by transporter ID (for available requests)' })
  @IsOptional()
  @IsString()
  transporterId?: string;

  @ApiPropertyOptional({ description: 'Maximum distance from transporter location' })
  @IsOptional()
  @IsNumber()
  maxDistance?: number;

  @ApiPropertyOptional({ description: 'Minimum required vehicle capacity' })
  @IsOptional()
  @IsNumber()
  minCapacity?: number;

  @ApiPropertyOptional({ description: 'Page size', default: 20 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Page number', default: 0 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  offset?: number = 0;
}

export class GetTransportBidsQueryDto {
  @ApiPropertyOptional({ description: 'Filter by transport request ID' })
  @IsOptional()
  @IsString()
  transportRequestId?: string;

  @ApiPropertyOptional({ description: 'Filter by transporter ID' })
  @IsOptional()
  @IsString()
  transporterId?: string;

  @ApiPropertyOptional({ enum: BidStatus })
  @IsOptional()
  @IsEnum(BidStatus)
  status?: BidStatus;

  @ApiPropertyOptional({ description: 'Page size', default: 20 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Page number', default: 0 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  offset?: number = 0;
}

export class GetTransportJobsQueryDto {
  @ApiPropertyOptional({ description: 'Filter by transporter ID' })
  @IsOptional()
  @IsString()
  transporterId?: string;

  @ApiPropertyOptional({ enum: TransportJobStatus })
  @IsOptional()
  @IsEnum(TransportJobStatus)
  status?: TransportJobStatus;

  @ApiPropertyOptional({ description: 'Page size', default: 20 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Page number', default: 0 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  offset?: number = 0;
}