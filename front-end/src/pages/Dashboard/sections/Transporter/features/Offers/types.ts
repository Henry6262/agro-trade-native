import type { MapOffer } from '../maps/types';
import type {
  TransportBid,
  TransportDeliveryPoint,
  TransportPickupPoint,
  TransportRequest,
} from '@services/transportService';

export type TransportOffersRequest = TransportRequest;
export type TransportOffersBid = TransportBid;
export type TransportOffersPickupPoint = TransportPickupPoint;
export type TransportOffersDeliveryPoint = TransportDeliveryPoint;
export type TransportOffersMapOffer = MapOffer;

export interface TransportOfferSummary {
  totalPending: number;
  verifiedCount: number;
  earliestDeadline?: string;
  totalWeight: number;
}

export interface TransporterOfferActionOptions {
  duration?: number;
  vehicleType?: string;
  vehicleCapacity?: number;
}

export interface TransporterOfferActionResult {
  success: boolean;
  errorMessage?: string;
}

export interface TransporterOffersHookResult {
  requests: TransportOffersRequest[];
  summary: TransportOfferSummary;
  selectedMapOffer: TransportOffersMapOffer | null;
  setSelectedMapOffer: (offer: TransportOffersMapOffer | null) => void;
  isLoading: boolean;
  isRefreshing: boolean;
  submittingBid: string | null;
  refresh: () => Promise<void>;
  hasBidOnRequest: (requestId: string) => boolean;
  submitBid: (
    requestId: string,
    amount: number,
    options?: TransporterOfferActionOptions
  ) => Promise<TransporterOfferActionResult>;
  viewRoute: (request: TransportOffersRequest) => void;
}
