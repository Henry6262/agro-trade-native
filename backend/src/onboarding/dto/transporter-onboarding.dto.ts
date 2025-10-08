import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { TruckType } from '@prisma/client';
import { CompanyInfoDto } from './seller-onboarding.dto';

export class TransporterBaseDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsNumber()
  @IsNotEmpty()
  latitude: number;

  @IsNumber()
  @IsNotEmpty()
  longitude: number;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class FleetVehicleDto {
  @IsString()
  @IsNotEmpty()
  plateNumber: string;

  @IsEnum(TruckType)
  @IsNotEmpty()
  vehicleType: TruckType;

  @IsNumber()
  @IsNotEmpty()
  capacityKg: number;

  @IsOptional()
  @IsNumber()
  year?: number;

  @IsOptional()
  @IsString()
  make?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  fuelType?: string;

  @IsOptional()
  @IsString()
  registrationDoc?: string;

  @IsOptional()
  @IsString()
  insuranceDoc?: string;

  @IsOptional()
  @IsString()
  licenseDoc?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class TransporterOnboardingDto {
  // Company association options
  @IsOptional()
  @IsString()
  transportCompanyId?: string; // Join existing company

  @IsOptional()
  @IsString()
  companyInviteCode?: string; // Join via invite code

  @IsOptional()
  @IsBoolean()
  isIndependent?: boolean; // Register as independent transporter

  @IsOptional()
  @IsString()
  companyName?: string; // For independent transporters

  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsString()
  baseLocationAddress?: string;

  @IsOptional()
  @IsNumber()
  baseLocationLat?: number;

  @IsOptional()
  @IsNumber()
  baseLocationLng?: number;

  @IsOptional()
  @IsString()
  insuranceDocUrl?: string;

  @IsOptional()
  @IsString()
  iban?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CompanyInfoDto)
  companyInfo?: CompanyInfoDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransporterBaseDto)
  bases: TransporterBaseDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FleetVehicleDto)
  fleetVehicles: FleetVehicleDto[];
}