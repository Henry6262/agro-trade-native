import { useCallback, useEffect, useMemo, useState } from 'react';
import transportService from '@services/transportService';
import type {
  TransportOffersBid,
  TransportOffersRequest,
  TransportOfferSummary,
  TransportOffersMapOffer,
} from '../types';
import { buildMapOffer, summarizeRequests } from '../utils';

export const useTransporterOffers = () => {
  const [requests, setRequests] = useState<TransportOffersRequest[]>([]);
  const [bids, setBids] = useState<TransportOffersBid[]>([]);
  const [selectedMapOffer, setSelectedMapOffer] = useState<TransportOffersMapOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingBid, setSubmittingBid] = useState<string | null>(null);

  const summary: TransportOfferSummary = useMemo(() => summarizeRequests(requests), [requests]);
  const availableRequests = requests.filter((req) => req.status?.toUpperCase() === "OPEN");
  const pendingHighPriority = availableRequests.filter((req) => req.urgencyLevel?.toUpperCase() === "HIGH");

  const loadTransportRequests = useCallback(async () => {
    try {
      const [available, myBids] = await Promise.all([
        transportService.getAvailableRequests(),
        transportService.getMyBids(),
      ]);
      setRequests(available);
      setBids(myBids);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadTransportRequests().catch((error) =>
      console.error('Failed to load transport requests', error)
    );
  }, [loadTransportRequests]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTransportRequests();
  }, [loadTransportRequests]);

  const hasBidOnRequest = useCallback(
    (requestId: string) => bids.some((bid) => bid.transportRequestId === requestId),
    [bids]
  );

  const handleSubmitBid = useCallback(
    async (
      requestId: string,
      amount: number,
      options?: { duration?: number; vehicleType?: string; vehicleCapacity?: number }
    ) => {
      try {
        setSubmittingBid(requestId);
        await transportService.submitBid({
          transportRequestId: requestId,
          bidAmount: amount,
          estimatedDuration: options?.duration ?? 24,
          vehicleType: options?.vehicleType ?? 'FLATBED',
          vehicleCapacity: options?.vehicleCapacity ?? 40,
        });
        await loadTransportRequests();
      } finally {
        setSubmittingBid(null);
      }
    },
    [loadTransportRequests]
  );

  const handleViewRoute = useCallback((request: TransportOffersRequest) => {
    setSelectedMapOffer(buildMapOffer(request));
  }, []);

  return {
    requests,
    bids,
    summary,
    selectedMapOffer,
    setSelectedMapOffer,
    loading,
    refreshing,
    submittingBid,
    handleRefresh,
    hasBidOnRequest,
    handleSubmitBid,
    handleViewRoute,
  };
};
