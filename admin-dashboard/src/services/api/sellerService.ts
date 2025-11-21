import { axios, API_BASE } from './config';

export const sellerService = {
  acceptOffer: async (userId: string, negotiationId: string) => {
    const response = await axios.post(
      `${API_BASE}/simulation/seller/${userId}/accept-offer`,
      { negotiationId }
    );
    return response.data;
  },

  counterOffer: async (
    userId: string,
    negotiationId: string,
    counterPrice: number,
    counterQuantity?: number
  ) => {
    const response = await axios.post(
      `${API_BASE}/simulation/seller/${userId}/counter-offer`,
      { negotiationId, counterPrice, counterQuantity }
    );
    return response.data;
  },

  rejectOffer: async (
    userId: string,
    negotiationId: string,
    reason?: string
  ) => {
    const response = await axios.post(
      `${API_BASE}/simulation/seller/${userId}/reject-offer`,
      { negotiationId, reason }
    );
    return response.data;
  },
};
