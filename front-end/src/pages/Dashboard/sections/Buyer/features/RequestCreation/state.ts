import type {
  BuyerRequestCreationState,
  BuyerRequestCreationStep,
  BuyerSpecifications,
  LocationData,
  ProductData,
  ProductSpecifications,
} from './types';

export const STEP_ORDER: BuyerRequestCreationStep[] = [
  'product-selection',
  'quantity-price',
  'product-specifications',
  'location-confirmation',
  'submit',
];

export const initialState: BuyerRequestCreationState = {
  currentStep: 'product-selection',
  data: {
    productData: null,
    buyerSpecifications: null,
    productSpecifications: null,
    location: null,
  },
  isLoading: false,
  error: null,
};

type BuyerRequestCreationAction =
  | { type: 'SET_STEP'; step: BuyerRequestCreationStep }
  | { type: 'NEXT_STEP' }
  | { type: 'PREVIOUS_STEP' }
  | { type: 'SET_PRODUCT_DATA'; payload: ProductData }
  | { type: 'SET_BUYER_SPECS'; payload: BuyerSpecifications }
  | { type: 'SET_PRODUCT_SPECS'; payload: ProductSpecifications }
  | { type: 'SET_LOCATION'; payload: LocationData }
  | { type: 'SET_LOADING'; value: boolean }
  | { type: 'SET_ERROR'; message: string | null }
  | { type: 'RESET' };

export const buyerRequestCreationReducer = (
  state: BuyerRequestCreationState,
  action: BuyerRequestCreationAction
): BuyerRequestCreationState => {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.step, error: null };
    case 'NEXT_STEP': {
      const currentIndex = STEP_ORDER.indexOf(state.currentStep);
      const next = STEP_ORDER[currentIndex + 1] ?? state.currentStep;
      return { ...state, currentStep: next, error: null };
    }
    case 'PREVIOUS_STEP': {
      const currentIndex = STEP_ORDER.indexOf(state.currentStep);
      const previous = STEP_ORDER[currentIndex - 1] ?? state.currentStep;
      return { ...state, currentStep: previous, error: null };
    }
    case 'SET_PRODUCT_DATA':
      return {
        ...state,
        data: { ...state.data, productData: action.payload },
        error: null,
      };
    case 'SET_BUYER_SPECS':
      return {
        ...state,
        data: { ...state.data, buyerSpecifications: action.payload },
        error: null,
      };
    case 'SET_PRODUCT_SPECS':
      return {
        ...state,
        data: { ...state.data, productSpecifications: action.payload },
        error: null,
      };
    case 'SET_LOCATION':
      return {
        ...state,
        data: { ...state.data, location: action.payload },
        error: null,
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.value };
    case 'SET_ERROR':
      return { ...state, error: action.message };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
};

export const isStepComplete = (
  state: BuyerRequestCreationState,
  step: BuyerRequestCreationStep
) => {
  switch (step) {
    case 'product-selection':
      return Boolean(state.data.productData);
    case 'quantity-price':
      return Boolean(state.data.buyerSpecifications);
    case 'product-specifications':
      return Boolean(state.data.productSpecifications);
    case 'location-confirmation':
      return Boolean(state.data.location);
    case 'submit':
      return true;
    default:
      return false;
  }
};
