export class AcceptJobDto {
  inspectorId: string;
  estimatedArrival: string;
}

export class LocationUpdateDto {
  inspectorId: string;
  jobId?: string;
  coordinates: {
    latitude: number;
    longitude: number;
    accuracy: number;
    heading?: number;
    speed?: number;
  };
  timestamp: string;
  batteryLevel?: number;
  networkType?: "wifi" | "cellular" | "none";
  isMoving: boolean;
}

export class VerificationResultDto {
  jobId: string;
  inspectorId: string;
  sellerListingId?: string;
  originalSpecs: Record<string, any>;
  verifiedSpecs: Record<string, any>;
  testMethods: Array<{
    parameter: string;
    method: string;
    equipment: string;
    standardUsed?: string;
  }>;
  evidence: Array<{
    type: "photo" | "document" | "video";
    url: string;
    caption?: string;
    timestamp: string;
  }>;
  notes: string;
  verificationStatus:
    | "VERIFIED"
    | "PARTIALLY_VERIFIED"
    | "FAILED"
    | "PENDING_REVIEW";
  signature?: string;
  verifiedAt: string;
}

export class JobFilterDto {
  priority?: "LOW" | "MEDIUM" | "HIGH";
  status?:
    | "PENDING"
    | "ASSIGNED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "FAILED"
    | "CANCELLED";
  lat?: number;
  lng?: number;
  radius?: number;
}
