import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductCategory, ProductUnit } from '@prisma/client';

export class LocationBasedPricingDto {
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
  country?: string;

  @IsOptional()
  priceRange?: {
    min: number;
    max: number;
    currency: string;
    confidence: 'high' | 'medium' | 'low';
  };

  @IsOptional()
  @IsBoolean()
  requestedCustomOffer?: boolean;
}

export class CustomOfferDataDto {
  @IsOptional()
  @IsBoolean()
  organicCertified?: boolean;

  @IsOptional()
  @IsString()
  harvestDate?: string;

  @IsOptional()
  @IsString()
  qualityGrade?: 'premium' | 'standard' | 'economy';

  @IsOptional()
  @IsString()
  storageType?: 'cold' | 'ambient' | 'controlled';

  @IsOptional()
  @IsString()
  packaging?: 'bulk' | 'bags' | 'crates' | 'custom';

  @IsOptional()
  @IsString()
  customPackagingDetails?: string;

  @IsOptional()
  @IsBoolean()
  deliveryFlexible?: boolean;

  @IsOptional()
  @IsString()
  minOrderQuantity?: string;

  @IsOptional()
  @IsString()
  specialRequests?: string;

  @IsOptional()
  @IsString()
  contactPreference?: 'email' | 'phone' | 'both';

  @IsOptional()
  @IsString()
  urgency?: 'immediate' | 'within_week' | 'within_month' | 'flexible';
}

export class ProductSpecificationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsEnum(ProductCategory)
  @IsNotEmpty()
  category: ProductCategory;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsEnum(ProductUnit)
  @IsNotEmpty()
  unit: ProductUnit;

  @IsOptional()
  @IsNumber()
  pricePerTon?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationBasedPricingDto)
  locationBasedPricing?: LocationBasedPricingDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CustomOfferDataDto)
  customOfferData?: CustomOfferDataDto;

  @IsOptional()
  @IsBoolean()
  wantCustomOffer?: boolean;
}

export class CompanyInfoDto {
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsOptional()
  @IsString()
  vatNumber?: string;

  @IsOptional()
  @IsString()
  businessLicense?: string;

  @IsOptional()
  companyAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsNumber()
  establishedYear?: number;
}

export class SellerOnboardingDto {
  @IsOptional()
  @IsString()
  farmName?: string;

  @IsOptional()
  @IsString()
  locationAddress?: string;

  @IsOptional()
  @IsNumber()
  locationLat?: number;

  @IsOptional()
  @IsNumber()
  locationLng?: number;

  @IsOptional()
  @IsString()
  businessId?: string;

  @IsOptional()
  @IsString()
  iban?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certifications?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => CompanyInfoDto)
  companyInfo?: CompanyInfoDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductSpecificationDto)
  selectedProducts: ProductSpecificationDto[];
}