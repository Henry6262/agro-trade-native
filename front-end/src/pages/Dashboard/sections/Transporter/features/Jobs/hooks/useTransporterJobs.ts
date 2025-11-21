import { useCallback, useEffect, useMemo, useState } from 'react';
import { transporterJobsService } from '../service';
import type { TransportJob } from '../service';
import type { JobActionResult, TransporterJobsHookResult } from '../types';
import {
  buildJobSummary,
  createDefaultDeliveryPayload,
  createDefaultPickupPayload,
  createDefaultStartPayload,
  mapJobsToDisplay,
} from '../utils';

export const useTransporterJobs = (): TransporterJobsHookResult => {
  const [jobs, setJobs] = useState<TransportJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionJobId, setActionJobId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    try {
      const data = await transporterJobsService.fetchJobs();
      setJobs(data);
      setErrorMessage(null);
    } catch (error) {
      console.error('Failed to load transporter jobs', error);
      setErrorMessage('Failed to load active jobs');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    loadJobs().catch((error) => console.error('Error loading transporter jobs', error));
  }, [loadJobs]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadJobs();
  }, [loadJobs]);

  const executeJobAction = useCallback(
    async (jobId: string, handler: () => Promise<unknown>): Promise<JobActionResult> => {
      setActionJobId(jobId);
      try {
        await handler();
        await loadJobs();
        return { success: true };
      } catch (error) {
        console.error('Failed to execute transporter job action', error);
        setErrorMessage('Unable to update job. Please try again.');
        return { success: false, error };
      } finally {
        setActionJobId(null);
      }
    },
    [loadJobs]
  );

  const startJob = useCallback(
    (jobId: string) =>
      executeJobAction(jobId, () =>
        transporterJobsService.startJob(jobId, createDefaultStartPayload())
      ),
    [executeJobAction]
  );

  const completePickup = useCallback(
    (jobId: string) =>
      executeJobAction(jobId, () =>
        transporterJobsService.completePickup(jobId, createDefaultPickupPayload())
      ),
    [executeJobAction]
  );

  const completeDelivery = useCallback(
    (jobId: string) =>
      executeJobAction(jobId, () =>
        transporterJobsService.completeDelivery(jobId, createDefaultDeliveryPayload())
      ),
    [executeJobAction]
  );

  const summary = useMemo(() => buildJobSummary(jobs), [jobs]);
  const displayJobs = useMemo(() => mapJobsToDisplay(jobs), [jobs]);

  return {
    jobs,
    displayJobs,
    summary,
    isLoading,
    isRefreshing,
    actionJobId,
    errorMessage,
    refresh,
    startJob,
    completePickup,
    completeDelivery,
  };
};
