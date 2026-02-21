import type { TransportJob } from '@services/transportService';
import type { MapOffer } from '../maps/types';

export type TransfersJobStatus = TransportJob['status'];

export interface TransfersSummary {
  activeJobs: number;
  completedJobs: number;
  totalEarningsLabel: string;
}

export interface TransfersJobView {
  id: string;
  jobNumber: string;
  productName: string;
  buyerName?: string;
  status: TransfersJobStatus;
  totalWeightLabel: string;
  budgetLabel: string;
  pickupLabel: string;
  deliveryLabel: string;
  etaLabel?: string;
  updatedAtLabel: string;
  stageIndex: number;
  mapOffer: MapOffer;
}

export interface TransporterTransfersHookResult {
  jobs: TransfersJobView[];
  summary: TransfersSummary;
  isLoading: boolean;
  isRefreshing: boolean;
  selectedOffer: MapOffer | null;
  refresh: () => Promise<void>;
  openMap: (job: TransfersJobView) => void;
  closeMap: () => void;
}

export type { TransportJob };
