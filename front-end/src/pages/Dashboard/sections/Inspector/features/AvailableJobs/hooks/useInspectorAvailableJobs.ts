import { useAuthStore } from '@stores/auth.store';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inspectorAvailableJobsService } from '../service';
import type {
  InspectorAvailableJobsHookResult,
  InspectorJobPriority,
  InspectorAvailableJob,
} from '../types';

export const useInspectorAvailableJobs = (): InspectorAvailableJobsHookResult => {
  const { user } = useAuthStore();

  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [priorityFilter, setPriorityFilter] = useState<InspectorJobPriority | null>(null);
  const [sortBy, setSortBy] = useState<'distance' | 'priority'>('distance');
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const inspectorId = user?.id ?? null;
  const jobsQuery = useQuery({
    queryKey: ['inspector', 'available-jobs', inspectorId],
    queryFn: () => inspectorAvailableJobsService.fetchJobs(inspectorId),
    enabled: Boolean(inspectorId),
  });

  const jobs = jobsQuery.data ?? [];
  const isLoading = jobsQuery.isLoading && !isRefreshing;

  const refresh = useCallback(async () => {
    if (!jobsQuery.refetch) {
      return;
    }
    setIsRefreshing(true);
    try {
      await jobsQuery.refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [jobsQuery]);

  useEffect(() => {
    if (!currentLocation && jobs.length) {
      setCurrentLocation({
        latitude: jobs[0].location.latitude,
        longitude: jobs[0].location.longitude,
      });
    }
  }, [jobs, currentLocation]);

  const displayedJobs = useMemo(() => {
    const filtered = priorityFilter ? jobs.filter((job) => job.priority === priorityFilter) : jobs;
    const priorityOrder: Record<InspectorJobPriority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

    return [...filtered].sort((a, b) => {
      if (sortBy === 'distance') {
        return (a.distance || 0) - (b.distance || 0);
      }
      return (
        priorityOrder[a.priority as InspectorJobPriority] -
        priorityOrder[b.priority as InspectorJobPriority]
      );
    });
  }, [jobs, priorityFilter, sortBy]);

  return {
    jobs,
    displayedJobs,
    viewMode,
    priorityFilter,
    sortBy,
    currentLocation,
    isLoading,
    isRefreshing,
    setViewMode,
    setPriorityFilter,
    setSortBy,
    refresh,
  };
};
