import { apiClient } from './api';

// Types for Negotiations
export interface Negotiation {
  id: string;
  tradeOperationId: string;
  tradeSellerId: string;
  type?: string;
  offeredPrice?: number;
  quantity?: number;
  message?: string;
  roundNumber?: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED' | 'EXPIRED' | 'WITHDRAWN';
  currentOffer: {
    price: number;
    quantity: number;
    terms?: string;
  };
  counterOffer?: {
    price: number;
    quantity: number;
    terms?: string;
    reason?: string;
  };
  offerHistory?: any[];
  finalPrice?: number;
  finalQuantity?: number;
  expiresAt: string;
  hoursUntilExpiry?: number;
  isExpiringSoon?: boolean;
  tradeSeller: {
    id: string;
    requestedQuantity: number;
    offeredQuantity: number;
    status: string;
    seller: {
      id: string;
      name: string;
      email: string;
    };
    saleListing?: {
      id: string;
      quantity: number;
      askingPrice: number;
    };
  };
  profitImpact?: {
    estimatedProfit: number;
    profitMargin: number;
    priceChange?: number;
    warning?: string;
  };
}

export interface ProfitImpact {
  currentProfit: number;
  newProfit: number;
  profitChange: number;
  marginChange: number;
  viability: 'VIABLE' | 'MARGINAL' | 'UNVIABLE';
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  recommendation: 'ACCEPT' | 'COUNTER' | 'REJECT';
  violatesMinimum?: boolean;
  warning?: string;
}

export interface PriceSuggestion {
  suggestions: {
    buyer: {
      suggestedPrice: number;
      confidence: number;
      reasoning: string;
      expectedAcceptance: number;
    };
    sellers: {
      sellerId: string;
      suggestedPrice: number;
      confidence: number;
      expectedAcceptance: number;
    }[];
  };
  strategy: {
    approach: 'AGGRESSIVE' | 'BALANCED' | 'CONSERVATIVE';
    expectedMargin: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    timeToClose: string;
  };
}

export interface NegotiationValidation {
  isValid: boolean;
  constraints: {
    minimumMargin: {
      required: number;
      achieved: number;
      passed: boolean;
    };
    targetMargin: {
      target: number;
      achieved: number;
      met: boolean;
    };
    priceRange: {
      min: number;
      max: number;
      proposed: number;
      inRange: boolean;
    };
  };
  violations: {
    constraint: string;
    severity: 'ERROR' | 'WARNING';
    impact: string;
    suggestion: string;
  }[];
  recommendations: string[];
}

