import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  IsEnum,
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
