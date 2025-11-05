// Trade Operation Types
export enum TradePhase {
  INITIATION = 'INITIATION',
  SELLER_NEGOTIATION = 'SELLER_NEGOTIATION',
  TRANSPORT_MATCHING = 'TRANSPORT_MATCHING',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERY = 'DELIVERY',
  PAYMENT = 'PAYMENT',
  COMPLETED = 'COMPLETED'
}

export enum TradeStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

export enum NegotiationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  COUNTERED = 'COUNTERED',
  EXPIRED = 'EXPIRED',
  WITHDRAWN = 'WITHDRAWN'
}

// Base types first
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  phoneNumber?: string;
  city?: string;
  region?: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
}

export interface Product {
  id: string;
  name: string;
  type: string;
  category: string;
  description?: string;
  specifications?: Record<string, string | number | boolean>;
  quality?: string;
}

export interface BuyListing {
  id: string;
  buyerId: string;
  productId: string;
  quantity: number;
  unit: string;
  maxPricePerUnit: number;
  requiredByDate: string;
  description?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  buyer?: User;
  product?: Product;
}

export interface SaleListing {
  id: string;
  sellerId: string;
  productId: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  availableDate: string;
  description?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  seller?: User;
  product?: Product;
}

export interface Negotiation {
  id: string;
  tradeOperationId: string;
  tradeSellerId: string;
  type: 'BUYER_OFFER' | 'SELLER_COUNTER' | 'BUYER_COUNTER';
  status: NegotiationStatus;
  offeredPrice: number;
  offeredQuantity: number;
  terms?: string;
  expiresAt: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
  tradeSeller?: TradeSeller;
}


export interface TradeSeller {
  id: string;
  tradeOperationId: string;
  sellerId: string;
  saleListingId: string;
  status: 'INVITED' | 'NEGOTIATING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'FAILED_INSPECTION';
  requestedQuantity: number;
  unit: string;
  finalPrice?: number;
  agreedPrice?: number;
  agreedQuantity?: number;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  seller?: User;
  saleListing?: SaleListing;
}

export interface TradeOperation {
  id: string;
  operationNumber: string;
  buyListingId: string;
  adminId: string;
  phase: TradePhase;
  status: TradeStatus;
  estimatedProfit?: number;
  profitMargin?: number;
  totalPurchaseCost?: number;
  estimatedTransportCost?: number;
  finalRevenue?: number;
  metadata?: Record<string, string | number | boolean | null>;
  createdAt: string;
  updatedAt: string;
  buyListing?: BuyListing;
  sellers?: TradeSeller[];
  admin?: User;
}

export interface VerificationResult {
  passed: boolean;
  qualityScore: number;
  moistureContent?: number;
  proteinLevel?: number;
  notes?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface InspectionRequest {
  id: string;
  tradeOperationId: string;
  saleListingId: string;
  inspectorId?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  requestedDate: string;
  scheduledDate?: string;
  completedDate?: string;
  latitude: number;
  longitude: number;
  address: string;
  notes?: string;
  photos: string[];
  qualityScore?: number;
  verificationResult?: VerificationResult;
  inspector?: User;
  saleListing?: SaleListing;
}

export interface CalculateTransportRequest {
  sellerIds: string[];
  buyerAddressId: string;
}

export interface TransportCostResult {
  sellerId: string;
  distance: number;
  transportCost: number;
}

export interface CalculateTransportResponse {
  success?: boolean;
  results: TransportCostResult[];
  totalCost?: number;
  currency?: string;
  warnings?: string[];
}

// Request DTOs
export interface CreateTradeSellerInput {
  sellerId: string;
  saleListingId: string;
  quantity: number;
  offerPrice: number;
}

export interface CreateTradeOperationDto {
  buyListingId: string;
  sellers: CreateTradeSellerInput[];
}

export interface NegotiationSummary {
  id: string;
  tradeSellerId: string;
  sellerId: string;
  sellerName: string;
  status: string;
  offerPrice?: number;
  quantity?: number;
  expiresAt?: string;
  hoursUntilExpiry?: number;
}

export interface CreateTradeOperationResponse {
  tradeOperationId: string;
  operationNumber: string;
  phase: string;
  status: string;
  negotiations: NegotiationSummary[];
}

export interface CreateNegotiationDto {
  tradeSellerId: string;
  offeredPrice: number;
  offeredQuantity: number;
  terms?: string;
  expiresInHours?: number;
}

export interface RespondToNegotiationDto {
  status: 'ACCEPTED' | 'REJECTED' | 'COUNTERED';
  counterPrice?: number;
  counterQuantity?: number;
  counterTerms?: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  type: string;
  description: string;
  user?: string;
  data?: Record<string, string | number | boolean | null>;
}
