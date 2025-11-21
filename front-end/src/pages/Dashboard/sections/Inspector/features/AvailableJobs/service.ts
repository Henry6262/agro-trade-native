import { inspectionService } from '@services/inspectionService';
import type { VerificationJob } from './types';

const mapInspectionToJob = (inspection: any): VerificationJob => ({
  id: inspection.id,
  sellerListingId: inspection.saleListingId,
  inspectorId: inspection.inspectorId,
  priority: inspection.priority,
  status: inspection.status,
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
  estimatedDuration: 60,
  distance: undefined,
  createdAt: new Date(inspection.createdAt),
  updatedAt: new Date(inspection.updatedAt),
});

export const inspectorAvailableJobsService = {
  async fetchJobs(inspectorId?: string | null): Promise<VerificationJob[]> {
    if (!inspectorId) {
      return [];
    }

    try {
      const inspections = await inspectionService.getInspectorMissions(inspectorId);
      return inspections.map(mapInspectionToJob);
    } catch (error) {
      console.error('Failed to fetch available jobs', error);
      return [];
    }
  },
};
