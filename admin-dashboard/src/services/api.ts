import axios from 'axios';
import * as Types from '../types';

// Configure axios defaults
const API_BASE_URL = 'http://localhost:4000/api';

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
  async getAll(): Promise<Types.TradeOperation[]> {
    const response = await api.get('/trade-operations');
    return response.data.data || response.data || [];
  },

  async getById(id: string): Promise<Types.TradeOperation> {
    const { data } = await api.get(`/trade-operations/${id}`);
    return data;
  },

  async create(dto: Types.CreateTradeOperationDto): Promise<Types.TradeOperation> {
    const { data } = await api.post('/trade-operations', dto);
    return data;
  },

  async updatePhase(id: string, phase: string): Promise<Types.TradeOperation> {
    const { data } = await api.patch(`/trade-operations/${id}/phase`, { phase });
    return data;
  },

  async updateStatus(id: string, status: string): Promise<Types.TradeOperation> {
    const { data } = await api.patch(`/trade-operations/${id}/status`, { status });
    return data;
  },

  async addSellers(id: string, sellers: Types.TradeSeller[]): Promise<Types.TradeOperation> {
    const { data } = await api.post(`/trade-operations/${id}/sellers`, { sellers });
    return data;
  },

  async removeSeller(id: string, sellerId: string): Promise<Types.TradeOperation> {
    const { data } = await api.delete(`/trade-operations/${id}/sellers/${sellerId}`);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/trade-operations/${id}`);
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
    const promises = offers.map(offer => this.create(tradeOperationId, offer));
    return Promise.all(promises);
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

export default api;
