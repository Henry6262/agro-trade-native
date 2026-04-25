export type SellerOfferUrgency = 'low' | 'medium' | 'high';
export type SellerOfferStatus = 'pending' | 'accepted' | 'rejected' | 'negotiating';
export type SellerOfferView = 'list' | 'negotiate' | 'accept' | 'reject';
export type SellerOfferFilter = 'all' | 'pending';
export type SellerNegotiationType = 'price' | 'quantity' | 'terms' | 'combined';

export interface SellerOfferBuyerLocation {
  city: string;
  state?: string;
  country: string;
}

export interface SellerOfferBuyer {
  id: string;
  name: string;
  company?: string;
  location: SellerOfferBuyerLocation;
  rating: number;
  reviewCount: number;
  verified: boolean;
  avatar?: string;
}

export interface SellerOfferDeliveryRequirements {
  location: string;
  timeframe: string;
  method?: string;
}

export interface SellerOfferSpecification {
  name: string;
  requirement: string;
  matches: boolean;
}

export interface SellerOffer {
  id: string;
  negotiationId?: string;
  buyer: SellerOfferBuyer;
  requestedQuantity: number;
  offeredPrice: number;
  unit: string;
  currency: string;
  deliveryRequirements: SellerOfferDeliveryRequirements;
  specifications?: SellerOfferSpecification[];
  matchScore: number;
  totalValue: number;
  message?: string;
  urgency: SellerOfferUrgency;
  validUntil: string;
  status: SellerOfferStatus;
  createdAt: string;
}

export interface SellerProductSummary {
  quantity?: number;
  priceRangeMin?: number | string;
  priceRangeMax?: number | string;
}
