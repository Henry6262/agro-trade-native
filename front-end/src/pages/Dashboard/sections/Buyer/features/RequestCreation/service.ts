import { apiClient } from '../../../../../../services/api';
import type { CreateBuyerRequestDto } from './types';

export const buyerRequestCreationService = {
  submitRequest: (payload: CreateBuyerRequestDto) => apiClient.post('/buyer/listings', payload),
};