// Negotiations API Service
export const negotiationService = {
  // Create buyer offer with profit impact analysis
  async createBuyerOffer(params: {
    tradeOperationId: string;
    buyerId: string;
    offeredPrice: number;
    quantity: number;
    message?: string;
  }): Promise<Negotiation & { profitImpact: ProfitImpact }> {
    try {
      // Note: This endpoint doesn't exist in backend, would need to be implemented
      // For now, use the regular offer endpoint
      const response = await apiClient.post(`/trade-operations/${params.tradeOperationId}/offers`, {
        tradeSellerId: params.buyerId, // This might need adjustment
        price: params.offeredPrice,
        quantity: params.quantity,
        terms: params.message,
      });
      return response.data;
    } catch (error) {
      console.error('Error creating buyer offer:', error);
      throw error;
    }
  },

  // Simple create offer for seller (used by OfferModal)
  async createOfferForSeller(params: {
    tradeOperationId: string;
    sellerId: string;
    price: number;
    quantity: number;
    terms?: string;
    message?: string;
  }): Promise<Negotiation> {
    try {
      // This uses the correct trade-operations offers endpoint
      const response = await apiClient.post(`/trade-operations/${params.tradeOperationId}/offers`, {
        tradeSellerId: params.sellerId,
        price: params.price,
        quantity: params.quantity,
        terms: params.terms || params.message,
      });
      return response.data;
    } catch (error) {
      console.error('Error creating offer for seller:', error);
      throw error;
    }
  },

  // Create seller offer with profit impact
  async createSellerOffer(params: {
    tradeOperationId: string;
    sellerId: string;
    offeredPrice: number;
    quantity: number;
    message?: string;
  }): Promise<Negotiation & { profitImpact: ProfitImpact }> {
    try {
      // This endpoint doesn't exist, would need to be implemented
      const response = await apiClient.post(`/trade-operations/${params.tradeOperationId}/offers`, {
        tradeSellerId: params.sellerId,
        price: params.offeredPrice,
        quantity: params.quantity,
        terms: params.message,
      });
      return response.data;
    } catch (error) {
      console.error('Error creating seller offer:', error);
      throw error;
    }
  },

  // Bulk negotiate with all parties simultaneously
  async bulkNegotiate(params: {
    tradeOperationId: string;
    buyerOffer: {
      price: number;
      message?: string;
    };
    sellerOffers: {
      sellerId: string;
      price: number;
      quantity: number;
    }[];
  }): Promise<{
    negotiations: {
      buyer: Negotiation;
      sellers: Negotiation[];
    };
    aggregateProfitImpact: {
      totalRevenue: number;
      totalCosts: number;
      netProfit: number;
      profitMargin: number;
      meetsTarget: boolean;
    };
    recommendation: {
      action: 'SEND' | 'REVISE' | 'ABORT';
      reasoning: string;
    };
  }> {
    try {
      // This endpoint doesn't exist in backend
      throw new Error('Bulk negotiate not implemented');
    } catch (error) {
      console.error('Error with bulk negotiation:', error);
      throw error;
    }
  },

  // Counter offer
  async counterOffer(
    negotiationId: string,
    params: {
      counterPrice?: number;
      price?: number;
      quantity?: number;
      message?: string;
      terms?: string;
      reason?: string;
    }
  ): Promise<
    Negotiation & {
      type: 'COUNTER_OFFER';
      roundNumber: number;
      counterPrice: number;
      previousPrice: number;
      convergence: {
        priceDifference: number;
        percentageDifference: number;
        isConverging: boolean;
      };
    }
  > {
    try {
      // Map counterPrice to price for backend compatibility
      const requestData = {
        price: params.price || params.counterPrice,
        quantity: params.quantity,
        terms: params.terms || params.message,
        reason: params.reason,
      };
      const response = await apiClient.post(`/negotiations/${negotiationId}/counter`, requestData);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error creating counter offer:', error);
      throw error;
    }
  },

  // Get profit impact of negotiation changes
  async getProfitImpact(negotiationId: string): Promise<{
    rounds: {
      roundNumber: number;
      price: number;
      profit: number;
      margin: number;
      timestamp: string;
    }[];
    trend: {
      priceDirection: 'INCREASING' | 'DECREASING' | 'STABLE';
      profitDirection: 'INCREASING' | 'DECREASING' | 'STABLE';
      convergenceRate: number;
    };
    summary: {
      initialProfit: number;
      currentProfit: number;
      totalChange: number;
    };
  }> {
    try {
      const response = await apiClient.get(`/negotiations/${negotiationId}/profit-impact`);
      return response.data;
    } catch (error) {
      console.error('Error getting profit impact:', error);
      throw error;
    }
  },

  // Get simple list of negotiations for a trade operation
  async getTradeNegotiations(tradeOperationId: string): Promise<Negotiation[]> {
    try {
      const response = await apiClient.get(`/negotiations/trade/${tradeOperationId}/summary`);
      return response.data.negotiations || response.data || [];
    } catch (error) {
      console.error('Error fetching trade negotiations:', error);
      return [];
    }
  },

  // Get negotiation history for a trade operation
  async getNegotiationHistory(tradeOperationId: string): Promise<{
    negotiations: Negotiation[];
    statistics: {
      totalNegotiations: number;
      avgRounds: number;
      successRate: number;
      avgProfitChange: number;
    };
    parties: {
      buyers: { id: string; name: string; negotiations: number }[];
      sellers: { id: string; name: string; negotiations: number }[];
    };
  }> {
    try {
      const response = await apiClient.get(`/negotiations/trade/${tradeOperationId}/history`);
      return response.data;
    } catch (error) {
      console.error('Error getting negotiation history:', error);
      throw error;
    }
  },

  // Get AI-powered price suggestions
  async getPriceSuggestions(
    tradeOperationId: string,
    options?: {
      style?: 'AGGRESSIVE' | 'CONSERVATIVE' | 'BALANCED';
    }
  ): Promise<PriceSuggestion> {
    try {
      const params = options || {};
      const response = await apiClient.get(
        `/negotiations/trade/${tradeOperationId}/suggest-prices`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting price suggestions:', error);
      throw error;
    }
  },

  // Validate negotiation against business constraints
  async validateNegotiation(
    negotiationId: string,
    params: {
      proposedPrice: number;
      party: 'BUYER' | 'SELLER';
    }
  ): Promise<NegotiationValidation> {
    try {
      const response = await apiClient.post(`/negotiations/${negotiationId}/validate`, params);
      return response.data;
    } catch (error) {
      console.error('Error validating negotiation:', error);
      throw error;
    }
  },

  // Validate all parties in a trade operation
  async validateAllParties(
    tradeOperationId: string,
    params: {
      buyerPrice: number;
      sellerPrices: {
        sellerId: string;
        price: number;
      }[];
    }
  ): Promise<
    NegotiationValidation & {
      overallValid: boolean;
      profitMargin: number;
      optimization?: {
        canOptimize: boolean;
        suggestedAdjustments?: {
          party: 'BUYER' | 'SELLER';
          currentPrice: number;
          suggestedPrice: number;
          reason: string;
        }[];
      };
    }
  > {
    try {
      const response = await apiClient.post(
        `/negotiations/trade/${tradeOperationId}/validate-all`,
        params
      );
      return response.data;
    } catch (error) {
      console.error('Error validating all parties:', error);
      throw error;
    }
  },

  // Finalize successful negotiation
  async finalizeNegotiation(
    negotiationId: string,
    params: {
      agreedPrices: {
        buyerPrice: number;
        sellerPrices: {
          sellerId: string;
          price: number;
          quantity: number;
        }[];
      };
      transportCost: number;
    }
  ): Promise<{
    status: 'ACCEPTED';
    finalTerms: {
      buyerPrice: number;
      sellerPrices: {
        sellerId: string;
        price: number;
        quantity: number;
      }[];
    };
    finalProfit: {
      revenue: number;
      costs: number;
      netProfit: number;
      profitMargin: number;
    };
    performance: {
      totalRounds: number;
      duration: string;
      marginImprovement: number;
      successMetrics: Record<string, number>;
    };
  }> {
    try {
      const response = await apiClient.post(`/negotiations/${negotiationId}/finalize`, params);
      return response.data;
    } catch (error) {
      console.error('Error finalizing negotiation:', error);
      throw error;
    }
  },

  // Reject negotiation
  async rejectNegotiation(
    negotiationId: string,
    params: {
      reason: 'PRICE_DISAGREEMENT' | 'QUALITY_CONCERNS' | 'TIMELINE_ISSUES' | 'OTHER';
      finalOffers: {
        buyer: number;
        sellers: {
          sellerId: string;
          price: number;
        }[];
      };
    }
  ): Promise<{
    status: 'REJECTED';
    reason: string;
    finalGap: {
      amount: number;
      percentage: number;
    };
    analysis: {
      stickingPoints: string[];
      alternativeStrategies: string[];
      lessonsLearned: string[];
    };
  }> {
    try {
      const response = await apiClient.post(`/negotiations/${negotiationId}/reject`, params);
      return response.data;
    } catch (error) {
      console.error('Error rejecting negotiation:', error);
      throw error;
    }
  },

  // NEW METHODS FOR NEGOTIATION MANAGEMENT SYSTEM

  // Get negotiations for a trade operation with summary
  async getNegotiations(
    tradeOperationId: string,
    status?: string,
    limit?: number,
    offset?: number
  ): Promise<{
    tradeOperationId: string;
    totalNegotiations: number;
    negotiations: Negotiation[];
    summary: {
      pending: number;
      countered: number;
      accepted: number;
      rejected: number;
      expired: number;
      withdrawn: number;
    };
    profitAnalysis?: any;
    phaseTransition?: any;
  }> {
    try {
      const params: any = {};
      if (status) params.status = status;
      if (limit) params.limit = limit;
      if (offset) params.offset = offset;

      const response = await apiClient.get(`/trade-operations/${tradeOperationId}/negotiations`, {
        params,
      });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error getting negotiations:', error);
      throw error;
    }
  },

  // Send new offer to seller
  async sendOffer(
    tradeOperationId: string,
    offer: {
      tradeSellerId: string;
      price: number;
      quantity: number;
      terms?: string;
    }
  ): Promise<Negotiation> {
    try {
      const response = await apiClient.post(`/trade-operations/${tradeOperationId}/offers`, offer);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error sending offer:', error);
      throw error;
    }
  },

  // Send batch offers
  async sendBatchOffers(
    tradeOperationId: string,
    offers: {
      tradeSellerId: string;
      price: number;
      quantity: number;
      terms?: string;
    }[]
  ): Promise<any> {
    try {
      const response = await apiClient.post(`/trade-operations/${tradeOperationId}/offers/batch`, {
        offers,
      });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error sending batch offers:', error);
      throw error;
    }
  },

  // Accept offer
  async acceptOffer(negotiationId: string, acceptanceNote?: string): Promise<Negotiation> {
    try {
      const response = await apiClient.post(`/negotiations/${negotiationId}/accept`, {
        acceptanceNote,
      });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error accepting offer:', error);
      throw error;
    }
  },

  // Reject offer
  async rejectOffer(negotiationId: string, reason?: string): Promise<Negotiation> {
    try {
      const response = await apiClient.post(`/negotiations/${negotiationId}/reject`, { reason });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error rejecting offer:', error);
      throw error;
    }
  },

  // Withdraw offer
  async withdrawOffer(negotiationId: string, reason?: string): Promise<Negotiation> {
    try {
      const response = await apiClient.post(`/negotiations/${negotiationId}/withdraw`, { reason });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error withdrawing offer:', error);
      throw error;
    }
  },

  // Extend expiry
  async extendExpiry(negotiationId: string, hours: number, reason?: string): Promise<any> {
    try {
      const response = await apiClient.post(`/negotiations/${negotiationId}/extend`, {
        hours,
        reason,
      });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error extending expiry:', error);
      throw error;
    }
  },

  // Get expiring negotiations
  async getExpiringNegotiations(tradeOperationId: string, hours: number = 24): Promise<any> {
    try {
      const response = await apiClient.get(
        `/trade-operations/${tradeOperationId}/negotiations/expiring`,
        {
          params: { hours },
        }
      );
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error getting expiring negotiations:', error);
      throw error;
    }
  },

  // Get negotiation metrics
  async getNegotiationMetrics(tradeOperationId: string): Promise<any> {
    try {
      const response = await apiClient.get(
        `/trade-operations/${tradeOperationId}/negotiations/metrics`
      );
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error getting negotiation metrics:', error);
      throw error;
    }
  },

  // Get negotiation analytics
  async getNegotiationAnalytics(params?: { startDate?: string; endDate?: string }): Promise<{
    summary: {
      totalNegotiations: number;
      successRate: number;
      avgRoundsToClose: number;
      avgMarginImprovement: number;
    };
    trends: {
      successRateTrend: 'IMPROVING' | 'DECLINING' | 'STABLE';
      marginTrend: 'IMPROVING' | 'DECLINING' | 'STABLE';
      velocityTrend: 'FASTER' | 'SLOWER' | 'STABLE';
    };
    partyAnalysis: {
      buyers: {
        id: string;
        name: string;
        successRate: number;
        avgNegotiationTime: string;
      }[];
      sellers: {
        id: string;
        name: string;
        successRate: number;
        avgNegotiationTime: string;
      }[];
    };
    bestPractices: {
      mostSuccessfulStrategies: string[];
      optimalRoundCount: { min: number; max: number };
      idealPriceMovements: { buyer: number; seller: number };
    };
  }> {
    try {
      const params_obj = params || {};
      const response = await apiClient.get('/negotiations/analytics', { params: params_obj });
      return response.data;
    } catch (error) {
      console.error('Error getting negotiation analytics:', error);
      throw error;
    }
  },
};

export default negotiationService;
