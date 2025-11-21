import { formatDate } from '@shared/utils';
import type {
  TransportJob,
  TransportPickupPoint,
  TransportDeliveryPoint,
} from '@services/transportService';
import type { MapOffer } from '@features/dashboard/screens/transporter/maps/types';
import type { TransfersJobView, TransfersSummary } from '../types';

const DEFAULT_COORDS = { lat: 42.6977, lng: 23.3219 };

export const stageDefinitions = [
  { name: 'Assigned', description: 'Job assigned & awaiting pickup' },
  { name: 'Started', description: 'Driver en route to pickup' },
  { name: 'In Transit', description: 'Cargo picked up, en route to delivery' },
  { name: 'Completed', description: 'Delivery confirmed' },
];

export const stageIndexFromStatus = (status?: string): number => {
  switch ((status || '').toUpperCase()) {
    case 'ASSIGNED':
      return 0;
    case 'STARTED':
      return 1;
    case 'IN_TRANSIT':
      return 2;
    case 'COMPLETED':
      return 3;
    default:
      return 0;
  }
};

const toLocationLabel = (point?: TransportPickupPoint | TransportDeliveryPoint): string =>
  point?.address?.split(',')[0] ||
  (point as TransportPickupPoint | undefined)?.sellerName ||
  'Location';

export const buildMapOffer = (job: TransportJob): MapOffer => {
  const pickupPoint = job.transportRequest?.pickupPoints?.[0];
  const deliveryPoint = job.transportRequest?.deliveryPoint;

  return {
    id: job.id,
    quantity: job.transportRequest?.totalWeight ?? 0,
    pickup: {
      coordinates: {
        latitude: pickupPoint?.lat ?? DEFAULT_COORDS.lat,
        longitude: pickupPoint?.lng ?? DEFAULT_COORDS.lng,
      },
      address: {
        street: pickupPoint?.address || 'Pickup Location',
        city: pickupPoint?.sellerName || '',
        state: '',
        country: '',
      },
      name: pickupPoint?.address || 'Pickup',
      type: 'pickup',
    },
    delivery: {
      coordinates: {
        latitude: deliveryPoint?.lat ?? DEFAULT_COORDS.lat,
        longitude: deliveryPoint?.lng ?? DEFAULT_COORDS.lng,
      },
      address: {
        city: deliveryPoint?.address || 'Delivery Location',
        state: '',
        country: '',
      },
      name: deliveryPoint?.address || 'Delivery',
      type: 'delivery',
    },
    deadline: job.estimatedArrival ? new Date(job.estimatedArrival) : new Date(),
    status:
      (job.status?.toLowerCase() as 'pending' | 'accepted' | 'in_transit' | 'delivered') ??
      'pending',
    estimatedValue: job.transportRequest?.maxBudget ?? 0,
    productType: job.transportRequest?.tradeOperation?.buyListing?.product?.name ?? 'Transport Job',
  };
};

export const summarizeTransfers = (
  jobs: TransportJob[],
  currencyFormatter: Intl.NumberFormat
): TransfersSummary => {
  const activeJobs = jobs.filter((job) => job.status !== 'COMPLETED');
  const completedJobs = jobs.filter((job) => job.status === 'COMPLETED');
  const totalBudget = completedJobs.reduce(
    (sum, job) => sum + (job.transportRequest?.maxBudget ?? 0),
    0
  );

  return {
    activeJobs: activeJobs.length,
    completedJobs: completedJobs.length,
    totalEarningsLabel: completedJobs.length ? currencyFormatter.format(totalBudget) : '—',
  };
};

export const mapJobsToView = (
  jobs: TransportJob[],
  currencyFormatter: Intl.NumberFormat
): TransfersJobView[] =>
  jobs.map((job) => ({
    id: job.id,
    jobNumber: job.jobNumber,
    productName: job.transportRequest?.tradeOperation?.buyListing?.product?.name ?? 'Transport Job',
    buyerName: job.transportRequest?.tradeOperation?.buyListing?.buyer?.name ?? undefined,
    status: job.status,
    totalWeightLabel: `${job.transportRequest?.totalWeight ?? '—'} tons`,
    budgetLabel: job.transportRequest?.maxBudget
      ? currencyFormatter.format(job.transportRequest.maxBudget)
      : '—',
    pickupLabel: toLocationLabel(job.transportRequest?.pickupPoints?.[0]),
    deliveryLabel: toLocationLabel(job.transportRequest?.deliveryPoint),
    etaLabel: job.estimatedArrival ? formatDate(new Date(job.estimatedArrival)) : undefined,
    updatedAtLabel: job.updatedAt ? formatDate(new Date(job.updatedAt)) : '',
    stageIndex: stageIndexFromStatus(job.status),
    mapOffer: buildMapOffer(job),
  }));
