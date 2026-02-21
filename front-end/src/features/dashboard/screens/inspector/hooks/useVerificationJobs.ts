import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { UseVerificationJobsReturn, VerificationJob } from '../types';
import { inspectionService } from '@services/inspectionService';
import { useAuthStore } from '../../../../../stores/auth.store';

export const useVerificationJobs = (): UseVerificationJobsReturn => {
  const [jobs, setJobs] = useState<VerificationJob[]>([]);
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

  const inspectorId = user?.id ?? null;
  const missionsQuery = useQuery({
    queryKey: ['inspector', 'verification-jobs', inspectorId],
    queryFn: async () => {
      if (!inspectorId) {
        return [];
      }
      const inspections = await inspectionService.getInspectorMissions(inspectorId);
      return inspections.map(mapInspectionToJob);
    },
    enabled: Boolean(inspectorId),
  });

  useEffect(() => {
    if (missionsQuery.data) {
      setJobs(missionsQuery.data);
      setIsError(false);
      setError(null);
    }
    if (missionsQuery.error) {
      setIsError(true);
      setError(missionsQuery.error);
    }
  }, [missionsQuery.data, missionsQuery.error]);

  const refetch = useCallback(() => {
    void missionsQuery.refetch();
  }, [missionsQuery]);

  const acceptJob = async (jobId: string, inspectorId: string) => {
    try {
      // Assign inspector to the inspection
      await inspectionService.assignInspector(jobId, inspectorId);

      // Update local state - mark job as assigned
      setJobs((prev) =>
        prev.map((job) =>
          job.id === jobId ? { ...job, status: 'ASSIGNED' as any, inspectorId } : job
        )
      );

      void missionsQuery.refetch();
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
        photos:
          result.evidence?.filter((e: any) => e.type === 'photo').map((e: any) => e.url) || [],
        recommendVerification: result.verificationStatus === 'VERIFIED',
      });

      // Update local state - mark job as completed
      setJobs((prev) => prev.filter((job) => job.id !== jobId));

      void missionsQuery.refetch();
    } catch (err) {
      console.error('Error completing job:', err);
      throw err;
    }
  };

  return {
    jobs,
    isLoading: missionsQuery.isLoading,
    isError,
    error,
    refetch,
    acceptJob,
    completeJob,
  };
};
