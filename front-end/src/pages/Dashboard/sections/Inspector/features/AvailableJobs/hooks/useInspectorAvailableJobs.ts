import { useAuthStore } from '@stores/auth.store';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { inspectorAvailableJobsService } from '../service';
import type {
  InspectorAvailableJobsHookResult,
  InspectorJobPriority,
  InspectorAvailableJob,
} from '../types';

export const useInspectorAvailableJobs = (): InspectorAvailableJobsHookResult => {
  const { user } = useAuthStore();

  const [jobs, setJobs] = useState<InspectorAvailableJob[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [priorityFilter, setPriorityFilter] = useState<InspectorJobPriority | null>(null);
  const [sortBy, setSortBy] = useState<'distance' | 'priority'>('distance');
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadJobs = useCallback(async () => {
    const fetchedJobs = await inspectorAvailableJobsService.fetchJobs(user?.id);
    setJobs(fetchedJobs);
    if (!currentLocation && fetchedJobs.length) {
      const firstJob = fetchedJobs[0];
      setCurrentLocation({
        latitude: firstJob.location.latitude,
        longitude: firstJob.location.longitude,
      });
    }
  }, [user?.id, currentLocation]);

  useEffect(() => {
    setIsLoading(true);
    loadJobs()
      .catch((error) => console.error('Failed to load inspector jobs', error))
      .finally(() => setIsLoading(false));
  }, [loadJobs]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadJobs().catch((error) => console.error('Failed to refresh inspector jobs', error));
    setIsRefreshing(false);
  }, [loadJobs]);

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
