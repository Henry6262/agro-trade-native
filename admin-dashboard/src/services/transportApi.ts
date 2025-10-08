import axios from 'axios';
import * as Types from '../types';

const api = axios.create({
  baseURL: 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Transport Request Service
export const transportRequestService = {
  async create(dto: any): Promise<any> {
    const response = await api.post('/transport/requests', dto);
    return response.data;
  },

  async getAll(params?: any): Promise<any> {
    const response = await api.get('/transport/requests', { params });
    return response.data;
  },

  async getById(id: string): Promise<any> {
    const response = await api.get(`/transport/requests/${id}`);
    return response.data;
  },

  async getBidsForRequest(requestId: string): Promise<any> {
    const response = await api.get(`/transport/requests/${requestId}/bids`);
    return response.data?.data || response.data || [];
  },
};

// Transport Bid Service
export const transportBidService = {
  async getAll(params?: any): Promise<any> {
    const response = await api.get('/transport/bids', { params });
    return response.data;
  },

  async accept(bidId: string): Promise<any> {
    const response = await api.post(`/transport/bids/${bidId}/accept`);
    return response.data;
  },

  async reject(bidId: string, reason?: string): Promise<any> {
    const response = await api.post(`/transport/bids/${bidId}/reject`, { reason });
    return response.data;
  },
};

// Transport Job Service
export const transportJobService = {
  async getAll(params?: any): Promise<any> {
    const response = await api.get('/transport/jobs', { params });
    return response.data;
  },

  async getByTradeOperation(tradeOperationId: string): Promise<any> {
    const response = await api.get('/transport/jobs', {
      params: { tradeOperationId }
    });
    return response.data?.data?.[0] || null;
  },
};

export default api;