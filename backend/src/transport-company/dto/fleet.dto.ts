import { ApiProperty } from "@nestjs/swagger";

export class FleetTruckDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  licensePlate: string;

  @ApiProperty()
  model: string;

  @ApiProperty()
  capacityTons: number;

  @ApiProperty({ enum: ["available", "assigned"] })
  status: "available" | "assigned";

  @ApiProperty()
  location: string;

  @ApiProperty()
  verified: boolean;

  @ApiProperty({ required: false })
  driver?: string;

  @ApiProperty({ required: false })
  assignment?: string;
}

export class FleetDriverDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  license: string;

  @ApiProperty({ required: false })
  phone?: string | null;

  @ApiProperty({ enum: ["available", "assigned"] })
  status: "available" | "assigned";

  @ApiProperty()
  experienceYears: number;

  @ApiProperty({ required: false })
  assignment?: string | null;
}

export class FleetSummaryDto {
  @ApiProperty()
  totalTrucks: number;

  @ApiProperty()
  availableTrucks: number;

  @ApiProperty()
  inTransitTrucks: number;

  @ApiProperty()
  verifiedTrucks: number;

  @ApiProperty()
  availableDrivers: number;

  @ApiProperty()
  assignedDrivers: number;
}

export class FleetResponseDto {
  @ApiProperty({ type: FleetSummaryDto })
  summary: FleetSummaryDto;

  @ApiProperty({ type: [FleetTruckDto] })
  trucks: FleetTruckDto[];

  @ApiProperty({ type: [FleetDriverDto] })
  drivers: FleetDriverDto[];
}
