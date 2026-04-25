import {
  ArrayMinSize,
  IsDateString,
  IsBoolean,
  IsDefined,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

class CoordinatesDto {
  @Type(() => Number)
  @IsNumber()
  latitude!: number;

  @Type(() => Number)
  @IsNumber()
  longitude!: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  accuracy?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  heading?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  speed?: number;
}

class TestMethodDto {
  @IsString()
  @IsNotEmpty()
  parameter!: string;

  @IsString()
  @IsNotEmpty()
  method!: string;

  @IsString()
  @IsNotEmpty()
  equipment!: string;

  @IsOptional()
  @IsString()
  standardUsed?: string;
}

class EvidenceDto {
  @IsString()
  @IsNotEmpty()
  type!: "photo" | "document" | "video";

  @IsUrl()
  url!: string;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsString()
  @IsNotEmpty()
  timestamp!: string;
}

export class AcceptJobDto {
  @IsString()
  @IsNotEmpty()
  inspectorId!: string;

  @IsDateString()
  estimatedArrival!: string;
}

export class LocationUpdateDto {
  @IsString()
  @IsNotEmpty()
  inspectorId!: string;

  @IsOptional()
  @IsString()
  jobId?: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates!: CoordinatesDto;

  @IsOptional()
  @IsDateString()
  timestamp?: string;

  @IsOptional()
  @IsNumber()
  batteryLevel?: number;

  @IsOptional()
  @IsString()
  networkType?: "wifi" | "cellular" | "none";

  @IsOptional()
  @IsBoolean()
  isMoving?: boolean;
}

export class VerificationResultDto {
  @IsString()
  @IsNotEmpty()
  jobId!: string;

  @IsString()
  @IsNotEmpty()
  inspectorId!: string;

  @IsOptional()
  @IsString()
  sellerListingId?: string;

  @IsDefined()
  originalSpecs!: Record<string, any>;

  @IsDefined()
  verifiedSpecs!: Record<string, any>;

  @IsDefined()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TestMethodDto)
  testMethods!: TestMethodDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => EvidenceDto)
  evidence?: EvidenceDto[];

  @IsString()
  @IsNotEmpty()
  notes!: string;

  @IsString()
  @IsNotEmpty()
  verificationStatus!: "VERIFIED" | "PARTIALLY_VERIFIED" | "FAILED" | "PENDING_REVIEW";

  @IsOptional()
  @IsString()
  signature?: string;

  @IsDateString()
  verifiedAt!: string;
}

export class JobFilterDto {
  @IsOptional()
  @IsIn(["LOW", "MEDIUM", "HIGH"])
  priority?: "LOW" | "MEDIUM" | "HIGH";

  @IsOptional()
  @IsIn(["PENDING", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"])
  status?: "PENDING" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  radius?: number;

  @IsOptional()
  @IsString()
  inspectorId?: string;
}
