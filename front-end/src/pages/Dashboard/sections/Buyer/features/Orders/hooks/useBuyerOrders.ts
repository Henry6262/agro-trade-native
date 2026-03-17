import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { buyerOrdersService } from '../service';
import type { BuyerOrdersHookResult } from '../types';
import type { TradeOperation } from '@services/buyerService';
import { deriveBuyerStatistics, mapOfferToIncoming, mapOperationToOrder } from '../utils';

export const useBuyerOrders = (): BuyerOrdersHookResult => {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pagination state
  const [extraOperations, setExtraOperations] = useState<TradeOperation[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const isFetchingMoreRef = useRef(false);

  const operationsQuery = useQuery({
    queryKey: ['buyer', 'orders', 'operations'],
    queryFn: () => buyerOrdersService.fetchTradeOperations({ limit: 20 }),
  });

  const statsQuery = useQuery({
    queryKey: ['buyer', 'orders', 'stats'],
    queryFn: buyerOrdersService.fetchStatistics,
  });

  const offersQuery = useQuery({
    queryKey: ['buyer', 'orders', 'offers'],
    queryFn: buyerOrdersService.fetchIncomingOffers,
  });

  // When the initial page loads, initialise cursor state
  useEffect(() => {
    if (operationsQuery.data) {
      setCursor(operationsQuery.data.nextCursor);
      setHasMore(!!operationsQuery.data.nextCursor);
      setExtraOperations([]);
    }
  }, [operationsQuery.data]);

  const fetchMore = useCallback(async () => {
    if (!hasMore || isFetchingMoreRef.current || !cursor) return;
    isFetchingMoreRef.current = true;
    setIsFetchingMore(true);
    try {
      const res = await buyerOrdersService.fetchTradeOperations({ limit: 20, cursor });
      if (res.items.length) {
        setExtraOperations((prev) => [...prev, ...res.items]);
        setCursor(res.nextCursor);
        setHasMore(!!res.nextCursor);
      } else {
        setHasMore(false);
      }
    } finally {
      isFetchingMoreRef.current = false;
      setIsFetchingMore(false);
    }
  }, [cursor, hasMore]);

  const allOperations = useMemo(
    () => [...(operationsQuery.data?.items ?? []), ...extraOperations],
    [operationsQuery.data?.items, extraOperations]
  );

  const orders = useMemo(() => allOperations.map(mapOperationToOrder), [allOperations]);
  const stats = useMemo(
    () => deriveBuyerStatistics(allOperations, statsQuery.data),
    [allOperations, statsQuery.data]
  );
  const incomingOffers = useMemo(
    () => offersQuery.data?.map(mapOfferToIncoming) ?? [],
    [offersQuery.data]
  );

  const isLoading = operationsQuery.isLoading || statsQuery.isLoading || offersQuery.isLoading;

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setExtraOperations([]);
    setCursor(null);
    setHasMore(true);
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
    isFetchingMore,
    hasMore,
    toggleOrderExpand,
    refresh,
    fetchMore,
  };
};
