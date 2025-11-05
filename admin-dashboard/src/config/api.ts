/**
 * API Configuration
 *
 * Central source for all API URLs and endpoints.
 * Makes it easy to change backend URL or add new endpoints.
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001';

export const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    register: '/auth/register',
    me: '/auth/me',
  },

  // Buyer Endpoints
  buyer: {
    listings: '/buyer/listings',
    listingById: (id: string) => `/buyer/listings/${id}`,
    offers: '/buyer/offers',
    trades: '/buyer/trades',
    stats: '/buyer/stats',
  },

  // Seller Endpoints
  seller: {
    listings: '/seller/listings',
    listingById: (id: string) => `/seller/listings/${id}`,
    offers: '/seller/offers',
    trades: '/seller/trades',
    stats: '/seller/stats',
  },

  // Trade Operations
  tradeOperations: {
    base: '/trade-operations',
    byId: (id: string) => `/trade-operations/${id}`,
    calculateTransport: '/trade-operations/calculate-transport',
    createOffers: (id: string) => `/trade-operations/${id}/offers`,
    matchingSellers: (id: string) => `/trade-operations/${id}/matching-sellers`,
    addSellers: (id: string) => `/trade-operations/${id}/sellers`,
    analytics: '/trade-operations/analytics',
  },

  // Products
  products: {
    base: '/products',
    byId: (id: string) => `/products/${id}`,
    categories: '/products/categories',
    specifications: '/products/specifications',
  },

  // Regions & Cities
  regions: {
    base: '/regions',
    cities: '/regions/cities',
  },

  // Transport
  transport: {
    estimate: '/transport/estimate',
    requests: '/transport/requests',
    byTradeOperation: (id: string) => `/transport/trade-operations/${id}/transport`,
    requestById: (id: string) => `/transport/requests/${id}`,
    approveBid: (id: string) => `/transport/bids/${id}/accept`,
    rejectBid: (id: string) => `/transport/bids/${id}/reject`,
    bids: '/transport/bids',
  },

  // Inspections
  inspections: {
    base: '/inspections',
    byId: (id: string) => `/inspections/${id}`,
    request: '/inspections/request',
    batch: '/inspections/batch',
  },

  // Negotiations
  negotiations: {
    byTradeOperation: (tradeOperationId: string) =>
      `/negotiations/trade-operation/${tradeOperationId}`,
  },
};

/**
 * Helper to build full URL
 */
export const buildUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

/**
 * Common headers for API requests
 */
export const getHeaders = (includeAuth: boolean = true): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};
