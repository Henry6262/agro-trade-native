import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, RegisterWithCompanyDto, CompanyInfo } from '@services/authService';
import { useAuthStore } from '@stores/auth.store';
import type { OnboardingRole } from '../shared/types/onboarding';
import type {
  ProductSelection,
  ProductRequirement,
  FleetInformation,
  ServiceArea,
  JobPreferences,
  MarketInsights,
  TransportOpportunities,
  BuyerOnboardingData,
  SellerOnboardingData,
  TransportOnboardingData,
} from '../shared/types';

export interface OnboardingLocation {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  region?: string;
  country?: string;
}

export interface GoogleAuthData {
  name: string;
  email: string;
  isAuthenticated: boolean;
}

export type RegisterWithOnboardingPayload = RegisterWithCompanyDto & {
  onboardingData?: Record<string, unknown>;
};

export interface OnboardingUserInfo {
  name: string;
  email: string;
  phone?: string;
}

export interface OnboardingStore {
  currentStep: number;
  totalSteps: number;
  selectedRole: OnboardingRole | undefined;
  sellerData: SellerOnboardingData | undefined;
  buyerData: BuyerOnboardingData | undefined;
  transportData: TransportOnboardingData | undefined;
  isComplete: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  setRole: (role: OnboardingRole) => void;
  nextStep: () => void;
  previousStep: () => void;
  setStep: (step: number) => void;
  selectedProducts: string[];
  setSelectedProducts: (products: string[]) => void;
  selectedProductsMetadata: any[];
  setSelectedProductsMetadata: (metadata: any[]) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
  setSellerProducts: (products: ProductSelection[]) => void;
  addSellerProduct: (product: ProductSelection) => void;
  removeSellerProduct: (productId: string) => void;
  updateSellerProduct: (productId: string, updates: Partial<ProductSelection>) => void;
  setMarketInsights: (insights: MarketInsights) => void;
  sellerSpecifications: Record<string, any>;
  updateSellerSpecification: (productId: string, specs: any) => void;
  setSellerBases: (bases: any[]) => void;
  setSellerDistributions: (distributions: any[]) => void;
  setBuyerRequirements: (requirements: ProductRequirement[]) => void;
  addBuyerRequirement: (requirement: ProductRequirement) => void;
  removeBuyerRequirement: (productId: string) => void;
  updateBuyerRequirement: (productId: string, updates: Partial<ProductRequirement>) => void;
  buyerSpecifications: Record<string, any>;
  updateBuyerSpecification: (productId: string, specs: any) => void;
  setBuyerBases: (bases: any[]) => void;
  setBuyerDistributions: (distributions: any[]) => void;
  setFleetInfo: (fleetInfo: FleetInformation) => void;
  setServiceArea: (serviceArea: ServiceArea) => void;
  setJobPreferences: (preferences: JobPreferences) => void;
  setTransportOpportunities: (opportunities: TransportOpportunities) => void;
  setLocation: (location: OnboardingLocation) => void;
  location: OnboardingLocation | undefined;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  saveOnboardingData: () => Promise<void>;
  loadOnboardingData: () => Promise<void>;
  submitOnboarding: (companyInfo?: CompanyInfo, userInfo?: OnboardingUserInfo) => Promise<void>;
  authenticateWithGoogle: (googleToken: string) => Promise<void>;
  setGoogleAuthData: (data: GoogleAuthData) => void;
  googleAuthData: GoogleAuthData | undefined;
  getProgress: () => number;
  getCurrentStepData: () => any;
  isStepValid: (step?: number) => boolean;
  getOnboardingPayload: () => RegisterWithOnboardingPayload | null;
}

export type OnboardingStateSnapshot = Pick<
  OnboardingStore,
  | 'selectedRole'
  | 'sellerData'
  | 'buyerData'
  | 'transportData'
  | 'selectedProducts'
  | 'sellerSpecifications'
  | 'buyerSpecifications'
  | 'currentStep'
  | 'totalSteps'
>;



