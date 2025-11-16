import transportService, {
  TransportBid,
  TransportRequest,
  TransporterPerformance,
} from '@services/transportService';

export const transporterBiddingService = {
  fetchRequests: (): Promise<TransportRequest[]> => transportService.getAvailableRequests(),
  fetchBids: (): Promise<TransportBid[]> => transportService.getMyBids(),
  fetchPerformance: (transporterId: string): Promise<TransporterPerformance> =>
    transportService.getTransporterPerformance(transporterId),
  submitBid: (payload: {
    transportRequestId: string;
    bidAmount: number;
    estimatedDuration?: number;
    vehicleType?: string;
    vehicleCapacity?: number;
  }) =>
    transportService.submitBid({
      estimatedDuration: 24,
      vehicleType: 'FLATBED',
      vehicleCapacity: 40,
      ...payload,
    }),
};

export type { TransportBid, TransportRequest, TransporterPerformance };
