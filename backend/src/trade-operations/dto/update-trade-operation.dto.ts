import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Max,
  IsEnum,
  IsBoolean,
  IsDate,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { TradePhase, TradeStatus } from "@prisma/client";
import { Type } from "class-transformer";

export class UpdateTradeOperationDto {
  @ApiPropertyOptional({
    description: "Trade operation phase",
    enum: TradePhase,
    example: "NEGOTIATION",
  })
  @IsOptional()
  @IsEnum(TradePhase)
  phase?: TradePhase;

  @ApiPropertyOptional({
    description: "Trade operation status",
    enum: TradeStatus,
    example: "ACTIVE",
  })
  @IsOptional()
  @IsEnum(TradeStatus)
  status?: TradeStatus;

  @ApiPropertyOptional({
    description: "Selling price per unit to buyer",
    example: 380,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sellingPrice?: number;

  @ApiPropertyOptional({
    description: "Target profit margin percentage",
    minimum: 5,
    maximum: 20,
    example: 7,
  })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(20)
  targetProfitMargin?: number;

  @ApiPropertyOptional({
    description: "Expected delivery date",
    example: "2024-12-31T23:59:59Z",
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expectedDeliveryDate?: Date;

  @ApiPropertyOptional({
    description: "Whether transport has been optimized",
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  transportOptimized?: boolean;

  @ApiPropertyOptional({
    description: "Admin notes or updates",
    example: "Negotiation progressing well",
  })
  @IsOptional()
  @IsString()
  adminNotes?: string;
}

export class FinalizeTradeDto {
  @ApiPropertyOptional({
    description: "Actual transport cost if different from estimated",
    example: 155.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  actualTransportCost?: number;

  @ApiPropertyOptional({
    description: "Actual delivery date",
    example: "2024-12-30T14:30:00Z",
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  actualDeliveryDate?: Date;

  @ApiPropertyOptional({
    description: "Final notes or comments",
    example: "Trade completed successfully",
  })
  @IsOptional()
  @IsString()
  finalNotes?: string;
}
