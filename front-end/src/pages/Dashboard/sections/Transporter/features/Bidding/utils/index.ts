import type { MapOffer } from '../../maps/types';
import type { TransportBid, TransportRequest, TransporterPerformance } from '../types';
import { TransportPickupPoint, TransportDeliveryPoint } from '@services/transportService';
import { TransporterBiddingRequestView, TransporterBiddingSummary } from '../types';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

export const formatCurrency = (value?: number | null): string =>
  typeof value === 'number' ? currencyFormatter.format(value) : '—';

export const formatDistance = (distance?: number | null): string =>
  typeof distance === 'number' ? `${Math.round(distance)} km` : '—';

export const formatTimeRemaining = (deadline?: string): string => {
  if (!deadline) return '—';
  const now = Date.now();
  const target = new Date(deadline).getTime();
  const diff = target - now;
  if (diff <= 0) return 'Expired';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  return `${hours}h ${minutes}m`;
};

const toLocationLabel = (point?: TransportPickupPoint | TransportDeliveryPoint): string =>
  point?.address?.split(',')[0] ||
  (point as TransportPickupPoint | undefined)?.sellerName ||
  'Location';

const DEFAULT_COORDS = {
  lat: 42.6977,
  lng: 23.3219,
};

export const buildMapOfferFromRequest = (request: TransportRequest): MapOffer => {
  const pickupPoint = request.pickupPoints?.[0];
  const deliveryPoint = request.deliveryPoint;

  return {
    id: request.id,
    quantity: request.totalWeight,
    pickup: {
      coordinates: {
        latitude: pickupPoint?.lat ?? DEFAULT_COORDS.lat,
        longitude: pickupPoint?.lng ?? DEFAULT_COORDS.lng,
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
        latitude: deliveryPoint?.lat ?? DEFAULT_COORDS.lat,
        longitude: deliveryPoint?.lng ?? DEFAULT_COORDS.lng,
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
    estimatedValue: request.maxBudget ?? 0,
    productType: request.tradeOperation?.buyListing?.product?.name || 'Agricultural Goods',
  };
};

export const buildBiddingSummary = (
  bids: TransportBid[],
  performance: TransporterPerformance | null
): TransporterBiddingSummary => {
  const pendingBids = bids.filter((bid) => bid.status === 'PENDING');
  const acceptedBids = bids.filter((bid) => bid.status === 'ACCEPTED');

  const winRate =
    bids.length === 0 ? '0%' : `${Math.round((acceptedBids.length / bids.length) * 100)}%`;

  const averageBid =
    bids.length === 0
      ? formatCurrency(0)
      : formatCurrency(
          bids.reduce((sum, bid) => sum + (bid.bidAmount ?? 0), 0) / Math.max(bids.length, 1)
        );

  return {
    activeBids: pendingBids.length,
    winRate,
    averageBid,
    completedJobs: performance?.completedJobs ?? 0,
  };
};

export const mapRequestsToView = (
  requests: TransportRequest[],
  hasBidOnRequest: (requestId: string) => boolean
): TransporterBiddingRequestView[] =>
  requests.map((request) => {
    const productName = request.tradeOperation?.buyListing?.product?.name || 'Agricultural Goods';
    const pickupPoint = request.pickupPoints?.[0];
    const deliveryPoint = request.deliveryPoint;
    const hasBid = hasBidOnRequest(request.id);

    const lowestBid = request.lowestBid ?? undefined;
    const pricePerKm =
      lowestBid && request.estimatedDistance
        ? lowestBid / Math.max(request.estimatedDistance, 1)
        : undefined;

    return {
      id: request.id,
      reference: request.requestNumber || productName,
      productName,
      productInitial: productName.charAt(0).toUpperCase(),
      totalWeightLabel: request.totalWeight ? `${request.totalWeight} tons` : 'N/A',
      distanceLabel: formatDistance(request.estimatedDistance),
      biddingDeadlineLabel: new Date(request.biddingDeadline).toLocaleDateString(),
      timeRemainingLabel: formatTimeRemaining(request.biddingDeadline),
      pickupLabel: toLocationLabel(pickupPoint),
      deliveryLabel: toLocationLabel(deliveryPoint),
      lowestBidLabel: lowestBid ? formatCurrency(lowestBid) : 'No bids yet',
      pricePerKmLabel: pricePerKm ? `${formatCurrency(pricePerKm)}/km` : '--',
      bidsCountLabel: `${request.bidsCount ?? 0} bids`,
      maxBudgetLabel: formatCurrency(request.maxBudget),
      urgencyLabel: request.urgencyLevel,
      hasBid,
      mapOffer: buildMapOfferFromRequest(request),
      request,
    };
  });
