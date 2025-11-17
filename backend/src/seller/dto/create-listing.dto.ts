import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsObject,
  ValidateNested,
  Min,
} from "class-validator";
import { Type } from "class-transformer";

export enum OfferType {
  LISTING = "listing",
  CUSTOM_OFFER = "custom-offer",
}

export enum ListingStatus {
  DRAFT = "draft",
  ACTIVE = "active",
  PENDING = "pending",
  SOLD = "sold",
  EXPIRED = "expired",
}

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

class PriceExpectationDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  min?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  max?: number;

  @IsString()
  @IsNotEmpty()
  currency: string;
}

export class CreateListingDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsString()
  @IsNotEmpty()
  unit: string;

  @IsEnum(OfferType)
  @IsNotEmpty()
  offerType: OfferType;

  @ValidateNested()
  @Type(() => LocationDto)
  @IsNotEmpty()
  location: LocationDto;

  @IsOptional()
  @IsObject()
  specifications?: Record<string, any>;

  @IsOptional()
  @ValidateNested()
  @Type(() => PriceExpectationDto)
  priceExpectation?: PriceExpectationDto;

  @IsOptional()
  @IsString()
  sellerId?: string;

  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;
}
