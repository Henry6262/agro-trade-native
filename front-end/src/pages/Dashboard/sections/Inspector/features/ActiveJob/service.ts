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
  const product = request.saleListing?.product as any;
  const saleListing = request.saleListing as any;
  return {
    variety: product?.name ?? 'Not Provided',
    grade: product?.category ?? product?.type ?? 'Not Provided',
    origin: request.address ?? 'Unknown',
    quantity: `${saleListing?.quantity ?? 0} ${saleListing?.unit ?? 'tons'}`,
  };
};

const toInspectorLocation = (request: InspectionRequest): InspectorLocationCoordinates => ({
  latitude: request.latitude,
  longitude: request.longitude,
  address: request.address,
  city: request.tradeOperation?.buyListing?.buyer?.name ?? undefined,
  region:
    (request.saleListing?.product as any)?.category ??
    (request.saleListing?.product as any)?.type ??
    undefined,
});

type LatLng = { latitude: number; longitude: number };

const haversineKm = (from: LatLng, to: LatLng): number => {
  const R = 6371;
  const dLat = ((to.latitude - from.latitude) * Math.PI) / 180;
  const dLon = ((to.longitude - from.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((from.latitude * Math.PI) / 180) *
      Math.cos((to.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
};

const toInspectorJob = (
  request: InspectionRequest,
  inspectorLocation?: LatLng
): InspectorVerificationJob => {
  const saleListing = request.saleListing as any;
  const product = request.saleListing?.product as any;
  const jobLat = request.latitude;
  const jobLon = request.longitude;
  return {
    id: request.id,
    jobNumber: request.tradeOperation?.id ?? request.id,
    tradeOperationId: request.tradeOperationId ?? request.tradeOperation?.id,
    priority: request.priority,
    status: request.status as InspectorVerificationJob['status'],
    location: toInspectorLocation(request),
    productDetails: {
      name: product?.name ?? 'Agricultural Product',
      type: product?.category ?? product?.type ?? undefined,
      quantity: saleListing?.quantity,
      unit: saleListing?.unit ?? 'tons',
      claimedSpecs: buildClaimedSpecs(request),
    },
    estimatedDuration: 45,
    distance:
      jobLat && jobLon && inspectorLocation
        ? haversineKm(inspectorLocation, { latitude: jobLat, longitude: jobLon })
        : undefined,
  };
};

const toSubmitPayload = (
  jobId: string,
  values: InspectorVerificationFormValues
): SubmitInspectionResultsDto => ({
  qualityScore: values.qualityScore,
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
  async fetchActiveJob(
    inspectorId: string,
    inspectorLocation?: LatLng
  ): Promise<InspectorVerificationJob | null> {
    const activeMission = await inspectionService.getInspectorActiveMission(inspectorId);
    if (activeMission) {
      return toInspectorJob(activeMission, inspectorLocation);
    }

    // Fallback to legacy missions query if backend returns null
    const [inProgress, scheduled] = await Promise.all([
      inspectionService.getInspectorMissions(inspectorId, 'IN_PROGRESS'),
      inspectionService.getInspectorMissions(inspectorId, 'SCHEDULED'),
    ]);
    const job = inProgress[0] ?? scheduled[0] ?? null;
    return job ? toInspectorJob(job, inspectorLocation) : null;
  },

  async submitVerification(jobId: string, values: InspectorVerificationFormValues) {
    const payload = toSubmitPayload(jobId, values);
    await inspectionService.submitInspectionResults(jobId, payload);
  },
};
