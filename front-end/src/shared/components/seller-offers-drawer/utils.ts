import type {
  SellerOffer,
  SellerOfferFilter,
  SellerProductSummary,
} from '@shared/types/seller-offers';

export const filterOffers = (offers: SellerOffer[], filterBy: SellerOfferFilter) => {
  if (filterBy === 'pending') {
    return offers.filter((offer) => offer.status === 'pending');
  }

  return offers;
};

export const getOfferStats = (offers: SellerOffer[]) => {
  const pending = offers.filter((offer) => offer.status === 'pending').length;
  const avgPrice =
    offers.length > 0
      ? offers.reduce((sum, offer) => sum + offer.offeredPrice, 0) / offers.length
      : 0;
  const bestPrice = offers.length > 0 ? Math.max(...offers.map((offer) => offer.offeredPrice)) : 0;

  return { pending, avgPrice, bestPrice };
};

export const calculatePriceDifference = (offer: SellerOffer, counterPrice: string) => {
  const original = offer.offeredPrice || 0;
  const counter = parseFloat(counterPrice) || 0;
  const difference = counter - original;
  const percentageChange = original > 0 ? (difference / original) * 100 : 0;

  return { difference, percentageChange, isIncrease: difference > 0 };
};

export const calculateQuantityDifference = (offer: SellerOffer, counterQuantity: string) => {
  const original = offer.requestedQuantity || 0;
  const counter = parseFloat(counterQuantity) || 0;
  const difference = counter - original;
  const percentageChange = original > 0 ? (difference / original) * 100 : 0;

  return { difference, percentageChange, isIncrease: difference > 0 };
};

export const calculateTotalValue = (counterPrice: string, counterQuantity: string) => {
  const price = parseFloat(counterPrice) || 0;
  const quantity = parseFloat(counterQuantity) || 0;

  return price * quantity;
};

export const calculateProfitMargin = (
  sellerProduct: SellerProductSummary | undefined,
  counterPrice: string
) => {
  const counterPriceNumber = parseFloat(counterPrice) || 0;
  const marketMin = Number(sellerProduct?.priceRangeMin || 0);

  if (marketMin > 0 && counterPriceNumber > 0) {
    const margin = counterPriceNumber - marketMin;
    const marginPercentage = (margin / marketMin) * 100;

    return { margin, marginPercentage, isProfitable: margin > 0 };
  }

  return { margin: 0, marginPercentage: 0, isProfitable: false };
};
