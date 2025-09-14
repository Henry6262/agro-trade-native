import { useState, useEffect } from 'react';
import { UseVerificationJobsReturn, VerificationJob } from '../types';
import { mockVerificationJobs } from '../__mocks__/mockData';

export const useVerificationJobs = (): UseVerificationJobsReturn => {
  const [jobs, setJobs] = useState<VerificationJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    // Simulate API call with mock data
    setTimeout(() => {
      setJobs(mockVerificationJobs as any);
      setIsLoading(false);
    }, 500);
  }, []);

  const refetch = () => {
    setIsLoading(true);
    setTimeout(() => {
      setJobs(mockVerificationJobs as any);
      setIsLoading(false);
    }, 500);
  };

  const acceptJob = async (jobId: string, inspectorId: string) => {
    // Mock accept job - just remove from available list
    setJobs(prev => prev.filter(job => job.id !== jobId));
    console.log(`Job ${jobId} accepted by ${inspectorId}`);
  };

  const completeJob = async (jobId: string, result: any) => {
    // Mock complete job
    console.log(`Job ${jobId} completed`, result);
  };

  return {
    jobs,
    isLoading,
    isError,
    error,
    refetch,
    acceptJob,
    completeJob,
  };
};