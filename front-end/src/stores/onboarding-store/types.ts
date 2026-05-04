import type { CompanyInfo, RegisterWithCompanyDto } from '@services/authService';
import type {
  FleetInformation,
  JobPreferences,
  MarketInsights,
  BuyerOnboardingData,
  ProductRequirement,
  ProductSelection,
  ServiceArea,
  SellerOnboardingData,
  TransportOnboardingData,
  TransportOpportunities,
} from '@shared/types';
import type { OnboardingRole } from '@shared/types/onboarding';

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
