import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { buyerRequestsService } from '../service';
import type { BuyerRequest, BuyerRequestsHookResult } from '../types';
import { transformBuyerListing } from '../utils';

export const useBuyerRequests = (): BuyerRequestsHookResult => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRequestCreation, setShowRequestCreation] = useState(false);
  const [showOffersDrawer, setShowOffersDrawer] = useState(false);
  const [selectedRequestOffers, setSelectedRequestOffers] = useState<BuyerRequest | null>(null);

  const listingsQuery = useQuery({
    queryKey: ['buyer', 'listings'],
    queryFn: () => buyerRequestsService.fetchBuyerListings(),
  });

  const requests = listingsQuery.data?.map(transformBuyerListing) ?? [];
  const isLoading = listingsQuery.isLoading && !isRefreshing;
  const error = listingsQuery.error ? 'Failed to load buyer requests' : null;

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await listingsQuery.refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [listingsQuery]);

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
