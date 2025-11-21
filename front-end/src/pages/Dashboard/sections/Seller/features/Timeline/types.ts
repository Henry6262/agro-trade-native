export type SellerTimelineEventType = 'NEGOTIATION' | 'TRADE' | 'TRANSPORT' | 'INSPECTION';

export interface SellerTimelineEvent {
  id: string;
  type: SellerTimelineEventType;
  title: string;
  status: string;
  timestamp: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface SellerTimelineHookResult {
  events: SellerTimelineEvent[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}
