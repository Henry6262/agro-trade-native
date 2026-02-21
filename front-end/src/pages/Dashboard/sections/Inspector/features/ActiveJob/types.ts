import type { InspectionRequest, SubmitInspectionResultsDto } from '@services/inspectionService';

export type InspectorJobPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export type InspectorJobStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type InspectorVerificationStatus =
  | 'VERIFIED'
  | 'PARTIALLY_VERIFIED'
  | 'FAILED'
  | 'PENDING_REVIEW';

export interface InspectorLocationCoordinates {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  region?: string;
}

export interface InspectorProductDetails {
  name: string;
  type?: string;
  quantity?: number;
  unit?: string;
  claimedSpecs: Record<string, string>;
}

export interface InspectorVerificationJob {
  id: string;
  jobNumber: string;
  sellerListingId?: string;
  priority: InspectorJobPriority;
  status: InspectorJobStatus;
  location: InspectorLocationCoordinates;
  productDetails: InspectorProductDetails;
  estimatedDuration?: number;
  distance?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface InspectorVerificationFormValues {
  verifiedSpecs: Record<string, string>;
  testMethods: Record<string, string>;
  notes?: string;
  correctedSpecs?: {
    variety?: string;
    grade?: string;
    origin?: string;
    notes?: string;
  };
  evidence?: {
    type: 'photo' | 'document' | 'video';
    url: string;
    caption?: string;
    timestamp: Date;
  }[];
  verificationStatus: InspectorVerificationStatus;
}

export interface InspectorActiveJobHookResult {
  job: InspectorVerificationJob | null;
  isLoading: boolean;
  error: string | null;
  showVerificationForm: boolean;
  currentLocation: InspectorLocationCoordinates | null;
  refresh: () => Promise<void>;
  startVerification: () => void;
  cancelVerification: () => void;
  submitVerification: (values: InspectorVerificationFormValues) => Promise<void>;
}

export interface VerificationFormProps {
  job: InspectorVerificationJob;
  onSubmit: (values: InspectorVerificationFormValues) => void | Promise<void>;
  onCancel?: () => void;
}

export type { InspectionRequest, SubmitInspectionResultsDto };
