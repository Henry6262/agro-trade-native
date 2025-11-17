import { useCallback, useEffect, useState } from 'react';
import { buyerOrdersService } from '../service';
import type { BuyerIncomingOffer, BuyerOrder, BuyerOrdersHookResult, BuyerStatistics } from '../types';
import { buildMockIncomingOffers, getDefaultBuyerStatistics, mapOperationToOrder } from '../utils';

export const useBuyerOrders = (): BuyerOrdersHookResult => {
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [stats, setStats] = useState<BuyerStatistics>(getDefaultBuyerStatistics());
  const [incomingOffers, setIncomingOffers] = useState<BuyerIncomingOffer[]>(buildMockIncomingOffers());
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [operations, statistics] = await Promise.all([
        buyerOrdersService.fetchTradeOperations(),
        buyerOrdersService.fetchStatistics(),
      ]);
      setOrders(operations.map(mapOperationToOrder));
      setStats(statistics ?? getDefaultBuyerStatistics());
    } catch (error) {
      console.error('Failed to load buyer orders', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    loadData();
  }, [loadData]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadData();
  }, [loadData]);

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
