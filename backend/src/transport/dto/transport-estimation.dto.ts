import { IsNumber, IsOptional, IsEnum, IsArray, ValidateNested, Min, Max, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TruckType } from '@prisma/client';

export class LocationDto {
  @ApiProperty({ example: 42.6977, description: 'Latitude' })
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({ example: 23.3219, description: 'Longitude' })
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;
}

export class PickupPointDto extends LocationDto {
  @ApiProperty({ example: 50, description: 'Quantity to pickup in tons' })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({ example: 'ton', description: 'Unit of measurement' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ 
    example: 'HIGH', 
    enum: ['HIGH', 'MEDIUM', 'LOW'],
    description: 'Pickup priority' 
  })
  @IsOptional()
  @IsEnum(['HIGH', 'MEDIUM', 'LOW'])
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
}

export class TransportEstimationRequestDto {
  @ApiProperty({
    type: [PickupPointDto],
    description: 'List of pickup points',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PickupPointDto)
  pickupPoints: PickupPointDto[];

  @ApiProperty({
    type: LocationDto,
    description: 'Delivery destination',
  })
  @ValidateNested()
  @Type(() => LocationDto)
  deliveryPoint: LocationDto;

  @ApiPropertyOptional({
    enum: TruckType,
    example: 'FLATBED',
    description: 'Type of vehicle',
  })
  @IsOptional()
  @IsEnum(TruckType)
  vehicleType?: TruckType;

  @ApiPropertyOptional({
    enum: ['NORMAL', 'EXPRESS'],
    example: 'NORMAL',
    description: 'Delivery urgency',
  })
  @IsOptional()
  @IsEnum(['NORMAL', 'EXPRESS'])
  urgency?: 'NORMAL' | 'EXPRESS';

  @ApiPropertyOptional({
    example: true,
    description: 'Include alternative vehicle types in response',
  })
  @IsOptional()
  includeAlternatives?: boolean;
}

export class RouteOptimizationRequestDto {
  @ApiProperty({ type: LocationDto, description: 'Warehouse starting point' })
  @ValidateNested()
  @Type(() => LocationDto)
  warehouseLocation: LocationDto;

  @ApiProperty({ type: [PickupPointDto], description: 'Pickup points to optimize' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PickupPointDto)
  pickups: PickupPointDto[];

  @ApiProperty({ type: LocationDto, description: 'Final delivery location' })
  @ValidateNested()
  @Type(() => LocationDto)
  deliveryLocation: LocationDto;

  @ApiPropertyOptional({
    enum: ['nearest_neighbor', 'tsp_2opt', 'genetic'],
    example: 'tsp_2opt',
    description: 'Optimization algorithm to use',
  })
  @IsOptional()
  @IsEnum(['nearest_neighbor', 'tsp_2opt', 'genetic'])
  algorithm?: 'nearest_neighbor' | 'tsp_2opt' | 'genetic';

  @ApiPropertyOptional({
    example: 1000,
    description: 'Maximum allowed distance in kilometers',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDistance?: number;

  @ApiPropertyOptional({
    example: 480,
    description: 'Maximum allowed duration in minutes',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDuration?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Prioritize high-priority pickups first',
  })
  @IsOptional()
  priorityPickupsFirst?: boolean;

  @ApiPropertyOptional({
    example: 100,
    description: 'Vehicle capacity in tons',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  vehicleCapacity?: number;
}

export class TransportCostBreakdownResponseDto {
  @ApiProperty({ example: 150 })
  distanceCost: number;

  @ApiProperty({ example: 25 })
  loadingCosts: number;

  @ApiProperty({ example: 1.0 })
  vehicleMultiplier: number;

  @ApiProperty({ example: 0.15 })
  appliedRate: number;

  @ApiPropertyOptional({
    type: 'object',
    properties: {
      tier: { type: 'number' },
      rateApplied: { type: 'number' },
    },
  })
  distanceTier?: {
    tier: number;
    rateApplied: number;
  };

  @ApiPropertyOptional({
    type: 'object',
    properties: {
      applied: { type: 'boolean' },
      discountRate: { type: 'number' },
      discountAmount: { type: 'number' },
    },
  })
  bulkDiscount?: {
    applied: boolean;
    discountRate: number;
    discountAmount: number;
  };

  @ApiPropertyOptional({
    type: 'object',
    properties: {
      applied: { type: 'boolean' },
      surchargeRate: { type: 'number' },
      surchargeAmount: { type: 'number' },
    },
  })
  urgencySurcharge?: {
    applied: boolean;
    surchargeRate: number;
    surchargeAmount: number;
  };
}

export class RouteInfoDto {
  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        lat: { type: 'number' },
        lng: { type: 'number' },
        quantity: { type: 'number' },
        distanceToNext: { type: 'number' },
      },
    },
  })
  pickupSequence: Array<PickupPointDto & { distanceToNext: number }>;

  @ApiProperty({ type: LocationDto })
  deliveryPoint: LocationDto;

  @ApiPropertyOptional({ example: true })
  optimizationApplied?: boolean;

  @ApiPropertyOptional({ example: 25.5 })
  distanceSaved?: number;
}

export class VehicleInfoDto {
  @ApiProperty({ enum: TruckType, example: 'FLATBED' })
  type: TruckType;

