import transportService, { TransportJob, TransporterPerformance } from '@services/transportService';

export const transporterTransfersService = {
  fetchJobs: (): Promise<TransportJob[]> => transportService.getMyJobs(),
  fetchPerformance: (transporterId: string): Promise<TransporterPerformance> =>
    transportService.getTransporterPerformance(transporterId),
};

export type { TransporterPerformance };
