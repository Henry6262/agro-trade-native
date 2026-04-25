import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class UpdateInvestmentPreferenceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  autoInvest?: boolean;

  @ApiPropertyOptional({ example: "PAXG" })
  @IsOptional()
  @IsString()
  assetSymbol?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 100, example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  percentage?: number;
}
