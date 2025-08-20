import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  OnboardingState,
  UserRole,
  SellerOnboardingData,
  BuyerOnboardingData,
  TransportOnboardingData,
  ProductSelection,
  ProductRequirement,
  FleetInformation,
  ServiceArea,
  JobPreferences,
  MarketInsights,
  TransportOpportunities,
} from '../types';

interface OnboardingStore extends OnboardingState {
  // Actions
  setRole: (role: UserRole) => void;
  nextStep: () => void;
  previousStep: () => void;
  setStep: (step: number) => void;
  
  // Seller actions
  setSellerProducts: (products: ProductSelection[]) => void;
  addSellerProduct: (product: ProductSelection) => void;
  removeSellerProduct: (productId: string) => void;
  updateSellerProduct: (productId: string, updates: Partial<ProductSelection>) => void;
  setMarketInsights: (insights: MarketInsights) => void;
  
  // Buyer actions
  setBuyerRequirements: (requirements: ProductRequirement[]) => void;
  addBuyerRequirement: (requirement: ProductRequirement) => void;
  removeBuyerRequirement: (productId: string) => void;
  updateBuyerRequirement: (productId: string, updates: Partial<ProductRequirement>) => void;
  
  // Transport actions
  setFleetInfo: (fleetInfo: FleetInformation) => void;
  setServiceArea: (serviceArea: ServiceArea) => void;
  setJobPreferences: (preferences: JobPreferences) => void;
  setTransportOpportunities: (opportunities: TransportOpportunities) => void;
  
  // General actions
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  
  // Computed properties
  getProgress: () => number;
  getCurrentStepData: () => any;
  isStepValid: (step?: number) => boolean;
}

const getInitialState = (): OnboardingState => ({
  currentStep: 0,
  totalSteps: 0,
  selectedRole: undefined,
  sellerData: undefined,
  buyerData: undefined,
  transportData: undefined,
  isComplete: false,
});

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    immer((set, get) => ({
      ...getInitialState(),

      setRole: (role: UserRole) =>
        set((state) => {
          state.selectedRole = role;
          // Set total steps based on role
          switch (role) {
            case 'seller':
              state.totalSteps = 6; // Role → Products → Details → Insights → Account → Complete
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

      isStepValid: (step?: number) => {
        const state = get();
        const targetStep = step ?? state.currentStep;
        
        switch (state.selectedRole) {
          case 'seller':
            if (targetStep === 1) return state.sellerData?.selectedProducts.length > 0;
            if (targetStep === 2) return state.sellerData?.selectedProducts.every(p => 
              p.varieties.length > 0 && p.quantity.amount > 0
            );
            break;
            
          case 'buyer':
            if (targetStep === 1) return state.buyerData?.requiredProducts.length > 0;
            if (targetStep === 2) return state.buyerData?.requiredProducts.every(r => 
              r.quantity.amount > 0
            );
            break;
            
          case 'transport':
            if (targetStep === 1) return state.transportData?.fleetInfo.vehicleCount > 0;
            if (targetStep === 2) return state.transportData?.serviceArea.radius > 0;
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
      }),
    }
  )
);