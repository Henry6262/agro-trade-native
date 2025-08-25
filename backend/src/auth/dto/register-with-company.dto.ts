import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '@prisma/client';

export class CompanyRegistrationDto {
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

export class RegisterWithCompanyDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;

  @IsOptional()
  @ValidateNested()
  @Type(() => CompanyRegistrationDto)
  companyInfo?: CompanyRegistrationDto;
}