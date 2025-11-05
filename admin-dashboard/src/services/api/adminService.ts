import { axios, API_BASE } from './config';

export const adminService = {
  createFarmerSaleListing: async (farmerId: string, data: {
    productCategory: string;
    quantity: number;
    pricePerUnit: number;
    latitude?: number;
    longitude?: number;
  }) => {
    const response = await axios.post(
      `${API_BASE}/simulation/admin/farmer/${farmerId}/create-sale-listing`,
      data
    );
    return response.data;
  },

  createTradeOperation: async (data: {
    buyListingId: string;
    adminMargin: number;
    buyerCommission: number;
    sellerCommission: number;
  }) => {
    const response = await axios.post(
      `${API_BASE}/simulation/admin/create-trade-operation`,
      data
    );
    return response.data;
  },

  sendOffers: async (data: {
    tradeOperationId: string;
    offers: Array<{
      farmerId: string;
      saleListingId: string;
      requestedQuantity: number;
      offeredPrice: number;
    }>;
  }) => {
    const response = await axios.post(
      `${API_BASE}/simulation/admin/send-offers`,
      data
    );
    return response.data;
  },

  acceptCounterOffer: async (negotiationId: string) => {
    const response = await axios.post(
      `${API_BASE}/simulation/admin/accept-counter-offer`,
      { negotiationId }
    );
    return response.data;
  },

  assignInspector: async (tradeOperationId: string, inspectorId: string) => {
    const response = await axios.post(
      `${API_BASE}/simulation/admin/assign-inspector`,
      { tradeOperationId, inspectorId }
    );
    return response.data;
  },

  createTransport: async (data: {
    tradeOperationId: string;
    transporterId: string;
    pickupLat: number;
    pickupLng: number;
    deliveryLat: number;
    deliveryLng: number;
    bidAmount: number;
    estimatedDuration: number;
  }) => {
    const response = await axios.post(
      `${API_BASE}/simulation/admin/create-transport`,
      data
    );
    return response.data;
  },

  completeTrade: async (tradeOperationId: string) => {
    const response = await axios.post(
      `${API_BASE}/simulation/admin/complete-trade`,
      { tradeOperationId }
    );
    return response.data;
  },

  createTransportRequest: async (data: {
    tradeOperationId: string;
    pickupLat: number;
    pickupLng: number;
    deliveryLat: number;
    deliveryLng: number;
    distanceKm?: number;
  }) => {
    const response = await axios.post(
      `${API_BASE}/simulation/admin/create-transport-request`,
      data
    );
    return response.data;
  },

  selectTransportBid: async (data: {
    transportRequestId: string;
    bidId: string;
  }) => {
    const response = await axios.post(
      `${API_BASE}/simulation/admin/select-transport-bid`,
      data
    );
    return response.data;
  },

  updatePricing: async (data: {
    negotiationId: string;
    newPrice: number;
    reason?: string;
  }) => {
    const response = await axios.post(
      `${API_BASE}/simulation/admin/update-pricing`,
      data
    );
    return response.data;
  },

  cleanupTestData: async () => {
    const response = await axios.delete(
      `${API_BASE}/simulation/admin/cleanup-test-data`
    );
    return response.data;
  },
};
