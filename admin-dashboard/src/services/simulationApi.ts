import axios from 'axios';

const API_BASE = 'http://localhost:4000/api';

// Types - defined here to avoid export issues
export type UserRole = 'BUYER' | 'FARMER' | 'TRANSPORTER' | 'INSPECTOR' | 'ADMIN' | 'COMPANY_ADMIN';

export type SimulationUser = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  company?: {
    id: string;
    legalName: string;
  };
};

export type TradeState = {
  operation: any;
  state: {
    phase: string;
    status: string;
    totalQuantityNeeded: number;
    securedQuantity: number;
    quantityGap: number;
    pendingNegotiations: number;
    activeTransport: any;
    inspections: {
      total: number;
      pending: number;
      completed: number;
    };
  };
  actors: {
    buyer: any;
    sellers: any[];
    transporters: any[];
    inspectors: any[];
  };
};

// Get auth token from localStorage
const getAuthToken = () => localStorage.getItem('adminToken');

// Configure axios defaults
axios.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const simulationApi = {
  // ==================== Authentication ====================
  auth: {
    login: async (email: string, password: string) => {
      const response = await axios.post(`${API_BASE}/auth/login`, {
        email,
        password,
      });
      if (response.data.access_token) {
        localStorage.setItem('adminToken', response.data.access_token);
      }
      return response.data;
    },
  },

  // ==================== State Queries ====================
  getUsersByRole: async (role: UserRole): Promise<SimulationUser[]> => {
    const response = await axios.get(`${API_BASE}/simulation/users/${role}`);
    return response.data;
  },

  getFullTradeState: async (tradeOperationId: string): Promise<TradeState> => {
    const response = await axios.get(
      `${API_BASE}/simulation/trade-operation/${tradeOperationId}/full-state`
    );
    return response.data;
  },

  createTestUser: async (
    role: UserRole,
    name?: string,
    data?: any
  ): Promise<SimulationUser> => {
    const response = await axios.post(
      `${API_BASE}/simulation/users/create-test-user`,
      { role, name, data }
    );
    return response.data;
  },

  // ==================== Buyer Actions ====================
  buyer: {
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
  },

  // ==================== Seller Actions ====================
  seller: {
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
  },

  // ==================== Transporter Actions ====================
  transporter: {
    submitBid: async (userId: string, data: {
      transportRequestId: string;
      bidAmount: number;
      estimatedDuration: number;
      vehicleType?: string;
      vehicleCapacity?: number;
    }) => {
      const response = await axios.post(
        `${API_BASE}/simulation/transporter/${userId}/submit-bid`,
        data
      );
      return response.data;
    },

    startJob: async (userId: string, jobId: string) => {
      const response = await axios.post(
        `${API_BASE}/simulation/transporter/${userId}/start-job`,
        { jobId }
      );
      return response.data;
    },

    completeDelivery: async (
      userId: string,
      jobId: string,
      deliveryNotes?: string
    ) => {
      const response = await axios.post(
        `${API_BASE}/simulation/transporter/${userId}/complete-delivery`,
        { jobId, deliveryNotes }
      );
      return response.data;
    },
  },

  // ==================== Inspector Actions ====================
  inspector: {
    acceptJob: async (userId: string, inspectionId: string) => {
      const response = await axios.post(
        `${API_BASE}/simulation/inspector/${userId}/accept-job`,
        { inspectionId }
      );
      return response.data;
    },

    submitResults: async (userId: string, data: {
      inspectionId: string;
      qualityScore: number;
      result: 'PASSED' | 'FAILED';
      notes?: string;
    }) => {
      const response = await axios.post(
        `${API_BASE}/simulation/inspector/${userId}/submit-results`,
        data
      );
      return response.data;
    },
  },

  // ==================== Admin Workflow Actions ====================
  admin: {
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
  },
};
