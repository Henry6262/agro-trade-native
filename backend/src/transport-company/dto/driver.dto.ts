import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Max,
  MaxLength,
  IsEmail,
  IsNotEmpty,
  Matches,
} from "class-validator";

export class CreateDriverDto {
  @ApiProperty({ description: "Driver's first name" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ description: "Driver's last name" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  lastName: string;

  @ApiProperty({ description: "Driver's license number (must be unique per company)" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  licenseNumber: string;

  @ApiProperty({ description: "Driver's phone number" })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: "Phone number must be a valid international format",
  })
  phone: string;

  @ApiPropertyOptional({ description: "Years of driving experience", minimum: 0, maximum: 60 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(60)
  experienceYears?: number;

  @ApiPropertyOptional({ description: "Driver's email address" })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: "License classes (e.g., C, C+E, ADR)", type: [String] })
  @IsOptional()
  licenseClasses?: string[];
}

export class UpdateDriverDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(50)
  licenseNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: "Phone number must be a valid international format",
  })
  phone?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 60 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(60)
  experienceYears?: number;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  licenseClasses?: string[];

  @ApiPropertyOptional({ enum: ["available", "assigned", "offline", "on_break"] })
  @IsOptional()
  status?: "available" | "assigned" | "offline" | "on_break";
}