export const createDefaultTransportData = (): TransportOnboardingData => ({
  fleetInfo: {
    vehicleCount: 0,
    vehicleTypes: [],
    baseLocation: {
      id: '',
      address: '',
      city: '',
      state: '',
      country: '',
      zipCode: '',
    },
    capacity: { total: 0, unit: 'tons' },
  },
  serviceArea: {
    radius: 0,
    preferredRegions: [],
    coverage: 'local',
  },
  jobPreferences: {
    cargoTypes: [],
    maxDistance: 0,
    minDistance: 0,
    availability: {},
  },
});

export const getRoleStepCount = (role: OnboardingRole) => {
  switch (role) {
    case 'seller':
      return 4;
    case 'buyer':
      return 6;
    case 'transport':
      return 7;
    default:
      return 0;
  }
};

export const getInitialLocation = () => undefined as OnboardingLocation | undefined;

export const getInitialState = () => ({
  currentStep: 0,
  totalSteps: 0,
  selectedRole: undefined,
  sellerData: undefined,
  buyerData: undefined,
  transportData: undefined,
  isComplete: false,
  selectedProducts: [] as string[],
  selectedProductsMetadata: [] as any[],
  sellerSpecifications: {} as Record<string, any>,
  buyerSpecifications: {} as Record<string, any>,
  googleAuthData: undefined as
    | { name: string; email: string; isAuthenticated: boolean }
    | undefined,
  location: getInitialLocation(),
  isLoading: false,
  isSubmitting: false,
  error: null,
});



const roleMapping = {
  seller: 'FARMER',
  buyer: 'BUYER',
  transport: 'TRANSPORTER',
  admin: 'ADMIN',
} as const;

const createBasePayload = (selectedRole: NonNullable<OnboardingStateSnapshot['selectedRole']>) => ({
  role: roleMapping[selectedRole] as RegisterWithCompanyDto['role'],
  email: '',
  name: '',
});

const mapBaseLocation = (base: any, fallbackType: string) => ({
  name: base.name,
  type: base.type || fallbackType,
  address: base.address,
  city: base.city,
  region: base.region,
  country: base.country || 'Bulgaria',
  postalCode: base.postalCode,
  latitude: base.latitude,
  longitude: base.longitude,
  storageCapacity: base.capacity,
  isPrimary: base.isPrimary || false,
});

const mapDistributions = (distributions: any[] = []) =>
  distributions.map((distribution) => ({
    productId: distribution.productId,
    distributions:
      distribution.distributions?.map((item: any) => ({
        baseId: item.baseId || item.baseName,
        quantity: item.quantity,
        percentage: item.percentage,
      })) || [],
  }));

const buildSellerOnboardingData = (state: OnboardingStateSnapshot) => ({
  selectedProductIds: state.selectedProducts,
  productSpecifications: Object.keys(state.sellerSpecifications).map((productId) => ({
    productId,
    quantity: state.sellerSpecifications[productId].quantity || 0,
    unit: state.sellerSpecifications[productId].unit || 'TON',
    pricePerKilo: state.sellerSpecifications[productId].pricePerKilo,
    varieties: state.sellerSpecifications[productId].varieties || [],
    qualitySpecs: state.sellerSpecifications[productId].qualitySpecs || [],
  })),
  bases: (state.sellerData?.bases || []).map((base) => mapBaseLocation(base, 'WAREHOUSE')),
  distributions: mapDistributions(state.sellerData?.distributions),
});

const buildBuyerOnboardingData = (state: OnboardingStateSnapshot) => ({
  requiredProductIds: state.selectedProducts,
  productRequirements: Object.keys(state.buyerSpecifications).map((productId) => ({
    productId,
    quantity: state.buyerSpecifications[productId].quantity || 0,
    unit: state.buyerSpecifications[productId].unit || 'TON',
    maxPricePerKilo: state.buyerSpecifications[productId].maxPrice,
    deliveryFrequency: state.buyerSpecifications[productId].deliveryFrequency,
    qualityRequirements: state.buyerSpecifications[productId].qualityRequirements || [],
  })),
  bases: (state.buyerData?.bases || []).map((base) => mapBaseLocation(base, 'DEPOT')),
  distributions: mapDistributions(state.buyerData?.distributions),
});

