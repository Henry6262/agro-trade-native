import { useState, useEffect, useCallback } from 'react';
import { UseVerificationJobsReturn, VerificationJob } from '../types';
import { mockVerificationJobs } from '../__mocks__/mockData';
import { inspectionService } from '@services/inspectionService';
import { useAuthStore } from '@shared/stores/useAuthStore';

export const useVerificationJobs = (): UseVerificationJobsReturn => {
  const [jobs, setJobs] = useState<VerificationJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<any>(null);
  const { user } = useAuthStore();

  // Map backend inspection to frontend VerificationJob format
  const mapInspectionToJob = (inspection: any): VerificationJob => {
    return {
      id: inspection.id,
      sellerListingId: inspection.saleListingId,
      inspectorId: inspection.inspectorId,
      priority: inspection.priority as any,
      status: inspection.status as any,
      location: {
        latitude: inspection.latitude,
        longitude: inspection.longitude,
        address: inspection.address,
        city: inspection.saleListing?.seller?.city || 'Unknown',
        region: inspection.saleListing?.seller?.region || 'Unknown',
      },
      productDetails: {
        name: inspection.saleListing?.product?.name || 'Unknown Product',
        type: inspection.saleListing?.product?.type || 'Unknown',
        quantity: inspection.saleListing?.quantity || 0,
        unit: inspection.saleListing?.unit || 'kg',
        claimedSpecs: inspection.saleListing?.product?.specifications || {},
      },
      scheduledDate: inspection.scheduledDate ? new Date(inspection.scheduledDate) : undefined,
      acceptedAt: inspection.scheduledDate ? new Date(inspection.scheduledDate) : undefined,
      completedAt: inspection.completedDate ? new Date(inspection.completedDate) : undefined,
      estimatedDuration: 60, // Default 60 minutes
      distance: undefined, // Calculate based on location if needed
      createdAt: new Date(inspection.createdAt),
      updatedAt: new Date(inspection.updatedAt),
    };
  };

  const fetchJobs = useCallback(async () => {
    if (!user?.id) {
      // If no user, use mock data for now
      setJobs(mockVerificationJobs as any);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setIsError(false);
      
      // Fetch inspector's missions
      const inspections = await inspectionService.getInspectorMissions(user.id);
      const mappedJobs = inspections.map(mapInspectionToJob);
      
      setJobs(mappedJobs);
    } catch (err) {
      console.error('Error fetching verification jobs:', err);
      setIsError(true);
      setError(err);
      // Fallback to mock data on error
      setJobs(mockVerificationJobs as any);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const refetch = () => {
    fetchJobs();
  };

  const acceptJob = async (jobId: string, inspectorId: string) => {
    try {
      // Assign inspector to the inspection
      await inspectionService.assignInspector(jobId, inspectorId);
      
      // Update local state - mark job as assigned
      setJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, status: 'ASSIGNED' as any, inspectorId }
          : job
      ));
      
      console.log(`Job ${jobId} accepted by ${inspectorId}`);
    } catch (err) {
      console.error('Error accepting job:', err);
      throw err;
    }
  };

  const completeJob = async (jobId: string, result: any) => {
    try {
      // Submit inspection results
      await inspectionService.submitInspectionResults(jobId, {
        qualityScore: result.qualityScore || 85,
        verificationResult: result.verifiedSpecs || {},
        notes: result.notes || '',
        photos: result.evidence?.filter((e: any) => e.type === 'photo').map((e: any) => e.url) || [],
        recommendVerification: result.verificationStatus === 'VERIFIED',
      });
      
      // Update local state - mark job as completed
      setJobs(prev => prev.filter(job => job.id !== jobId));
      
      console.log(`Job ${jobId} completed`, result);
    } catch (err) {
      console.error('Error completing job:', err);
      throw err;
    }
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