// API Configuration
import { ENV } from '../shared/utils/environment';

// Determine if we're in development or production
const isDev = __DEV__ || process.env.NODE_ENV === 'development';

// Use dynamic environment-based API URL
export const API_URL = ENV.apiUrl;

// WebSocket URL for real-time features
export const WS_URL = API_URL.replace('http', 'ws').replace('/api', '');

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    GOOGLE: '/auth/google',
  },
  
  // Onboarding
  ONBOARDING: {
    SUBMIT: '/onboarding/submit',
    STATUS: '/onboarding/status',
    UPDATE: '/onboarding/update',
  },
  
  // Products
  PRODUCTS: {
    LIST: '/products',
    CATALOG: '/products/catalog',
    CREATE: '/products/create',
    UPDATE: (id: string) => `/products/${id}`,
    DELETE: (id: string) => `/products/${id}`,
    BY_ID: (id: string) => `/products/${id}`,
  },
  
  // Bases
  BASES: {
    MY_BASES: '/bases/my-bases',
    CREATE: '/bases',
    UPDATE: (id: string) => `/bases/${id}`,
    DELETE: (id: string) => `/bases/${id}`,
    SET_PRIMARY: (id: string) => `/bases/${id}/set-primary`,
  },
  
  // Location
  LOCATION: {
    GEOCODE: '/location/geocode',
    REVERSE_GEOCODE: '/location/reverse-geocode',
    SEARCH_CITIES: '/location/cities/search',
    PRICING: '/location/pricing',
    SAVE: '/location/save',
    COUNTRIES: '/location/countries',
  },
  
  // Admin
  ADMIN: {
    PRICING_ZONES: '/admin/pricing-zones',
    CITIES: '/admin/cities',
    PRODUCT_PRICES: '/admin/product-prices',
    MARKET_CONDITIONS: '/admin/market-conditions',
    ANALYTICS: '/admin/analytics',
    MAP_DATA: '/admin/analytics/map-data',
    EXPORT: '/admin/export/pricing-data',
    IMPORT_CITIES: '/admin/import/cities',
  },
};

// Request timeout in milliseconds
export const REQUEST_TIMEOUT = 30000;

// Retry configuration
export const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  retryOn: [408, 429, 500, 502, 503, 504],
};

// File upload configuration
export const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  allowedDocumentTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

export default {
  API_URL,
  WS_URL,
  API_ENDPOINTS,
  REQUEST_TIMEOUT,
  RETRY_CONFIG,
  UPLOAD_CONFIG,
};