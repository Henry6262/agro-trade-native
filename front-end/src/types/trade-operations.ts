// Trade Operations Type Definitions

export interface SellerLocation {
  latitude: number;
  longitude: number;
  lat?: number; // Some APIs return lat/lng instead of latitude/longitude
  lng?: number;
  city: string;
  address?: string;
  displayName?: string;
}

export interface MatchingSeller {
  sellerId: string;
  sellerName: string;
  saleListingId: string;
  availableQuantity: number;
  availability?: number; // For backward compatibility
  askingPrice: number;
  quality: string;
  location?: SellerLocation;
  distance: number;
  score: number;
  matchScore?: number; // Frontend calculated percentage
  saleListing?: {
    seller?: {
      name?: string;
    };
    address?: {
      city?: string;
    };
    location?: {
      city?: string;
    };
  };
}

export interface TradeOperation {
  id: string;
  operationNumber: string;
  phase: TradePhase;
  status: TradeStatus;
  buyListingId: string;
  buyListing?: BuyListing;
  sellers?: TradeSeller[];
  negotiations?: OfferNegotiation[];
  totalPurchaseCost?: number;
  avgPurchasePrice?: number;
  estimatedTransportCost?: number;
  estimatedProfit?: number;
  profitMargin?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BuyListing {
  id: string;
  buyerId: string;
  buyer?: {
    id: string;
    name: string;
    email?: string;
  };
  productId: string;
  product?: Product;
  quantity: number;
  unit: ProductUnit;
  maxPricePerUnit: number;
  preferredDeliveryDate?: string;
  location?: SellerLocation;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  description?: string;
  defaultUnit: ProductUnit;
  minimumQuality?: string;
}

export interface TradeSeller {
  id: string;
  tradeOperationId: string;
  sellerId: string;
  seller?: {
    id: string;
    name: string;
  };
  saleListingId: string;
  saleListing?: SaleListing;
  requestedQuantity: number;
  offeredQuantity?: number;
  unit: ProductUnit;
  status: SellerStatus;
  finalPrice?: number;
  isVerified?: boolean;
}

export interface SaleListing {
  id: string;
  productId: string;
  product?: Product;
  sellerId: string;
  seller?: {
    id: string;
    name: string;
  };
  addressId?: string;
  address?: {
    street?: string;
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  quantity: number;
  unit: ProductUnit;
  askingPrice?: number;
  harvestDate?: string;
  status: ListingStatus;
  qualityGrade?: string;
  isVerified: boolean;
  verificationDate?: string;
  location?: SellerLocation;
}

export interface OfferNegotiation {
  id: string;
  tradeOperationId: string;
  sellerId: string;
  seller?: {
    id: string;
    name: string;
  };
  status: NegotiationStatus;
  currentOffer?: Offer;
  offers: Offer[];
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Offer {
  id: string;
  negotiationId: string;
  sentBy: 'BUYER' | 'SELLER' | 'PLATFORM';
  price: number;
  quantity: number;
  terms?: string;
  message?: string;
  response?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED';
  counterOfferId?: string;
  createdAt: string;
  expiresAt?: string;
}

// Enums
export enum TradePhase {
  BUYER_SELECTION = 'BUYER_SELECTION',
  SELLER_MATCHING = 'SELLER_MATCHING',
  SELLER_NEGOTIATION = 'SELLER_NEGOTIATION',
  INSPECTION_REQUESTED = 'INSPECTION_REQUESTED',
  TRANSPORT_MATCHING = 'TRANSPORT_MATCHING',
  TRANSPORT_NEGOTIATION = 'TRANSPORT_NEGOTIATION',
  IN_PROGRESS = 'IN_PROGRESS',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TradeStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

export enum SellerStatus {
  INVITED = 'INVITED',
  OFFER_SENT = 'OFFER_SENT',
  NEGOTIATING = 'NEGOTIATING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

export enum NegotiationStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export enum ListingStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  SOLD = 'SOLD',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum ProductUnit {
  KG = 'KG',
  TON = 'TON',
  PIECE = 'PIECE',
  LITER = 'LITER',
  BUSHEL = 'BUSHEL',
}

// API Request/Response types
export interface CreateTradeOperationRequest {
  buyListingId: string;
  notes?: string;
}

export interface AddSellersRequest {
  sellers: {
    sellerId: string;
    saleListingId: string;
    requestedQuantity: number;
  }[];
}

export interface CreateOfferRequest {
  negotiationId?: string;
  sellerId: string;
  price: number;
  quantity: number;
  terms?: string;
  message?: string;
}

export interface RespondToOfferRequest {
  offerId: string;
  response: 'ACCEPT' | 'REJECT' | 'COUNTER';
  counterOffer?: {
    price: number;
    quantity: number;
    terms?: string;
    message?: string;
  };
}

export interface TransitionPhaseRequest {
  toPhase: TradePhase;
  reason?: string;
}

export interface TradeOperationDetail extends TradeOperation {
  timeline?: TimelineEvent[];
  availableActions?: string[];
  profitCalculation?: ProfitCalculation;
}

export interface TimelineEvent {
  id: string;
  phase: TradePhase;
  timestamp: string;
  description: string;
  actor: string;
  details?: any;
}

export interface ProfitCalculation {
  revenue: {
    sellingPrice: number;
    totalRevenue: number;
  };
  costs: {
    purchaseCost: number;
    transportCost: number;
    commission: number;
    totalCosts: number;
  };
  profit: {
    netProfit: number;
    profitMargin: number;
    meetsMinimumMargin: boolean;
  };
}
