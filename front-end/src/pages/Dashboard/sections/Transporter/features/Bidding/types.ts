import type {
  TransportBid,
  TransportDeliveryPoint,
  TransportPickupPoint,
  TransportRequest,
  TransporterPerformance,
} from '@services/transportService';
import type { MapOffer } from '../maps/types';

export interface TransporterBiddingSummary {
  activeBids: number;
  winRate: string;
  averageBid: string;
  completedJobs: number;
}

export interface TransporterBiddingRequestView {
  id: string;
  reference: string;
  productName: string;
  productInitial: string;
  totalWeightLabel: string;
  distanceLabel: string;
  biddingDeadlineLabel: string;
  timeRemainingLabel: string;
  pickupLabel: string;
  deliveryLabel: string;
  lowestBidLabel: string;
  pricePerKmLabel: string;
  bidsCountLabel: string;
  maxBudgetLabel: string;
  urgencyLabel?: string | undefined;
  hasBid: boolean;
  mapOffer: MapOffer | null;
  request: TransportRequest;
}

export interface TransporterBidActionResult {
  success: boolean;
  errorMessage?: string;
}

export interface TransporterBiddingHookResult {
  summary: TransporterBiddingSummary;
  requestViews: TransporterBiddingRequestView[];
  isLoading: boolean;
  isRefreshing: boolean;
  isSubmitting: boolean;
  selectedRequestId: string | null;
  bidAmount: string;
  isVerified: boolean;
  mapOffer: MapOffer | null;
  isMapDrawerOpen: boolean;
  refresh: () => void;
  selectRequest: (request: TransportRequest) => void;
  cancelSelection: () => void;
  setBidAmount: (value: string) => void;
  submitBid: (requestId: string) => Promise<TransporterBidActionResult>;
  viewRoute: (request: TransportRequest) => void;
  closeMapDrawer: () => void;
}

export type {
  TransportBid,
  TransportDeliveryPoint,
  TransportPickupPoint,
  TransportRequest,
  TransporterPerformance,
};
