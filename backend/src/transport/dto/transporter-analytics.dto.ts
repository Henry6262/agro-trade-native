import { ApiProperty } from "@nestjs/swagger";

export class TransporterAnalyticsMetricsDto {
  @ApiProperty()
  totalBids: number;

  @ApiProperty()
  acceptedBids: number;

  @ApiProperty()
  winRate: number;

  @ApiProperty()
  pendingBids: number;

  @ApiProperty()
  activeJobs: number;

  @ApiProperty()
  completedJobs: number;

  @ApiProperty()
  onTimeDeliveryRate: number;

  @ApiProperty()
  averageBidAmount: number;
}

export class TransporterAnalyticsResponseDto {
  @ApiProperty({ type: TransporterAnalyticsMetricsDto })
  metrics: TransporterAnalyticsMetricsDto;

  @ApiProperty({
    type: "array",
    items: { type: "object", additionalProperties: true },
  })
  recentJobs: any[];
}
