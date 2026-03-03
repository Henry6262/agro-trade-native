/**
 * Shared TypeScript Interfaces for Listings
 *
 * Central source of truth for all listing types across the application.
 * Import from here instead of defining in each component.
 */

import type { Specification } from '../utils/specificationHelpers';
import type { Address } from '../utils/locationHelpers';

export interface Company {
  id: string;
  legalName: string;
  registrationNumber: string;
  phoneNumber?: string;
  email?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  company?: Company;
}

export interface Product {
  id: string;
  name: string;
  displayName?: string;
  category?: string;
  description?: string;
  image?: string | null;
}

export interface SaleListing {
  id: string;
  sellerId: string;
  productId: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  askingPrice?: number;
  qualityGrade?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  specifications: Specification[];
  seller?: User;
  product?: Product;
  address?: Address;
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

export interface TradeSellerSummary {
  id: string;
  sellerId: string;
  saleListingId: string;
  name: string;
  requestedQuantity: number;
  offeredQuantity: number;
  agreedQuantity?: number | null;
  unit?: string;
  price?: number;
  status: string;
  inspection?: SellerInspectionStatus;
  seller?: User;
  saleListing?: SaleListing;
}

export interface BuyListing {
  id: string;
  buyerId: string;
  productId: string;
  quantity: number;
  unit: string;
  targetPrice?: number | null;
  maxPricePerUnit?: number | null;
  deliveryAddressId?: string | null;
  status: string;
  neededBy?: string;
  createdAt: string;
  updatedAt?: string;
  notes?: string;
  specifications?: Specification[];
  buyer?: User;
  product?: Product;
  deliveryAddress?: Address;
}

export interface Offer {
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
}

export interface TradeOperation {
  id: string;
  operationNumber: string;
  buyListingId: string;
  adminId: string;
  phase: string;
  status: string;
  totalQuantity?: number;
  totalCost?: number;
  estimatedProfit?: number;
  createdAt: string;
  updatedAt?: string;
  buyListing?: BuyListing;
  sellers?: TradeSellerSummary[];
  offers?: Offer[];
  transport?: {
    estimatedCost: number;
    distance: number;
    optimized: boolean;
    request?: {
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
          buyer?: { id: string; email: string; name: string; role?: string };
          product?: { id: string; name: string };
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
      bids: Array<{
        id: string;
        status: string;
        bidAmount?: number;
        transporterId?: string;
        transporterName?: string;
        transportCompanyName?: string;
        vehicleType?: string;
        vehicleCapacity?: number;
        estimatedDuration?: number;
        submittedAt?: string;
      }>;
      job?: {
        id: string;
        jobNumber: string;
        status: string;
        startedAt?: string;
        estimatedArrival?: string;
        actualDelivery?: string;
        progress?: number;
      } | null;
    } | null;
  };
}

export interface MatchedSeller {
  sellerId: string;
  sellerName: string;
  saleListingId: string;
  availableQuantity: number;
  askingPrice: number;
  quality: number;
  location: {
    lat: number;
    lng: number;
    city: string;
    displayName: string;
  };
  distance: number;
  score: number;
}

/**
 * Type guards for runtime type checking
 */
export const isSaleListing = (listing: unknown): listing is SaleListing => {
  return typeof listing === 'object' && listing !== null && 'sellerId' in listing && 'pricePerUnit' in listing;
};

export const isBuyListing = (listing: unknown): listing is BuyListing => {
  if (typeof listing !== 'object' || listing === null) {
    return false;
  }

  const obj = listing as Record<string, unknown>;
  return 'buyerId' in obj && ('targetPrice' in obj || 'maxPricePerUnit' in obj);
};

/**
 * Transport Management Types
 */
export interface TransportRequest {
  id: string;
  requestNumber: string;
  tradeOperationId: string;
  totalWeight: number;
  pickupPoints: Array<{
    lat?: number;
    lng?: number;
    sellerId?: string;
    saleListingId?: string;
    sellerName?: string;
    quantity?: number;
    unit?: string;
    address?: string;
  }>;
  deliveryPoint: {
    lat?: number;
    lng?: number;
    addressId?: string;
    address?: string;
    buyerId?: string;
    buyerName?: string;
  };
  deliveryDeadline: string;
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export interface TransportCompany {
  id: string;
  companyName: string;
  mainEmail: string;
  mainPhone: string;
}

export interface TransportBid {
  id: string;
  transportRequestId: string;
  transportCompanyId: string;
  transportCompany?: TransportCompany;
  truckCount: number;
  totalCapacity: number;
  status: 'PENDING' | 'CONFIRMED' | 'DECLINED' | 'ACCEPTED' | 'REJECTED';
  submittedAt: string;
}

export interface TransportJob {
  id: string;
  jobNumber: string;
  transportRequestId: string;
  transportBidId: string;
  status: 'ASSIGNED' | 'STARTED' | 'IN_TRANSIT' | 'COMPLETED';
  startedAt?: string;
  estimatedArrival?: string;
  actualDelivery?: string;
  progress: number;
}

export interface TransportData {
  request: TransportRequest | null;
  bids: TransportBid[];
  job: TransportJob | null;
}
