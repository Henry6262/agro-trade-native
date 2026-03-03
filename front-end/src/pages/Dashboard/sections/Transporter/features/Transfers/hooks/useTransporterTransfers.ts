import { useAuthStore } from '@stores/auth.store';
import { useCallback, useEffect, useRef, useState } from 'react';
import { transporterTransfersService } from '../service';
import type { TransporterTransfersHookResult, TransfersJobView, TransfersSummary } from '../types';
import { summarizeTransfers, mapJobsToView } from '../utils';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

export const useTransporterTransfers = (): TransporterTransfersHookResult => {
  useAuthStore((state) => state.user?.id);

  const [jobs, setJobs] = useState<TransfersJobView[]>([]);
  const [summary, setSummary] = useState<TransfersSummary>({
    activeJobs: 0,
    completedJobs: 0,
    totalEarningsLabel: '—',
  });
  const [selectedOffer, setSelectedOffer] = useState<TransfersJobView['mapOffer'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasFetched = useRef(false);

  const loadJobs = useCallback(async () => {
    const rawJobs = await transporterTransfersService.fetchJobs();
    setJobs(mapJobsToView(rawJobs, currencyFormatter));
    setSummary(summarizeTransfers(rawJobs, currencyFormatter));
  }, []);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    setIsLoading(true);
    loadJobs()
      .catch((error) => console.error('Failed to load transfer jobs', error))
      .finally(() => setIsLoading(false));
  }, [loadJobs]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadJobs().catch((error) => console.error('Failed to refresh transfers', error));
    setIsRefreshing(false);
  }, [loadJobs]);

  const openMap = useCallback((job: TransfersJobView) => {
    setSelectedOffer(job.mapOffer);
  }, []);

  const closeMap = useCallback(() => setSelectedOffer(null), []);

  return {
    jobs,
    summary,
    isLoading,
    isRefreshing,
    selectedOffer,
    refresh,
    openMap,
    closeMap,
  };
};
