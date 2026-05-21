// Enums
export enum JobPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum JobStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum VerificationStatus {
  VERIFIED = 'VERIFIED',
  PARTIALLY_VERIFIED = 'PARTIALLY_VERIFIED',
  FAILED = 'FAILED',
  PENDING_REVIEW = 'PENDING_REVIEW',
}

// Location types
export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  region: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  heading?: number;
  speed?: number;
}

// Product types
export interface ProductSummary {
  name: string;
  type: string;
  quantity: number;
  unit: string;
  claimedSpecs: Record<string, any>;
}

// Job types
export interface VerificationJob {
  id: string;
  sellerListingId: string;
  inspectorId?: string | null | undefined;
  priority: JobPriority;
  status: JobStatus;
  location: LocationCoordinates;
  productDetails: ProductSummary;
  scheduledDate?: Date | undefined;
  acceptedAt?: Date | undefined;
  completedAt?: Date | undefined;
  estimatedDuration: number; // minutes
  distance?: number | undefined; // km from inspector
  createdAt: Date;
  updatedAt: Date;
}

// Inspector types
export interface Certification {
  name: string;
  issuedBy: string;
  validUntil: Date;
  documentUrl?: string;
}

export interface WorkingHours {
  start: string; // "09:00"
  end: string; // "18:00"
  workDays: number[]; // 1-7 (Mon-Sun)
}

export interface InspectorProfile {
  id: string;
  userId: string;
  employeeId: string;
  specializations: string[];
  certifications: Certification[];
  activeJobId?: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: Date;
  };
  isAvailable: boolean;
  workingHours: WorkingHours;
  totalJobsCompleted: number;
  averageRating: number;
  createdAt: Date;
  updatedAt: Date;
}

// Location tracking
export interface LocationUpdate {
  id: string;
  inspectorId: string;
  jobId?: string;
  coordinates: Coordinates;
  timestamp: Date;
  batteryLevel?: number;
  networkType?: 'wifi' | 'cellular' | 'none';
  isMoving: boolean;
}

// Verification types
export interface TestMethod {
  parameter: string;
  method: string;
  equipment: string;
  standardUsed?: string;
}

export interface Evidence {
  type: 'photo' | 'document' | 'video';
  url: string;
  caption?: string;
  timestamp: Date;
}

export interface VerificationResult {
  id: string;
  jobId: string;
  inspectorId: string;
  sellerListingId: string;
  originalSpecs: Record<string, any>;
  verifiedSpecs: Record<string, any>;
  testMethods: TestMethod[];
  evidence: Evidence[];
  notes: string;
  verificationStatus: VerificationStatus;
  signature?: string;
  verifiedAt: Date;
  createdAt: Date;
}

// Seller listing lock
export interface SellerListingLock {
  listingId: string;
  isLocked: boolean;
  lockedFields: string[];
  verificationResultId?: string;
  lockedAt?: Date;
  lockedBy?: string;
  unlockRequested?: boolean;
  unlockReason?: string;
}

// Component props
export interface JobCardProps {
  job: VerificationJob;
  onPress?: (job: VerificationJob) => void;
  onAccept?: (jobId: string) => void;
  showAcceptButton?: boolean;
  className?: string;
}

export interface JobPriorityBadgeProps {
  priority: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export interface ActiveJobTabProps {
  activeJob: VerificationJob | null;
  currentLocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    heading?: number;
    speed?: number;
  } | null;
  onStartVerification?: () => void;
  onCompleteVerification?: (result: Partial<VerificationResult>) => void;
}

export interface AvailableJobsTabProps {
  jobs: VerificationJob[];
  currentLocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    heading?: number;
    speed?: number;
  } | null;
  onJobSelect?: (job: VerificationJob) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export interface JobMapViewProps {
  jobs: VerificationJob[];
  currentLocation?: { latitude: number; longitude: number } | undefined;
  onJobSelect?: ((job: VerificationJob) => void) | undefined;
  onRegionChange?: (region: any) => void;
}

export interface JobListViewProps {
  jobs: VerificationJob[];
  onJobSelect?: ((job: VerificationJob) => void) | undefined;
  onRefresh?: (() => void) | undefined;
  isRefreshing?: boolean | undefined;
}

export interface VerificationFormProps {
  job: VerificationJob;
  onSubmit: (result: Partial<VerificationResult>) => void;
  onCancel?: () => void;
}

// Store types
export interface InspectorStore {
  // State
  profile: InspectorProfile | null;
  activeJob: VerificationJob | null;
  availableJobs: VerificationJob[];
  currentLocation: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: Date;
  } | null;
  isTracking: boolean;

  // Actions
  setProfile: (profile: InspectorProfile) => void;
  setActiveJob: (job: VerificationJob | null) => void;
  setAvailableJobs: (jobs: VerificationJob[]) => void;
  updateLocation: (location: any) => void;
  startTracking: () => void;
  stopTracking: () => void;
  acceptJob: (jobId: string) => void;
  completeJob: () => void;
  getJobsByPriority: (priority: string) => VerificationJob[];
  getJobsSortedByDistance: () => VerificationJob[];
  reset: () => void;
}

// Hook types
export interface LocationTrackingOptions {
  enableBackground?: boolean;
  updateInterval?: number; // milliseconds
  distanceFilter?: number; // meters
}

export interface UseLocationTrackingReturn {
  currentLocation: {
    latitude: number;
    longitude: number;
    accuracy: number;
    heading?: number;
    speed?: number;
  } | null;
  isTracking: boolean;
  permissionStatus: string | null;
  error: string | null;
  startTracking: () => Promise<void>;
  stopTracking: () => Promise<void>;
  calculateDistance: (lat1: number, lng1: number, lat2: number, lng2: number) => number;
}

export interface UseVerificationJobsOptions {
  priority?: string;
  location?: { lat: number; lng: number };
  radius?: number;
  refetchInterval?: number;
}

export interface UseVerificationJobsReturn {
  jobs: VerificationJob[];
  isLoading: boolean;
  isError: boolean;
  error: any;
  refetch: () => void;
  acceptJob: (jobId: string, inspectorId: string) => Promise<void>;
  completeJob: (jobId: string, result: Partial<VerificationResult>) => Promise<void>;
}
