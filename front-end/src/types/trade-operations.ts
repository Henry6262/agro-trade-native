export type TradePhase =
  | 'INITIATION'
  | 'BUYER_SELECTION'
  | 'SELLER_MATCHING'
  | 'SELLER_NEGOTIATION'
  | 'INSPECTION_PENDING'
  | 'TRANSPORT_MATCHING'
  | 'TRANSPORT_BIDDING'
  | 'IN_PROGRESS'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED';

export type TradeStatus =
  | 'ACTIVE'
  | 'PENDING'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED'
  | 'FAILED';

export interface TradeOperation {
  id: string;
  status: TradeStatus;
  phase: TradePhase;
  profitMargin?: number | null;
  estimatedProfit?: number | null;
  targetProfitMargin?: number;
  createdAt: string;
  updatedAt: string;
  operationNumber?: string;
  buyListing?: {
    id: string;
    quantity: number;
    unit?: string;
    maxPricePerUnit?: number;
    product?: { id: string; name: string; category?: string } | null;
    buyer?: { id: string; name: string; email?: string } | null;
    deliveryAddress?: {
      city?: string;
      country?: string;
      address?: string;
      latitude?: number;
      longitude?: number;
    } | null;
  } | null;
  admin?: { id: string; name: string } | null;
  sellers?: TradeSeller[];
  selectedSellers?: {
    id: string;
    sellerId: string;
    saleListingId: string;
    requestedQuantity: number;
    saleListing?: {
      seller?: { name?: string } | null;
      product?: { name?: string } | null;
      unit?: string;
      askingPrice?: number;
      address?: { address?: string } | null;
    } | null;
  }[];
  negotiations?: NegotiationStub[];
  negotiationSummary?: NegotiationSummary;
  _count?: { sellers: number };
}

export interface NegotiationStub {
  id: string;
  status: string;
  tradeSellerId?: string;
  offeredPrice?: number;
  quantity?: number;
}

export interface NegotiationSummary {
  pending: number;
  countered: number;
  accepted: number;
  rejected: number;
  expired: number;
  withdrawn: number;
  total?: number;
}

export interface MatchingSeller {
  id: string;
  name: string;
  sellerName?: string;
  sellerId: string;
  saleListingId: string;
  askingPrice: number;
  price: number;
  availableQuantity: number;
  quantity: number;
  distance?: number;
  rating?: number;
  matchScore?: number;
  location?: { city?: string; country?: string; address?: string; displayName?: string };
  availability: number;
  saleListing?: {
    seller?: { name?: string } | null;
    product?: { name?: string } | null;
    unit?: string;
    address?: { address?: string } | null;
  } | null;
}

export interface TradeSeller {
  id: string;
  name: string;
  sellerId?: string;
  saleListingId?: string;
  price: number;
  quantity: number;
  requestedQuantity?: number;
  unit?: string;
  finalPrice?: number;
  status?: string;
  isVerified?: boolean;
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

export interface SaleListing {
  id: string;
  quantity: number;
  pricePerUnit: number;
  unit?: string;
  askingPrice?: number;
  quality?: string;
  categories?: string[];
  harvestDate?: string;
  location?: { city?: string; country?: string; address?: string };
  product?: { id: string; name: string } | null;
  seller?: { id: string; name: string } | null;
}

export interface BuyListing {
  id: string;
  quantity: number;
  unit?: string;
  maxPricePerUnit?: number;
  status?: string;
  neededBy?: string;
  urgency?: string;
  requirements?: string[];
  product?: { id: string; name: string; category?: string } | null;
  buyer?: { id: string; name: string; email?: string } | null;
  deliveryAddress?: {
    city?: string;
    country?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  } | null;
}

export interface ProfitCalculation {
  estimatedProfit: number;
  profitMargin: number;
  revenue?: { totalRevenue?: number; sellingPrice?: number; quantity?: number };
  costs?: {
    totalCosts?: number;
    purchases?: { totalCost?: number };
    transport?: { estimatedCost?: number };
  };
  profit?: { netProfit?: number; profitMargin?: number; meetsMinimumMargin?: boolean };
  sensitivityAnalysis?: unknown;
  riskAssessment?: unknown;
}

export interface TransportEstimate {
  distance: number;
  estimatedTime: number;
  estimatedCost: number;
  duration?: number;
  costs?: { totalCost?: number };
  vehicleType?: string;
  breakdown?: {
    baseRate?: number;
    distanceCharge?: number;
    multiPickupSurcharge?: number;
    costPerKm?: number;
    fuel?: number;
    tolls?: number;
    driver?: number;
    loading?: number;
  };
  route?: TransportRoute;
}
