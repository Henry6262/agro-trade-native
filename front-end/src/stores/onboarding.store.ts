import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, RegisterWithCompanyDto, CompanyInfo } from '../services/authService';
import { useAuthStore } from '@stores/auth.store';
import type {
  OnboardingState,
  UserRole,
  TransportOnboardingData,
  ProductSelection,
  ProductRequirement,
  FleetInformation,
  ServiceArea,
  JobPreferences,
  MarketInsights,
  TransportOpportunities,
} from '../shared/types';

interface OnboardingStore extends OnboardingState {
  // Loading and error states
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  
  // Actions
  setRole: (role: UserRole) => void;
  nextStep: () => void;
  previousStep: () => void;
  setStep: (step: number) => void;
  
  // Common product selection
  selectedProducts: string[];
  setSelectedProducts: (products: string[]) => void;
  selectedProductsMetadata: any[];
  setSelectedProductsMetadata: (metadata: any[]) => void;
  
  // Additional store properties not in OnboardingState
  transportData?: TransportOnboardingData;
  
  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
  
  // Seller actions
  setSellerProducts: (products: ProductSelection[]) => void;
  addSellerProduct: (product: ProductSelection) => void;
  removeSellerProduct: (productId: string) => void;
  updateSellerProduct: (productId: string, updates: Partial<ProductSelection>) => void;
  setMarketInsights: (insights: MarketInsights) => void;
  sellerSpecifications: Record<string, any>;
  updateSellerSpecification: (productId: string, specs: any) => void;
  setSellerBases: (bases: any[]) => void;
  setSellerDistributions: (distributions: any[]) => void;
  
  // Buyer actions
  setBuyerRequirements: (requirements: ProductRequirement[]) => void;
  addBuyerRequirement: (requirement: ProductRequirement) => void;
  removeBuyerRequirement: (productId: string) => void;
  updateBuyerRequirement: (productId: string, updates: Partial<ProductRequirement>) => void;
  buyerSpecifications: Record<string, any>;
  updateBuyerSpecification: (productId: string, specs: any) => void;
  setBuyerBases: (bases: any[]) => void;
  setBuyerDistributions: (distributions: any[]) => void;
  
  // Transport actions
  setFleetInfo: (fleetInfo: FleetInformation) => void;
  setServiceArea: (serviceArea: ServiceArea) => void;
  setJobPreferences: (preferences: JobPreferences) => void;
  setTransportOpportunities: (opportunities: TransportOpportunities) => void;
  
  // Location
  setLocation: (location: { latitude: number; longitude: number; address?: string; city?: string; region?: string; country?: string }) => void;
  location?: { latitude: number; longitude: number; address?: string; city?: string; region?: string; country?: string };
  
  // General actions
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  
  // API integration methods
  saveOnboardingData: () => Promise<void>;
  loadOnboardingData: () => Promise<void>;
  submitOnboarding: (companyInfo?: CompanyInfo, userInfo?: { name: string; email: string; phone?: string }) => Promise<void>;
  authenticateWithGoogle: (googleToken: string) => Promise<void>;
  setGoogleAuthData: (data: { name: string; email: string; isAuthenticated: boolean }) => void;
  googleAuthData?: { name: string; email: string; isAuthenticated: boolean };
  
  // Computed properties
  getProgress: () => number;
  getCurrentStepData: () => any;
  isStepValid: (step?: number) => boolean;
  getOnboardingPayload: () => RegisterWithCompanyDto | null;
}

