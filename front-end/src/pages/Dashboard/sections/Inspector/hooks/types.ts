export interface InspectorProfile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  rating?: number;
  completedJobs?: number;
}

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: Date;
}

export interface VerificationJob {
  id: string;
  sellerListingId?: string | undefined;
  inspectorId?: string | undefined;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'SCHEDULED';
  location: {
    latitude: number;
    longitude: number;
    address?: string | undefined;
    city?: string | undefined;
    region?: string | undefined;
  };
  productDetails: {
    name: string;
    type?: string | undefined;
    quantity?: number | undefined;
    unit?: string | undefined;
    claimedSpecs?: Record<string, any> | undefined;
  };
  scheduledDate?: Date | undefined;
  acceptedAt?: Date | undefined;
  completedAt?: Date | undefined;
  estimatedDuration?: number | undefined;
  distance?: number | undefined;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface InspectorStore {
  profile: InspectorProfile | null;
  activeJob: VerificationJob | null;
  availableJobs: VerificationJob[];
  currentLocation: LocationCoordinates | null;
  isTracking: boolean;

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

export interface UseVerificationJobsReturn {
  jobs: VerificationJob[];
  isLoading: boolean;
  isError: boolean;
  error: any;
  refetch: () => void;
  acceptJob: (jobId: string, inspectorId: string) => Promise<void>;
  completeJob: (jobId: string, result: any) => Promise<void>;
}
