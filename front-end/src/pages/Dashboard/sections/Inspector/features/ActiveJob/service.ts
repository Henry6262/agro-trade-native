import {
  inspectionService,
  type InspectionRequest,
  type SubmitInspectionResultsDto,
} from '@services/inspectionService';
import type {
  InspectorVerificationJob,
  InspectorVerificationFormValues,
  InspectorLocationCoordinates,
} from './types';

const buildClaimedSpecs = (request: InspectionRequest): Record<string, string> => {
  const product = request.saleListing?.product;
  return {
    variety: product?.name ?? 'Not Provided',
    grade: product?.category ?? 'Not Provided',
    origin: request.address ?? 'Unknown',
    quantity: `${request.saleListing?.quantity ?? 0} ${request.saleListing?.unit ?? 'tons'}`,
  };
};

const toInspectorLocation = (request: InspectionRequest): InspectorLocationCoordinates => ({
  latitude: request.latitude,
  longitude: request.longitude,
  address: request.address,
  city: request.tradeOperation?.buyListing?.buyer?.name ?? undefined,
  region: request.saleListing?.product?.category ?? undefined,
});

const toInspectorJob = (request: InspectionRequest): InspectorVerificationJob => ({
  id: request.id,
  jobNumber: request.tradeOperation?.id ?? request.id,
  priority: request.priority,
  status: request.status as InspectorVerificationJob['status'],
  location: toInspectorLocation(request),
  productDetails: {
    name: request.saleListing?.product?.name ?? 'Agricultural Product',
    type: request.saleListing?.product?.category ?? undefined,
    quantity: request.saleListing?.quantity,
    unit: request.saleListing?.unit ?? 'tons',
    claimedSpecs: buildClaimedSpecs(request),
  },
  estimatedDuration: 45,
  distance: request.latitude && request.longitude ? Math.round(Math.random() * 50) + 10 : undefined,
});

const toSubmitPayload = (
  jobId: string,
  values: InspectorVerificationFormValues
): SubmitInspectionResultsDto => ({
  qualityScore: 90,
  verificationResult: {
    actualQuantity: Number(values.verifiedSpecs.quantity) || undefined,
    actualQuality: values.verifiedSpecs.grade,
    productSpecifications: {
      variety: values.correctedSpecs?.variety,
      grade: values.correctedSpecs?.grade,
      origin: values.correctedSpecs?.origin,
    },
    foreignMatter: Number(values.verifiedSpecs.foreignMatter) || undefined,
    moistureContent: Number(values.verifiedSpecs.moisture) || undefined,
  },
  notes: values.notes,
  photos: values.evidence?.map((item) => item.url),
  recommendVerification: values.verificationStatus !== 'FAILED',
  qualityGrade: values.verifiedSpecs.grade,
});

export const inspectorActiveJobService = {
  async fetchActiveJob(inspectorId: string): Promise<InspectorVerificationJob | null> {
    const activeMission = await inspectionService.getInspectorActiveMission(inspectorId);
    if (activeMission) {
      return toInspectorJob(activeMission);
    }

    // Fallback to legacy missions query if backend returns null
    const [inProgress, scheduled] = await Promise.all([
      inspectionService.getInspectorMissions(inspectorId, 'IN_PROGRESS'),
      inspectionService.getInspectorMissions(inspectorId, 'SCHEDULED'),
    ]);
    const job = inProgress[0] ?? scheduled[0] ?? null;
    return job ? toInspectorJob(job) : null;
  },

  async submitVerification(jobId: string, values: InspectorVerificationFormValues) {
    const payload = toSubmitPayload(jobId, values);
    await inspectionService.submitInspectionResults(jobId, payload);
  },
};
