import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductUnit, RequestStatus } from '@prisma/client';
import { PartialType } from '@nestjs/swagger';

class LocationDto {
  @IsNumber()
  @IsNotEmpty()
  latitude: number;

  @IsNumber()
  @IsNotEmpty()
  longitude: number;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  address?: string;
}

export class CreateBuyListingDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsEnum(ProductUnit)
  @IsNotEmpty()
  unit: ProductUnit;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPricePerUnit?: number;

  @IsOptional()
  @IsDateString()
  neededBy?: string;

  @ValidateNested()
  @Type(() => LocationDto)
  @IsNotEmpty()
  deliveryLocation: LocationDto;

  @IsOptional()
  @IsObject()
  specifications?: Record<string, any>;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  buyerId?: string;

  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;
}

export class UpdateBuyListingDto extends PartialType(CreateBuyListingDto) {}
