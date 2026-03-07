import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  IsPhoneNumber,
  IsObject,
} from "class-validator";
import { UserRole } from "@prisma/client";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsPhoneNumber()
  phoneNumber?: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsObject()
  metadata?: any;
}

export class TransporterRegisterDto extends RegisterDto {
  @IsString()
  companyName: string;

  @IsString()
  licenseNumber: string;

  @IsOptional()
  fleetSize?: number;

  @IsOptional()
  @IsString()
  baseLocation?: string;

  @IsOptional()
  @IsObject()
  coordinates?: {
    lat: number;
    lng: number;
  };

  @IsOptional()
  @IsString()
  insuranceProvider?: string;

  @IsOptional()
  @IsString()
  insurancePolicyNumber?: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class VerifyEmailDto {
  @IsString()
  token: string;
}
export class AuthUserDto {
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

  @ApiPropertyOptional()
  hasProfile?: boolean;
}

export class AuthSuccessResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ name: "access_token" })
  access_token: string;

  @ApiProperty({ name: "refresh_token" })
  refresh_token: string;

  @ApiProperty({ type: () => AuthUserDto })
  user: AuthUserDto;

  @ApiPropertyOptional()
  message?: string;
}

export class RefreshTokenResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ name: "access_token" })
  access_token: string;

  @ApiProperty({ name: "refresh_token" })
  refresh_token: string;
}

export class TransporterRegistrationResponseDto extends AuthSuccessResponseDto {
  @ApiPropertyOptional({ type: Object })
  transporter?: Record<string, any>;
}

export class GoogleMobileAuthDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty()
  @IsString()
  redirectUri: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  role?: string;
}

export class GoogleNativeUserInfoDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  givenName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  familyName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  photo?: string;
}

export class GoogleNativeAuthDto {
  @ApiProperty()
  @IsString()
  idToken: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ type: () => GoogleNativeUserInfoDto })
  @IsOptional()
  userInfo?: GoogleNativeUserInfoDto;
}

export class LogoutResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;
}

export class AuthProfileResponseDto {
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

  @ApiProperty({ type: String, format: "date-time" })
  createdAt: string;

  @ApiProperty({ type: String, format: "date-time" })
  updatedAt: string;

  @ApiPropertyOptional({ type: Object })
  companyContext?: Record<string, any>;
}

export class PrivyAuthDto {
  @ApiProperty()
  @IsString()
  privyToken: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string | null;
}

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}

export class UpdateProfileResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty({ type: () => AuthProfileResponseDto })
  user: AuthProfileResponseDto;
}

// ==================== Company DTOs ====================

export class UpdateCompanyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  legalName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vatNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  website?: string;
}

export class CompanyResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  legalName: string;

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

  @ApiProperty({ type: String, format: "date-time" })
  createdAt: string;

  @ApiProperty({ type: String, format: "date-time" })
  updatedAt: string;
}

export class PhoneSendOtpDto {
  @ApiProperty({ example: '+35988123456', description: 'E.164 format phone number' })
  @IsString()
  phone: string;
}

export class PhoneVerifyOtpDto {
  @ApiProperty({ example: '+35988123456', description: 'E.164 format phone number' })
  @IsString()
  phone: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP code' })
  @IsString()
  code: string;
}

// ==================== Base (Address) DTOs ====================

export class CreateBaseDto {
  @ApiProperty()
  @IsString()
  label: string;

  @ApiProperty({ enum: ["WAREHOUSE", "FARM", "OFFICE", "PICKUP", "DELIVERY", "OTHER"] })
  @IsString()
  addressType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  street?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  isDefault?: boolean;
}

export class BaseResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  label: string;

  @ApiProperty()
  addressType: string;

  @ApiPropertyOptional()
  street?: string | null;

  @ApiPropertyOptional()
  cityId?: string | null;

  @ApiPropertyOptional()
  postalCode?: string | null;

  @ApiPropertyOptional()
  country?: string | null;

  @ApiPropertyOptional()
  latitude?: number | null;

  @ApiPropertyOptional()
  longitude?: number | null;

  @ApiProperty()
  isDefault: boolean;
}
