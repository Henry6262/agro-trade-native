import { apiClient } from '../../../../../services/api';

export const buyerRequestsService = {
  fetchBuyerListings: () => apiClient.get('/buyer/listings').then((res) => res.data),
};
