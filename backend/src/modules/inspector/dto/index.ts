import { IsOptional, IsString, IsNumber, IsBoolean, IsIn } from "class-validator";
import { Type } from "class-transformer";

export class AcceptJobDto {
  @IsOptional()
  @IsString()
  inspectorId?: string;

  @IsOptional()
  @IsString()
  estimatedArrival?: string;
}

export class LocationUpdateDto {
  @IsOptional()
  @IsString()
  inspectorId?: string;

  @IsOptional()
  @IsString()
  jobId?: string;

  @IsOptional()
  coordinates?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    heading?: number;
    speed?: number;
  };

  @IsOptional()
  @IsString()
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
  @IsOptional()
  @IsString()
  jobId?: string;

  @IsOptional()
  @IsString()
  inspectorId?: string;

  @IsOptional()
  @IsString()
  sellerListingId?: string;

  @IsOptional()
  originalSpecs?: Record<string, any>;

  @IsOptional()
  verifiedSpecs?: Record<string, any>;

  @IsOptional()
  testMethods?: Array<{
    parameter: string;
    method: string;
    equipment: string;
    standardUsed?: string;
  }>;

  @IsOptional()
  evidence?: Array<{
    type: "photo" | "document" | "video";
    url: string;
    caption?: string;
    timestamp: string;
  }>;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  verificationStatus?: "VERIFIED" | "PARTIALLY_VERIFIED" | "FAILED" | "PENDING_REVIEW";

  @IsOptional()
  @IsString()
  signature?: string;

  @IsOptional()
  @IsString()
  verifiedAt?: string;
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
