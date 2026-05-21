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
