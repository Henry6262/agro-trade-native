import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  InspectionPriority,
  InspectionStatus,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateInspectionRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  tradeOperationId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  saleListingId: string;

  @ApiPropertyOptional({ enum: InspectionPriority })
  @IsOptional()
  @IsEnum(InspectionPriority)
  priority?: InspectionPriority;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsString()
  requestedDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateBatchInspectionsDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  tradeOperationId: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  saleListingIds: string[];

  @ApiPropertyOptional({ enum: InspectionPriority })
  @IsOptional()
  @IsEnum(InspectionPriority)
  priority?: InspectionPriority;
}

export class AssignInspectorDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  inspectorId: string;
}

export class UpdateInspectionStatusDto {
  @ApiProperty({ enum: InspectionStatus })
  @IsEnum(InspectionStatus)
  status: InspectionStatus;
}

export class UpdateInspectionDto {
  @ApiPropertyOptional({ enum: InspectionStatus })
  @IsOptional()
  @IsEnum(InspectionStatus)
  status?: InspectionStatus;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  qualityScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  qualityGrade?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];
}

export class InspectionProductSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  category?: string | null;
}

export class InspectionSellerSummaryDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  name?: string | null;

  @ApiPropertyOptional()
  email?: string | null;
}

export class InspectionSaleListingSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  sellerId: string;

  @ApiPropertyOptional()
  productId?: string;

  @ApiPropertyOptional({ type: Number })
  quantity?: number | null;

  @ApiPropertyOptional()
  unit?: string | null;

  @ApiPropertyOptional({ type: Number })
  askingPrice?: number | null;

  @ApiPropertyOptional({ type: () => InspectionProductSummaryDto })
  @Type(() => InspectionProductSummaryDto)
  product?: InspectionProductSummaryDto | null;

  @ApiPropertyOptional({ type: () => InspectionSellerSummaryDto })
  @Type(() => InspectionSellerSummaryDto)
  seller?: InspectionSellerSummaryDto | null;
}

export class InspectionBuyerSummaryDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  name?: string | null;

  @ApiPropertyOptional()
  email?: string | null;
}

export class InspectionBuyListingSummaryDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  productId?: string | null;

  @ApiPropertyOptional({ type: Number })
  quantity?: number | null;

  @ApiPropertyOptional()
  unit?: string | null;

  @ApiPropertyOptional({ type: () => InspectionBuyerSummaryDto })
  @Type(() => InspectionBuyerSummaryDto)
  buyer?: InspectionBuyerSummaryDto | null;
}

export class InspectionTradeOperationSummaryDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  status?: string | null;

  @ApiPropertyOptional({ type: () => InspectionBuyListingSummaryDto })
  @Type(() => InspectionBuyListingSummaryDto)
  buyListing?: InspectionBuyListingSummaryDto | null;
}

export class InspectionInspectorSummaryDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  name?: string | null;

  @ApiPropertyOptional()
  email?: string | null;
}

export class InspectionVerificationProductSpecificationsDto {
  @ApiPropertyOptional()
  variety?: string;

  @ApiPropertyOptional()
  grade?: string;

  @ApiPropertyOptional()
  origin?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  harvestDate?: string;
}

export class InspectionVerificationResultDto {
  @ApiPropertyOptional({ type: Number })
  actualQuantity?: number;

  @ApiPropertyOptional()
  actualQuality?: string;

  @ApiPropertyOptional({ type: Number })
  moistureContent?: number;

  @ApiPropertyOptional({ type: Number })
  foreignMatter?: number;

  @ApiPropertyOptional({ type: Number })
  brokenGrains?: number;

  @ApiPropertyOptional()
  discoloration?: boolean;

  @ApiPropertyOptional()
  pestDamage?: boolean;

  @ApiPropertyOptional({
    type: () => InspectionVerificationProductSpecificationsDto,
  })
  @Type(() => InspectionVerificationProductSpecificationsDto)
  productSpecifications?: InspectionVerificationProductSpecificationsDto;
}

export class SubmitInspectionResultsDto {
  @ApiProperty({ type: Number })
  @IsNumber()
  qualityScore: number;

  @ApiProperty({ type: () => InspectionVerificationResultDto })
  @ValidateNested()
  @Type(() => InspectionVerificationResultDto)
  verificationResult: InspectionVerificationResultDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];

  @ApiProperty()
  @IsBoolean()
  recommendVerification: boolean;
}

export class InspectionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: InspectionStatus })
  status: InspectionStatus;

  @ApiProperty({ enum: InspectionPriority })
  priority: InspectionPriority;

  @ApiProperty({ type: String, format: 'date-time' })
  requestedDate: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  scheduledDate?: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  completedDate?: string | null;

  @ApiPropertyOptional({ type: Number })
  qualityScore?: number | null;

  @ApiPropertyOptional({ type: () => InspectionVerificationResultDto })
  @Type(() => InspectionVerificationResultDto)
  verificationResult?: InspectionVerificationResultDto | null;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiPropertyOptional({ type: [String] })
  photos?: string[] | null;

  @ApiProperty({ type: Number })
  latitude: number;

  @ApiProperty({ type: Number })
  longitude: number;

  @ApiPropertyOptional()
  address?: string | null;

  @ApiPropertyOptional({ type: () => InspectionSaleListingSummaryDto })
  @Type(() => InspectionSaleListingSummaryDto)
  saleListing?: InspectionSaleListingSummaryDto | null;

  @ApiPropertyOptional({ type: () => InspectionInspectorSummaryDto })
  @Type(() => InspectionInspectorSummaryDto)
  inspector?: InspectionInspectorSummaryDto | null;

  @ApiPropertyOptional({ type: () => InspectionTradeOperationSummaryDto })
  @Type(() => InspectionTradeOperationSummaryDto)
  tradeOperation?: InspectionTradeOperationSummaryDto | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: string;
}

export class InspectionStatsDto {
  @ApiProperty({ type: Number })
  total: number;

  @ApiProperty({ type: Number })
  pending: number;

  @ApiProperty({ type: Number })
  scheduled: number;

  @ApiProperty({ type: Number })
  inProgress: number;

  @ApiProperty({ type: Number })
  completed: number;

  @ApiProperty({ type: Number })
  avgQualityScore: number;
}

export class InspectionAssigneeDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  name?: string | null;

  @ApiPropertyOptional()
  email?: string | null;

  @ApiPropertyOptional({ type: Number })
  activeAssignments?: number;
}

export class InspectorMissionDto extends InspectionResponseDto {}
