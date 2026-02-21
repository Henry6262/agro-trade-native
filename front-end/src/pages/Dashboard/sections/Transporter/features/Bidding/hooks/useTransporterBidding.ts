import { useCallback, useEffect, useMemo, useState } from 'react';
import { transporterBiddingService } from '../service';
import type {
  TransporterBiddingHookResult,
  TransporterBidActionResult,
  TransportRequest,
  TransportBid,
  TransporterPerformance,
} from '../types';
import type { MapOffer } from '../../maps/types';
import { buildBiddingSummary, buildMapOfferFromRequest, mapRequestsToView } from '../utils';

export const useTransporterBidding = (): TransporterBiddingHookResult => {
  const [requests, setRequests] = useState<TransportRequest[]>([]);
  const [bids, setBids] = useState<TransportBid[]>([]);
  const [performance, setPerformance] = useState<TransporterPerformance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [mapOffer, setMapOffer] = useState<MapOffer | null>(null);
  const [isMapDrawerOpen, setIsMapDrawerOpen] = useState(false);

  const isVerified = true;

  const loadData = useCallback(async () => {
    try {
      const [fetchedRequests, fetchedBids] = await Promise.all([
        transporterBiddingService.fetchRequests(),
        transporterBiddingService.fetchBids(),
      ]);
      setRequests(fetchedRequests);
      setBids(fetchedBids);

      try {
        const stats = await transporterBiddingService.fetchPerformance();
        setPerformance(stats);
      } catch (performanceError) {
        console.warn('Failed to load transporter performance', performanceError);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    loadData().catch((error) => console.error('Failed to load transporter bidding data', error));
  }, [loadData]);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    loadData().catch((error) => console.error('Failed to refresh transporter bidding data', error));
  }, [loadData]);

  const hasBidOnRequest = useCallback(
    (requestId: string) =>
      bids.some(
        (bid: TransportBid) => bid.transportRequestId === requestId && bid.status === 'PENDING'
      ),
    [bids]
  );

  const summary = useMemo(() => buildBiddingSummary(bids, performance), [bids, performance]);
  const requestViews = useMemo(
    () => mapRequestsToView(requests, hasBidOnRequest),
    [requests, hasBidOnRequest]
  );

  const selectRequest = useCallback((request: TransportRequest) => {
    setSelectedRequestId(request.id);
    if (request.lowestBid) {
      setBidAmount(Math.ceil(request.lowestBid + 50).toString());
    } else {
      setBidAmount('');
    }
  }, []);

  const cancelSelection = useCallback(() => {
    setSelectedRequestId(null);
    setBidAmount('');
  }, []);

  const submitBid = useCallback(
    async (requestId: string): Promise<TransporterBidActionResult> => {
      const numericAmount = parseFloat(bidAmount);
      if (!numericAmount || Number.isNaN(numericAmount) || numericAmount <= 0) {
        return { success: false, errorMessage: 'Enter a valid bid amount' };
      }

      setIsSubmitting(true);
      try {
        const matchedRequest = requests.find((r) => r.id === requestId);
        await transporterBiddingService.submitBid({
          transportRequestId: requestId,
          tradeOperationId: matchedRequest?.tradeOperationId || '',
          bidAmount: numericAmount,
        });
        cancelSelection();
        await loadData();
        return { success: true };
      } catch (error) {
        console.error('Failed to submit bid', error);
        return { success: false, errorMessage: 'Failed to submit bid' };
      } finally {
        setIsSubmitting(false);
      }
    },
    [bidAmount, cancelSelection, loadData]
  );

  const viewRoute = useCallback((request: TransportRequest) => {
    setMapOffer(buildMapOfferFromRequest(request));
    setIsMapDrawerOpen(true);
  }, []);

  const closeMapDrawer = useCallback(() => {
    setIsMapDrawerOpen(false);
    setMapOffer(null);
  }, []);

  return {
    summary,
    requestViews,
    isLoading,
    isRefreshing,
    isSubmitting,
    selectedRequestId,
    bidAmount,
    isVerified,
    mapOffer,
    isMapDrawerOpen,
    refresh,
    selectRequest,
    cancelSelection,
    setBidAmount,
    submitBid,
    viewRoute,
    closeMapDrawer,
  };
};
