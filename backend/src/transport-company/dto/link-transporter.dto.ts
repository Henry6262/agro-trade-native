import { IsString, IsNotEmpty, IsOptional, IsBoolean } from "class-validator";

export class LinkTransporterDto {
  @IsString()
  @IsNotEmpty()
  transporterId: string; // User ID of the transporter

  @IsOptional()
  @IsBoolean()
  canSubmitBids?: boolean;

  @IsOptional()
  @IsBoolean()
  canManageTrucks?: boolean;
}

export class UnlinkTransporterDto {
  @IsString()
  @IsNotEmpty()
  transporterId: string;
}

export class InviteTransporterDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  licenseNumber: string;

  @IsOptional()
  @IsString()
  licenseClass?: string[];
}

export class TransporterSearchDto {
  @IsOptional()
  @IsString()
  searchTerm?: string; // Search by name, email, phone

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsBoolean()
  onlyAvailable?: boolean;
}
