import type {
  BuyerRequestCreationState,
  BuyerRequestCreationStep,
  ProductData,
  BuyerSpecifications,
  ProductSpecifications,
  LocationData,
  CreateBuyerRequestDto,
} from '../RequestCreation/types';

export interface BuyerRequest {
  id: string;
  product: string;
  productId?: string;
  productCategory?: string;
  productImage?: string;
  quantity: number;
  unit: string;
  maxPricePerUnit?: number | null;
  deliveryLocation: string;
  deliveryFlag?: string;
  requiredDate?: string;
  status: string;
  qualityRequirements: string[];
  offers: number;
  bestOffer?: number | null;
  hasOffers: boolean;
  created: string;
  notes?: string;
  rawData?: any;
}

export interface BuyerRequestsHookResult {
  requests: BuyerRequest[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  showRequestCreation: boolean;
  selectedRequestOffers: BuyerRequest | null;
  showOffersDrawer: boolean;
  openRequestCreation: () => void;
  closeRequestCreation: () => void;
  openOffersDrawer: (request: BuyerRequest) => void;
  closeOffersDrawer: () => void;
  refresh: () => Promise<void>;
}

export type {
  BuyerRequestCreationState,
  BuyerRequestCreationStep,
  ProductData,
  BuyerSpecifications,
  ProductSpecifications,
  LocationData,
  CreateBuyerRequestDto,
};
