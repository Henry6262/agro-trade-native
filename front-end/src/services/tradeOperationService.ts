import { apiClient } from './api';

export interface TradeOperation {
  id: string;
  status: string;
  phase: string;
  profitMargin?: number | null;
  estimatedProfit?: number | null;
  createdAt: string;
  updatedAt: string;
  buyListing?: {
    id: string;
    quantity: number;
    product?: {
      id: string;
      name: string;
      category?: string;
    } | null;
    buyer?: {
      id: string;
      name: string;
      email?: string;
    } | null;
    deliveryAddress?: {
      city?: string;
      country?: string;
    } | null;
  } | null;
  admin?: {
    id: string;
    name: string;
  } | null;
  _count?: {
    sellers: number;
  };
}

export interface TradeOperationAnalytics {
  totalTrades: number;
  marginDistribution: number[];
  averageMargin: number;
  totalProfit: number;
  periodStart: string | null;
  periodEnd: string | null;
}

export interface BuyListing {
  id: string;
  quantity: number;
  product?: { id: string; name: string; category?: string } | null;
  buyer?: { id: string; name: string; email?: string } | null;
  deliveryAddress?: { city?: string; country?: string } | null;
}

export interface MatchingSeller {
  id: string;
  name: string;
  price: number;
  quantity: number;
  distance?: number;
  rating?: number;
}

export interface ProfitCalculation {
  estimatedProfit: number;
  profitMargin: number;
  revenue: number;
  costs: number;
}

export interface TransportEstimate {
  distance: number;
  estimatedTime: number;
  estimatedCost: number;
  route?: TransportRoute;
}

export interface TradeOperationsFilters {
  status?: string;
  phase?: string;
  adminId?: string;
  buyerId?: string;
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

  updateTradeOperation: async (
    id: string,
    data: Partial<TradeOperation>,
  ): Promise<TradeOperation> => {
    const response = await apiClient.patch<TradeOperation>(`/trade-operations/${id}`, data);
    return response.data;
  },
};

export default tradeOperationService;
