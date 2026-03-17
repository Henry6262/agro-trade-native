import { apiClient } from './api';

// Types for Trade Operations
export interface BuyListing {
  id: string;
  product: {
    id: string;
    name: string;
    category: string;
  };
  buyer: {
    id: string;
    name: string;
  };
  quantity: number;
  unit: string;
  maxPricePerUnit: number;
  deliveryAddress?: {
    address: string;
    city: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };
  neededBy?: string;
  requirements?: string[];
  specifications?: any[];
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  createdAt: string;
}

export interface SaleListing {
  id: string;
  product: {
    id: string;
    name: string;
    category: string;
  };
  seller: {
    id: string;
    name: string;
  };
  quantity: number;
  unit: string;
  askingPrice: number;
  address?: {
    address: string;
    city: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };
  location?: {
    city: string;
    country: string;
  };
  harvestDate?: string;
  categories?: string[];
  quality?: 'premium' | 'standard' | 'economy';
  status: string;
  createdAt: string;
}

export interface TradeOperation {
  id: string;
  operationNumber: string;
  buyListingId: string;
  buyListing: BuyListing;
  status: 'ACTIVE' | 'IN_PROGRESS' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  phase?: string;
  targetProfitMargin: number;
  sellingPrice?: number;
  totalRevenue?: number;
  totalPurchaseCost?: number;
  estimatedTransportCost?: number;
  actualTransportCost?: number;
  estimatedProfit?: number;
  actualProfit?: number;
  profitMargin?: number;
  selectedSellers?: TradeSeller[];
  sellers?: TradeSeller[];
  createdAt: string;
  updatedAt: string;
}

export interface TradeSeller {
  id: string;
  sellerId: string;
  tradeOperationId?: string;
  saleListingId: string;
  saleListing: SaleListing;
  requestedQuantity: number;
  unit?: string;
  agreedPrice?: number;
  status: 'PENDING' | 'NEGOTIATING' | 'AGREED' | 'REJECTED';
  isVerified?: boolean;
}

export interface ProfitCalculation {
  tradeOperationId: string;
  revenue: {
    sellingPrice: number;
    quantity: number;
    totalRevenue: number;
    currency: string;
  };
  costs: {
    purchases: {
      totalCost: number;
      avgPrice: number;
      breakdown: {
        sellerId: string;
        price: number;
        quantity: number;
        subtotal: number;
      }[];
    };
    transport: {
      estimatedCost: number;
      distance?: number;
      ratePerKm?: number;
    };
    totalCosts: number;
  };
  profit: {
    grossProfit: number;
    netProfit: number;
    profitMargin: number;
    meetsMinimumMargin: boolean;
    targetMarginMet: boolean;
    viability: 'VIABLE' | 'MARGINAL' | 'UNVIABLE';
  };
}

export interface TransportEstimate {
  distance: number;
  duration: number;
  vehicleType?: string;
  costs: {
    baseCost: number;
    fuelSurcharge: number;
    driverCost: number;
    totalCost: number;
  };
  breakdown: {
    costPerKm: number;
    costPerTon: number;
    costPerTonKm: number;
    baseRate?: number;
    distanceCharge?: number;
    multiPickupSurcharge?: number;
  };
  route?: {
    waypoints: {
      latitude: number;
      longitude: number;
      address: string;
    }[];
    totalDistance: number;
    estimatedDuration: number;
  };
}

export interface MatchingSeller {
  sellerId: string;
  saleListingId: string;
  saleListing: SaleListing;
  matchScore: number;
  distance: number;
  askingPrice: number;
  availability: number;
  qualityScore?: number;
  reasons: string[];
  location?: {
    city?: string;
    latitude?: number;
    longitude?: number;
  };
}

