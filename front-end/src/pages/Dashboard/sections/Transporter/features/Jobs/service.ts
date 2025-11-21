import transportService, { TransportJob } from '@services/transportService';

export interface TransporterJobFilters {
  status?: string;
}

export interface TransporterJobStartPayload {
  actualPickupTime?: string;
  notes?: string;
}

export interface TransporterPickupPayload {
  pickupNotes?: string;
  actualWeight?: number;
  pickupPhotos?: string[];
}

export interface TransporterDeliveryPayload {
  deliveryPhotos?: string[];
  proofOfDelivery?: string;
  deliveryNotes?: string;
  recipientSignature?: string;
}

export const transporterJobsService = {
  fetchJobs: (filters?: TransporterJobFilters): Promise<TransportJob[]> =>
    transportService.getMyJobs(filters),
  startJob: (jobId: string, payload?: TransporterJobStartPayload) =>
    transportService.startJob(jobId, payload),
  completePickup: (jobId: string, payload: TransporterPickupPayload) =>
    transportService.completePickup(jobId, payload),
  completeDelivery: (jobId: string, payload: TransporterDeliveryPayload) =>
    transportService.completeDelivery(jobId, payload),
};

export type { TransportJob } from '@services/transportService';
