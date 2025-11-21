import transportService, {
  TransportBid,
  TransportJob,
  TransportRequest,
  TransporterAnalyticsSummary,
  TransporterPerformance,
} from '@services/transportService';

const mapAnalyticsToPerformance = (
  analytics: TransporterAnalyticsSummary
): TransporterPerformance => ({
  transporterId: 'me',
  completedJobs: analytics.metrics.completedJobs,
  totalJobs: analytics.metrics.completedJobs + analytics.metrics.activeJobs,
  completionRate: analytics.metrics.winRate,
  onTimeDeliveryRate: analytics.metrics.onTimeDeliveryRate,
  recentJobs: (analytics.recentJobs as TransportJob[]) ?? [],
});

export const transporterBiddingService = {
  fetchRequests: (): Promise<TransportRequest[]> => transportService.getAvailableRequests(),
  fetchBids: (): Promise<TransportBid[]> => transportService.getMyBids(),
  fetchPerformance: async (): Promise<TransporterPerformance> =>
    mapAnalyticsToPerformance(await transportService.getMyAnalytics()),
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
