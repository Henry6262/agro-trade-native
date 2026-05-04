import type { TransportOnboardingData } from '@shared/types';
import type { OnboardingRole } from '@shared/types/onboarding';

import type { OnboardingLocation } from './types';

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
