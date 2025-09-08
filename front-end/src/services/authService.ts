import { apiClient } from './api';
import {
  User,
  LoginForm,
  RegisterForm,
  ApiResponse,
  UserRole,
} from '../shared/types';

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

export interface GoogleAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    phone?: string;
    role: UserRole;
    hasProfile: boolean;
  };
}

export interface CompanyInfo {
  companyName: string;
  vatNumber?: string;
  businessLicense?: string;
  companyAddress?: string;
  website?: string;
  establishedYear?: number;
}

export interface RegisterWithCompanyDto {
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  companyInfo?: CompanyInfo;
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
  googleAuth: async (token: string): Promise<GoogleAuthResponse> => {
    return apiClient.post<ApiResponse<GoogleAuthResponse>>('/auth/google', { token })
      .then((response) => response.data);
  },

  // Onboarding registration
  registerWithCompany: async (data: RegisterWithCompanyDto): Promise<RegisterResponse> => {
    return apiClient.post<ApiResponse<RegisterResponse>>('/auth/register-with-company', data)
      .then((response) => response.data);
  },

  // Refresh token
  refreshAccessToken: async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
    return apiClient.post<ApiResponse<{ accessToken: string; refreshToken: string }>>('/auth/refresh', {
      refreshToken,
    }).then((response) => response.data);
  },
};