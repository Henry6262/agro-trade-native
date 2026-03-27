import type { OfferSummary, ProductMetadata, SellerLocation, SellerOfferMock, SellerProduct } from './types';

const CATEGORY_IMAGES: Record<string, string> = {
  SOFT_WHEAT: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400',
  HARD_WHEAT: 'https://images.unsplash.com/photo-1558818498-28c1e002b655?w=400',
  CORN: 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=400',
  SOYBEANS: 'https://images.unsplash.com/photo-1639843906836-85fc9fa11584?w=400',
  RICE: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
};

export const formatLocation = (location?: SellerLocation | null) => {
  if (!location) return 'Location not set';
  return [location.city, location.state, location.country].filter(Boolean).join(', ') || 'Location not set';
};

export const formatTimeAgo = (dateString: string) => {
  const diffMs = new Date().getTime() - new Date(dateString).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins} minutes ago`;
  const diffHours = Math.floor(diffMs / 3600000);
  if (diffHours < 24) return `${diffHours} hours ago`;
  return `${Math.floor(diffMs / 86400000)} days ago`;
};

const findMetaProduct = (product: SellerProduct, metadata: ProductMetadata[]) =>
  metadata?.find?.((p) =>
    p?.id === product.productId || p?.name === product.name ||
    p?.displayName === product.name || p?.category === product.category
  );

export const getProductImage = (product: SellerProduct, metadata: ProductMetadata[]) => {
  const meta = findMetaProduct(product, metadata);
  if (meta?.image) return meta.image;
  return CATEGORY_IMAGES[product.category] || 'https://via.placeholder.com/400x400/10B981/FFFFFF?text=Product';
};

export const getPriceRange = (product: SellerProduct, metadata: ProductMetadata[]) => {
  const meta = metadata?.find?.((p) =>
    p?.id === product.productId || p?.category === product.category ||
    p?.name === product.name || p?.displayName === product.name
  );
  return { min: meta?.priceRangeMin ?? product.priceRangeMin, max: meta?.priceRangeMax ?? product.priceRangeMax };
};

const mkBuyer = (id: string, name: string, loc: { city: string; state: string; country: string },
  rating: number, reviewCount: number, verified: boolean, bg: string) => ({
  id, name, company: name, location: loc, rating, reviewCount, verified,
  avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff`,
});

const mkOffer = (idx: number, productId: string, buyer: ReturnType<typeof mkBuyer>,
  qty: number, price: number, loc: string, timeframe: string, method: string,
  specs: { name: string; requirement: string; matches: boolean }[],
  matchScore: number, msg: string, urgency: 'low' | 'medium' | 'high',
  validDays: number, createdDaysAgo: number): SellerOfferMock => ({
  id: `offer-${productId}-${idx}`, buyer, requestedQuantity: qty, offeredPrice: price,
  unit: 'TON', currency: 'EUR',
  deliveryRequirements: { location: loc, timeframe, method },
  specifications: specs, matchScore, totalValue: qty * price, message: msg, urgency,
  validUntil: new Date(Date.now() + validDays * 864e5).toISOString(),
  status: 'pending', createdAt: new Date(Date.now() - createdDaysAgo * 864e5).toISOString(),
});

export const getMockOffers = (productId: string): SellerOfferMock[] => [
  mkOffer(1, productId,
    mkBuyer('buyer-1', 'GlobalGrain Corp', { city: 'Chicago', state: 'Illinois', country: 'USA' }, 4.7, 23, true, '3B82F6'),
    500, 245, 'Port of Hamburg, Germany', 'Within 30 days', 'Container shipping',
    [{ name: 'Protein Content', requirement: '>=13%', matches: true }, { name: 'Moisture', requirement: '<=12%', matches: true }, { name: 'Test Weight', requirement: '>=60 lb/bu', matches: false }],
    88, 'Looking for premium quality wheat for our European operations. Can provide long-term contract.', 'medium', 7, 2),
  mkOffer(2, productId,
    mkBuyer('buyer-2', 'European Mills Ltd', { city: 'Rotterdam', state: '', country: 'Netherlands' }, 4.9, 67, true, '10B981'),
    1000, 255, 'Rotterdam Port, Netherlands', 'Within 45 days', 'Bulk carrier',
    [{ name: 'Protein Content', requirement: '>=14%', matches: true }, { name: 'Moisture', requirement: '<=11%', matches: true }, { name: 'Foreign Material', requirement: '<=1%', matches: true }],
    95, 'Urgent requirement for our milling operations. Premium price for quality product.', 'high', 3, 1),
  mkOffer(3, productId,
    mkBuyer('buyer-3', 'Prairie Harvest LLC', { city: 'Kansas', state: 'KS', country: 'USA' }, 4.2, 15, false, 'F59E0B'),
    600, 255, 'EXW', 'Within 5 days', 'Bulk carrier',
    [{ name: 'Protein Content', requirement: '>=14%', matches: false }, { name: 'Moisture', requirement: '<=11%', matches: false }, { name: 'Foreign Material', requirement: '<=1%', matches: false }],
    65, 'We can move fast but need confirmation within 48h.', 'low', 5, 3),
];

export const getOfferSummary = (productId: string): OfferSummary => {
  const offers = getMockOffers(productId);
  const bestOffer = offers.length ? Math.max(...offers.map((o) => o.offeredPrice)) : undefined;
  return { total: offers.length, urgent: offers.filter((o) => o.urgency === 'high').length, bestOffer, offers };
};
