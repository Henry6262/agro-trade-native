import {
  IsEmail,
  IsString,
  IsOptional,
  IsArray,
  MinLength,
  Matches,
} from "class-validator";

export class RegisterCompanyDto {
  // Company Details
  @IsString()
  @MinLength(2)
  companyName: string;

  @IsString()
  @Matches(/^[A-Z0-9]{6,20}$/, {
    message: "Registration number must be 6-20 characters, alphanumeric only",
  })
  registrationNumber: string;

  @IsString()
  @IsOptional()
  @Matches(/^[A-Z]{2}[0-9]{8,12}$/, {
    message: "VAT number must start with 2 letters followed by 8-12 digits",
  })
  vatNumber?: string;

  // Contact Information
  @IsEmail()
  mainEmail: string;

  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: "Please provide a valid phone number",
  })
  mainPhone: string;

  @IsString()
  @IsOptional()
  website?: string;

  // Operating Information
  @IsArray()
  @IsString({ each: true })
  operatingRegions: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  specializations?: string[];

  // Admin Account Details
  @IsString()
  @MinLength(2)
  adminName: string;

  @IsEmail()
  adminEmail: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      "Password must contain uppercase, lowercase, number and special character",
  })
  adminPassword: string;

  @IsString()
  @IsOptional()
  adminPhone?: string;
}

export class VerifyCompanyDto {
  @IsString()
  companyId: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
