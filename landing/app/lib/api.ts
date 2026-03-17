import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://agro-trade-native-production.up.railway.app/api";

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor — attach auth token from localStorage
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("agrotrade-auth");
        if (raw) {
          const parsed = JSON.parse(raw);
          const token = parsed?.state?.token;
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
      } catch {
        // localStorage unavailable (SSR) or corrupted — continue without token
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      // Clear auth state and redirect to login
      localStorage.removeItem("agrotrade-auth");
      window.location.href = "/auth/login";
    }

    if (error.response?.status !== 404) {
      console.error("API Error:", error.response?.data || error.message);
    }

    return Promise.reject(error);
  }
);

// Typed API client
export const apiClient = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig) =>
    api.get<T>(url, config).then((r) => r.data),

  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    api.post<T>(url, data, config).then((r) => r.data),

  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    api.put<T>(url, data, config).then((r) => r.data),

  patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    api.patch<T>(url, data, config).then((r) => r.data),

  delete: <T = unknown>(url: string, config?: AxiosRequestConfig) =>
    api.delete<T>(url, config).then((r) => r.data),
};

export default api;
