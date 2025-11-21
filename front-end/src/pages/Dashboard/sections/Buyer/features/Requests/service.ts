import buyerService, { BuyListing } from '@services/buyerService';

export const buyerRequestsService = {
  fetchBuyerListings: (): Promise<BuyListing[]> => buyerService.getMyBuyListings(),
};