const buildTransportOnboardingData = (state: OnboardingStateSnapshot) => ({
  fleetInfo: {
    vehicleCount: state.transportData?.fleetInfo?.vehicleCount || 0,
    vehicleTypes: state.transportData?.fleetInfo?.vehicleTypes || [],
    totalCapacity: state.transportData?.fleetInfo?.capacity?.total || 0,
    capacityUnit: state.transportData?.fleetInfo?.capacity?.unit || 'tons',
  },
  baseLocation: state.transportData?.fleetInfo?.baseLocation
    ? {
        address: state.transportData.fleetInfo.baseLocation.address,
        city: state.transportData.fleetInfo.baseLocation.city,
        state: state.transportData.fleetInfo.baseLocation.state,
        country: state.transportData.fleetInfo.baseLocation.country,
        zipCode: state.transportData.fleetInfo.baseLocation.zipCode,
      }
    : null,
  serviceArea: {
    radius: state.transportData?.serviceArea?.radius || 0,
    preferredRegions: state.transportData?.serviceArea?.preferredRegions || [],
    coverage: state.transportData?.serviceArea?.coverage || 'local',
  },
  jobPreferences: {
    cargoTypes: state.transportData?.jobPreferences?.cargoTypes || [],
    maxDistance: state.transportData?.jobPreferences?.maxDistance || 0,
    minDistance: state.transportData?.jobPreferences?.minDistance || 0,
  },
});

export const buildOnboardingPayload = (
  state: OnboardingStateSnapshot
): RegisterWithOnboardingPayload | null => {
  if (!state.selectedRole) {
    return null;
  }

  const basePayload = createBasePayload(state.selectedRole);
  let companyInfo: CompanyInfo | undefined;
  let onboardingData: Record<string, unknown> | undefined;

  switch (state.selectedRole) {
    case 'seller':
      if (state.sellerData) {
        companyInfo = { companyName: '' };
        onboardingData = buildSellerOnboardingData(state);
      }
      break;
    case 'buyer':
      if (state.buyerData) {
        companyInfo = { companyName: '' };
        onboardingData = buildBuyerOnboardingData(state);
      }
      break;
    case 'transport':
      if (state.transportData) {
        companyInfo = { companyName: '' };
        onboardingData = buildTransportOnboardingData(state);
      }
      break;
  }

  return {
    ...basePayload,
    ...(companyInfo ? { companyInfo } : {}),
    ...(onboardingData ? { onboardingData } : {}),
  };
};


export const getCurrentOnboardingStepData = (state: OnboardingStateSnapshot) => {
  switch (state.selectedRole) {
    case 'seller':
      return state.sellerData;
    case 'buyer':
      return state.buyerData;
    case 'transport':
      return state.transportData;
    default:
      return null;
  }
};

export const getOnboardingProgress = (state: OnboardingStateSnapshot) => {
  return state.totalSteps > 0 ? (state.currentStep + 1) / state.totalSteps : 0;
};

export const isOnboardingStepValid = (state: OnboardingStateSnapshot, step?: number) => {
  const targetStep = step ?? state.currentStep;

  switch (state.selectedRole) {
    case 'seller':
      if (targetStep === 1) {
        return (state.sellerData?.selectedProducts?.length ?? 0) > 0;
      }
      if (targetStep === 2) {
        return (
          state.sellerData?.selectedProducts?.every(
            (product) => product.varieties.length > 0 && product.quantity.amount > 0
          ) ?? false
        );
      }
      break;
    case 'buyer':
      if (targetStep === 1) {
        return (state.buyerData?.requiredProducts?.length ?? 0) > 0;
      }
      if (targetStep === 2) {
        return (
          state.buyerData?.requiredProducts?.every(
            (requirement) => requirement.quantity.amount > 0
          ) ?? false
        );
      }
      break;
    case 'transport':
      if (targetStep === 1) {
        return (state.transportData?.fleetInfo?.vehicleCount ?? 0) > 0;
      }
      if (targetStep === 2) {
        return (state.transportData?.serviceArea?.radius ?? 0) > 0;
      }
      break;
  }

  return true;
};

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
