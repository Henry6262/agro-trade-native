import {
  IsEmail,
  IsString,
  IsEnum,
  IsOptional,
  MinLength,
  MaxLength,
  IsPhoneNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class LoginDto {
  @ApiProperty({
    example: 'farmer@example.com',
    description: 'User email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'User password',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;
}

export class RegisterDto {
  @ApiProperty({
    example: 'farmer@example.com',
    description: 'User email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'User password',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password: string;

  @ApiProperty({
    example: 'John',
    description: 'User first name',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'User last name',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.FARMER,
    description: 'User role in the system',
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({
    example: '+1234567890',
    description: 'User phone number',
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;
}

export class GoogleAuthDto {
  @ApiProperty({
    example: '1234567890',
    description: 'Google user ID',
  })
  @IsString()
  googleId: string;

  @ApiProperty({
    example: 'user@gmail.com',
    description: 'Google account email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'John',
    description: 'First name from Google profile',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Last name from Google profile',
  })
  @IsString()
  lastName: string;

  @ApiProperty({
    example: 'https://avatar.url/image.jpg',
    description: 'Google profile picture URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.FARMER,
    description: 'Desired user role',
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Refresh token',
  })
  @IsString()
  refreshToken: string;
}

export class ChangePasswordDto {
  @ApiProperty({
    example: 'oldpassword123',
    description: 'Current password',
  })
  @IsString()
  currentPassword: string;

  @ApiProperty({
    example: 'newpassword123',
    description: 'New password',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  newPassword: string;
}

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address to send reset link',
  })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Password reset token',
  })
  @IsString()
  token: string;

  @ApiProperty({
    example: 'newpassword123',
    description: 'New password',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  newPassword: string;
}