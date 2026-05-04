import { format } from 'date-fns';
import type { TransportJob } from '../service';
import type { TransporterDisplayJob, TransporterJobSummary } from '../types';
import type {
  TransporterDeliveryPayload,
  TransporterPickupPayload,
  TransporterJobStartPayload,
} from '../service';

const STATUS_COLOR_MAP: Record<string, string> = {
  ASSIGNED: 'text-blue-400',
  IN_TRANSIT: 'text-yellow-400',
  DELIVERING: 'text-orange-400',
  COMPLETED: 'text-green-400',
};

export const getStatusColorClass = (status?: string): string =>
  STATUS_COLOR_MAP[status?.toUpperCase() ?? ''] ?? 'text-gray-400';

const formatWeightLabel = (weight?: number | null): string =>
  typeof weight === 'number' ? `${weight} tons` : 'N/A';

const formatEtaLabel = (date?: string | null): string | undefined =>
  date ? `ETA: ${format(new Date(date), 'MMM dd, HH:mm')}` : undefined;

export const buildJobSummary = (jobs: TransportJob[]): TransporterJobSummary => {
  const today = new Date().toDateString();

  return jobs.reduce<TransporterJobSummary>(
    (acc, job) => {
      if (job.status === 'ASSIGNED' || job.status === 'IN_TRANSIT' || job.status === 'DELIVERING') {
        acc.active += 1;
      }
      if (job.status === 'IN_TRANSIT' || job.status === 'DELIVERING') {
        acc.inTransit += 1;
      }
      if (
        job.status === 'COMPLETED' &&
        job.estimatedArrival &&
        new Date(job.estimatedArrival).toDateString() === today
      ) {
        acc.completedToday += 1;
      }
      return acc;
    },
    { active: 0, inTransit: 0, completedToday: 0 }
  );
};

export const mapJobsToDisplay = (jobs: TransportJob[]): TransporterDisplayJob[] =>
  jobs.map((job) => {
    const pickupsCompleted = job.pickupsCompleted?.length ?? 0;
    const pickupPointsTotal = job.transportRequest?.pickupPoints?.length ?? 1;

    return {
      id: job.id,
      jobNumber: job.jobNumber,
      status: job.status,
      statusColorClass: getStatusColorClass(job.status),
      totalWeightLabel: formatWeightLabel(job.transportRequest?.totalWeight),
      etaLabel: formatEtaLabel(job.estimatedArrival),
      pickupsCompleted,
      pickupPointsTotal,
      currentLocationLabel: job.currentLocation?.address ?? 'Location updating...',
      hasLocation: Boolean(job.currentLocation),
      requestNumber: job.transportRequest?.requestNumber,
      canStart: job.status === 'ASSIGNED',
      canCompletePickup: job.status === 'IN_TRANSIT' && !job.allPickupsComplete,
      canCompleteDelivery: job.status === 'IN_TRANSIT' && Boolean(job.allPickupsComplete),
      isCompleted: job.status === 'COMPLETED',
    };
  });

export const createDefaultStartPayload = (): TransporterJobStartPayload => ({
  actualPickupTime: new Date().toISOString(),
});

export const createDefaultPickupPayload = (): TransporterPickupPayload => ({
  pickupNotes: 'Pickup completed successfully',
  actualWeight: 100,
  pickupPhotos: [],
});

export const createDefaultDeliveryPayload = (): TransporterDeliveryPayload => ({
  deliveryNotes: 'Delivery completed successfully',
  deliveryPhotos: [],
  recipientSignature: 'Signed digitally',
});
