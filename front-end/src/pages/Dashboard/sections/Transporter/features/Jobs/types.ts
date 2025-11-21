import type { TransportJob } from '@services/transportService';

export interface TransporterJobSummary {
  active: number;
  inTransit: number;
  completedToday: number;
}

export interface TransporterDisplayJob {
  id: string;
  jobNumber: string;
  status: string;
  statusColorClass: string;
  totalWeightLabel: string;
  etaLabel?: string;
  pickupsCompleted: number;
  pickupPointsTotal: number;
  currentLocationLabel?: string;
  hasLocation: boolean;
  requestNumber?: string;
  canStart: boolean;
  canCompletePickup: boolean;
  canCompleteDelivery: boolean;
  isCompleted: boolean;
}

export interface TransporterJobsHookResult {
  jobs: TransportJob[];
  displayJobs: TransporterDisplayJob[];
  summary: TransporterJobSummary;
  isLoading: boolean;
  isRefreshing: boolean;
  actionJobId: string | null;
  errorMessage: string | null;
  refresh: () => Promise<void>;
  startJob: (jobId: string) => Promise<JobActionResult>;
  completePickup: (jobId: string) => Promise<JobActionResult>;
  completeDelivery: (jobId: string) => Promise<JobActionResult>;
}

export interface JobActionResult {
  success: boolean;
  error?: unknown;
}

export type TransporterJobActionHandler = (jobId: string) => Promise<void>;

export interface TransporterJobCardProps {
  job: TransporterDisplayJob;
  actionJobId: string | null;
  onStartJob: TransporterJobActionHandler;
  onCompletePickup: TransporterJobActionHandler;
  onCompleteDelivery: TransporterJobActionHandler;
}

export interface TransporterJobListProps {
  jobs: TransporterDisplayJob[];
  isLoading: boolean;
  actionJobId: string | null;
  onStartJob: TransporterJobActionHandler;
  onCompletePickup: TransporterJobActionHandler;
  onCompleteDelivery: TransporterJobActionHandler;
}

export interface TransporterJobsSummaryGridProps {
  summary: TransporterJobSummary;
}

export interface TransporterJobsRefreshButtonProps {
  refreshing: boolean;
  onRefresh: () => Promise<void>;
}
