import { IsInt, Min } from 'class-validator';

export class InvestDto {
  @IsInt()
  @Min(1)
  shareCount: number;
}
