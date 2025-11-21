import sellerService, { SellerStats, SellerTradeRecord } from '@services/sellerService';

export const sellerTradesService = {
  fetchTrades: (): Promise<SellerTradeRecord[]> => sellerService.getMyTrades(),
  fetchStats: (): Promise<SellerStats> => sellerService.getMyStats(),
};
