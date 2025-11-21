import type { TransportOffersMapOffer, TransportOfferSummary } from '../types';
import type { TransportRequest } from '@services/transportService';

export const buildMapOffer = (request: TransportRequest): TransportOffersMapOffer => {
  const pickupPoint = request.pickupPoints?.[0];
  const deliveryPoint = request.deliveryPoint;

  return {
    id: request.id,
    quantity: request.totalWeight,
    pickup: {
      coordinates: {
        latitude: pickupPoint?.lat ?? 42.6977,
        longitude: pickupPoint?.lng ?? 23.3219,
      },
      address: {
        street: pickupPoint?.address || 'Pickup Location',
        city: pickupPoint?.sellerName || '',
        state: '',
        country: '',
      },
      name: pickupPoint?.address || 'Pickup',
      type: 'pickup',
    },
    delivery: {
      coordinates: {
        latitude: deliveryPoint?.lat ?? 42.1354,
        longitude: deliveryPoint?.lng ?? 24.7453,
      },
      address: {
        city: deliveryPoint?.address || 'Delivery Location',
        state: '',
        country: '',
      },
      name: deliveryPoint?.address || 'Delivery',
      type: 'delivery',
    },
    deadline: new Date(request.biddingDeadline),
    status: 'pending',
    estimatedValue: request.maxBudget || 5000,
    productType: request.tradeOperation?.buyListing?.product?.name || 'Agricultural Goods',
  };
};

export const summarizeRequests = (requests: TransportRequest[]): TransportOfferSummary => {
  const pending = requests.filter((r) => r.status?.toUpperCase() === 'OPEN');
  const verified = pending.filter((r) => r.isVerified);
  const earliest = pending
    .map((r) => r.biddingDeadline)
    .filter(Boolean)
    .sort()[0];

  return {
    totalPending: pending.length,
    verifiedCount: verified.length,
    earliestDeadline: earliest,
    totalWeight: pending.reduce((sum, req) => sum + (req.totalWeight || 0), 0),
  };
};
