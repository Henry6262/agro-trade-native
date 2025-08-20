import { apiClient } from './api';
import {
  User,
  LoginForm,
  RegisterForm,
  ApiResponse,
} from '../types';

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface RegisterResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export const authService = {
  // User authentication
  login: async (credentials: LoginForm): Promise<LoginResponse> => {
    return apiClient.post<ApiResponse<LoginResponse>>('/auth/login', credentials)
      .then((response) => response.data);
  },

  register: async (userData: RegisterForm): Promise<RegisterResponse> => {
    return apiClient.post<ApiResponse<RegisterResponse>>('/auth/register', userData)
      .then((response) => response.data);
  },

  logout: async (): Promise<void> => {
    return apiClient.post('/auth/logout');
  },

  refreshToken: async (refreshToken: string): Promise<{ token: string }> => {
    return apiClient.post<ApiResponse<{ token: string }>>('/auth/refresh', {
      refreshToken,
    }).then((response) => response.data);
  },

  forgotPassword: async (email: string): Promise<void> => {
    return apiClient.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    return apiClient.post('/auth/reset-password', {
      token,
      password: newPassword,
    });
  },

  // User profile
  getProfile: async (): Promise<User> => {
    return apiClient.get<ApiResponse<User>>('/auth/profile')
      .then((response) => response.data);
  },

  updateProfile: async (userData: Partial<User>): Promise<User> => {
    return apiClient.put<ApiResponse<User>>('/auth/profile', userData)
      .then((response) => response.data);
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    return apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },

  // Account verification
  verifyEmail: async (token: string): Promise<void> => {
    return apiClient.post('/auth/verify-email', { token });
  },

  resendVerificationEmail: async (): Promise<void> => {
    return apiClient.post('/auth/resend-verification');
  },

  // Social authentication
  googleAuth: async (token: string): Promise<LoginResponse> => {
    return apiClient.post<ApiResponse<LoginResponse>>('/auth/google', { token })
      .then((response) => response.data);
  },
};