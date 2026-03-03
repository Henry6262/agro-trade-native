import axios from 'axios';
import * as Types from '../types';
import { API_ENDPOINTS } from '../config/api';

// Configure axios defaults
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const getAccessToken = (): string | null => {
  const direct = localStorage.getItem('token');
  if (direct) return direct;

  const persisted = localStorage.getItem('auth-storage');
  if (persisted) {
    try {
      const parsed = JSON.parse(persisted);
      return parsed?.state?.token ?? null;
    } catch (error) {
      console.warn('Failed to parse persisted auth storage', error);
    }
  }

  return null;
};

// Add auth token if exists
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Trade Operations Service
export const tradeOperationService = {
  async getAll(params?: {
    phase?: Types.TradePhase;
    status?: Types.TradeStatus;
    buyListingId?: string;
    page?: number;
    limit?: number;
  }): Promise<Types.TradeOperation[]> {
    const response = await api.get(API_ENDPOINTS.tradeOperations.base, {
      params,
    });
    return response.data.data || response.data || [];
  },

  async getByBuyListingId(buyListingId: string): Promise<Types.TradeOperation | null> {
    try {
      const latestResponse = await api.get(
        `${API_ENDPOINTS.tradeOperations.base}/buy-listing/${buyListingId}/latest`,
      );
      if (latestResponse.data?.data) {
        return latestResponse.data.data;
      }
    } catch (error) {
      console.warn('Latest trade operation lookup failed, falling back to list', error);
    }

    const fallbackResponse = await api.get(API_ENDPOINTS.tradeOperations.base, {
      params: {
        limit: 200,
        page: 1,
      },
    });
    const operations = fallbackResponse.data.data || fallbackResponse.data || [];
    return operations.find((op: Types.TradeOperation) => op.buyListingId === buyListingId) || null;
  },

  async getById(id: string): Promise<Types.TradeOperation> {
    const { data } = await api.get(API_ENDPOINTS.tradeOperations.byId(id));
    return data;
  },

  async create(
    dto: Types.CreateTradeOperationDto,
  ): Promise<Types.CreateTradeOperationResponse> {
    const { data } = await api.post(API_ENDPOINTS.tradeOperations.base, dto);
    return data;
  },
  async calculateTransport(
    payload: Types.CalculateTransportRequest,
  ): Promise<Types.CalculateTransportResponse> {
    const { data } = await api.post(
      API_ENDPOINTS.tradeOperations.calculateTransport,
      payload,
    );
    return data;
  },

  async update(id: string, updateDto: Partial<{
    phase: Types.TradePhase;
    status: Types.TradeStatus;
    sellingPrice: number;
    targetProfitMargin: number;
    expectedDeliveryDate: Date;
    transportOptimized: boolean;
    adminNotes: string;
  }>): Promise<Types.TradeOperation> {
    const { data } = await api.patch(
      API_ENDPOINTS.tradeOperations.byId(id),
      updateDto,
    );
    return data;
  },

  async updatePhase(id: string, phase: string): Promise<Types.TradeOperation> {
    const { data } = await api.patch(
      `${API_ENDPOINTS.tradeOperations.byId(id)}/phase`,
      { phase },
    );
    return data;
  },

  async updateStatus(id: string, status: string): Promise<Types.TradeOperation> {
    const { data } = await api.patch(
      `${API_ENDPOINTS.tradeOperations.byId(id)}/status`,
      { status },
    );
    return data;
  },

  async cancel(id: string, reason?: string): Promise<{
    success: boolean;
    message: string;
    data: {
      id: string;
      operationNumber: string;
      status: string;
      phase: string;
      completedAt: string;
    };
  }> {
    const { data } = await api.post(
      `${API_ENDPOINTS.tradeOperations.byId(id)}/cancel`,
      { reason },
    );
    return data;
  },

  async addSellers(id: string, sellers: Types.TradeSeller[]): Promise<Types.TradeOperation> {
    const { data } = await api.post(
      API_ENDPOINTS.tradeOperations.addSellers(id),
      { sellers },
    );
    return data;
  },

  async removeSeller(id: string, sellerId: string): Promise<Types.TradeOperation> {
    const { data } = await api.delete(
      `${API_ENDPOINTS.tradeOperations.addSellers(id)}/${sellerId}`,
    );
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.tradeOperations.byId(id));
  },
};

