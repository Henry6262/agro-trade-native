import type { OnboardingStateSnapshot } from './types';

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
