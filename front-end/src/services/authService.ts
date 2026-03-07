import { apiClient } from './api';
import { User, LoginForm, RegisterForm, UserRole } from '../shared/types';

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

export interface PhoneVerifyResponse {
  access_token: string;
  refresh_token: string;
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
  registrationNumber?: string;
  businessLicense?: string;
  companyAddress?: string;
  website?: string;
  email?: string;
  phoneNumber?: string;
  establishedYear?: number;
}

export interface BaseInfo {
  id: string;
  name: string;
  location: string;
  type: string;
  capacity: string;
  addressType?: string;
  isDefault?: boolean;
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
    return apiClient
      .post<LoginResponse>('/auth/login', credentials)
      .then((response) => response.data);
  },

  register: async (userData: RegisterForm): Promise<RegisterResponse> => {
    return apiClient
      .post<RegisterResponse>('/auth/register', userData)
      .then((response) => response.data);
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  refreshToken: async (refreshToken: string): Promise<{ token: string }> => {
    return apiClient
      .post<{ token: string }>('/auth/refresh', {
        refreshToken,
      })
      .then((response) => response.data);
  },

  forgotPassword: async (email: string): Promise<void> => {
    await apiClient.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/reset-password', {
      token,
      password: newPassword,
    });
  },

  // User profile
  getProfile: async (): Promise<User> => {
    return apiClient.get<User>('/auth/me').then((response) => response.data);
  },

  updateProfile: async (userData: Partial<User>): Promise<User> => {
    // Transform frontend User fields to backend fields
    const backendData: Record<string, string | undefined> = {
      name: userData.name,
      email: userData.email,
      phoneNumber: userData.phone, // Frontend uses 'phone', backend uses 'phoneNumber'
    };

    return apiClient
      .patch<{
        success: boolean;
        message: string;
        user: User & { phoneNumber?: string };
      }>('/auth/me', backendData)
      .then((response) => {
        // Transform backend response to frontend User format
        const backendUser = response.data.user;
        return {
          ...backendUser,
          phone: backendUser.phoneNumber, // Map backend 'phoneNumber' to frontend 'phone'
        } as User;
      });
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },

  // Account verification
  verifyEmail: async (token: string): Promise<void> => {
    await apiClient.post('/auth/verify-email', { token });
  },

  resendVerificationEmail: async (): Promise<void> => {
    await apiClient.post('/auth/resend-verification');
  },

  // Social authentication
  googleAuth: async (token: string): Promise<GoogleAuthResponse> => {
    return apiClient
      .post<GoogleAuthResponse>('/auth/google', { token })
      .then((response) => response.data);
  },

  // Native Google Sign-In (DEPRECATED - use privyLogin instead)
  googleSignIn: async (data: {
    idToken: string;
    role: string;
    email?: string | null;
    name?: string | null;
    googleId?: string;
    photo?: string | null;
  }): Promise<LoginResponse> => {
    return apiClient
      .post<LoginResponse>('/auth/google/native', data)
      .then((response) => response.data);
  },

  // Privy Authentication
  privyLogin: async (data: {
    privyToken: string;
    role: string;
    email?: string | null;
    name?: string | null;
  }): Promise<GoogleAuthResponse> => {
    return apiClient
      .post<GoogleAuthResponse>('/auth/privy/login', data)
      .then((response) => response.data);
  },

  // Phone OTP authentication
  phoneOtpSend: async (phone: string): Promise<{ expiresIn: number }> => {
    return apiClient.post<{ expiresIn: number }>('/auth/phone/send', { phone }).then((r) => r.data);
  },

  phoneOtpVerify: async (phone: string, code: string): Promise<PhoneVerifyResponse> => {
    return apiClient
      .post<PhoneVerifyResponse>('/auth/phone/verify', { phone, code })
      .then((r) => r.data);
  },

  // Onboarding registration
  registerWithCompany: async (data: RegisterWithCompanyDto): Promise<RegisterResponse> => {
    return apiClient
      .post<RegisterResponse>('/auth/register-with-company', data)
      .then((response) => response.data);
  },

  // Refresh token
  refreshAccessToken: async (
    refreshToken: string
  ): Promise<{ accessToken: string; refreshToken: string }> => {
    return apiClient
      .post<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
        refreshToken,
      })
      .then((response) => response.data);
  },

  // Company profile
  getCompany: async (): Promise<{ success: boolean; company: CompanyInfo | null }> => {
    return apiClient
      .get<{ success: boolean; company: CompanyInfo | null }>('/auth/me/company')
      .then((response) => response.data);
  },

  updateCompany: async (
    data: Partial<CompanyInfo>
  ): Promise<{ success: boolean; company: CompanyInfo }> => {
    // Map frontend field names to backend field names
    const backendData: Record<string, unknown> = {};
    if (data.companyName !== undefined) backendData.legalName = data.companyName;
    if (data.vatNumber !== undefined) backendData.vatNumber = data.vatNumber;
    if (data.companyAddress !== undefined) backendData.registrationNumber = undefined; // address is not a direct field
    if (data.website !== undefined) backendData.website = data.website;

    return apiClient
      .patch<{
        success: boolean;
        company: {
          legalName: string;
          vatNumber?: string;
          registrationNumber?: string;
          website?: string;
          email?: string;
          phoneNumber?: string;
        };
      }>('/auth/me/company', backendData)
      .then((response) => {
        const c = response.data.company;
        return {
          success: true,
          company: {
            companyName: c.legalName,
            vatNumber: c.vatNumber,
            registrationNumber: c.registrationNumber,
            website: c.website,
            email: c.email,
            phoneNumber: c.phoneNumber,
          } as CompanyInfo,
        };
      });
  },

  // Bases (addresses)
  getBases: async (): Promise<{ success: boolean; bases: BaseInfo[] }> => {
    type RawBase = {
      id: string;
      label: string;
      street?: string;
      country?: string;
      addressType?: string;
      isDefault?: boolean;
    };
    return apiClient
      .get<{ success: boolean; bases: RawBase[] }>('/auth/me/bases')
      .then((response) => ({
        success: true,
        bases: (response.data.bases || []).map((b) => ({
          id: b.id,
          name: b.label,
          location: [b.street, b.country].filter(Boolean).join(', ') || '',
          type: (b.addressType || 'warehouse').toLowerCase(),
          capacity: '',
          addressType: b.addressType,
          isDefault: b.isDefault,
        })),
      }));
  },

  createBase: async (data: {
    label: string;
    addressType: string;
    street?: string;
    country?: string;
    isDefault?: boolean;
  }): Promise<{ success: boolean; base: BaseInfo }> => {
    return apiClient
      .post<{ success: boolean; base: BaseInfo }>('/auth/me/bases', data)
      .then((response) => response.data);
  },

  deleteBase: async (baseId: string): Promise<{ success: boolean }> => {
    return apiClient
      .delete<{ success: boolean }>(`/auth/me/bases/${baseId}`)
      .then((response) => response.data);
  },
};
