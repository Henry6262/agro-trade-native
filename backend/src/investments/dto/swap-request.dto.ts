import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsPositive, IsString, Min } from "class-validator";

export class SwapRequestDto {
  @ApiProperty({ example: "PAXG" })
  @IsString()
  assetSymbol: string;

  @ApiProperty({ example: 10.5 })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @Min(0.000001)
  amountUsdc: number;

  @ApiPropertyOptional({ example: "cmtrade123" })
  @IsOptional()
  @IsString()
  tradeOperationId?: string;
}
