import buyerService from '@services/buyerService';

export const buyerOrdersService = {
  fetchTradeOperations: () => buyerService.getMyTradeOperations(),
  fetchStatistics: () => buyerService.getMyStatistics(),
};
