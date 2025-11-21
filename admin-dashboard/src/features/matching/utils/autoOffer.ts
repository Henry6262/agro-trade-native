import type { BuyListing, SaleListing } from '../../../types/listings';
import type { TransportCostResult } from '../../../types';
import { getBuyerTargetPrice, getSellerUnitPrice } from '../../../utils/pricing';

type TransportLookup = Record<string, TransportCostResult | undefined>;

export interface AutoOfferPlanOffer {
  seller: SaleListing;
  sellerId: string;
  saleListingId: string;
  quantity: number;
  offerPrice: number;
  unitPrice: number;
  transport?: TransportCostResult;
  transportPerTon: number;
  totalCostPerTon: number;
  budgetSlackPerTon: number;
  distanceKm: number;
}

export type AutoOfferSkipType =
  | 'BUYER_PRICE_MISSING'
  | 'SELLER_PRICE_MISSING'
  | 'NO_TRANSPORT'
  | 'NO_QUANTITY'
  | 'OVER_BUDGET'
  | 'NOT_SELECTED';

export interface AutoOfferSkip {
  sellerId: string;
  saleListingId?: string;
  reason: string;
  type: AutoOfferSkipType;
}

export interface AutoOfferOptions {
  maxOffers?: number;
  adminMarginPerTon?: number;
  maxDistanceKm?: number;
}

export interface AutoOfferPlan {
  offers: AutoOfferPlanOffer[];
  totalQuantity: number;
  remainingQuantity: number;
  skipped: AutoOfferSkip[];
  hasBuyerTargetPrice: boolean;
  buyerTargetPrice: number | null;
}

const DEFAULT_OPTIONS: Required<AutoOfferOptions> = {
  maxOffers: 5,
  adminMarginPerTon: 10,
  maxDistanceKm: 500,
};

const calculateTransportPerTon = (
  seller: SaleListing,
  estimate?: TransportCostResult,
): number => {
  if (!estimate || !seller.quantity || seller.quantity <= 0) {
    return Number.POSITIVE_INFINITY;
  }

  return estimate.transportCost / seller.quantity;
};

export const buildAutoOfferPlan = (
  order: BuyListing,
  sellers: SaleListing[],
  transportLookup: TransportLookup,
  options?: AutoOfferOptions,
): AutoOfferPlan => {
  const effectiveOptions = { ...DEFAULT_OPTIONS, ...options };
  const orderQuantity = Number(order.quantity) || 0;
  const buyerTargetPrice = getBuyerTargetPrice(order);

  if (!buyerTargetPrice || buyerTargetPrice <= 0) {
    return {
      offers: [],
      totalQuantity: 0,
      remainingQuantity: orderQuantity,
      skipped: [
        {
          sellerId: 'buyer-target-price',
          reason: 'Buyer max price is required for automatic offers.',
          type: 'BUYER_PRICE_MISSING',
        },
      ],
      hasBuyerTargetPrice: false,
      buyerTargetPrice: buyerTargetPrice ?? null,
    };
  }

  const skips: AutoOfferSkip[] = [];
  const eligible: AutoOfferPlanOffer[] = [];

  for (const seller of sellers) {
    const sellerId = seller.sellerId;

    if (!sellerId) {
      skips.push({
        sellerId: 'missing-seller',
        saleListingId: seller.id,
        reason: 'Missing seller reference.',
        type: 'SELLER_PRICE_MISSING',
      });
      continue;
    }

    if (!seller.quantity || seller.quantity <= 0) {
      skips.push({
        sellerId,
        saleListingId: seller.id,
        reason: 'Seller quantity unavailable.',
        type: 'NO_QUANTITY',
      });
      continue;
    }

    const sellerUnitPrice = getSellerUnitPrice(seller);
    if (sellerUnitPrice === null) {
      skips.push({
        sellerId,
        saleListingId: seller.id,
        reason: 'Seller asking price unavailable.',
        type: 'SELLER_PRICE_MISSING',
      });
      continue;
    }

    const transport = transportLookup[sellerId];
    if (!transport) {
      skips.push({
        sellerId,
        saleListingId: seller.id,
        reason: 'Transport estimate unavailable.',
        type: 'NO_TRANSPORT',
      });
      continue;
    }

    const transportPerTon = calculateTransportPerTon(seller, transport);
    if (!Number.isFinite(transportPerTon)) {
      skips.push({
        sellerId,
        saleListingId: seller.id,
        reason: 'Invalid transport calculation.',
        type: 'NO_TRANSPORT',
      });
      continue;
    }

    const offerPrice = Math.max(sellerUnitPrice, 0);
    const totalCostPerTon = offerPrice + transportPerTon;

    if (totalCostPerTon > buyerTargetPrice) {
      skips.push({
        sellerId,
        saleListingId: seller.id,
        reason: `Over budget by €${(totalCostPerTon - buyerTargetPrice).toFixed(2)}/t`,
        type: 'OVER_BUDGET',
      });
      continue;
    }

    eligible.push({
      seller,
      sellerId,
      saleListingId: seller.id,
      quantity: 0, // placeholder; allocation happens later
      offerPrice: Number(offerPrice.toFixed(2)),
      unitPrice: Number(offerPrice.toFixed(2)),
      transport,
      transportPerTon: Number(transportPerTon.toFixed(2)),
      totalCostPerTon: Number(totalCostPerTon.toFixed(2)),
      budgetSlackPerTon: Number((buyerTargetPrice - totalCostPerTon).toFixed(2)),
      distanceKm: Number((transport.distance ?? effectiveOptions.maxDistanceKm).toFixed(1)),
    });
  }

  eligible.sort((a, b) => {
    if (a.distanceKm !== b.distanceKm) {
      return a.distanceKm - b.distanceKm;
    }

    if (a.budgetSlackPerTon !== b.budgetSlackPerTon) {
      return b.budgetSlackPerTon - a.budgetSlackPerTon;
    }

    return (b.seller.quantity || 0) - (a.seller.quantity || 0);
  });

  const selected: AutoOfferPlanOffer[] = [];

  eligible.forEach((candidate) => {
    if (selected.length >= effectiveOptions.maxOffers) {
      skips.push({
        sellerId: candidate.sellerId,
        saleListingId: candidate.saleListingId,
        reason: 'Not included in first batch (ranked lower).',
        type: 'NOT_SELECTED',
      });
      return;
    }

    const availableQuantity = Number(candidate.seller.quantity) || 0;
    const allocation = Math.min(availableQuantity, orderQuantity);

    if (allocation <= 0) {
      skips.push({
        sellerId: candidate.sellerId,
        saleListingId: candidate.saleListingId,
        reason: 'No remaining quantity available.',
        type: 'NOT_SELECTED',
      });
      return;
    }

    selected.push({
      ...candidate,
      quantity: allocation,
    });
  });

  const totalQuantity = selected.reduce((sum, offer) => sum + offer.quantity, 0);
  const normalizedRemaining = Math.max(orderQuantity - Math.min(totalQuantity, orderQuantity), 0);

  return {
    offers: selected,
    totalQuantity,
    remainingQuantity: normalizedRemaining,
    skipped: skips,
    hasBuyerTargetPrice: true,
    buyerTargetPrice,
  };
};
