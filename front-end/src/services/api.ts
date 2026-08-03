import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '@stores/auth.store';
import { getApiUrl } from '@shared/utils/environment';

const API_URL = getApiUrl();

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Shared refresh promise — prevents parallel refresh storms on 401
let refreshPromise: Promise<void> | null = null;

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    // Network/timeout errors
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

      const { refreshToken, token } = useAuthStore.getState();

      // Skip refresh for dev/guest sessions — no real refresh token
      if (!refreshToken || token === 'guest') {
        return Promise.reject(error);
      }

      // Deduplicate: if a refresh is already in-flight, wait for it
      if (!refreshPromise) {
        refreshPromise = useAuthStore
          .getState()
          .refreshTokens()
          .finally(() => {
            refreshPromise = null;
          });
      }

      try {
        await refreshPromise;
        const newToken = useAuthStore.getState().token;
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }
    }

    if (error.response?.status !== 404) {
      console.error('API Error:', error.response?.data || error.message);
    }

    return Promise.reject(error);
  }
);

export const apiClient = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<{ data: T }> =>
    api.get(url, config).then((r) => ({ data: r.data })),

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<{ data: T }> =>
    api.post(url, data, config).then((r) => ({ data: r.data })),

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<{ data: T }> =>
    api.put(url, data, config).then((r) => ({ data: r.data })),

  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<{ data: T }> =>
    api.delete(url, config).then((r) => ({ data: r.data })),

  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<{ data: T }> =>
    api.patch(url, data, config).then((r) => ({ data: r.data })),
};

export default api;
