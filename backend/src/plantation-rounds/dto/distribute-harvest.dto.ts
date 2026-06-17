import { IsNumber, Min } from 'class-validator';

export class DistributeHarvestDto {
  @IsNumber()
  @Min(1)
  totalSaleCUSD: number;
}
