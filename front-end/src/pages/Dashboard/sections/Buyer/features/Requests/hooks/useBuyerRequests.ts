import { useCallback, useEffect, useState } from 'react';
import { buyerRequestsService } from '../service';
import type { BuyerRequest, BuyerRequestsHookResult } from '../types';
import { transformBuyerListing } from '../utils';

export const useBuyerRequests = (): BuyerRequestsHookResult => {
  const [requests, setRequests] = useState<BuyerRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRequestCreation, setShowRequestCreation] = useState(false);
  const [showOffersDrawer, setShowOffersDrawer] = useState(false);
  const [selectedRequestOffers, setSelectedRequestOffers] = useState<BuyerRequest | null>(null);

  const loadRequests = useCallback(async () => {
    try {
      setError(null);
      const listings = await buyerRequestsService.fetchBuyerListings();
      setRequests(listings.map(transformBuyerListing));
    } catch (err) {
      console.error('Failed to load buyer requests', err);
      setError('Failed to load buyer requests');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    loadRequests();
  }, [loadRequests]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadRequests();
  }, [loadRequests]);

  const openRequestCreation = () => setShowRequestCreation(true);
  const closeRequestCreation = () => setShowRequestCreation(false);

  const openOffersDrawer = (request: BuyerRequest) => {
    setSelectedRequestOffers(request);
    setShowOffersDrawer(true);
  };

  const closeOffersDrawer = () => {
    setShowOffersDrawer(false);
    setSelectedRequestOffers(null);
  };

  return {
    requests,
    isLoading,
    isRefreshing,
    error,
    showRequestCreation,
    selectedRequestOffers,
    showOffersDrawer,
    openRequestCreation,
    closeRequestCreation,
    openOffersDrawer,
    closeOffersDrawer,
    refresh,
  };
};
