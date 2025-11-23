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

  @ApiProperty()
  @IsString()
  role: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string | null;
}
