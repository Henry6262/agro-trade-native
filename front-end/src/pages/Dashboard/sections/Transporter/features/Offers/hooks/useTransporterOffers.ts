import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { transporterOffersService } from '../service';
import type {
  TransportOffersBid,
  TransportOffersRequest,
  TransporterOfferActionOptions,
  TransporterOfferActionResult,
  TransporterOffersHookResult,
  TransportOfferSummary,
  TransportOffersMapOffer,
} from '../types';
import { buildMapOffer, summarizeRequests } from '../utils';

export const useTransporterOffers = (): TransporterOffersHookResult => {
  const [requests, setRequests] = useState<TransportOffersRequest[]>([]);
  const [bids, setBids] = useState<TransportOffersBid[]>([]);
  const [selectedMapOffer, setSelectedMapOffer] = useState<TransportOffersMapOffer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [submittingBid, setSubmittingBid] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const summary: TransportOfferSummary = useMemo(() => summarizeRequests(requests), [requests]);

  const loadTransportRequests = useCallback(async () => {
    const [available, myBids] = await Promise.all([
      transporterOffersService.fetchRequests(),
      transporterOffersService.fetchBids(),
    ]);
    setRequests(available);
    setBids(myBids);
  }, []);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    setIsLoading(true);
    loadTransportRequests()
      .catch((error) => console.error('Failed to load transport requests', error))
      .finally(() => setIsLoading(false));
  }, [loadTransportRequests]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadTransportRequests().catch((error) =>
      console.error('Failed to refresh transport requests', error)
    );
    setIsRefreshing(false);
  }, [loadTransportRequests]);

  const hasBidOnRequest = useCallback(
    (requestId: string) => bids.some((bid) => bid.transportRequestId === requestId),
    [bids]
  );

  const submitBid = useCallback(
    async (
      requestId: string,
      amount: number,
      options?: TransporterOfferActionOptions
    ): Promise<TransporterOfferActionResult> => {
      setSubmittingBid(requestId);
      try {
        await transporterOffersService.submitBid(requestId, amount, options);
        await loadTransportRequests();
        return { success: true };
      } catch (error) {
        console.error('Failed to submit bid', error);
        return { success: false, errorMessage: 'Failed to submit bid' };
      } finally {
        setSubmittingBid(null);
      }
    },
    [loadTransportRequests]
  );

  const viewRoute = useCallback((request: TransportOffersRequest) => {
    setSelectedMapOffer(buildMapOffer(request));
  }, []);

  return {
    requests,
    summary,
    selectedMapOffer,
    setSelectedMapOffer,
    isLoading,
    isRefreshing,
    submittingBid,
    refresh,
    hasBidOnRequest,
    submitBid,
    viewRoute,
  };
};