// Negotiations Service
export const negotiationService = {
  async getByTradeOperation(tradeOperationId: string): Promise<Types.Negotiation[]> {
    const response = await api.get(`/negotiations/trade-operation/${tradeOperationId}`);
    return response.data?.data?.negotiations || response.data?.negotiations || response.data || [];
  },

  async create(tradeOperationId: string, dto: Types.CreateNegotiationDto): Promise<Types.Negotiation> {
    const { data } = await api.post(`/negotiations/trade-operation/${tradeOperationId}`, dto);
    return data;
  },

  async respond(negotiationId: string, dto: Types.RespondToNegotiationDto): Promise<Types.Negotiation> {
    const endpoint = dto.status === 'COUNTERED' 
      ? `/negotiations/${negotiationId}/counter`
      : dto.status === 'ACCEPTED'
      ? `/negotiations/${negotiationId}/accept`
      : `/negotiations/${negotiationId}/reject`;
    
    const { data } = await api.post(endpoint, dto);
    return data;
  },

  async bulkCreate(tradeOperationId: string, offers: Types.CreateNegotiationDto[]): Promise<Types.Negotiation[]> {
    // Use the dedicated batch endpoint for better performance and transactionality
    const { data } = await api.post(
      `/negotiations/trade-operations/${tradeOperationId}/offers/batch`,
      { offers }
    );
    return data?.data || data || [];
  },
};

// Inspections Service
export const inspectionService = {
  async getByTradeOperation(tradeOperationId: string): Promise<Types.InspectionRequest[]> {
    const { data } = await api.get(`/inspections/trade-operation/${tradeOperationId}`);
    return data;
  },

  async requestForTrade(tradeOperationId: string, saleListingIds: string[], priority: string = 'MEDIUM'): Promise<Types.InspectionRequest[]> {
    const { data } = await api.post(`/trade-operations/${tradeOperationId}/request-inspections`, {
      saleListingIds,
      priority,
    });
    return data;
  },

  async create(dto: any): Promise<Types.InspectionRequest> {
    const { data } = await api.post('/inspections', dto);
    return data;
  },

  async getInspectors(): Promise<Types.InspectorAssignee[]> {
    const { data } = await api.get('/inspections/inspectors');
    return data;
  },

  async assignInspector(inspectionId: string, inspectorId: string) {
    const { data } = await api.put(`/inspections/${inspectionId}/assign`, {
      inspectorId,
    });
    return data;
  },

  async list(params?: { status?: string; priority?: string; page?: number; limit?: number }) {
    const { data } = await api.get('/inspections', {
      params,
    });
    return data;
  },

  async submitResult(
    inspectionId: string,
    payload: Types.SubmitInspectionResultPayload,
  ): Promise<Types.InspectionRequest> {
    const { data } = await api.post(`/inspections/${inspectionId}/results`, payload);
    return data;
  },
};

// Buy Listings Service
export const buyListingService = {
  async getAll(): Promise<Types.BuyListing[]> {
    const response = await api.get('/buyer/listings');
    return response.data.data || response.data || [];
  },

  async getById(id: string): Promise<Types.BuyListing> {
    const { data } = await api.get(`/buyer/listings/${id}`);
    return data;
  },
};

// Sale Listings Service
export const saleListingService = {
  async search(params: {
    productId?: string;
    minQuantity?: number;
    maxPrice?: number;
    location?: { lat: number; lng: number; radius: number };
  }): Promise<Types.SaleListing[]> {
    const { data } = await api.get('/buyer/sellers/match', { params });
    return data;
  },

  async getById(id: string): Promise<Types.SaleListing> {
    const { data } = await api.get(`/seller/listings/${id}`);
    return data;
  },
};

// Profit Calculation Service
export const profitService = {
  async calculate(tradeOperationId: string): Promise<any> {
    const response = await api.get(`/trade-operations/${tradeOperationId}/profit`);
    return response.data?.data || response.data || {};
  },

  async getScenarios(tradeOperationId: string): Promise<any[]> {
    const { data } = await api.get(`/trade-operations/${tradeOperationId}/scenarios`);
    return data;
  },
};

export const transportAdminService = {
  async getByTradeOperation(tradeOperationId: string): Promise<Types.TransportData> {
    const { data } = await api.get(API_ENDPOINTS.transport.byTradeOperation(tradeOperationId));
    return data;
  },

  async autoCreateRequest(tradeOperationId: string) {
    const { data } = await api.post(API_ENDPOINTS.transport.autoRequest, {
      tradeOperationId,
    });
    return data;
  },

  async getRequestById(id: string): Promise<Types.TransportRequestSummary> {
    const { data } = await api.get(API_ENDPOINTS.transport.requestById(id));
    return data;
  },

  async getRequests(params?: {
    status?: string;
    urgencyLevel?: string;
    offset?: number;
    limit?: number;
  }): Promise<Types.TransportRequestsResponse> {
    const { data } = await api.get(API_ENDPOINTS.transport.requests, {
      params,
    });
    return data;
  },

  async approveBid(bidId: string) {
    const { data } = await api.post(API_ENDPOINTS.transport.approveBid(bidId));
    return data;
  },

  async rejectBid(bidId: string) {
    const { data } = await api.post(API_ENDPOINTS.transport.rejectBid(bidId));
    return data;
  },
};

export default api;
