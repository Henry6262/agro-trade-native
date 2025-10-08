import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';
import { useAuthStore } from '@stores/auth.store';

interface BuyListing {
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

interface TradeOperation {
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
      const response = await fetch(`${API_URL}/buyer/buy-listings`, {
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
      const response = await fetch(`${API_URL}/buyer/trade-operations`, {
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
      const response = await fetch(`${API_URL}/buyer/trade-operations/${operationId}`, {
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
      const response = await fetch(`${API_URL}/buyer/negotiations/${negotiationId}/accept`, {
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
      const response = await fetch(`${API_URL}/buyer/negotiations/${negotiationId}/reject`, {
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
      const response = await fetch(`${API_URL}/buyer/negotiations/${negotiationId}/counter`, {
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
  async getMyStatistics(): Promise<any> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_URL}/buyer/statistics`, {
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

  // Track delivery status
  async getDeliveryStatus(transportJobId: string): Promise<any> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_URL}/buyer/delivery-status/${transportJobId}`, {
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
}

export default new BuyerService();