// Trade Operations API Service
export const tradeOperationService = {
  // Get active buy listings that need fulfillment
  async getActiveBuyListings(): Promise<BuyListing[]> {
    try {
      const response = await apiClient.get<BuyListing[]>('/buyer/listings');

      // Filter for active listings and ensure they have proper IDs
      const activeListings = response.data.filter((listing) => listing.status === 'ACTIVE');

      return activeListings;
    } catch (error) {
      console.error('Error fetching buy listings:', error);
      throw error;
    }
  },

  // Get active sell listings (paginated)
  async getActiveSellListings(
    page = 1,
    limit = 50
  ): Promise<{
    data: SaleListing[];
    meta: { page: number; limit: number; total: number; hasMore: boolean };
  }> {
    try {
      const response = await apiClient.get(`/seller/listings?page=${page}&limit=${limit}`);
      // Backend returns { data: [], meta: { page, limit, total, hasMore } }
      const payload = response.data;
      const items: SaleListing[] = Array.isArray(payload) ? payload : (payload?.data ?? []);
      const meta = payload?.meta ?? { page, limit, total: items.length, hasMore: false };
      return { data: items.filter((l: SaleListing) => l.status === 'ACTIVE'), meta };
    } catch (error) {
      console.error('Error fetching sell listings:', error);
      throw error;
    }
  },

  // Create a new trade operation from a buy listing
  async createTradeOperation(
    buyListingId: string,
    targetProfitMargin: number
  ): Promise<TradeOperation> {
    try {
      const response = await apiClient.post<TradeOperation>('/trade-operations', {
        buyListingId,
        targetProfitMargin,
      });
      return response.data;
    } catch (error) {
      console.error('Error creating trade operation:', error);
      throw error;
    }
  },

  // Get trade operation details
  async getTradeOperation(id: string): Promise<TradeOperation> {
    try {
      const response = await apiClient.get<TradeOperation>(`/trade-operations/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching trade operation:', error);
      throw error;
    }
  },

  // Find matching sellers for a trade operation
  async findMatchingSellers(
    tradeOperationId: string,
    maxDistance?: number
  ): Promise<{
    sellers: MatchingSeller[];
    totalQuantityAvailable: number;
    averagePrice: number;
    recommendedSellers: string[];
  }> {
    try {
      const params = maxDistance ? { maxDistance } : {};
      const response = await apiClient.get(
        `/trade-operations/${tradeOperationId}/matching-sellers`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error('Error finding matching sellers:', error);
      throw error;
    }
  },

  // Select sellers for a trade operation
  async selectSellers(
    tradeOperationId: string,
    sellers: {
      sellerId: string;
      saleListingId: string;
      requestedQuantity: number;
    }[]
  ): Promise<{
    selectedSellers: TradeSeller[];
    totalQuantity: number;
    estimatedPurchaseCost: number;
  }> {
    try {
      const response = await apiClient.post(`/trade-operations/${tradeOperationId}/sellers`, {
        sellers,
      });
      return response.data;
    } catch (error) {
      console.error('Error selecting sellers:', error);
      throw error;
    }
  },

  // Calculate real-time profit for a trade operation
  async calculateProfit(
    tradeOperationId: string,
    options?: {
      includeSensitivity?: boolean;
      includeRiskAssessment?: boolean;
    }
  ): Promise<ProfitCalculation> {
    try {
      const params = options || {};
      const response = await apiClient.get(`/profit/${tradeOperationId}/profit`, { params });
      return response.data;
    } catch (error) {
      console.error('Error calculating profit:', error);
      throw error;
    }
  },

  // Estimate profit with proposed prices
  async estimateProfit(
    tradeOperationId: string,
    estimation: {
      buyerPrice: number;
      sellerPrices: {
        sellerId: string;
        price: number;
        quantity: number;
      }[];
      transportCost: number;
    }
  ): Promise<{
    estimatedRevenue: number;
    estimatedCosts: number;
    estimatedProfit: number;
    profitMargin: number;
    viability: 'VIABLE' | 'MARGINAL' | 'UNVIABLE';
    recommendation: string;
    warning?: string;
  }> {
    try {
      const response = await apiClient.post(
        `/profit/${tradeOperationId}/profit/estimate`,
        estimation
      );
      return response.data;
    } catch (error) {
      console.error('Error estimating profit:', error);
      throw error;
    }
  },

  // Estimate transport costs
  async estimateTransportCost(params: {
    origin: { latitude: number; longitude: number; address: string };
    pickupLocations?: {
      latitude: number;
      longitude: number;
      address: string;
      quantity: number;
    }[];
    destination: { latitude: number; longitude: number; address: string };
    quantity: number;
    vehicleType: string;
  }): Promise<TransportEstimate> {
    try {
      const response = await apiClient.post('/transport/estimate', params);
      return response.data;
    } catch (error) {
      console.error('Error estimating transport cost:', error);
      throw error;
    }
  },

  // Optimize transport route
  async optimizeRoute(
    tradeOperationId: string,
    algorithm: 'TSP_NEAREST' | 'TSP_2OPT' | 'GENETIC' = 'TSP_2OPT'
  ): Promise<{
    route: {
      algorithm: string;
      waypoints: {
        latitude: number;
        longitude: number;
        address: string;
        order: number;
      }[];
      sequence: number[];
      totalDistance: number;
      estimatedDuration: number;
    };
    estimation: {
      totalCost: number;
      costPerKm: number;
      fuelCost: number;
    };
    optimization: {
      algorithm: string;
      originalDistance?: number;
      optimizedDistance: number;
      distanceSaved: number;
      costSaved: number;
      percentImprovement: number;
      savings?: string;
    };
  }> {
    try {
      const response = await apiClient.post(
        `/trade-operations/${tradeOperationId}/optimize-transport`,
        {
          algorithm,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error optimizing transport route:', error);
      throw error;
    }
  },

  // Get all trade operations (for admin dashboard)
  async getAllTradeOperations(filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    productId?: string;
  }): Promise<TradeOperation[]> {
    try {
      const params = filters || {};
      const response = await apiClient.get('/trade-operations', { params });

      // Handle different response formats
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        // Handle paginated response
        return response.data.data;
      } else {
        console.warn('Unexpected response format for trade operations:', response.data);
        return [];
      }
    } catch (error) {
      console.error('Error fetching trade operations:', error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  },

  // Get trade operations by status (convenience method for ActiveOperationsTab)
  async getTradeOperations(status?: string): Promise<TradeOperation[]> {
    return this.getAllTradeOperations(status ? { status } : undefined);
  },

  // Update trade operation
  async updateTradeOperation(
    id: string,
    data: Partial<Pick<TradeOperation, 'status' | 'phase' | 'sellingPrice'>>
  ): Promise<TradeOperation> {
    try {
      const response = await apiClient.patch<TradeOperation>(`/trade-operations/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating trade operation:', error);
      throw error;
    }
  },

  // Update trade operation status
  async updateTradeOperationStatus(
    id: string,
    status: TradeOperation['status']
  ): Promise<TradeOperation> {
    try {
      const response = await apiClient.patch<TradeOperation>(`/trade-operations/${id}`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating trade operation status:', error);
      throw error;
    }
  },

  // Finalize trade operation
  async finalizeTradeOperation(
    id: string,
    finalData: {
      finalSellingPrice: number;
      finalPurchasePrices: {
        sellerId: string;
        price: number;
      }[];
      actualTransportCost: number;
    }
  ): Promise<{
    status: string;
    actualProfit: number;
    actualProfitMargin: number;
    profitAnalysis: {
      targetMet: boolean;
      marginDifference: number;
      viability: string;
    };
  }> {
    try {
      const response = await apiClient.post(`/trade-operations/${id}/finalize`, finalData);
      return response.data;
    } catch (error) {
      console.error('Error finalizing trade operation:', error);
      throw error;
    }
  },
};

export default tradeOperationService;
