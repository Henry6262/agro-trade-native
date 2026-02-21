import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';
import { useAuthStore } from '@stores/auth.store';

export interface BuyListing {
  id: string;
  buyerId: string;
  productId: string;
  product: {
    id: string;
    name: string;
    category: string;
  };
  quantity: number;
  unit: string;
  maxPricePerUnit: number;
  urgency: string;
  description: string;
  qualityRequirements: string[];
  status: string;
  createdAt: string;
}

export interface TradeOperation {
  id: string;
  operationNumber: string;
  buyListingId: string;
  buyListing: BuyListing;
  phase: string;
  status: string;
  targetQuantity: number;
  securedQuantity: number;
  estimatedProfit: number;
  profitMargin: number;
  estimatedTransportCost: number;
  createdAt: string;
  updatedAt: string;
  sellers?: any[];
  transportRequest?: any;
  transportJob?: any;
}

export interface BuyerTimelineEvent {
  id: string;
  type: 'TRADE' | 'NEGOTIATION' | 'TRANSPORT' | 'INSPECTION';
  title: string;
  status: string;
  timestamp: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

class BuyerService {
  private getHeaders = async () => {
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
  };

  // Get buyer's buy listings
  async getMyBuyListings(): Promise<BuyListing[]> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_URL}/buyer/listings`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch buy listings');
      }

      const data = await response.json();
      return data.data || data || [];
    } catch (error) {
      console.error('Error fetching buy listings:', error);
      throw error;
    }
  }

  // Get trade operations for buyer's listings
  async getMyTradeOperations(): Promise<TradeOperation[]> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_URL}/buyer/trades`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch trade operations');
      }

      const data = await response.json();
      return data.data || data || [];
    } catch (error) {
      console.error('Error fetching trade operations:', error);
      throw error;
    }
  }

  // Get specific trade operation details
  async getTradeOperationDetails(operationId: string): Promise<TradeOperation> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_URL}/trade-operations/${operationId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch trade operation details');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching trade operation details:', error);
      throw error;
    }
  }

  // Accept an offer from a seller (approve negotiation)
  async acceptOffer(negotiationId: string): Promise<any> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_URL}/negotiations/${negotiationId}/accept`, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to accept offer');
      }

      return await response.json();
    } catch (error) {
      console.error('Error accepting offer:', error);
      throw error;
    }
  }

  // Reject an offer from a seller
  async rejectOffer(negotiationId: string, reason?: string): Promise<any> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_URL}/negotiations/${negotiationId}/reject`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject offer');
      }

      return await response.json();
    } catch (error) {
      console.error('Error rejecting offer:', error);
      throw error;
    }
  }

  // Counter an offer from a seller
  async counterOffer(
    negotiationId: string,
    counterPrice: number,
    counterQuantity: number
  ): Promise<any> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_URL}/negotiations/${negotiationId}/counter`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ counterPrice, counterQuantity }),
      });

      if (!response.ok) {
        throw new Error('Failed to counter offer');
      }

      return await response.json();
    } catch (error) {
      console.error('Error countering offer:', error);
      throw error;
    }
  }

  // Get buyer statistics
  async getMyStatistics(): Promise<BuyerStats> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_URL}/buyer/stats`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw error;
    }
  }

  // Track delivery status via transport request
  async getDeliveryStatus(transportRequestId: string): Promise<any> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_URL}/transport/requests/${transportRequestId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch delivery status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching delivery status:', error);
      throw error;
    }
  }

  // Get buyer timeline events
  async getMyTimeline(
    limit = 20,
    cursor?: string
  ): Promise<{
    events: BuyerTimelineEvent[];
    nextCursor: string | null;
  }> {
    const headers = await this.getHeaders();
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) {
      params.append('cursor', cursor);
    }

    const response = await fetch(`${API_URL}/buyer/timeline?${params.toString()}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to fetch buyer timeline');
    }

    return await response.json();
  }
  async getMyOffers(): Promise<BuyerOffer[]> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_URL}/buyer/offers`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch buyer offers');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching buyer offers:', error);
      throw error;
    }
  }
}

export default new BuyerService();
export interface BuyerOffer {
  id: string;
  buyListingId: string;
  tradeOperationId?: string | null;
  price?: number | null;
  quantity?: number | null;
  status?: string | null;
  product?: {
    id?: string;
    name?: string;
    category?: string;
  } | null;
  saleListing?: {
    id: string;
    sellerId: string;
    quantity?: number | null;
    askingPrice?: number | null;
    product?: {
      id?: string;
      name?: string;
      category?: string | null;
    } | null;
  } | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface BuyerStats {
  totalListings: number;
  activeListings: number;
  totalOffers: number;
  acceptedOffers: number;
  fulfilledListings: number;
}
