export type TradePhase =
  | 'INITIATION'
  | 'SELLER_MATCHING'
  | 'SELLER_NEGOTIATION'
  | 'INSPECTION_PENDING'
  | 'TRANSPORT_MATCHING'
  | 'TRANSPORT_BIDDING'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED';

export type TradeStatus = 'ACTIVE' | 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';

export interface TradeOperation {
  id: string;
  status: TradeStatus;
  phase: TradePhase;
  profitMargin?: number | null;
  estimatedProfit?: number | null;
  createdAt: string;
  updatedAt: string;
  buyListing?: {
    id: string;
    quantity: number;
    product?: { id: string; name: string; category?: string } | null;
    buyer?: { id: string; name: string; email?: string } | null;
    deliveryAddress?: { city?: string; country?: string } | null;
  } | null;
  admin?: { id: string; name: string } | null;
  _count?: { sellers: number };
}

export interface MatchingSeller {
  id: string;
  name: string;
  price: number;
  quantity: number;
  distance?: number;
  rating?: number;
}

export interface TradeSeller {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  type: string;
  description: string;
  actor: string;
}

export interface TransportRoute {
  id: string;
  origin: string;
  destination: string;
  distance: number;
  estimatedTime: number;
}
