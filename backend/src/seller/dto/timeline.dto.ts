import { ApiProperty } from "@nestjs/swagger";

export type SellerTimelineEventType =
  | "NEGOTIATION"
  | "TRADE"
  | "TRANSPORT"
  | "INSPECTION";

export class SellerTimelineEventDto {
  @ApiProperty()
  id: string;

  @ApiProperty({
    enum: ["NEGOTIATION", "TRADE", "TRANSPORT", "INSPECTION"],
  })
  type: SellerTimelineEventType;

  @ApiProperty()
  title: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  timestamp: Date;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false, type: Object })
  metadata?: Record<string, any>;
}

export class SellerTimelineResponseDto {
  @ApiProperty({ type: [SellerTimelineEventDto] })
  events: SellerTimelineEventDto[];

  @ApiProperty({ nullable: true })
  nextCursor: string | null;
}
