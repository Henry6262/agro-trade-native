// Shared scenario types for the admin dashboard

export type ScenarioRole =
  | 'BUYER'
  | 'FARMER'
  | 'SELLER'
  | 'TRANSPORTER'
  | 'INSPECTOR'
  | 'ADMIN'
  | 'COMPANY_ADMIN';

export interface ScenarioOfferPayload {
  farmerIndex?: number;
  saleListingIndex?: number;
  requestedQuantity: number;
  offeredPrice: number;
}

export interface ScenarioPayload {
  [key: string]: unknown;
  role?: string;
  name?: string;
  data?: Record<string, unknown>;
  action?: string;
  productCategory?: string;
  productId?: string;
  unit?: string;
  description?: string;
  notes?: string;
  reason?: string;
  vehicleType?: string;
  result?: string;
  response?: 'accept' | 'reject' | 'counter';
  accept?: boolean;
  reject?: boolean;
  farmerIndex?: number;
  buyerIndex?: number;
  transporterIndex?: number;
  inspectorIndex?: number;
  saleListingIndex?: number;
  buyListingIndex?: number;
  tradeOperationIndex?: number;
  tradeOpIndex?: number;
  negotiationIndex?: number;
  inspectionIndex?: number;
  transportRequestIndex?: number;
  requestIndex?: number;
  bidIndex?: number;
  jobIndex?: number;
  quantity?: number;
  requestedQuantity?: number;
  pricePerUnit?: number;
  maxPricePerUnit?: number;
  offeredPrice?: number;
  counterPrice?: number;
  counterQuantity?: number;
  newPrice?: number;
  qualityScore?: number;
  latitude?: number;
  longitude?: number;
  pickupLat?: number;
  pickupLng?: number;
  deliveryLat?: number;
  deliveryLng?: number;
  distanceKm?: number;
  bidAmount?: number;
  estimatedDuration?: number;
  vehicleCapacity?: number;
  adminMargin?: number;
  buyerCommission?: number;
  sellerCommission?: number;
  neededBy?: string;
  priority?: string;
  offers?: ScenarioOfferPayload[];
}

export interface ScenarioEntity {
  id?: string;
  status?: string;
  phase?: string;
  quantity?: number;
  pricePerUnit?: number;
  pricePerTon?: number;
  maxPricePerUnit?: number;
  maxPricePerTon?: number;
  productType?: string;
  saleListingId?: string;
  tradeOperationId?: string;
  transportRequestId?: string;
  transportBidId?: string;
  bidAmount?: number;
  [key: string]: unknown;
}

export interface ScenarioUser extends ScenarioEntity {
  email?: string;
  name?: string | null;
  role?: ScenarioRole;
  companyName?: string;
  location?: unknown;
  verified?: boolean;
}

export interface ScenarioNegotiation extends ScenarioEntity {
  saleListing?: { id: string };
  tradeSeller?: { saleListingId?: string };
}

export interface ScenarioResult extends ScenarioUser {
  message?: string;
  negotiations?: ScenarioNegotiation[];
}

export interface ScenarioState {
  createdUsers: {
    farmers: ScenarioUser[];
    buyers: ScenarioUser[];
    transporters: ScenarioUser[];
    inspector: ScenarioUser | null;
  };
  saleListings: ScenarioEntity[];
  buyListings: ScenarioEntity[];
  tradeOperations: ScenarioEntity[];
  negotiations: ScenarioNegotiation[];
  inspections: ScenarioEntity[];
  transportRequests: ScenarioEntity[];
  transportBids: ScenarioEntity[];
  transportJobs: ScenarioEntity[];
}

export interface ScenarioStep {
  step: number;
  description?: string;
  actor: string;
  action: string;
  payload?: ScenarioPayload;
  data?: ScenarioPayload;
  status?: 'pending' | 'in_progress' | 'completed' | 'failed' | 'active' | 'accepted' | 'rejected' | 'passed' | 'assigned' | 'pending_bids' | 'in_transit' | 'price_adjusted' | 'bid_submitted' | 'delivered' | 'bid_accepted' | 'confirmed' | 'processing' | 'archived' | string;
  result?: unknown;
  error?: string;
  duration?: number;
}
