import { IsString, IsNumber, IsOptional, Min, Max, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TruckType } from '@prisma/client';

export class CreateTradeOperationDto {
  @ApiProperty({
    description: 'ID of the buy listing to create a trade operation for',
    example: 'cmfk0hzzh0004bfffxe82z2jz',
  })
  @IsString()
  buyListingId: string;

  @ApiPropertyOptional({
    description: 'Target profit margin percentage (default: 7%)',
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
    description: 'Maximum transport distance in kilometers',
    example: 500,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxTransportDistance?: number;

  @ApiPropertyOptional({
    description: 'Preferred vehicle type for transport',
    enum: TruckType,
    example: 'FLATBED',
  })
  @IsOptional()
  @IsEnum(TruckType)
  preferredVehicleType?: TruckType;

  @ApiPropertyOptional({
    description: 'Quality preference for sourcing',
    enum: ['PREMIUM', 'STANDARD', 'ECONOMY', 'ANY'],
    example: 'STANDARD',
  })
  @IsOptional()
  @IsEnum(['PREMIUM', 'STANDARD', 'ECONOMY', 'ANY'])
  qualityPreference?: string;

  @ApiPropertyOptional({
    description: 'Notes or special instructions for the trade operation',
    example: 'Prioritize local suppliers',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class SellerToAddDto {
  @ApiProperty({ example: 'cmf899npe003mmd437u4ojxe2' })
  @IsString()
  sellerId: string;

  @ApiProperty({ example: 'cmf89d7s80008md43r3njqt4p' })
  @IsString()
  saleListingId: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0)
  requestedQuantity: number;
}

export class AddSellersDto {
  @ApiProperty({
    description: 'List of sellers to add to the trade operation',
    type: [SellerToAddDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SellerToAddDto)
  sellers: SellerToAddDto[];
}