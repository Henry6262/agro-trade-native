import { apiClient } from './api';

// Types for Seller Offers
export interface SellerOffer {
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
  status: 'pending' | 'accepted' | 'rejected' | 'countered' | 'expired';
  negotiationId: string;
  tradeOperationId: string;
  isExpiringSoon: boolean;
  hoursUntilExpiry: number;
  counterOffer?: {
    price: number;
    quantity: number;
    terms?: string;
    reason?: string;
  };
  offerHistory?: any[];
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

export interface SellerOffersResponse {
  success: boolean;
  data: {
    offers: SellerOffer[];
    stats: SellerOfferStats;
  };
}

export interface CounterOfferRequest {
  counterPrice: number;
  quantity?: number;
  message?: string;
}

export interface AcceptOfferRequest {
  acceptanceNote?: string;
}

export interface RejectOfferRequest {
  reason?: string;
}

// Seller Offers API Service
export const sellerOfferService = {
  // Get all offers for the logged-in seller
  async getMyOffers(): Promise<SellerOffersResponse> {
    try {
      const response = await apiClient.get<SellerOffersResponse>('/seller/offers');
      return response.data;
    } catch (error) {
      console.error('Error fetching seller offers:', error);
      throw error;
    }
  },

  // Accept an offer
  async acceptOffer(negotiationId: string, request: AcceptOfferRequest = {}): Promise<SellerOffer> {
    try {
      const response = await apiClient.post(`/negotiations/${negotiationId}/accept`, request);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error accepting offer:', error);
      throw error;
    }
  },

  // Reject an offer
  async rejectOffer(negotiationId: string, request: RejectOfferRequest = {}): Promise<SellerOffer> {
    try {
      const response = await apiClient.post(`/negotiations/${negotiationId}/reject`, request);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error rejecting offer:', error);
      throw error;
    }
  },

  // Make a counter offer
  async counterOffer(negotiationId: string, request: CounterOfferRequest): Promise<SellerOffer> {
    try {
      const response = await apiClient.post(`/negotiations/${negotiationId}/counter`, {
        counterPrice: request.counterPrice,
        quantity: request.quantity,
        message: request.message,
      });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error making counter offer:', error);
      throw error;
    }
  },

  // Get offer details by negotiation ID
  async getOfferDetails(negotiationId: string): Promise<SellerOffer> {
    try {
      // This would require a new endpoint in the backend
      // For now, fetch all offers and find the specific one
      const offersResponse = await this.getMyOffers();
      const offer = offersResponse.data.offers.find(o => o.negotiationId === negotiationId);
      
      if (!offer) {
        throw new Error('Offer not found');
      }
      
      return offer;
    } catch (error) {
      console.error('Error fetching offer details:', error);
      throw error;
    }
  },

  // Refresh offers (useful after making changes)
  async refreshOffers(): Promise<SellerOffersResponse> {
    return this.getMyOffers();
  },
};

export default sellerOfferService;