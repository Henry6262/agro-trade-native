import transportService from '@services/transportService';
import type { TransportOffersRequest, TransportOffersBid, TransporterOfferActionOptions } from './types';

export const transporterOffersService = {
  fetchRequests: (): Promise<TransportOffersRequest[]> => transportService.getAvailableRequests(),
  fetchBids: (): Promise<TransportOffersBid[]> => transportService.getMyBids(),
  submitBid: (
    transportRequestId: string,
    bidAmount: number,
    options?: TransporterOfferActionOptions
  ) =>
    transportService.submitBid({
      transportRequestId,
      bidAmount,
      estimatedDuration: options?.duration ?? 24,
      vehicleType: options?.vehicleType ?? 'FLATBED',
      vehicleCapacity: options?.vehicleCapacity ?? 40,
    }),
};
