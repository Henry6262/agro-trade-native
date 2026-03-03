import { useAuthStore } from '@stores/auth.store';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { InspectorActiveJobHookResult, InspectorVerificationFormValues } from '../types';
import { inspectorActiveJobService } from '../service';

const DEFAULT_LOCATION = {
  latitude: 42.6877,
  longitude: 23.3119,
  address: 'Inspector Hub',
  city: 'Sofia',
  region: 'BG',
};

export const useInspectorActiveJob = (): InspectorActiveJobHookResult => {
  const user = useAuthStore((state) => state.user);
  const inspectorId = user?.id ?? 'inspector-demo';

  const [job, setJob] = useState<InspectorActiveJobHookResult['job']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [currentLocation] = useState(DEFAULT_LOCATION);
  const hasFetched = useRef(false);

  const loadJob = useCallback(async () => {
    try {
      setIsLoading(true);
      const nextJob = await inspectorActiveJobService.fetchActiveJob(inspectorId);
      setJob(nextJob);
      setError(null);
    } catch (err) {
      console.error('Failed to load inspector job', err);
      setError('Unable to load active job');
    } finally {
      setIsLoading(false);
    }
  }, [inspectorId]);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    loadJob();
  }, [loadJob]);

  const refresh = useCallback(async () => {
    await loadJob();
  }, [loadJob]);

  const startVerification = useCallback(() => {
    setShowVerificationForm(true);
  }, []);

  const cancelVerification = useCallback(() => {
    setShowVerificationForm(false);
  }, []);

  const submitVerification = useCallback(
    async (values: InspectorVerificationFormValues) => {
      if (!job) {
        return;
      }

      await inspectorActiveJobService.submitVerification(job.id, values);
      setShowVerificationForm(false);
      await loadJob();
    },
    [job, loadJob]
  );

  return {
    job,
    isLoading,
    error,
    showVerificationForm,
    currentLocation,
    refresh,
    startVerification,
    cancelVerification,
    submitVerification,
  };
};
