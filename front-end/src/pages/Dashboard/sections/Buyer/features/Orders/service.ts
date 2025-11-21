import buyerService from '@services/buyerService';

export const buyerOrdersService = {
  fetchTradeOperations: () => buyerService.getMyTradeOperations(),
  fetchStatistics: () => buyerService.getMyStatistics(),
  fetchTimeline: (limit = 20) => buyerService.getMyTimeline(limit),
  fetchIncomingOffers: () => buyerService.getMyOffers(),
};
