import { axios, API_BASE } from './config';

export const buyerService = {
  createListing: async (userId: string, data: {
    productId: string;
    quantity: number;
    unit?: string;
    maxPricePerUnit: number;
    neededBy?: string;
    description?: string;
  }) => {
    const response = await axios.post(
      `${API_BASE}/simulation/buyer/${userId}/create-listing`,
      data
    );
    return response.data;
  },
};
