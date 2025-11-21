import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNumber,
  IsOptional,
  IsObject,
  IsEnum,
  Min,
  MaxLength,
  IsNotEmpty,
} from "class-validator";

export class TruckLocationDto {
  @ApiProperty()
  @IsNumber()
  lat: number;

  @ApiProperty()
  @IsNumber()
  lng: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;
}

export class CreateTruckDto {
  @ApiProperty({ description: "License plate number (must be unique per company)" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  licensePlate: string;

  @ApiProperty({ description: "Truck model or type description" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  model: string;

  @ApiProperty({ description: "Cargo capacity in tons", minimum: 0.1 })
  @IsNumber()
  @Min(0.1)
  capacityTons: number;

  @ApiPropertyOptional({ type: TruckLocationDto, description: "Current location" })
  @IsOptional()
  @IsObject()
  location?: TruckLocationDto;

  @ApiPropertyOptional({ description: "Vehicle type (e.g., FLATBED, REFRIGERATED)" })
  @IsOptional()
  @IsString()
  vehicleType?: string;
}

export class UpdateTruckDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(20)
  licensePlate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(100)
  model?: string;

  @ApiPropertyOptional({ minimum: 0.1 })
  @IsNumber()
  @IsOptional()
  @Min(0.1)
  capacityTons?: number;

  @ApiPropertyOptional({ type: TruckLocationDto })
  @IsOptional()
  @IsObject()
  location?: TruckLocationDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vehicleType?: string;

  @ApiPropertyOptional({ enum: ["available", "assigned", "maintenance"] })
  @IsOptional()
  @IsEnum(["available", "assigned", "maintenance"])
  status?: "available" | "assigned" | "maintenance";
}

export class AssignDriverDto {
  @ApiProperty({ description: "Driver ID to assign to this truck" })
  @IsString()
  @IsNotEmpty()
  driverId: string;
}
