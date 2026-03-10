import { TradeEventType } from "@prisma/client";

export class CreateTradeEventDto {
  tradeOperationId: string;
  eventType: TradeEventType;
  actorRole: string;
  actorId?: string;
  commodityCode?: string;
  quantityKg?: number;
  pricePerKg?: number;
  locationLat?: number;
  locationLng?: number;
  regionCode?: string;
  inspectionGrade?: string;
  blockchainTxHash?: string;
  metadata?: Record<string, unknown>;
}
