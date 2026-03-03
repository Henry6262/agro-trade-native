import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { transportService } from '@services/transportService';
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

const LOCATION_POLL_INTERVAL_MS = 30_000;

export const useTransporterJobs = (): TransporterJobsHookResult => {
  const [jobs, setJobs] = useState<TransportJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionJobId, setActionJobId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasFetched = useRef(false);

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
    if (hasFetched.current) return;
    hasFetched.current = true;
    setIsLoading(true);
    loadJobs().catch((error) => console.error('Error loading transporter jobs', error));
  }, [loadJobs]);

  // GPS location tracking for IN_TRANSIT jobs
  useEffect(() => {
    const inTransitJobs = jobs.filter((job) => job.status === 'IN_TRANSIT');

    // Stop any existing interval before (re-)starting
    if (locationIntervalRef.current !== null) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }

    if (inTransitJobs.length === 0) {
      return;
    }

    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission denied — GPS tracking disabled');
        return;
      }

      const sendLocation = async () => {
        try {
          const position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const { latitude, longitude } = position.coords;
          await Promise.all(
            inTransitJobs.map((job) =>
              transportService.updateJobLocation(job.id, latitude, longitude).catch((err) => {
                console.warn(`Failed to update location for job ${job.id}`, err);
              })
            )
          );
        } catch (err) {
          console.warn('Failed to get current position', err);
        }
      };

      // Send immediately on start, then on interval
      sendLocation().catch((err) => console.warn('Initial location send failed', err));
      locationIntervalRef.current = setInterval(() => {
        sendLocation().catch((err) => console.warn('Interval location send failed', err));
      }, LOCATION_POLL_INTERVAL_MS);
    };

    startTracking().catch((err) => console.warn('Location tracking startup failed', err));

    return () => {
      if (locationIntervalRef.current !== null) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
    };
  }, [jobs]);

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
