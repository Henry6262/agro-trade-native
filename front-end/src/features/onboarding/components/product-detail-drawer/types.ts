import type { ProductSpecification } from '@stores/product.store';

export type ProductDetailAction = 'listing' | 'custom-offer';
export type ProductDetailStep = 'quantity' | 'specifications' | 'auth';
export type ProductSpecificationsMap = Record<string, string>;

export interface ProductDetailConfirmData {
  productId: string;
  quantity: number;
  unit: string;
  action: ProductDetailAction;
  specifications?: ProductSpecificationsMap;
}

export interface ProductDetailDrawerProps {
  visible: boolean;
  onClose: () => void;
  productId: string | null;
  onConfirm: (data: ProductDetailConfirmData) => void;
}

export interface PriceOffer {
  min: number;
  max: number;
  currency: string;
}

export interface ProductDrawerLocation {
  city?: string | undefined;
  region?: string | undefined;
}

export interface QuantityStepProps {
  location?: ProductDrawerLocation | undefined;
  priceOffer: PriceOffer | null;
  defaultUnit: string;
  quantity: number;
  selectedQuantity: number | null;
  showCustomInput: boolean;
  customQuantity: string;
  presetQuantities: readonly number[];
  onLocationChange: () => void;
  onSelectQuantity: (quantity: number) => void;
  onShowCustomInput: () => void;
  onCustomQuantityChange: (value: string) => void;
  onCancelCustomInput: () => void;
}

export interface SpecificationsStepProps {
  productName: string;
  productSpecifications: ProductSpecification[];
  specifications: ProductSpecificationsMap;
  quantity: number;
  defaultUnit: string;
  onBack: () => void;
  onChangeSpecification: (spec: ProductSpecification, value: string) => void;
}

export interface AuthStepProps {
  productName: string;
  quantity: number;
  defaultUnit: string;
  specificationCount: number;
  onBack: () => void;
}
