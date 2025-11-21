import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  IsNumber,
} from "class-validator";
import { Type } from "class-transformer";
import { ProductCategory, ProductUnit } from "@prisma/client";
import { CompanyInfoDto } from "./seller-onboarding.dto";

export class BuyerRequirementDto {
  @IsEnum(ProductCategory)
  @IsNotEmpty()
  category: ProductCategory;

  @IsNumber()
  @IsNotEmpty()
  estimatedQuantity: number;

  @IsEnum(ProductUnit)
  @IsNotEmpty()
  unit: ProductUnit;

  @IsOptional()
  @IsString()
  preferredLocation?: string;

  @IsOptional()
  @IsString()
  frequency?: string; // 'weekly', 'monthly', 'seasonal', etc.
}

export class BuyerOnboardingDto {
  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  vatId?: string;

  @IsOptional()
  billingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };

  @IsOptional()
  paymentMethod?: {
    type?: string;
    details?: any;
  };

  @IsOptional()
  @ValidateNested()
  @Type(() => CompanyInfoDto)
  companyInfo?: CompanyInfoDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BuyerRequirementDto)
  requirements: BuyerRequirementDto[];
}
