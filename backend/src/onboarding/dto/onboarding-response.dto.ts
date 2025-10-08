import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AddressType, TruckType, UserRole } from '@prisma/client';
import { Type } from 'class-transformer';

export class OnboardingCompanyDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  legalName?: string | null;

  @ApiPropertyOptional()
  registrationNumber?: string | null;

  @ApiPropertyOptional()
  vatNumber?: string | null;

  @ApiPropertyOptional()
  phoneNumber?: string | null;

  @ApiPropertyOptional()
  email?: string | null;

  @ApiPropertyOptional()
  website?: string | null;
}

export class OnboardingAddressDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: AddressType })
  addressType: AddressType;

  @ApiPropertyOptional()
  label?: string | null;

  @ApiPropertyOptional()
  street?: string | null;

  @ApiPropertyOptional()
  cityId?: string | null;

  @ApiPropertyOptional()
  postalCode?: string | null;

  @ApiPropertyOptional()
  country?: string | null;

  @ApiPropertyOptional({ type: Number })
  latitude?: number | null;

  @ApiPropertyOptional({ type: Number })
  longitude?: number | null;

  @ApiPropertyOptional()
  isDefault?: boolean | null;
}

export class OnboardingTruckDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  plateNumber: string;

  @ApiPropertyOptional({ type: Number })
  capacity?: number | null;

  @ApiProperty({ enum: TruckType })
  type: TruckType;

  @ApiPropertyOptional()
  currentLocation?: string | null;

  @ApiPropertyOptional({ type: Number })
  latitude?: number | null;

  @ApiPropertyOptional({ type: Number })
  longitude?: number | null;

  @ApiProperty()
  isAvailable: boolean;
}

export class OnboardingDataDto {
  @ApiPropertyOptional({ type: () => OnboardingCompanyDto })
  @Type(() => OnboardingCompanyDto)
  company?: OnboardingCompanyDto | null;

  @ApiPropertyOptional({ type: () => [OnboardingAddressDto] })
  @Type(() => OnboardingAddressDto)
  addresses?: OnboardingAddressDto[] | null;

  @ApiPropertyOptional({ type: () => [OnboardingTruckDto] })
  @Type(() => OnboardingTruckDto)
  trucks?: OnboardingTruckDto[] | null;
}

export class OnboardingStatusResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty()
  isComplete: boolean;

  @ApiProperty()
  onboardingCompleted: boolean;

  @ApiProperty({ type: [String] })
  missingFields: string[];

  @ApiProperty({ type: () => OnboardingDataDto })
  @Type(() => OnboardingDataDto)
  data: OnboardingDataDto;
}

export class OnboardingUserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional()
  name?: string | null;

  @ApiPropertyOptional()
  phoneNumber?: string | null;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty()
  onboardingCompleted: boolean;
}
