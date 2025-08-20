import { apiClient } from './api';
import {
  Order,
  OrderCreateForm,
  ApiResponse,
  PaginatedResponse,
} from '../types';

export interface OrdersListParams {
  page?: number;
  limit?: number;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  sellerId?: string;
}

export const orderService = {
  // Get orders list
  getOrders: async (params: OrdersListParams = {}): Promise<PaginatedResponse<Order>> => {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    return apiClient.get<PaginatedResponse<Order>>(`/orders?${queryParams.toString()}`);
  },

  // Get single order
  getOrder: async (orderId: string): Promise<Order> => {
    return apiClient.get<ApiResponse<Order>>(`/orders/${orderId}`)
      .then((response) => response.data);
  },

  // Create new order
  createOrder: async (orderData: OrderCreateForm): Promise<Order> => {
    return apiClient.post<ApiResponse<Order>>('/orders', orderData)
      .then((response) => response.data);
  },

  // Update order status (usually for sellers)
  updateOrderStatus: async (
    orderId: string,
    status: string,
    notes?: string
  ): Promise<Order> => {
    return apiClient.patch<ApiResponse<Order>>(`/orders/${orderId}/status`, {
      status,
      notes,
    }).then((response) => response.data);
  },

  // Cancel order
  cancelOrder: async (orderId: string, reason?: string): Promise<Order> => {
    return apiClient.patch<ApiResponse<Order>>(`/orders/${orderId}/cancel`, {
      reason,
    }).then((response) => response.data);
  },

  // Get order tracking information
  getOrderTracking: async (orderId: string): Promise<{
    orderId: string;
    status: string;
    trackingNumber?: string;
    estimatedDelivery?: string;
    updates: Array<{
      status: string;
      message: string;
      timestamp: string;
      location?: string;
    }>;
  }> => {
    return apiClient.get<ApiResponse<any>>(`/orders/${orderId}/tracking`)
      .then((response) => response.data);
  },

  // Request refund
  requestRefund: async (
    orderId: string,
    reason: string,
    amount?: number
  ): Promise<void> => {
    return apiClient.post(`/orders/${orderId}/refund`, {
      reason,
      amount,
    });
  },

  // Rate order/seller
  rateOrder: async (
    orderId: string,
    rating: number,
    review?: string
  ): Promise<void> => {
    return apiClient.post(`/orders/${orderId}/rating`, {
      rating,
      review,
    });
  },

  // Get order statistics (for buyers dashboard)
  getOrderStats: async (): Promise<{
    total: number;
    pending: number;
    completed: number;
    cancelled: number;
    totalSpent: number;
  }> => {
    return apiClient.get<ApiResponse<any>>('/orders/stats')
      .then((response) => response.data);
  },

  // Download order invoice
  downloadInvoice: async (orderId: string): Promise<Blob> => {
    return apiClient.get(`/orders/${orderId}/invoice`, {
      responseType: 'blob',
    });
  },
};