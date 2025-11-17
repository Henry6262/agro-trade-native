import type { BuyerRequest } from './types';

const formatLocation = (address: any): string => {
  if (!address) return 'Unknown Location';
  const { city, state, country } = address;
  return [city, state, country].filter(Boolean).join(', ');
};

const getCountryFlag = (country?: string): string =>
  country === 'USA' ? '🇺🇸' : country === 'UAE' ? '🇦🇪' : '🌍';

const mapStatus = (status?: string): string => {
  switch ((status || '').toUpperCase()) {
    case 'DRAFT':
      return 'Draft';
    case 'ACTIVE':
      return 'Active';
    case 'MATCHED':
      return 'Matched';
    case 'COMPLETED':
      return 'Completed';
    default:
      return status ?? 'Unknown';
  }
};

const extractQualityRequirements = (specifications?: any[], listing?: any): string[] => {
  if (Array.isArray(specifications) && specifications.length) {
    return specifications.map((spec) => spec?.name || 'Quality Spec');
  }
  return listing?.qualityRequirements || [];
};

const getBestOfferPrice = (offers?: any[]): number | null => {
  if (!offers || offers.length === 0) return null;
  return Math.min(...offers.map((offer) => Number(offer.pricePerUnit) || 0));
};

export const transformBuyerListing = (listing: any): BuyerRequest => ({
  id: listing.id,
  product: listing.product?.displayName || listing.product?.name || 'Unknown Product',
  productId: listing.product?.id,
  productCategory: listing.product?.category,
  productImage: listing.product?.image,
  quantity: Number(listing.quantity) || 0,
  unit: listing.unit || 'TON',
  maxPricePerUnit: listing.maxPricePerUnit ? Number(listing.maxPricePerUnit) : null,
  deliveryLocation: formatLocation(listing.deliveryAddress),
  deliveryFlag: getCountryFlag(listing.deliveryAddress?.country),
  requiredDate: listing.neededBy,
  status: mapStatus(listing.status),
  qualityRequirements: extractQualityRequirements(listing.specifications, listing),
  offers: listing.offers?.length || 0,
  bestOffer: getBestOfferPrice(listing.offers),
  hasOffers: Boolean(listing.offers?.length),
  created: listing.createdAt,
  notes: listing.notes,
  rawData: listing,
});