const getInitialState = () => ({
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
  googleAuthData: undefined as { name: string; email: string; isAuthenticated: boolean } | undefined,
  location: undefined as { latitude: number; longitude: number; address?: string; city?: string; region?: string; country?: string } | undefined,
  isLoading: false,
  isSubmitting: false,
  error: null,
});

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    immer((set, get) => ({
      ...getInitialState(),
      
      // Transport data access
      transportData: undefined as TransportOnboardingData | undefined,
      
      // Error and loading states
      isLoading: false,
      isSubmitting: false,
      error: null,

      setRole: (role: UserRole) =>
        set((state) => {
          state.selectedRole = role;
          // Set total steps based on role
          switch (role) {
            case 'seller':
              state.totalSteps = 4; // Products → Quantity/Pricing → Custom Offer → Account
              state.sellerData = { selectedProducts: [] };
              break;
            case 'buyer':
              state.totalSteps = 6; // Role → Products → Requirements → Overview → Account → Complete
              state.buyerData = { requiredProducts: [] };
              break;
            case 'transport':
              state.totalSteps = 7; // Role → Fleet → Preferences → Opportunities → Account → Complete
              state.transportData = {
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
              };
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
              Object.assign(state.sellerData.selectedProducts[productIndex], updates);
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
              Object.assign(state.buyerData.requiredProducts[requirementIndex], updates);
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
      setLocation: (location: { latitude: number; longitude: number; address?: string; city?: string; region?: string; country?: string }) =>
        set((state) => {
          state.location = location;
          console.log('Location updated:', location);
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
        const state = get();
        try {
          set((draft) => {
            draft.isLoading = true;
            draft.error = null;
          });

          // Save data to AsyncStorage (handled by persist middleware)
          // This is a placeholder for any additional local storage logic
          console.log('Onboarding data saved locally', {
            role: state.selectedRole,
            sellerData: state.sellerData,
            buyerData: state.buyerData,
            transportData: state.transportData,
          });

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
          const state = get();
          console.log('Onboarding data loaded', {
            role: state.selectedRole,
            currentStep: state.currentStep,
            hasSellerData: !!state.sellerData,
            hasBuyerData: !!state.buyerData,
            hasTransportData: !!state.transportData,
          });

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

      setGoogleAuthData: (data: { name: string; email: string; isAuthenticated: boolean }) => {
        set((draft) => {
          // Store Google auth data temporarily for use in the modal
          // This will be used to pre-fill the auth form
          draft.googleAuthData = data;
          console.log('Google auth data stored:', data);
        });
      },

      getOnboardingPayload: (): RegisterWithCompanyDto | null => {
        const state = get();
        if (!state.selectedRole) return null;

        // Map frontend roles to backend UserRole enum
        const roleMapping = {
          'seller': 'FARMER',
          'buyer': 'BUYER',
          'transport': 'TRANSPORTER',
          'admin': 'ADMIN'
        };

        const backendRole = roleMapping[state.selectedRole] || state.selectedRole.toUpperCase();

        const basePayload = {
          role: backendRole as any, // Cast to any to match backend enum
          email: '', // Will be filled during authentication
          name: '', // Will be filled during authentication
          phone: undefined as string | undefined,
        };

        // Add role-specific data as company info
        let companyInfo: CompanyInfo | undefined;

        // Structure the actual user-entered onboarding data properly
        switch (state.selectedRole) {
          case 'seller':
            if (state.sellerData) {
              companyInfo = {
                companyName: '', // Will be filled from AuthModal form
              };
              
              // Structure seller onboarding data from user inputs
              const sellerOnboardingData: any = {
                // Products selected (just IDs from catalog)
                selectedProductIds: state.selectedProducts,
                
                // Product specifications entered by user
                productSpecifications: Object.keys(state.sellerSpecifications).map(productId => ({
                  productId,
                  quantity: state.sellerSpecifications[productId].quantity || 0,
                  unit: state.sellerSpecifications[productId].unit || 'TON',
                  pricePerKilo: state.sellerSpecifications[productId].pricePerKilo,
                  varieties: state.sellerSpecifications[productId].varieties || [],
                  qualitySpecs: state.sellerSpecifications[productId].qualitySpecs || [],
                })),
                
                // Bases/locations created by user
                bases: (state.sellerData.bases || []).map(base => ({
                  name: base.name,
                  type: base.type || 'WAREHOUSE',
                  address: base.address,
                  city: base.city,
                  region: base.region,
                  country: base.country || 'Bulgaria',
                  postalCode: base.postalCode,
                  latitude: base.latitude,
                  longitude: base.longitude,
                  storageCapacity: base.capacity,
                  isPrimary: base.isPrimary || false,
                })),
                
                // Distribution data (how much product at each base)
                distributions: (state.sellerData.distributions || []).map(dist => ({
                  productId: dist.productId,
                  distributions: dist.distributions?.map((d: any) => ({
                    baseId: d.baseId || d.baseName, // Use base identifier
                    quantity: d.quantity,
                    percentage: d.percentage,
                  })) || [],
                })),
              };
              
              (basePayload as any).onboardingData = sellerOnboardingData;
            }
            break;
          
          case 'buyer':
            if (state.buyerData) {
              companyInfo = {
                companyName: '', // Will be filled from AuthModal form
              };
              
              // Structure buyer onboarding data from user inputs
              const buyerOnboardingData: any = {
                // Products needed (just IDs from catalog)
                requiredProductIds: state.selectedProducts,
                
                // Product requirements entered by user
                productRequirements: Object.keys(state.buyerSpecifications).map(productId => ({
                  productId,
                  quantity: state.buyerSpecifications[productId].quantity || 0,
                  unit: state.buyerSpecifications[productId].unit || 'TON',
                  maxPricePerKilo: state.buyerSpecifications[productId].maxPrice,
                  deliveryFrequency: state.buyerSpecifications[productId].deliveryFrequency,
                  qualityRequirements: state.buyerSpecifications[productId].qualityRequirements || [],
                })),
                
                // Delivery locations/bases
                bases: (state.buyerData.bases || []).map(base => ({
                  name: base.name,
                  type: base.type || 'DEPOT',
                  address: base.address,
                  city: base.city,
                  region: base.region,
                  country: base.country || 'Bulgaria',
                  postalCode: base.postalCode,
                  latitude: base.latitude,
                  longitude: base.longitude,
                  storageCapacity: base.capacity,
                  isPrimary: base.isPrimary || false,
                })),
                
                // Distribution requirements (how much needed at each base)
                distributions: (state.buyerData.distributions || []).map(dist => ({
                  productId: dist.productId,
                  distributions: dist.distributions?.map((d: any) => ({
                    baseId: d.baseId || d.baseName,
                    quantity: d.quantity,
                    percentage: d.percentage,
                  })) || [],
                })),
              };
              
              (basePayload as any).onboardingData = buyerOnboardingData;
            }
            break;
            
          case 'transport':
            if (state.transportData) {
              companyInfo = {
                companyName: '', // Will be filled from AuthModal form
              };
              
              // Structure transporter onboarding data from user inputs
              const transportOnboardingData: any = {
                // Fleet information entered by user
                fleetInfo: {
                  vehicleCount: state.transportData.fleetInfo?.vehicleCount || 0,
                  vehicleTypes: state.transportData.fleetInfo?.vehicleTypes || [],
                  totalCapacity: state.transportData.fleetInfo?.capacity?.total || 0,
                  capacityUnit: state.transportData.fleetInfo?.capacity?.unit || 'tons',
                },
                
                // Base location for fleet
                baseLocation: state.transportData.fleetInfo?.baseLocation ? {
                  address: state.transportData.fleetInfo.baseLocation.address,
                  city: state.transportData.fleetInfo.baseLocation.city,
                  state: state.transportData.fleetInfo.baseLocation.state,
                  country: state.transportData.fleetInfo.baseLocation.country,
                  zipCode: state.transportData.fleetInfo.baseLocation.zipCode,
                } : null,
                
                // Service area preferences
                serviceArea: {
                  radius: state.transportData.serviceArea?.radius || 0,
                  preferredRegions: state.transportData.serviceArea?.preferredRegions || [],
                  coverage: state.transportData.serviceArea?.coverage || 'local',
                },
                
                // Job preferences
                jobPreferences: {
                  cargoTypes: state.transportData.jobPreferences?.cargoTypes || [],
                  maxDistance: state.transportData.jobPreferences?.maxDistance || 0,
                  minDistance: state.transportData.jobPreferences?.minDistance || 0,
                },
              };
              
              (basePayload as any).onboardingData = transportOnboardingData;
            }
            break;
        }

        return {
          ...basePayload,
          companyInfo,
        };
      },

      submitOnboarding: async (companyInfo?: CompanyInfo, userInfo?: { name: string; email: string; phone?: string }) => {
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
          const finalPayload: RegisterWithCompanyDto = {
            ...payload,
            email: userInfo?.email || '',
            name: userInfo?.name || '',
            phone: userInfo?.phone,
            companyInfo: companyInfo || payload.companyInfo,
          };

          // Include all the onboarding data in the payload
          const onboardingData = (payload as any).onboardingData;
          if (onboardingData) {
            (finalPayload as any).onboardingData = onboardingData;
          }

          console.log('Submitting onboarding with payload:', finalPayload);

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
          const errorMessage = error?.response?.data?.message || error?.message || 'Failed to complete onboarding';
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
          const errorMessage = error?.response?.data?.message || error?.message || 'Google authentication failed';
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
      getProgress: () => {
        const state = get();
        return state.totalSteps > 0 ? (state.currentStep + 1) / state.totalSteps : 0;
      },

      getCurrentStepData: () => {
        const state = get();
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
      },

      isStepValid: (step?: number): boolean => {
        const state = get();
        const targetStep = step ?? state.currentStep;
        
        switch (state.selectedRole) {
          case 'seller':
            if (targetStep === 1) return (state.sellerData?.selectedProducts?.length ?? 0) > 0;
            if (targetStep === 2) return state.sellerData?.selectedProducts?.every(p => 
              p.varieties.length > 0 && p.quantity.amount > 0
            ) ?? false;
            break;
            
          case 'buyer':
            if (targetStep === 1) return (state.buyerData?.requiredProducts?.length ?? 0) > 0;
            if (targetStep === 2) return state.buyerData?.requiredProducts?.every(r => 
              r.quantity.amount > 0
            ) ?? false;
            break;
            
          case 'transport':
            if (targetStep === 1) return (state.transportData?.fleetInfo?.vehicleCount ?? 0) > 0;
            if (targetStep === 2) return (state.transportData?.serviceArea?.radius ?? 0) > 0;
            break;
        }
        
        return true;
      },
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