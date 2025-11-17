import type { VerificationJob } from '@features/dashboard/screens/inspector/types';

export type InspectorAvailableJob = VerificationJob;

export type InspectorJobPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface InspectorAvailableJobsHookResult {
  jobs: InspectorAvailableJob[];
  displayedJobs: InspectorAvailableJob[];
  viewMode: 'list' | 'map';
  priorityFilter: InspectorJobPriority | null;
  sortBy: 'distance' | 'priority';
  currentLocation: { latitude: number; longitude: number } | null;
  isLoading: boolean;
  isRefreshing: boolean;
  setViewMode: (mode: 'list' | 'map') => void;
  setPriorityFilter: (priority: InspectorJobPriority | null) => void;
  setSortBy: (sort: 'distance' | 'priority') => void;
  refresh: () => Promise<void>;
}

export type { VerificationJob };
