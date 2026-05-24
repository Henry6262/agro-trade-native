import { apiClient } from './api';
import type {
  TransportRoute,
  BuyListing,
  SaleListing,
  MatchingSeller,
  ProfitCalculation,
  TransportEstimate,
} from '../types/trade-operations';

export interface TradeOperation {
  id: string;
  status: string;
  phase: string;
  profitMargin?: number | null;
  estimatedProfit?: number | null;
  targetProfitMargin?: number;
  createdAt: string;
  updatedAt: string;
  operationNumber?: string;
  buyListing?: {
    id: string;
    quantity: number;
    unit?: string;
    maxPricePerUnit?: number;
    product?: { id: string; name: string; category?: string } | null;
    buyer?: { id: string; name: string; email?: string } | null;
    deliveryAddress?: {
      city?: string;
      country?: string;
      address?: string;
      latitude?: number;
      longitude?: number;
    } | null;
  } | null;
  admin?: { id: string; name: string } | null;
  sellers?: TradeSeller[];
  selectedSellers?: {
    id: string;
    sellerId: string;
    saleListingId: string;
    requestedQuantity: number;
    saleListing?: {
      seller?: { name?: string } | null;
      product?: { name?: string } | null;
      unit?: string;
      askingPrice?: number;
      address?: { address?: string } | null;
    } | null;
  }[];
  negotiations?: NegotiationStub[];
  negotiationSummary?: NegotiationSummary;
  _count?: { sellers: number };
}

export interface NegotiationStub {
  id: string;
  status: string;
  tradeSellerId?: string;
  offeredPrice?: number;
  quantity?: number;
}

export interface NegotiationSummary {
  pending: number;
  countered: number;
  accepted: number;
  rejected: number;
  expired: number;
  withdrawn: number;
  total?: number;
}

export interface TradeSeller {
  id: string;
  name: string;
  sellerId?: string;
  saleListingId?: string;
  price: number;
  quantity: number;
  status?: string;
  isVerified?: boolean;
}

export interface TradeOperationAnalytics {
  totalTrades: number;
  marginDistribution: number[];
  averageMargin: number;
  totalProfit: number;
  periodStart: string | null;
  periodEnd: string | null;
}

export interface TradeOperationsFilters {
  status?: string;
  phase?: string;
  adminId?: string;
  buyerId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { hasMore: boolean; total: number; page: number };
}

export const tradeOperationService = {
  getAll: async (filters?: TradeOperationsFilters): Promise<TradeOperation[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.phase) params.append('phase', filters.phase);
    if (filters?.adminId) params.append('adminId', filters.adminId);
    if (filters?.buyerId) params.append('buyerId', filters.buyerId);

    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient.get<TradeOperation[]>(`/trade-operations${query}`);
    return response.data;
  },

  getAnalytics: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<TradeOperationAnalytics> => {
    const query = new URLSearchParams();
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);

    const queryStr = query.toString() ? `?${query.toString()}` : '';
    const response = await apiClient.get<TradeOperationAnalytics>(
      `/trade-operations/analytics${queryStr}`
    );
    return response.data;
  },

  getById: async (id: string): Promise<TradeOperation> => {
    const response = await apiClient.get<TradeOperation>(`/trade-operations/${id}`);
    return response.data;
  },

  getTradeOperations: async (filters?: TradeOperationsFilters): Promise<TradeOperation[]> => {
    return tradeOperationService.getAll(filters);
  },

  getTradeOperation: async (id: string): Promise<TradeOperation> => {
    return tradeOperationService.getById(id);
  },

  getAllTradeOperations: async (): Promise<TradeOperation[]> => {
    return tradeOperationService.getAll();
  },

  updateTradeOperation: async (
    id: string,
    data: Partial<TradeOperation>
  ): Promise<TradeOperation> => {
    const response = await apiClient.patch<TradeOperation>(`/trade-operations/${id}`, data);
    return response.data;
  },

  getActiveBuyListings: async (): Promise<BuyListing[]> => {
    const response = await apiClient.get<BuyListing[]>('/buy-listings/active');
    return response.data;
  },

  getActiveSellListings: async (page = 1): Promise<PaginatedResponse<SaleListing>> => {
    const response = await apiClient.get<PaginatedResponse<SaleListing>>(
      `/sale-listings/active?page=${page}`
    );
    return response.data;
  },

  createTradeOperation: async (
    buyListingId: string,
    targetProfitMargin: number
  ): Promise<TradeOperation> => {
    const response = await apiClient.post<TradeOperation>('/trade-operations', {
      buyListingId,
      targetProfitMargin,
    });
    return response.data;
  },

  findMatchingSellers: async (
    tradeOperationId: string,
    _maxDistance?: number
  ): Promise<{ sellers: MatchingSeller[] }> => {
    const response = await apiClient.get<{ sellers: MatchingSeller[] }>(
      `/trade-operations/${tradeOperationId}/matching-sellers`
    );
    return response.data;
  },

  selectSellers: async (
    tradeOperationId: string,
    sellers: { sellerId: string; saleListingId: string; requestedQuantity: number }[]
  ): Promise<TradeOperation> => {
    const response = await apiClient.post<TradeOperation>(
      `/trade-operations/${tradeOperationId}/select-sellers`,
      {
        sellers,
      }
    );
    return response.data;
  },

  calculateProfit: async (
    tradeOperationId: string,
    options?: { includeSensitivity?: boolean; includeRiskAssessment?: boolean }
  ): Promise<ProfitCalculation> => {
    const response = await apiClient.post<ProfitCalculation>(
      `/trade-operations/${tradeOperationId}/calculate-profit`,
      options
    );
    return response.data;
  },

  estimateTransportCost: async (params: {
    origin: { latitude: number; longitude: number; address: string };
    pickupLocations?: { latitude: number; longitude: number; address: string; quantity: number }[];
    destination: { latitude: number; longitude: number; address: string };
    quantity: number;
    vehicleType: string;
  }): Promise<TransportEstimate> => {
    const response = await apiClient.post<TransportEstimate>(
      '/trade-operations/estimate-transport',
      params
    );
    return response.data;
  },
};

export default tradeOperationService;

export type {
  BuyListing,
  SaleListing,
  MatchingSeller,
  ProfitCalculation,
  TransportEstimate,
  TransportRoute,
};
