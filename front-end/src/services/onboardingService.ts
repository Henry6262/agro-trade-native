import { apiClient } from './api';
import { useOnboardingStore } from '../store/onboardingStore';
import { useAuthStore } from '../store/authStore';
import { authService } from './authService';
import type {
  ApiResponse,
  SellerOnboardingData,
  BuyerOnboardingData,
  TransportOnboardingData,
  UserRole,
} from '../types';

export interface OnboardingSubmissionData {
  role: UserRole;
  sellerData?: SellerOnboardingData;
  buyerData?: BuyerOnboardingData;
  transportData?: TransportOnboardingData;
  userInfo: {
    name: string;
    email: string;
    phone?: string;
  };
  companyInfo?: {
    companyName: string;
    vatNumber?: string;
    businessLicense?: string;
    companyAddress?: string;
    website?: string;
    establishedYear?: number;
  };
}

export interface OnboardingResponse {
  success: boolean;
  message: string;
  data: {
    user: any;
    profile: any;
    companyInfo?: any;
  };
}

export const onboardingService = {
  /**
   * Submit complete onboarding data to backend
   */
  submitOnboardingData: async (data: OnboardingSubmissionData): Promise<OnboardingResponse> => {
    return apiClient.post<ApiResponse<OnboardingResponse>>('/onboarding/submit', data)
      .then((response) => response.data);
  },

  /**
   * Get onboarding progress for current user
   */
  getOnboardingProgress: async (): Promise<{
    isComplete: boolean;
    completedSteps: string[];
    currentStep: string;
  }> => {
    return apiClient.get<ApiResponse<{
      isComplete: boolean;
      completedSteps: string[];
      currentStep: string;
    }>>('/onboarding/progress')
      .then((response) => response.data);
  },

  /**
   * Save draft onboarding data (for persistence across sessions)
   */
  saveDraftData: async (data: Partial<OnboardingSubmissionData>): Promise<void> => {
    return apiClient.post('/onboarding/draft', data);
  },

  /**
   * Get saved draft data
   */
  getDraftData: async (): Promise<Partial<OnboardingSubmissionData> | null> => {
    try {
      return apiClient.get<ApiResponse<Partial<OnboardingSubmissionData>>>('/onboarding/draft')
        .then((response) => response.data);
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return null; // No draft data found
      }
      throw error;
    }
  },

  /**
   * Complete onboarding flow with optimistic updates
   */
  completeOnboarding: async (): Promise<void> => {
    const onboardingStore = useOnboardingStore.getState();
    const authStore = useAuthStore.getState();

    if (!onboardingStore.selectedRole) {
      throw new Error('No role selected');
    }

    // Prepare submission data
    const submissionData: OnboardingSubmissionData = {
      role: onboardingStore.selectedRole,
      sellerData: onboardingStore.sellerData,
      buyerData: onboardingStore.buyerData,
      transportData: onboardingStore.transportData,
      userInfo: {
        name: authStore.user?.name || '',
        email: authStore.user?.email || '',
        phone: authStore.user?.phone,
      },
    };

    // Optimistic update - mark as complete locally
    onboardingStore.completeOnboarding();

    try {
      // Submit to backend
      const response = await onboardingService.submitOnboardingData(submissionData);
      
      if (!response.success) {
        throw new Error(response.message || 'Onboarding submission failed');
      }

      // Clear draft data on successful submission
      try {
        await apiClient.delete('/onboarding/draft');
      } catch (draftError) {
        // Ignore draft deletion errors
        console.warn('Failed to clear draft data:', draftError);
      }

      // Return void as expected by the interface
      return;
    } catch (error) {
      // Revert optimistic update on failure
      onboardingStore.setError('Failed to complete onboarding');
      throw error;
    }
  },

  /**
   * Sync local onboarding state with backend
   */
  syncOnboardingState: async (): Promise<void> => {
    try {
      const progress = await onboardingService.getOnboardingProgress();
      const draftData = await onboardingService.getDraftData();
      
      const onboardingStore = useOnboardingStore.getState();
      
      // Update store with backend data
      if (draftData) {
        if (draftData.role && draftData.role !== onboardingStore.selectedRole) {
          onboardingStore.setRole(draftData.role);
        }
        
        if (draftData.sellerData) {
          // Update seller data
          // This would require specific methods to update seller data
        }
        
        if (draftData.buyerData) {
          // Update buyer data
          // This would require specific methods to update buyer data
        }
        
        if (draftData.transportData) {
          // Update transport data
          // This would require specific methods to update transport data
        }
      }

      if (progress.isComplete && !onboardingStore.isComplete) {
        onboardingStore.completeOnboarding();
      }
    } catch (error) {
      console.error('Failed to sync onboarding state:', error);
      // Don't throw - this is a background sync operation
    }
  },

  /**
   * Handle Google OAuth integration with onboarding
   */
  handleGoogleOAuth: async (googleToken: string): Promise<void> => {
    const onboardingStore = useOnboardingStore.getState();
    
    try {
      // Authenticate with Google
      const authResponse = await authService.googleAuth(googleToken);
      
      // Create a User object with required fields
      const user = {
        ...authResponse.user,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Update auth store
      useAuthStore.getState().login(
        user, 
        authResponse.accessToken, 
        authResponse.refreshToken
      );
      
      // If user already has a profile, they might not need onboarding
      if (authResponse.user.hasProfile) {
        onboardingStore.completeOnboarding();
        return;
      }
      
      // Otherwise, continue with onboarding flow
      await onboardingService.syncOnboardingState();
      
    } catch (error) {
      console.error('Google OAuth integration failed:', error);
      throw error;
    }
  },

  /**
   * Validate onboarding data before submission
   */
  validateOnboardingData: (data: OnboardingSubmissionData): string[] => {
    const errors: string[] = [];

    if (!data.role) {
      errors.push('User role is required');
    }

    if (!data.userInfo.name) {
      errors.push('User name is required');
    }

    if (!data.userInfo.email) {
      errors.push('User email is required');
    }

    // Role-specific validation
    switch (data.role) {
      case 'seller':
        if (!data.sellerData?.selectedProducts?.length) {
          errors.push('At least one product must be selected for sellers');
        }
        break;
        
      case 'buyer':
        if (!data.buyerData?.requiredProducts?.length) {
          errors.push('At least one product requirement must be specified for buyers');
        }
        break;
        
      case 'transport':
        if (!data.transportData?.fleetInfo?.vehicleCount) {
          errors.push('Fleet information is required for transporters');
        }
        break;
    }

    return errors;
  },

  /**
   * Get role-specific onboarding requirements
   */
  getOnboardingRequirements: (role: UserRole): {
    requiredSteps: string[];
    optionalSteps: string[];
    estimatedTime: number; // in minutes
  } => {
    switch (role) {
      case 'seller':
        return {
          requiredSteps: [
            'Product Selection',
            'Product Specifications',
            'Market Insights',
            'Business Information',
            'Account Setup'
          ],
          optionalSteps: ['Marketing Preferences'],
          estimatedTime: 8
        };
        
      case 'buyer':
        return {
          requiredSteps: [
            'Product Requirements',
            'Purchasing Specifications',
            'Market Overview',
            'Business Information',
            'Account Setup'
          ],
          optionalSteps: ['Supplier Preferences'],
          estimatedTime: 7
        };
        
      case 'transport':
        return {
          requiredSteps: [
            'Fleet Information',
            'Service Areas',
            'Job Preferences',
            'Business Information',
            'Account Setup'
          ],
          optionalSteps: ['Route Optimization'],
          estimatedTime: 10
        };
        
      default:
        return {
          requiredSteps: ['Account Setup'],
          optionalSteps: [],
          estimatedTime: 3
        };
    }
  }
};