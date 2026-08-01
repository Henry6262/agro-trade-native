import axios from 'axios';
import * as Types from '../types';

interface TransportListParams {
  status?: string;
  page?: number;
  limit?: number;
  tradeOperationId?: string;
}

interface CreateTransportRequestDto {
  tradeOperationId: string;
}

const api = axios.create({
  baseURL: 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Transport Request Service
export const transportRequestService = {
  async create(dto: CreateTransportRequestDto): Promise<Types.TransportRequestSummary> {
    const response = await api.post('/transport/requests', dto);
    return response.data;
  },

  async getAll(params?: TransportListParams): Promise<Types.TransportRequestsResponse> {
    const response = await api.get('/transport/requests', { params });
    return response.data;
  },

  async getById(id: string): Promise<Types.TransportRequestSummary> {
    const response = await api.get(`/transport/requests/${id}`);
    return response.data;
  },

  async getBidsForRequest(requestId: string): Promise<Types.TransportBidSummary[]> {
    const response = await api.get(`/transport/requests/${requestId}/bids`);
    return response.data?.data || response.data || [];
  },
};

// Transport Bid Service
export const transportBidService = {
  async getAll(params?: TransportListParams): Promise<Types.TransportBidSummary[]> {
    const response = await api.get('/transport/bids', { params });
    return response.data;
  },

  async accept(bidId: string): Promise<Types.TransportBidSummary> {
    const response = await api.post(`/transport/bids/${bidId}/accept`);
    return response.data;
  },

  async reject(bidId: string, reason?: string): Promise<Types.TransportBidSummary> {
    const response = await api.post(`/transport/bids/${bidId}/reject`, { reason });
    return response.data;
  },
};

// Transport Job Service
export const transportJobService = {
  async getAll(params?: TransportListParams): Promise<Types.TransportJobSummary[]> {
    const response = await api.get('/transport/jobs', { params });
    return response.data;
  },

  async getByTradeOperation(tradeOperationId: string): Promise<Types.TransportJobSummary | null> {
    const response = await api.get('/transport/jobs', {
      params: { tradeOperationId }
    });
    return response.data?.data?.[0] || null;
  },
};

export default api;
