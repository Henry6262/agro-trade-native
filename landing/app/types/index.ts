// ── Core domain types (ported from mobile, web-only — no RN deps) ──────────

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  location?: Location;
  onboardingComplete?: boolean;
  hasProfile?: boolean;
  preferences?: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = "buyer" | "seller" | "transport" | "inspector" | "admin";

export interface UserPreferences {
  products?: string[];
  categories?: string[];
  location?: Location;
  radius?: number;
  notifications?: NotificationPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  marketing: boolean;
}

export interface Location {
  id: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
}

// ── Products ────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  price: number;
  unit: string;
  quantity: number;
  images: string[];
  sellerId: string;
  seller: User;
  location: Location;
  quality: ProductQuality;
  harvestDate?: string;
  expiryDate?: string;
  certifications: string[];
  isOrganic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

export interface ProductQuality {
  grade: "A" | "B" | "C";
  description: string;
  certifiedBy?: string;
}

// ── Trade Operations ────────────────────────────────────────────────────────

export type TradePhase =
  | "INITIATION"
  | "SELLER_MATCHING"
  | "SELLER_NEGOTIATION"
  | "INSPECTION_PENDING"
  | "TRANSPORT_MATCHING"
  | "TRANSPORT_BIDDING"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED";

export interface TradeOperation {
  id: string;
  buyerId: string;
  buyer: User;
  sellerId?: string;
  seller?: User;
  sellerListingId: string;
  phase: TradePhase;
  quantity: number;
  unit: string;
  agreedPrice?: number;
  currency: string;
  notes?: string;
  escrowStatus?: EscrowStatus;
  createdAt: string;
  updatedAt: string;
}

export type EscrowStatus =
  | "NONE"
  | "AWAITING_PAYMENT"
  | "AWAITING_DELIVERY"
  | "COMPLETE"
  | "DISPUTED"
  | "REFUNDED";

// ── Seller Listings ─────────────────────────────────────────────────────────

export interface SellerListing {
  id: string;
  sellerId: string;
  seller: User;
  productName: string;
  category: string;
  description: string;
  price: number;
  unit: string;
  quantity: number;
  minOrderQuantity?: number;
  images: string[];
  location?: Location;
  isOrganic: boolean;
  certifications: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Inspections ─────────────────────────────────────────────────────────────

export interface Inspection {
  id: string;
  tradeOperationId: string;
  inspectorId: string;
  inspector: User;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  qualityScore?: number;
  passed?: boolean;
  notes?: string;
  photos?: string[];
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Transport ───────────────────────────────────────────────────────────────

export interface Delivery {
  id: string;
  tradeOperationId: string;
  transporterId: string;
  transporter: User;
  status: "pending" | "picked_up" | "in_transit" | "delivered" | "cancelled";
  pickupLocation?: Location;
  deliveryLocation?: Location;
  estimatedArrival?: string;
  actualArrival?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Negotiations ────────────────────────────────────────────────────────────

export interface Negotiation {
  id: string;
  tradeOperationId: string;
  buyerId: string;
  sellerId: string;
  currentPrice: number;
  currentQuantity: number;
  status: "active" | "accepted" | "rejected" | "expired";
  messages: NegotiationMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface NegotiationMessage {
  id: string;
  negotiationId: string;
  senderId: string;
  type: "offer" | "counter" | "message";
  price?: number;
  quantity?: number;
  message: string;
  createdAt: string;
}

// ── API Response types ──────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}