  @ApiProperty({ example: 100 })
  requiredCapacity: number;

  @ApiProperty({ example: 1.0 })
  multiplier: number;
}

export class TransportEstimationResponseDto {
  @ApiProperty({ example: 245.5 })
  totalDistance: number;

  @ApiProperty({ example: 175.50 })
  totalCost: number;

  @ApiProperty({ example: 'EUR' })
  currency: string;

  @ApiProperty({ type: TransportCostBreakdownResponseDto })
  breakdown: TransportCostBreakdownResponseDto;

  @ApiProperty({ type: RouteInfoDto })
  route: RouteInfoDto;

  @ApiProperty({ type: VehicleInfoDto })
  vehicleInfo: VehicleInfoDto;

  @ApiPropertyOptional({ example: false })
  cached?: boolean;

  @ApiPropertyOptional({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        vehicleType: { type: 'string' },
        cost: { type: 'number' },
        difference: { type: 'number' },
      },
    },
  })
  alternatives?: Array<{
    vehicleType: TruckType;
    cost: number;
    difference: number;
  }>;
}

export class RoutePointDto {
  @ApiProperty({ enum: ['warehouse', 'pickup', 'delivery'], example: 'pickup' })
  type: 'warehouse' | 'pickup' | 'delivery';

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id?: string;

  @ApiProperty({ type: LocationDto })
  location: LocationDto;

  @ApiPropertyOptional({ example: 50 })
  quantity?: number;

  @ApiProperty({ example: 25.5 })
  distanceFromPrevious: number;

  @ApiProperty({ example: 125.5 })
  cumulativeDistance: number;

  @ApiPropertyOptional({ example: '2024-01-20T14:30:00Z' })
  estimatedArrival?: Date;

  @ApiPropertyOptional({ example: '2024-01-20T15:00:00Z' })
  estimatedDeparture?: Date;
}

export class OptimizedRouteDto {
  @ApiProperty({ type: [RoutePointDto] })
  sequence: RoutePointDto[];

  @ApiProperty({ example: 245.5 })
  totalDistance: number;

  @ApiProperty({ example: 255, description: 'Total duration in minutes' })
  totalDuration: number;

  @ApiProperty({ 
    enum: ['nearest_neighbor', 'tsp_2opt', 'genetic'],
    example: 'tsp_2opt' 
  })
  algorithm: 'nearest_neighbor' | 'tsp_2opt' | 'genetic';
}

export class RouteComparisonDto {
  @ApiProperty({ example: 280.5 })
  originalDistance: number;

  @ApiProperty({ example: 245.5 })
  optimizedDistance: number;

  @ApiProperty({ example: 35 })
  distanceSaved: number;

  @ApiProperty({ example: 12.5 })
  percentageSaved: number;
}

export class RouteOptimizationResponseDto {
  @ApiProperty({ type: OptimizedRouteDto })
  optimizedRoute: OptimizedRouteDto;

  @ApiProperty({ type: RouteComparisonDto })
  comparison: RouteComparisonDto;

  @ApiProperty({
    type: 'object',
    properties: {
      computationTime: { type: 'number' },
      numberOfPermutations: { type: 'number' },
      optimizationLevel: { type: 'string' },
    },
  })
  metrics: {
    computationTime: number;
    numberOfPermutations: number;
    optimizationLevel: string;
  };

  @ApiPropertyOptional({
    type: 'object',
    properties: {
      requiredTrips: { type: 'number' },
      trips: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            tripNumber: { type: 'number' },
            totalQuantity: { type: 'number' },
            distance: { type: 'number' },
          },
        },
      },
    },
  })
  multiTripSuggestion?: {
    requiredTrips: number;
    trips: Array<{
      tripNumber: number;
      totalQuantity: number;
      distance: number;
    }>;
  };
}