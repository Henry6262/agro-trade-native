import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, IsPositive, IsString } from "class-validator";

export class LocationPricingQueryDto {
  @ApiProperty({ description: "Product identifier (slug or id)" })
  @IsString()
  productId!: string;

  @ApiProperty({ description: "Requested quantity (e.g., kg)", example: 100 })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  quantity!: number;

  @ApiProperty({ description: "Latitude of the requester", example: 42.6977 })
  @Type(() => Number)
  @IsNumber()
  latitude!: number;

  @ApiProperty({ description: "Longitude of the requester", example: 23.3219 })
  @Type(() => Number)
  @IsNumber()
  longitude!: number;
}

export class PriceRangeDto {
  @ApiProperty()
  min!: number;

  @ApiProperty()
  max!: number;

  @ApiProperty({ example: "EUR" })
  currency!: string;

  @ApiProperty({ enum: ["high", "medium", "low"] })
  confidence!: "high" | "medium" | "low";
}

export class MarketDataDto {
  @ApiProperty()
  averagePrice!: number;

  @ApiProperty({ enum: ["rising", "stable", "falling"] })
  trend!: "rising" | "stable" | "falling";

  @ApiProperty({ enum: ["high", "medium", "low"] })
  demandLevel!: "high" | "medium" | "low";
}

export class LocationPricingResponseDto {
  @ApiProperty({ type: () => PriceRangeDto })
  priceRange!: PriceRangeDto;

  @ApiProperty({ type: () => MarketDataDto })
  marketData!: MarketDataDto;
}
