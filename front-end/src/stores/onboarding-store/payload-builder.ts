import { RegisterWithCompanyDto, CompanyInfo } from '@services/authService';
import type { OnboardingStateSnapshot, RegisterWithOnboardingPayload } from './types';

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
