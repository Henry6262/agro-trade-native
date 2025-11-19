export interface SellerLocation {
  city?: string;
  state?: string;
  country?: string;
}

export interface ProductMetadata {
  id?: string;
  name?: string;
  displayName?: string;
  category?: string;
  image?: string;
  priceRangeMin?: number;
  priceRangeMax?: number;
}

export interface SellerProduct {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit?: string;
  productId?: string;
  priceRangeMin?: number;
  priceRangeMax?: number;
  isVerified?: boolean;
  qualityTags?: string[];
  location?: SellerLocation | null;
  updatedAt: string;
  views?: number;
  inquiries?: number;
  specifications?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SellerOfferMock {
  id: string;
  buyer: {
    id: string;
    name: string;
    company: string;
    location: SellerLocation;
    rating: number;
    reviewCount: number;
    verified: boolean;
    avatar: string;
  };
  requestedQuantity: number;
  offeredPrice: number;
  unit: string;
  currency: string;
  deliveryRequirements: {
    location: string;
    timeframe: string;
    method: string;
  };
  specifications: { name: string; requirement: string; matches: boolean }[];
  matchScore: number;
  totalValue: number;
  message: string;
  urgency: 'high' | 'medium' | 'low';
  validUntil: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface OfferSummary {
  total: number;
  urgent: number;
  bestOffer?: number;
  offers: SellerOfferMock[];
}

export interface SellerProductEditPayload {
  id: string;
  quantity: number;
  unit?: string;
  location?: SellerLocation | null;
  specifications?: Record<string, unknown>;
}
