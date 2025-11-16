import type {
  TransportBid,
  TransportDeliveryPoint,
  TransportPickupPoint,
  TransportRequest,
} from '@services/transportService';
import type { MapOffer } from '../../../maps/types';

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
