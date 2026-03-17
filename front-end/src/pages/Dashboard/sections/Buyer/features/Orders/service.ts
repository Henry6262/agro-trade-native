import buyerService from '@services/buyerService';
import type { TradeOperation } from '@services/buyerService';

export interface OrderPageResult {
  items: TradeOperation[];
  nextCursor: string | null;
}

export const buyerOrdersService = {
  fetchTradeOperations: (params?: { limit?: number; cursor?: string }): Promise<OrderPageResult> =>
    buyerService.getMyTradeOperationsPaginated(params?.limit ?? 20, params?.cursor),
  fetchStatistics: () => buyerService.getMyStatistics(),
  fetchTimeline: (limit = 20) => buyerService.getMyTimeline(limit),
  fetchIncomingOffers: () => buyerService.getMyOffers(),
};
