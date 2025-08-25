import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductCategory, ProductUnit } from '@prisma/client';

export class ProductSpecificationDto {
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
  @IsString()
  locationAddress?: string;

  @IsOptional()
  @IsNumber()
  locationLat?: number;

  @IsOptional()
  @IsNumber()
  locationLng?: number;
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