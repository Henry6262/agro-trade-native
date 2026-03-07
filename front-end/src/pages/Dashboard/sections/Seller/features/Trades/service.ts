import sellerService, { SellerStats, SellerTradeRecord } from '@services/sellerService';

export interface TradePageResult {
  items: SellerTradeRecord[];
  nextCursor: string | null;
}

export const sellerTradesService = {
  fetchTrades: async (params?: { limit?: number; cursor?: string }): Promise<TradePageResult> => {
    const raw = await sellerService.getMyTrades(params);
    // Backend may return plain array (no pagination) or paginated object
    if (Array.isArray(raw)) {
      return { items: raw, nextCursor: null };
    }
    return raw as TradePageResult;
  },
  fetchStats: (): Promise<SellerStats> => sellerService.getMyStats(),
};
