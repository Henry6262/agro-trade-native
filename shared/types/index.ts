/**
 * shared/types/index.ts
 *
 * Canonical shared types for Agro-Trade Native ecosystem.
 * All components (backend, mobile, admin) should reference these
 * to avoid "ghost objects" and silent breaking changes.
 */

// ─── ROLES ──────────────────────────────────────────────────────────────────

export enum UserRole {
  ADMIN = 'ADMIN',
  FARMER = 'FARMER',
  BUYER = 'BUYER',
  TRANSPORTER = 'TRANSPORTER',
  COMPANY_ADMIN = 'COMPANY_ADMIN',
  INSPECTOR = 'INSPECTOR',
}

// ─── TRADE LIFECYCLE ────────────────────────────────────────────────────────

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
  CANCELLED = 'CANCELLED',
}

export enum TradeStatus {
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED',
}

// ─── NEGOTIATION ────────────────────────────────────────────────────────────

export enum NegotiationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  COUNTERED = 'COUNTERED',
  EXPIRED = 'EXPIRED',
  WITHDRAWN = 'WITHDRAWN',
}

export enum SellerStatus {
  INVITED = 'INVITED',
  NEGOTIATING = 'NEGOTIATING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CONFIRMED = 'CONFIRMED',
  WITHDRAWN = 'WITHDRAWN',
  FAILED_INSPECTION = 'FAILED_INSPECTION',
}

// ─── CORE OBJECTS ───────────────────────────────────────────────────────────

export interface SharedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  createdAt: string;
}

export interface SharedNegotiation {
  id: string;
  tradeOperationId: string;
  status: NegotiationStatus;
  currentOffer: {
    price: number;
    quantity: number;
    terms?: string;
  };
  finalPrice?: number;
  finalQuantity?: number;
  expiresAt: string;
}

export interface SharedTradeOperation {
  id: string;
  operationNumber: string;
  phase: TradePhase;
  status: TradeStatus;
  targetQuantity: number;
  securedQuantity: number;
  estimatedProfit: number;
}
