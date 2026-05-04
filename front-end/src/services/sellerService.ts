import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';
import { useAuthStore } from '@stores/auth.store';

export type SellerTimelineEventType = 'NEGOTIATION' | 'TRADE' | 'TRANSPORT' | 'INSPECTION';

export interface SellerTimelineEvent {
  id: string;
  type: SellerTimelineEventType;
  title: string;
  status: string;
  timestamp: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface SellerTimelineResponse {
  events: SellerTimelineEvent[];
  nextCursor: string | null;
}

export interface SellerStats {
  totalProducts: number;
  activeListings: number;
  totalOffers: number;
  pendingOffers: number;
  totalTrades: number;
  completedTrades: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageRating: number;
}

export interface SellerOfferSummary {
  id: string;
  product: string;
  quantity: number;
  offeredPricePerTon: number;
  totalValue: number;
  buyer: string;
  buyerLocation: string;
  buyerFlag: string;
  adminNote: string;
  deadline: string;
  responseTime: string;
  estimatedProfit: number;
  qualityRequirements: string[];
  status: string;
  negotiationId: string;
  tradeOperationId: string;
  isExpiringSoon: boolean;
  hoursUntilExpiry: number;
  counterOffer?: {
    price?: number;
    quantity?: number;
    terms?: string;
    reason?: string;
  };
  offerHistory?: unknown[];
  createdAt: string;
  updatedAt: string;
}

export interface SellerOfferStats {
  totalOffers: number;
  pendingOffers: number;
  acceptedThisMonth: number;
  averageOfferValue: number;
  topRequestedProduct: string;
  conversionRate: number;
}

export interface SellerOffersPayload {
  success: boolean;
  data: {
    offers: SellerOfferSummary[];
    stats: SellerOfferStats;
  };
}

export interface SellerTradeRecord {
  id: string;
  tradeOperationId?: string;
  productName?: string | null;
  product?: {
    name?: string | null;
    displayName?: string | null;
    category?: string | null;
  } | null;
  quantity?: number | null;
  agreedQuantity?: number | null;
  unit?: string | null;
  agreedPrice?: number | null;
  agreedPricePerUnit?: number | null;
  agreedPricePerTon?: number | null;
  buyerName?: string | null;
  buyer?: {
    name?: string | null;
    city?: string | null;
    country?: string | null;
  } | null;
  buyerLocation?: string | null;
  buyerCountry?: string | null;
  transporter?: {
    name?: string | null;
    fleetSize?: number | null;
    licensePlate?: string | null;
  } | null;
  status?: string | null;
  pickupDate?: string | null;
  scheduledPickup?: string | null;
  updatedAt?: string | null;
}

class SellerService {
  private async getHeaders() {
    let token = useAuthStore.getState().token;

    if (!token) {
      const persisted = await AsyncStorage.getItem('auth-storage');
      if (persisted) {
        try {
          const parsed = JSON.parse(persisted);
          token = parsed?.state?.token ?? null;
        } catch (error) {
          console.warn('Failed to parse persisted auth storage', error);
        }
      }
    }

    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async get<T>(path: string, params?: Record<string, string>) {
    const headers = await this.getHeaders();
    const searchParams = params ? `?${new URLSearchParams(params).toString()}` : '';
    const response = await fetch(`${API_URL}${path}${searchParams}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${path}`);
    }

    return (await response.json()) as T;
  }

  async getMyTimeline(limit = 20, cursor?: string): Promise<SellerTimelineResponse> {
    const params: Record<string, string> = { limit: String(limit) };
    if (cursor) {
      params['cursor'] = cursor;
    }
    return this.get<SellerTimelineResponse>('/seller/timeline', params);
  }

  async getMyTrades(params?: {
    limit?: number;
    cursor?: string;
  }): Promise<SellerTradeRecord[] | { items: SellerTradeRecord[]; nextCursor: string | null }> {
    const stringParams: Record<string, string> | undefined = params
      ? { limit: String(params.limit || 20), ...(params.cursor ? { cursor: params.cursor } : {}) }
      : undefined;
    return this.get<
      SellerTradeRecord[] | { items: SellerTradeRecord[]; nextCursor: string | null }
    >('/seller/trades', stringParams);
  }

  async getMyStats(): Promise<SellerStats> {
    return this.get<SellerStats>('/seller/stats');
  }

  async getMyOffers(): Promise<SellerOffersPayload> {
    return this.get<SellerOffersPayload>('/seller/offers');
  }
}

export default new SellerService();
