export interface LocationData {
  address: string;
  city: string;
  region: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export interface ProductData {
  id: string;
  name: string;
  displayName?: string;
  category: string;
  defaultUnit?: string;
  priceRangeMin?: number;
  priceRangeMax?: number;
  image?: string;
  description?: string;
}

export interface ProductSpecifications {
  quantity: number;
  unit: string;
  specifications: Record<string, any>;
  productId: string;
  productName: string;
  pricePerUnit?: number;
  totalPrice?: number;
}

export interface ProductCreationData {
  productData: ProductData | null;
  specifications: ProductSpecifications | null;
  location: LocationData | null;
}

export type ProductCreationStep = 'product-selection' | 'specifications' | 'location-confirmation';

export interface ProductCreationState {
  currentStep: ProductCreationStep;
  data: ProductCreationData;
  isLoading: boolean;
  error: string | null;
}

export interface CreateListingDto {
  productId: string;
  quantity: number;
  unit: string;
  specifications: Record<string, any>;
  location: {
    address: string;
    city: string;
    region: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };
  status: 'active' | 'inactive';
  offerType: 'STANDARD' | 'PREMIUM';
}

export interface ProductCreationFlowProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (product: any) => void;
  onError?: (error: string) => void;
}

// Step component props interfaces
export interface ProductSelectionStepProps {
  visible: boolean;
  onClose: () => void;
  onNext: (productData: ProductData) => void;
  productMetadata?: ProductData[];
}

export interface ProductSpecificationStepProps {
  visible: boolean;
  productData: ProductData;
  onClose: () => void;
  onNext: (specifications: ProductSpecifications) => void;
  onBack: () => void;
}

export interface LocationConfirmationStepProps {
  visible: boolean;
  onClose: () => void;
  onNext: (location: LocationData) => void;
  onBack: () => void;
  initialLocation?: LocationData;
}