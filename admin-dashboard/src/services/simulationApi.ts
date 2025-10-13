import axios from 'axios';
import { scenarioContext } from './scenarioContext';

const API_BASE = 'http://localhost:4001/api';

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

    cleanupTestData: async () => {
      const response = await axios.delete(
        `${API_BASE}/simulation/admin/cleanup-test-data`
      );
      return response.data;
    },
  },

  // ==================== Convenience Methods for Scenarios ====================
  createSaleListing: async (data: any) => {
    console.log('[API] Creating sale listing with data:', data);

    // Resolve farmer ID from context
    const farmer = scenarioContext.getUser('FARMER', data.farmerIndex || 0);
    if (!farmer) {
      throw new Error(`Farmer ${data.farmerIndex || 0} not found in context. Ensure farmer is created first.`);
    }

    // Call real API
    const result = await simulationApi.admin.createFarmerSaleListing(farmer.id, {
      productCategory: data.productCategory,
      quantity: data.quantity,
      pricePerUnit: data.pricePerUnit,
      latitude: data.latitude,
      longitude: data.longitude,
    });

    // Store in context
    scenarioContext.addEntity('saleListings', result);

    console.log('[API] Sale listing created:', result);
    return result;
  },

  createBuyListing: async (data: any) => {
    console.log('[API] Creating buy listing with data:', data);

    // Resolve buyer ID from context
    const buyer = scenarioContext.getUser('BUYER', data.buyerIndex || 0);
    if (!buyer) {
      throw new Error(`Buyer ${data.buyerIndex || 0} not found in context. Ensure buyer is created first.`);
    }

    // Get or use product ID
    const productId = scenarioContext.getProductId(data.productCategory || data.productId);

    // Call real API
    const result = await simulationApi.buyer.createListing(buyer.id, {
      productId: productId,
      quantity: data.quantity,
      unit: data.unit || 'tons',
      maxPricePerUnit: data.maxPricePerUnit,
      neededBy: data.neededBy,
      description: data.description,
    });

    // Store in context
    scenarioContext.addEntity('buyListings', result);

    console.log('[API] Buy listing created:', result);
    return result;
  },

  createTradeOperation: async (data: any) => {
    console.log('[API] Creating trade operation with data:', data);

    // Resolve buy listing ID from context
    const buyListing = scenarioContext.getEntity('buyListings', data.buyListingIndex || 0);
    if (!buyListing) {
      throw new Error(`Buy listing ${data.buyListingIndex || 0} not found in context. Ensure buy listing is created first.`);
    }

    // Call real API
    const result = await simulationApi.admin.createTradeOperation({
      buyListingId: buyListing.id,
      adminMargin: data.adminMargin || 0.1,
      buyerCommission: data.buyerCommission || 0.015,
      sellerCommission: data.sellerCommission || 0.025,
    });

    // Store in context
    scenarioContext.addEntity('tradeOperations', result);

    console.log('[API] Trade operation created:', result);
    return result;
  },

  initiateNegotiation: async (data: any) => {
    console.log('[API] Initiating negotiation with data:', data);

    // Resolve trade operation ID from context
    const tradeOperation = scenarioContext.getEntity('tradeOperations', data.tradeOperationIndex || 0);
    if (!tradeOperation) {
      throw new Error(`Trade operation ${data.tradeOperationIndex || 0} not found in context.`);
    }

    // Build offers array from data
    const offers = [];

    // Handle single offer
    if (data.farmerIndex !== undefined && data.saleListingIndex !== undefined) {
      const farmer = scenarioContext.getUser('FARMER', data.farmerIndex);
      const saleListing = scenarioContext.getEntity('saleListings', data.saleListingIndex);

      if (!farmer) throw new Error(`Farmer ${data.farmerIndex} not found`);
      if (!saleListing) throw new Error(`Sale listing ${data.saleListingIndex} not found`);

      offers.push({
        farmerId: farmer.id,
        saleListingId: saleListing.id,
        requestedQuantity: data.requestedQuantity,
        offeredPrice: data.offeredPrice,
      });
    }

    // Handle multiple offers if provided
    if (data.offers && Array.isArray(data.offers)) {
      for (const offer of data.offers) {
        const farmer = scenarioContext.getUser('FARMER', offer.farmerIndex);
        const saleListing = scenarioContext.getEntity('saleListings', offer.saleListingIndex);

        if (!farmer) throw new Error(`Farmer ${offer.farmerIndex} not found`);
        if (!saleListing) throw new Error(`Sale listing ${offer.saleListingIndex} not found`);

        offers.push({
          farmerId: farmer.id,
          saleListingId: saleListing.id,
          requestedQuantity: offer.requestedQuantity,
          offeredPrice: offer.offeredPrice,
        });
      }
    }

    if (offers.length === 0) {
      throw new Error('No valid offers to send');
    }

    // Call real API
    const result = await simulationApi.admin.sendOffers({
      tradeOperationId: tradeOperation.id,
      offers: offers,
    });

    // Store negotiations in context (assuming result contains array of negotiations)
    if (result.negotiations) {
      result.negotiations.forEach((negotiation: any) => {
        scenarioContext.addEntity('negotiations', negotiation);
      });
    } else if (result.negotiation) {
      scenarioContext.addEntity('negotiations', result.negotiation);
    }

    console.log('[API] Negotiation initiated:', result);
    return result;
  },

  respondToNegotiation: async (data: any) => {
    console.log('[API] Responding to negotiation with data:', data);

    // Resolve negotiation ID from context
    const negotiation = scenarioContext.getEntity('negotiations', data.negotiationIndex || 0);
    if (!negotiation) {
      throw new Error(`Negotiation ${data.negotiationIndex || 0} not found in context.`);
    }

    // Resolve seller ID from context
    const seller = scenarioContext.getUser('FARMER', data.farmerIndex || 0);
    if (!seller) {
      throw new Error(`Farmer/Seller ${data.farmerIndex || 0} not found in context.`);
    }

    let result;

    // Determine response type
    if (data.response === 'accept' || data.accept === true) {
      // Accept offer
      result = await simulationApi.seller.acceptOffer(seller.id, negotiation.id);
    } else if (data.response === 'counter' || data.counterPrice !== undefined) {
      // Counter offer
      result = await simulationApi.seller.counterOffer(
        seller.id,
        negotiation.id,
        data.counterPrice,
        data.counterQuantity
      );
    } else if (data.response === 'reject' || data.reject === true) {
      // Reject offer
      result = await simulationApi.seller.rejectOffer(
        seller.id,
        negotiation.id,
        data.reason
      );
    } else {
      throw new Error('Invalid negotiation response. Must specify accept, counter, or reject.');
    }

    console.log('[API] Negotiation response sent:', result);
    return result;
  },

  requestInspection: async (data: any) => {
    console.log('[API] Requesting inspection with data:', data);

    // Resolve trade operation ID from context
    const tradeOperation = scenarioContext.getEntity('tradeOperations', data.tradeOperationIndex || 0);
    if (!tradeOperation) {
      throw new Error(`Trade operation ${data.tradeOperationIndex || 0} not found in context.`);
    }

    // Resolve inspector ID from context
    const inspector = scenarioContext.getUser('INSPECTOR', data.inspectorIndex || 0);
    if (!inspector) {
      throw new Error(`Inspector ${data.inspectorIndex || 0} not found in context.`);
    }

    // Call real API
    const result = await simulationApi.admin.assignInspector(
      tradeOperation.id,
      inspector.id
    );

    // Store inspection in context
    scenarioContext.addEntity('inspections', result);

    console.log('[API] Inspection requested:', result);
    return result;
  },

  submitInspection: async (data: any) => {
    console.log('[API] Submitting inspection with data:', data);

    // Resolve inspection ID from context
    const inspection = scenarioContext.getEntity('inspections', data.inspectionIndex || 0);
    if (!inspection) {
      throw new Error(`Inspection ${data.inspectionIndex || 0} not found in context.`);
    }

    // Resolve inspector ID from context
    const inspector = scenarioContext.getUser('INSPECTOR', data.inspectorIndex || 0);
    if (!inspector) {
      throw new Error(`Inspector ${data.inspectorIndex || 0} not found in context.`);
    }

    // Call real API
    const result = await simulationApi.inspector.submitResults(inspector.id, {
      inspectionId: inspection.id,
      qualityScore: data.qualityScore || 85,
      result: data.result || 'PASSED',
      notes: data.notes,
    });

    console.log('[API] Inspection submitted:', result);
    return result;
  },

  createTransportRequest: async (data: any) => {
    console.log('[API] Creating transport request with data:', data);

    // Resolve trade operation ID from context
    const tradeOperation = scenarioContext.getEntity('tradeOperations', data.tradeOperationIndex || 0);
    if (!tradeOperation) {
      throw new Error(`Trade operation ${data.tradeOperationIndex || 0} not found in context.`);
    }

    // If direct transport assignment is requested
    if (data.transporterIndex !== undefined) {
      const transporter = scenarioContext.getUser('TRANSPORTER', data.transporterIndex);
      if (!transporter) {
        throw new Error(`Transporter ${data.transporterIndex} not found in context.`);
      }

      // Call createTransport directly
      const result = await simulationApi.admin.createTransport({
        tradeOperationId: tradeOperation.id,
        transporterId: transporter.id,
        pickupLat: data.pickupLat || 0,
        pickupLng: data.pickupLng || 0,
        deliveryLat: data.deliveryLat || 0,
        deliveryLng: data.deliveryLng || 0,
        bidAmount: data.bidAmount || 500,
        estimatedDuration: data.estimatedDuration || 24,
      });

      scenarioContext.addEntity('transportJobs', result);
      console.log('[API] Transport created directly:', result);
      return result;
    }

    // Otherwise create transport request for bidding
    const result = await simulationApi.admin.createTransportRequest({
      tradeOperationId: tradeOperation.id,
      pickupLat: data.pickupLat || 0,
      pickupLng: data.pickupLng || 0,
      deliveryLat: data.deliveryLat || 0,
      deliveryLng: data.deliveryLng || 0,
      distanceKm: data.distanceKm,
    });

    // Store transport request in context
    scenarioContext.addEntity('transportRequests', result);

    console.log('[API] Transport request created:', result);
    return result;
  },

  submitTransportBid: async (data: any) => {
    console.log('[API] Submitting transport bid with data:', data);

    // Resolve transport request ID from context
    const transportRequest = scenarioContext.getEntity('transportRequests', data.transportRequestIndex || 0);
    if (!transportRequest) {
      throw new Error(`Transport request ${data.transportRequestIndex || 0} not found in context.`);
    }

    // Resolve transporter ID from context
    const transporter = scenarioContext.getUser('TRANSPORTER', data.transporterIndex || 0);
    if (!transporter) {
      throw new Error(`Transporter ${data.transporterIndex || 0} not found in context.`);
    }

    // Call real API
    const result = await simulationApi.transporter.submitBid(transporter.id, {
      transportRequestId: transportRequest.id,
      bidAmount: data.bidAmount,
      estimatedDuration: data.estimatedDuration || 24,
      vehicleType: data.vehicleType,
      vehicleCapacity: data.vehicleCapacity,
    });

    // Store bid in context
    scenarioContext.addEntity('transportBids', result);

    console.log('[API] Transport bid submitted:', result);
    return result;
  },

  acceptTransportBid: async (data: any) => {
    console.log('[API] Accepting transport bid with data:', data);

    // Resolve transport request ID from context
    const transportRequest = scenarioContext.getEntity('transportRequests', data.transportRequestIndex || 0);
    if (!transportRequest) {
      throw new Error(`Transport request ${data.transportRequestIndex || 0} not found in context.`);
    }

    // Resolve transport bid ID from context
    const transportBid = scenarioContext.getEntity('transportBids', data.bidIndex || 0);
    if (!transportBid) {
      throw new Error(`Transport bid ${data.bidIndex || 0} not found in context.`);
    }

    // Call real API
    const result = await simulationApi.admin.selectTransportBid({
      transportRequestId: transportRequest.id,
      bidId: transportBid.id,
    });

    // Store transport job in context
    scenarioContext.addEntity('transportJobs', result);

    console.log('[API] Transport bid accepted:', result);
    return result;
  },

  cleanupTestData: async () => {
    // Also reset the context when cleaning up test data
    scenarioContext.reset();
    return simulationApi.admin.cleanupTestData();
  },
};

// Export scenarioContext for external access
export { scenarioContext };
