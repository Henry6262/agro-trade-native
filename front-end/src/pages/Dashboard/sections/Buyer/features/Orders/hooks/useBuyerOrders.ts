import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { buyerOrdersService } from '../service';
import type { BuyerOrdersHookResult } from '../types';
import { deriveBuyerStatistics, mapOfferToIncoming, mapOperationToOrder } from '../utils';

export const useBuyerOrders = (): BuyerOrdersHookResult => {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const operationsQuery = useQuery({
    queryKey: ['buyer', 'orders', 'operations'],
    queryFn: buyerOrdersService.fetchTradeOperations,
  });

  const statsQuery = useQuery({
    queryKey: ['buyer', 'orders', 'stats'],
    queryFn: buyerOrdersService.fetchStatistics,
  });

  const offersQuery = useQuery({
    queryKey: ['buyer', 'orders', 'offers'],
    queryFn: buyerOrdersService.fetchIncomingOffers,
  });

  const orders = operationsQuery.data?.map(mapOperationToOrder) ?? [];
  const stats = deriveBuyerStatistics(operationsQuery.data ?? [], statsQuery.data);
  const incomingOffers = offersQuery.data?.map(mapOfferToIncoming) ?? [];
  const isLoading = operationsQuery.isLoading || statsQuery.isLoading || offersQuery.isLoading;

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([operationsQuery.refetch(), statsQuery.refetch(), offersQuery.refetch()]);
    setIsRefreshing(false);
  }, [operationsQuery, statsQuery, offersQuery]);

  const toggleOrderExpand = useCallback((orderId: string) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  }, []);

  return {
    orders,
    stats,
    incomingOffers,
    expandedOrderId,
    isLoading,
    isRefreshing,
    toggleOrderExpand,
    refresh,
  };
};
