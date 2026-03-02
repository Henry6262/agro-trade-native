// Trade Operation Types
export enum TradePhase {
  INITIATION = 'INITIATION',
  SELLER_MATCHING = 'SELLER_MATCHING',
  SELLER_NEGOTIATION = 'SELLER_NEGOTIATION',
  INSPECTION_PENDING = 'INSPECTION_PENDING',
  TRANSPORT_MATCHING = 'TRANSPORT_MATCHING',
  TRANSPORT_BIDDING = 'TRANSPORT_BIDDING',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum TradeStatus {
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  DISPUTED = 'DISPUTED'
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
  role?: string;
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
  type?: string;
  category?: string;
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
  specifications?: Array<{
    id: string;
    valueNumber?: number | null;
    valueText?: string | null;
    valueBool?: boolean | null;
    specificationType: {
      id: string;
      code: string;
      name: string;
      unit?: string;
      dataType: 'NUMBER' | 'TEXT' | 'BOOLEAN' | 'ENUM';
    };
  }>;
}

export interface SaleListing {
  id: string;
  sellerId: string;
  productId: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  askingPrice?: number;
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
  inspection?: SellerInspectionStatus;
}

export interface SellerInspectionStatus {
  id: string;
  status: 'PENDING' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  requestedDate?: string | null;
  scheduledDate?: string | null;
  completedDate?: string | null;
  inspector?: {
    id: string;
    name?: string | null;
    email?: string | null;
  } | null;
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
  sellingPrice?: number;
  expectedDeliveryDate?: string;
  metadata?: Record<string, string | number | boolean | null>;
  createdAt: string;
  updatedAt: string;
  buyListing?: BuyListing;
  sellers?: TradeSeller[];
  admin?: User;
  transport?: TransportSummary;
  offers?: Array<{
    id: string;
    tradeOperationId: string;
    saleListingId: string;
    buyListingId: string;
    quantity: number;
    pricePerUnit: number;
    totalPrice: number;
    status: 'pending' | 'accepted' | 'rejected' | 'countered' | 'expired';
    expiresAt?: string;
    createdAt: string;
    updatedAt?: string;
  }>;
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

export interface InspectorAssignee {
  id: string;
  name?: string | null;
  email?: string | null;
  activeAssignments?: number;
  latitude?: number;
  longitude?: number;
  city?: string | null;
  region?: string | null;
  lastSeenAt?: string;
}

export interface SubmitInspectionResultPayload {
  qualityScore: number;
  verificationResult: {
    actualQuantity?: number;
    actualQuality?: string;
    moistureContent?: number;
    foreignMatter?: number;
    brokenGrains?: number;
    discoloration?: boolean;
    pestDamage?: boolean;
    productSpecifications?: {
      variety?: string;
      grade?: string;
      origin?: string;
      harvestDate?: string;
    };
  };
  notes?: string;
  photos?: string[];
  recommendVerification: boolean;
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

export interface TransportSummary {
  estimatedCost: number;
  distance: number;
  optimized: boolean;
  request?: TransportRequestSummary | null;
}

export interface TransportRequestSummary {
  id: string;
  requestNumber: string;
  status: string;
  totalWeight: number;
  biddingDeadline?: string | null;
  deliveryDeadline?: string | null;
  urgencyLevel?: string;
  tradeOperationId?: string;
  createdAt?: string;
  updatedAt?: string;
  tradeOperation?: {
    id?: string;
    operationNumber?: string;
    buyListing?: {
      buyer?: User;
      product?: Product;
    };
  };
  pickupPoints: Array<{
    sellerId?: string;
    saleListingId?: string;
    sellerName?: string;
    quantity?: number;
    unit?: string;
    address?: string;
    lat?: number;
    lng?: number;
  }>;
  deliveryPoint?: {
    buyerId?: string;
    buyerName?: string;
    address?: string;
    lat?: number;
    lng?: number;
  } | null;
  bids: TransportBidSummary[];
  job?: TransportJobSummary | null;
}

export interface TransportBidSummary {
  id: string;
  status: string;
  bidAmount?: number;
  transporterId?: string;
  transporterName?: string;
  transportCompanyName?: string;
  transportCompanyId?: string;
  transportCompany?: {
    id: string;
    companyName: string;
    mainEmail?: string;
    mainPhone?: string;
  };
  vehicleType?: string;
  vehicleCapacity?: number;
  estimatedDuration?: number;
  submittedAt?: string;
  truckCount?: number;
  totalCapacity?: number;
  transportRequestId?: string;
}

export interface TransportJobSummary {
  id: string;
  jobNumber: string;
  status: string;
  startedAt?: string;
  estimatedArrival?: string;
  actualDelivery?: string;
  progress?: number;
}

export interface TransportData {
  request: TransportRequestSummary | null;
  bids: TransportBidSummary[];
  job: TransportJobSummary | null;
}

export interface TransportRequestListItem extends Omit<TransportRequestSummary, 'bids'> {
  bids?: TransportBidSummary[];
  tradeOperation?: {
    id?: string;
    operationNumber?: string;
    buyListing?: {
      product?: Product;
      buyer?: User;
    };
  };
  bidsCount?: number;
  lowestBid?: number;
  averageBid?: number;
}

export interface TransportRequestsResponse {
  data: TransportRequestListItem[];
  total: number;
  page: number;
  limit: number;
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
  price: number;
  quantity: number;
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
