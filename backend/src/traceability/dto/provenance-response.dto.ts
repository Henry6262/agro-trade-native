export class ProvenanceEventDto {
  type: string;
  timestamp: string;
  actorRole: string;
  location: { lat?: number; lng?: number; region?: string };
  grade?: string;
  verified: boolean;
  blockchainTxHash?: string;
}

export class ProvenanceResponseDto {
  tradeId: string;
  events: ProvenanceEventDto[];
}
