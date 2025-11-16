import { apiClient } from '../../../../../../services/api';
import type { SellerProductEditPayload } from './types';

export const sellerProductsService = {
  async updateProduct(payload: SellerProductEditPayload) {
    const response = await apiClient.put(`/seller/listings/${payload.id}`, {
      quantity: payload.quantity,
      unit: payload.unit || 'ton',
      location: payload.location,
      specifications: payload.specifications || {},
    });

    return response?.data;
  },
  async deleteProduct(productId: string) {
    const response = await apiClient.delete(`/seller/listings/${productId}`);
    return response?.data;
  },
};
