import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, RegisterWithCompanyDto, CompanyInfo } from '@services/authService';
import { useAuthStore } from '@stores/auth.store';
import type {
  ProductSelection,
  ProductRequirement,
  FleetInformation,
  ServiceArea,
  JobPreferences,
  MarketInsights,
  TransportOpportunities,
} from '../shared/types';
import type { OnboardingRole } from '../shared/types/onboarding';
import { buildOnboardingPayload } from './onboarding-store/payload';
import {
  createDefaultTransportData,
  getInitialState,
  getRoleStepCount,
} from './onboarding-store/initial-state';
import type { OnboardingStore } from './onboarding-store/types';
import {
  getCurrentOnboardingStepData,
  getOnboardingProgress,
  isOnboardingStepValid,
} from './onboarding-store/validation';

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    immer((set, get) => ({
      ...getInitialState(),

      setRole: (role: OnboardingRole) =>
        set((state) => {
          state.selectedRole = role;
          state.totalSteps = getRoleStepCount(role);

          switch (role) {
            case 'seller':
              state.sellerData = { selectedProducts: [] };
              break;
            case 'buyer':
              state.buyerData = { requiredProducts: [] };
              break;
            case 'transport':
              state.transportData = createDefaultTransportData();
              break;
          }
        }),

      nextStep: () =>
        set((state) => {
          if (state.currentStep < state.totalSteps - 1) {
            state.currentStep += 1;
          }
        }),

      previousStep: () =>
        set((state) => {
          if (state.currentStep > 0) {
            state.currentStep -= 1;
          }
        }),

      setStep: (step: number) =>
        set((state) => {
          if (step >= 0 && step < state.totalSteps) {
            state.currentStep = step;
          }
        }),

      // Seller actions
      setSellerProducts: (products: ProductSelection[]) =>
        set((state) => {
          if (state.sellerData) {
            state.sellerData.selectedProducts = products;
          }
        }),

      addSellerProduct: (product: ProductSelection) =>
        set((state) => {
          if (state.sellerData) {
            const existingIndex = state.sellerData.selectedProducts.findIndex(
              (p) => p.productId === product.productId
            );
            if (existingIndex === -1) {
              state.sellerData.selectedProducts.push(product);
            }
          }
        }),

      removeSellerProduct: (productId: string) =>
        set((state) => {
          if (state.sellerData) {
            state.sellerData.selectedProducts = state.sellerData.selectedProducts.filter(
              (p) => p.productId !== productId
            );
          }
        }),

      updateSellerProduct: (productId: string, updates: Partial<ProductSelection>) =>
        set((state) => {
          if (state.sellerData) {
            const productIndex = state.sellerData.selectedProducts.findIndex(
              (p) => p.productId === productId
            );
            if (productIndex !== -1) {
              const existingProduct = state.sellerData.selectedProducts[productIndex];
              if (existingProduct) {
                Object.assign(existingProduct, updates);
              }
            }
          }
        }),

      setMarketInsights: (insights: MarketInsights) =>
        set((state) => {
          if (state.sellerData) {
            state.sellerData.marketInsights = insights;
          }
        }),

      // Common product selection
      setSelectedProducts: (products: string[]) =>
        set((state) => {
          state.selectedProducts = products;
        }),

      setSelectedProductsMetadata: (metadata: any[]) =>
        set((state) => {
          state.selectedProductsMetadata = metadata;
        }),

      // Seller specifications
      updateSellerSpecification: (productId: string, specs: any) =>
        set((state) => {
          state.sellerSpecifications[productId] = {
            ...state.sellerSpecifications[productId],
            ...specs,
          };
        }),

      setSellerBases: (bases: any[]) =>
        set((state) => {
          if (state.sellerData) {
            state.sellerData.bases = bases;
          }
        }),

      setSellerDistributions: (distributions: any[]) =>
        set((state) => {
          if (state.sellerData) {
            state.sellerData.distributions = distributions;
          }
        }),

      // Buyer specifications
      updateBuyerSpecification: (productId: string, specs: any) =>
        set((state) => {
          state.buyerSpecifications[productId] = {
            ...state.buyerSpecifications[productId],
            ...specs,
          };
        }),

      setBuyerBases: (bases: any[]) =>
        set((state) => {
          if (state.buyerData) {
            state.buyerData.bases = bases;
          }
        }),

      setBuyerDistributions: (distributions: any[]) =>
        set((state) => {
          if (state.buyerData) {
            state.buyerData.distributions = distributions;
          }
        }),

      // Buyer actions
      setBuyerRequirements: (requirements: ProductRequirement[]) =>
        set((state) => {
          if (state.buyerData) {
            state.buyerData.requiredProducts = requirements;
          }
        }),

      addBuyerRequirement: (requirement: ProductRequirement) =>
        set((state) => {
          if (state.buyerData) {
            const existingIndex = state.buyerData.requiredProducts.findIndex(
              (r) => r.productId === requirement.productId
            );
            if (existingIndex === -1) {
              state.buyerData.requiredProducts.push(requirement);
            }
          }
        }),

      removeBuyerRequirement: (productId: string) =>
        set((state) => {
          if (state.buyerData) {
            state.buyerData.requiredProducts = state.buyerData.requiredProducts.filter(
              (r) => r.productId !== productId
            );
          }
        }),

      updateBuyerRequirement: (productId: string, updates: Partial<ProductRequirement>) =>
        set((state) => {
          if (state.buyerData) {
            const requirementIndex = state.buyerData.requiredProducts.findIndex(
              (r) => r.productId === productId
            );
            if (requirementIndex !== -1) {
              const existingRequirement = state.buyerData.requiredProducts[requirementIndex];
              if (existingRequirement) {
                Object.assign(existingRequirement, updates);
              }
            }
          }
        }),

      // Transport actions
      setFleetInfo: (fleetInfo: FleetInformation) =>
        set((state) => {
          if (state.transportData) {
            state.transportData.fleetInfo = fleetInfo;
          }
        }),

      setServiceArea: (serviceArea: ServiceArea) =>
        set((state) => {
          if (state.transportData) {
            state.transportData.serviceArea = serviceArea;
          }
        }),

      setJobPreferences: (preferences: JobPreferences) =>
        set((state) => {
          if (state.transportData) {
            state.transportData.jobPreferences = preferences;
          }
        }),

      setTransportOpportunities: (opportunities: TransportOpportunities) =>
        set((state) => {
          if (state.transportData) {
            state.transportData.opportunities = opportunities;
          }
        }),

      // Location
      setLocation: (location) =>
        set((state) => {
          state.location = location;
        }),

      // Error handling actions
      setError: (error: string | null) =>
        set((state) => {
          state.error = error;
          state.isLoading = false;
          state.isSubmitting = false;
        }),

      clearError: () =>
        set((state) => {
          state.error = null;
        }),

      setLoading: (isLoading: boolean) =>
        set((state) => {
          state.isLoading = isLoading;
          if (isLoading) state.error = null;
        }),

      setSubmitting: (isSubmitting: boolean) =>
        set((state) => {
          state.isSubmitting = isSubmitting;
          if (isSubmitting) state.error = null;
        }),

      // API integration methods
      saveOnboardingData: async () => {
        try {
          set((draft) => {
            draft.isLoading = true;
            draft.error = null;
          });

          // Save data to AsyncStorage (handled by persist middleware)
          // This is a placeholder for any additional local storage logic

          set((draft) => {
            draft.isLoading = false;
          });
        } catch (error) {
          console.error('Failed to save onboarding data:', error);
          set((draft) => {
            draft.error = 'Failed to save onboarding data';
            draft.isLoading = false;
          });
          throw error;
        }
      },

      loadOnboardingData: async () => {
        try {
          set((draft) => {
            draft.isLoading = true;
            draft.error = null;
          });

          // Data is automatically loaded by persist middleware
          // This is a placeholder for any additional loading logic

          set((draft) => {
            draft.isLoading = false;
          });
        } catch (error) {
          console.error('Failed to load onboarding data:', error);
          set((draft) => {
            draft.error = 'Failed to load onboarding data';
            draft.isLoading = false;
          });
          throw error;
        }
      },

      setGoogleAuthData: (data) => {
        set((draft) => {
          draft.googleAuthData = data;
        });
      },

      getOnboardingPayload: () => buildOnboardingPayload(get()),

      submitOnboarding: async (
        companyInfo?: CompanyInfo,
        userInfo?: { name: string; email: string; phone?: string }
      ) => {
        const state = get();
        try {
          set((draft) => {
            draft.isSubmitting = true;
            draft.error = null;
          });

          const payload = state.getOnboardingPayload();
          if (!payload) {
            throw new Error('Invalid onboarding data');
          }

          // Update payload with user info and company info
          const finalPayload: RegisterWithCompanyDto & {
            onboardingData?: Record<string, unknown>;
          } = {
            ...payload,
            email: userInfo?.email || '',
            name: userInfo?.name || '',
            ...(userInfo?.phone ? { phone: userInfo.phone } : {}),
            ...(companyInfo || payload.companyInfo
              ? { companyInfo: companyInfo || payload.companyInfo }
              : {}),
          };

          const onboardingData = payload.onboardingData;
          if (onboardingData) {
            finalPayload.onboardingData = onboardingData;
          }

          const response = await authService.registerWithCompany(finalPayload);

          // Update auth store with the response
          useAuthStore.getState().login(response.user, response.token, response.refreshToken);

          set((draft) => {
            draft.isComplete = true;
            draft.isSubmitting = false;
            draft.currentStep = draft.totalSteps - 1;
          });

          // Clear persisted onboarding data after successful submission
          await AsyncStorage.removeItem('onboarding-storage');
        } catch (error: any) {
          console.error('Failed to submit onboarding data:', error);
          const errorMessage =
            error?.response?.data?.message || error?.message || 'Failed to complete onboarding';
          set((draft) => {
            draft.error = errorMessage;
            draft.isSubmitting = false;
          });
          throw error;
        }
      },

      authenticateWithGoogle: async (googleToken: string): Promise<void> => {
        try {
          set((draft) => {
            draft.isLoading = true;
            draft.error = null;
          });

          const response = await authService.googleAuth(googleToken);

          // Create a User object with required fields
          const user = {
            ...response.user,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // Update auth store
          useAuthStore.getState().login(user, response.accessToken, response.refreshToken);

          set((draft) => {
            draft.isLoading = false;
          });
        } catch (error: any) {
          console.error('Google authentication failed:', error);
          const errorMessage =
            error?.response?.data?.message || error?.message || 'Google authentication failed';
          set((draft) => {
            draft.error = errorMessage;
            draft.isLoading = false;
          });
          throw error;
        }
      },

      // General actions
      completeOnboarding: () =>
        set((state) => {
          state.isComplete = true;
          state.currentStep = state.totalSteps - 1;
        }),

      resetOnboarding: () =>
        set((state) => {
          Object.assign(state, getInitialState());
        }),

      // Computed properties
      getProgress: () => getOnboardingProgress(get()),
      getCurrentStepData: () => getCurrentOnboardingStepData(get()),
      isStepValid: (step?: number) => isOnboardingStepValid(get(), step),
    })),
    {
      name: 'onboarding-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        selectedRole: state.selectedRole,
        sellerData: state.sellerData,
        buyerData: state.buyerData,
        transportData: state.transportData,
        isComplete: state.isComplete,
        currentStep: state.currentStep,
        selectedProducts: state.selectedProducts,
        selectedProductsMetadata: state.selectedProductsMetadata,
        totalSteps: state.totalSteps,
        sellerSpecifications: state.sellerSpecifications,
        buyerSpecifications: state.buyerSpecifications,
        googleAuthData: state.googleAuthData,
        // Don't persist loading and error states
      }),
    }
  )
);
