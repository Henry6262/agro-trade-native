import { ApiProperty } from "@nestjs/swagger";

export type BuyerTimelineEventType =
  | "TRADE"
  | "NEGOTIATION"
  | "TRANSPORT"
  | "INSPECTION";

export class BuyerTimelineEventDto {
  @ApiProperty()
  id: string;

  @ApiProperty({
    enum: ["TRADE", "NEGOTIATION", "TRANSPORT", "INSPECTION"],
  })
  type: BuyerTimelineEventType;

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

export class BuyerTimelineResponseDto {
  @ApiProperty({ type: [BuyerTimelineEventDto] })
  events: BuyerTimelineEventDto[];

  @ApiProperty({ nullable: true })
  nextCursor: string | null;
}
