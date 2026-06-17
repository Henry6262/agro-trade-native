import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateRoundDto {
  @IsString()
  @IsNotEmpty()
  cropType: string;

  @IsString()
  @IsNotEmpty()
  farmLocation: string;

  @IsNumber()
  @Min(1)
  targetCUSD: number;

  @IsNumber()
  @Min(1)
  pricePerShareCUSD: number;

  @IsDateString()
  harvestDeadline: string;

  @IsString()
  @IsOptional()
  metadataUri?: string;

  @IsNumber()
  @IsOptional()
  projectedApyPct?: number;
}
