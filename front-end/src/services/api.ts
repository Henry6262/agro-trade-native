import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '@stores/auth.store';
import { getApiUrl } from '@shared/utils/environment';

// Get the correct API URL based on platform
const API_URL = getApiUrl();

// Debug logging (disabled to prevent top-level execution)
// console.log('=== API Configuration ===');
// console.log('Platform:', Platform.OS);
// console.log('API URL:', API_URL);

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Debug log the actual request URL (disabled for performance)
    // console.log('API Request:', config.method?.toUpperCase(), config.baseURL + config.url);

    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors globally and token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    // Network error (no response) — device is offline or server unreachable
    if (!error.response) {
      const networkError = new Error(
        error.code === 'ECONNABORTED'
          ? 'Request timed out. Check your connection.'
          : 'No internet connection.'
      );
      (networkError as any).isNetworkError = true;
      return Promise.reject(networkError);
    }

    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token
        await useAuthStore.getState().refreshTokens();

        // Get the new token and retry the original request
        const newToken = useAuthStore.getState().token;
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        console.error('Token refresh failed:', refreshError);
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    // Log unexpected errors — 404 is expected ("no records yet") and handled per-service
    if (error.response?.status !== 404) {
      console.error('API Error:', error.response?.data || error.message);
    }

    return Promise.reject(error);
  }
);

// Generic API methods with proper typing
export const apiClient = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<{ data: T }> =>
    api.get(url, config).then((response) => ({ data: response.data })),

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<{ data: T }> =>
    api.post(url, data, config).then((response) => ({ data: response.data })),

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<{ data: T }> =>
    api.put(url, data, config).then((response) => ({ data: response.data })),

  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<{ data: T }> =>
    api.delete(url, config).then((response) => ({ data: response.data })),

  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<{ data: T }> =>
    api.patch(url, data, config).then((response) => ({ data: response.data })),
};

export default api;
