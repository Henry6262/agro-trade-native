import { IsArray, IsNumber, IsOptional, IsString, ValidateNested, IsBoolean, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { BaseType, ProductUnit } from '@prisma/client';

// Base DTO
export class BaseDto {
  @IsString()
  name: string;

  @IsEnum(BaseType)
  type: BaseType;

  @IsString()
  address: string;

  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsString()
  country: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsNumber()
  storageCapacity?: number;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

// Distribution DTO
export class DistributionItemDto {
  @IsString()
  baseId: string; // Will be mapped to actual base after creation

  @IsNumber()
  quantity: number;

  @IsNumber()
  percentage: number;
}

export class ProductDistributionDto {
  @IsString()
  productId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DistributionItemDto)
  distributions: DistributionItemDto[];
}

// Seller specific DTOs
export class SellerProductSpecificationDto {
  @IsString()
  productId: string;

  @IsNumber()
  quantity: number;

  @IsEnum(ProductUnit)
  unit: ProductUnit;

  @IsOptional()
  @IsNumber()
  pricePerKilo?: number;

  @IsOptional()
  @IsArray()
  varieties?: string[];

  @IsOptional()
  @IsArray()
  qualitySpecs?: string[];
}

export class SellerOnboardingDataDto {
  @IsArray()
  @IsString({ each: true })
  selectedProductIds: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SellerProductSpecificationDto)
  productSpecifications: SellerProductSpecificationDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BaseDto)
  bases?: BaseDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductDistributionDto)
  distributions?: ProductDistributionDto[];
}

// Buyer specific DTOs
export class BuyerProductRequirementDto {
  @IsString()
  productId: string;

  @IsNumber()
  quantity: number;

  @IsEnum(ProductUnit)
  unit: ProductUnit;

  @IsOptional()
  @IsNumber()
  maxPricePerKilo?: number;

  @IsOptional()
  @IsString()
  deliveryFrequency?: string;

  @IsOptional()
  @IsArray()
  qualityRequirements?: string[];
}

export class BuyerOnboardingDataDto {
  @IsArray()
  @IsString({ each: true })
  requiredProductIds: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BuyerProductRequirementDto)
  productRequirements: BuyerProductRequirementDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BaseDto)
  bases?: BaseDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductDistributionDto)
  distributions?: ProductDistributionDto[];
}

// Transporter specific DTOs
export class FleetInfoDto {
  @IsNumber()
  vehicleCount: number;

  @IsArray()
  @IsString({ each: true })
  vehicleTypes: string[];

  @IsNumber()
  totalCapacity: number;

  @IsString()
  capacityUnit: string;
}

export class BaseLocationDto {
  @IsString()
  address: string;

  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsString()
  country: string;

  @IsOptional()
  @IsString()
  zipCode?: string;
}

export class ServiceAreaDto {
  @IsNumber()
  radius: number;

  @IsArray()
  @IsString({ each: true })
  preferredRegions: string[];

  @IsString()
  coverage: string;
}

export class JobPreferencesDto {
  @IsArray()
  @IsString({ each: true })
  cargoTypes: string[];

  @IsNumber()
  maxDistance: number;

  @IsNumber()
  minDistance: number;
}

export class TransporterOnboardingDataDto {
  @ValidateNested()
  @Type(() => FleetInfoDto)
  fleetInfo: FleetInfoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => BaseLocationDto)
  baseLocation?: BaseLocationDto;

  @ValidateNested()
  @Type(() => ServiceAreaDto)
  serviceArea: ServiceAreaDto;

  @ValidateNested()
  @Type(() => JobPreferencesDto)
  jobPreferences: JobPreferencesDto;
}