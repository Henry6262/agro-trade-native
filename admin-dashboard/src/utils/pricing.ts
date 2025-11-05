import type { BuyListing, SaleListing } from '../types/listings';

export const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  // Handle simple Decimal-like objects (e.g., { value: '123.45' })
  if (typeof value === 'object' && value !== null && 'value' in value) {
    return toNumber((value as { value: unknown }).value);
  }

  return null;
};

export const getSellerUnitPrice = (seller: SaleListing): number | null => {
  const priceSources = [
    seller.askingPrice,
    seller.pricePerUnit,
  ];

  for (const source of priceSources) {
    const parsed = toNumber(source);
    if (parsed !== null) {
      return parsed;
    }
  }

  return null;
};

export const getBuyerTargetPrice = (order: BuyListing): number | null => {
  const priceSources = [
    order.targetPrice,
    order.maxPricePerUnit,
  ];

  for (const source of priceSources) {
    const parsed = toNumber(source);
    if (parsed !== null) {
      return parsed;
    }
  }

  return null;
};

export const formatUnitPrice = (price: number | null, unit: string): string => {
  if (price === null) {
    return '—';
  }

  return `€${price.toFixed(price % 1 === 0 ? 0 : 2)}/${unit}`;
};
