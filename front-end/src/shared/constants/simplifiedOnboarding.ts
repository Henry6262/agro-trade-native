import type { OnboardingRole, StepConfig } from '../types/onboarding';

// Simplified onboarding steps without base management
export const simplifiedRoleSteps: Record<OnboardingRole, StepConfig[]> = {
  seller: [
    { id: 'products', title: 'Product', description: 'Select one product to sell' },
    {
      id: 'quantity-pricing',
      title: 'Quantity & Location',
      description: 'Set quantity and location',
    },
    { id: 'account', title: 'Overview', description: 'Review and sell' },
  ],
  buyer: [
    { id: 'products', title: 'Product', description: 'Select what to buy' },
    { id: 'quantity-location', title: 'Quantity & Location', description: 'Amount and delivery' },
    { id: 'specifications', title: 'Specifications', description: 'Product requirements' },
    { id: 'market', title: 'Overview', description: 'Review and complete' },
  ],
  transport: [
    { id: 'fleet', title: 'Fleet', description: 'Your vehicles' },
    { id: 'coverage', title: 'Coverage', description: 'Service areas' },
    { id: 'preferences', title: 'Preferences', description: 'Job preferences' },
    { id: 'overview', title: 'Overview', description: 'Review and complete' },
  ],
};

// Export the original products list from main onboarding file
export { products } from './onboarding';
