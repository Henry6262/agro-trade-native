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

export interface BuyerSpecifications {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  maxPricePerUnit?: number;
  neededBy?: string;
  notes?: string;
}

export interface ProductSpecifications {
  [key: string]: any;
}

export interface BuyerRequestCreationData {
  productData: ProductData | null;
  buyerSpecifications: BuyerSpecifications | null;
  productSpecifications: ProductSpecifications | null;
  location: LocationData | null;
}

export type BuyerRequestCreationStep =
  | 'product-selection'
  | 'quantity-price'
  | 'product-specifications'
  | 'location-confirmation'
  | 'submit';

export interface BuyerRequestCreationState {
  currentStep: BuyerRequestCreationStep;
  data: BuyerRequestCreationData;
  isLoading: boolean;
  error: string | null;
}

export interface CreateBuyerRequestDto {
  productId: string;
  quantity: number;
  unit: string;
  maxPricePerUnit?: number;
  neededBy?: string;
  specifications: Record<string, any>;
  deliveryAddress: {
    address: string;
    city: string;
    region: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };
  notes?: string;
  status: 'active' | 'inactive';
}

export interface BuyerRequestCreationFlowProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (request: any) => void;
  onError?: (error: string) => void;
}

// Step component props interfaces
export interface ProductSelectionStepProps {
  visible: boolean;
  onClose: () => void;
  onNext: (productData: ProductData) => void;
  productMetadata?: ProductData[];
}

export interface QuantityPriceStepProps {
  visible: boolean;
  productData: ProductData;
  onClose: () => void;
  onNext: (specifications: BuyerSpecifications) => void;
  onBack: () => void;
}

export interface ProductSpecificationsStepProps {
  visible: boolean;
  productData: ProductData;
  buyerSpecifications: BuyerSpecifications;
  onClose: () => void;
  onNext: (specifications: ProductSpecifications) => void;
  onBack: () => void;
  existingSpecs?: ProductSpecifications;
}

export interface LocationConfirmationStepProps {
  visible: boolean;
  onClose: () => void;
  onNext: (location: LocationData) => void;
  onBack: () => void;
  initialLocation?: LocationData;
}

export interface SubmitStepProps {
  visible: boolean;
  productData: ProductData;
  buyerSpecifications: BuyerSpecifications;
  productSpecifications: ProductSpecifications;
  location: LocationData;
  onClose: () => void;
  onBack: () => void;
  onComplete: () => void;
}
