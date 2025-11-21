import type {
  OfferSummary,
  ProductMetadata,
  SellerLocation,
  SellerOfferMock,
  SellerProduct,
} from './types';

const CATEGORY_IMAGES: Record<string, string> = {
  SOFT_WHEAT: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400',
  HARD_WHEAT: 'https://images.unsplash.com/photo-1558818498-28c1e002b655?w=400',
  CORN: 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=400',
  SOYBEANS: 'https://images.unsplash.com/photo-1639843906836-85fc9fa11584?w=400',
  RICE: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
};

export const formatLocation = (location?: SellerLocation | null) => {
  if (!location) return 'Location not set';
  const parts = [location.city, location.state, location.country].filter(Boolean);
  return parts.join(', ') || 'Location not set';
};

export const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  return `${diffDays} days ago`;
};

export const getProductImage = (product: SellerProduct, metadata: ProductMetadata[]) => {
  const metaProduct = metadata?.find?.(
    (p) =>
      p?.id === product.productId ||
      p?.name === product.name ||
      p?.displayName === product.name ||
      p?.category === product.category
  );

  if (metaProduct?.image) {
    return metaProduct.image;
  }

  return (
    CATEGORY_IMAGES[product.category] ||
    'https://via.placeholder.com/400x400/10B981/FFFFFF?text=Product'
  );
};

export const getPriceRange = (product: SellerProduct, metadata: ProductMetadata[]) => {
  const metaProduct = metadata?.find?.(
    (p) =>
      p?.id === product.productId ||
      p?.category === product.category ||
      p?.name === product.name ||
      p?.displayName === product.name
  );

  return {
    min: metaProduct?.priceRangeMin ?? product.priceRangeMin,
    max: metaProduct?.priceRangeMax ?? product.priceRangeMax,
  };
};

export const getMockOffers = (productId: string): SellerOfferMock[] => [
  {
    id: `offer-${productId}-1`,
    buyer: {
      id: 'buyer-1',
      name: 'GlobalGrain Corp',
      company: 'GlobalGrain Corp',
      location: { city: 'Chicago', state: 'Illinois', country: 'USA' },
      rating: 4.7,
      reviewCount: 23,
      verified: true,
      avatar: 'https://ui-avatars.com/api/?name=GlobalGrain&background=3B82F6&color=fff',
    },
    requestedQuantity: 500,
    offeredPrice: 245,
    unit: 'TON',
    currency: 'EUR',
    deliveryRequirements: {
      location: 'Port of Hamburg, Germany',
      timeframe: 'Within 30 days',
      method: 'Container shipping',
    },
    specifications: [
      { name: 'Protein Content', requirement: '≥13%', matches: true },
      { name: 'Moisture', requirement: '≤12%', matches: true },
      { name: 'Test Weight', requirement: '≥60 lb/bu', matches: false },
    ],
    matchScore: 88,
    totalValue: 122500,
    message:
      'Looking for premium quality wheat for our European operations. Can provide long-term contract.',
    urgency: 'medium',
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: `offer-${productId}-2`,
    buyer: {
      id: 'buyer-2',
      name: 'European Mills Ltd',
      company: 'European Mills Ltd',
      location: { city: 'Rotterdam', state: '', country: 'Netherlands' },
      rating: 4.9,
      reviewCount: 67,
      verified: true,
      avatar: 'https://ui-avatars.com/api/?name=European+Mills&background=10B981&color=fff',
    },
    requestedQuantity: 1000,
    offeredPrice: 255,
    unit: 'TON',
    currency: 'EUR',
    deliveryRequirements: {
      location: 'Rotterdam Port, Netherlands',
      timeframe: 'Within 45 days',
      method: 'Bulk carrier',
    },
    specifications: [
      { name: 'Protein Content', requirement: '≥14%', matches: true },
      { name: 'Moisture', requirement: '≤11%', matches: true },
      { name: 'Foreign Material', requirement: '≤1%', matches: true },
    ],
    matchScore: 95,
    totalValue: 255000,
    message: 'Urgent requirement for our milling operations. Premium price for quality product.',
    urgency: 'high',
    validUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: `offer-${productId}-3`,
    buyer: {
      id: 'buyer-3',
      name: 'Prairie Harvest LLC',
      company: 'Prairie Harvest LLC',
      location: { city: 'Kansas', state: 'KS', country: 'USA' },
      rating: 4.2,
      reviewCount: 15,
      verified: false,
      avatar: 'https://ui-avatars.com/api/?name=Prairie+Harvest&background=F59E0B&color=fff',
    },
    requestedQuantity: 600,
    offeredPrice: 255,
    unit: 'TON',
    currency: 'EUR',
    deliveryRequirements: {
      location: 'EXW',
      timeframe: 'Within 5 days',
      method: 'Bulk carrier',
    },
    specifications: [
      { name: 'Protein Content', requirement: '≥14%', matches: false },
      { name: 'Moisture', requirement: '≤11%', matches: false },
      { name: 'Foreign Material', requirement: '≤1%', matches: false },
    ],
    matchScore: 65,
    totalValue: 153000,
    message: 'We can move fast but need confirmation within 48h.',
    urgency: 'low',
    validUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const getOfferSummary = (productId: string): OfferSummary => {
  const offers = getMockOffers(productId);
  const bestOffer = offers.length
    ? Math.max(...offers.map((offer) => offer.offeredPrice))
    : undefined;
  const urgent = offers.filter((offer) => offer.urgency === 'high').length;

  return {
    total: offers.length,
    urgent,
    bestOffer,
    offers,
  };
};
