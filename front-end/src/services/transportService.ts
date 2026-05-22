export interface TransportPickupPoint {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
  lat?: number;
  lng?: number;
  contactName?: string;
  contactPhone?: string;
  sellerName?: string;
}

export interface TransportDeliveryPoint {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
  lat?: number;
  lng?: number;
  contactName?: string;
  contactPhone?: string;
}

export interface TransportJob {
  id: string;
  status: string;
  jobNumber?: string;
  pickupLocation: string;
  deliveryLocation: string;
  cargo: string;
  weight: number;
  distance: number;
  price: number;
  buyerName: string;
  sellerName: string;
  createdAt: string;
  startedAt?: string;
  pickupCompletedAt?: string;
  deliveryCompletedAt?: string;
  completedAt?: string;
  estimatedArrival?: string;
  currentLocation?: { latitude: number; longitude: number; address?: string };
  transportRequest?: TransportRequest;
  pickupsCompleted?: string[];
  allPickupsComplete?: boolean;
}

export interface TransportRequest {
  id: string;
  pickupLocation: string;
  deliveryLocation: string;
  cargo: string;
  weight: number;
  distance: number;
  proposedPrice: number;
  deadline: string;
  status: string;
  tradeOperationId?: string;
  pickupPoints?: TransportPickupPoint[];
  deliveryPoint?: TransportDeliveryPoint;
  totalWeight?: number;
  biddingDeadline?: string;
  maxBudget?: number;
  tradeOperation?: { id: string; buyerName?: string; buyListing?: { product?: { name?: string } } };
  lowestBid?: number | TransportBid;
  estimatedDistance?: number;
  requestNumber?: string;
  bidsCount?: number;
  urgencyLevel?: string;
}

export interface TransportBid {
  id: string;
  requestId: string;
  transportRequestId?: string;
  tradeOperationId?: string;
  transporterId: string;
  price: number;
  bidAmount?: number;
  estimatedDays: number;
  estimatedDuration?: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  transportRequest?: TransportRequest;
  vehicleType?: string;
}

export interface TransportFleetTruck {
  id: string;
  plateNumber: string;
  licensePlate?: string;
  type: string;
  model?: string;
  capacity: number;
  capacityTons?: number;
  status: 'available' | 'in_use' | 'maintenance' | 'assigned';
  driver?: string;
  verified?: boolean;
  location?: { latitude: number; longitude: number; address?: string };
  assignment?: { id: string; route?: string; driver?: string };
}

export interface TransportFleetDriver {
  id: string;
  name: string;
  licenseType: string;
  experience: number;
  experienceYears?: number;
  status: 'available' | 'assigned' | 'off_duty';
  assignment?: { id: string; route?: string; truck?: string };
}

export interface TransportFleetSummary {
  totalTrucks: number;
  totalDrivers: number;
  availableTrucks: number;
  availableDrivers: number;
  assignedDrivers: number;
  inTransitTrucks?: number;
}

export interface TransportPerformance {
  completedJobs: number;
  onTimeRate: number;
  onTimeDeliveryRate?: number;
  avgRating: number;
  totalEarnings: number;
}

export type TransporterPerformance = TransportPerformance;

const transportService = {
  async getMyJobs(): Promise<TransportJob[]> {
    return [];
  },

  async startJob(_jobId: string, _data: { startedAt?: string; actualPickupTime?: string }): Promise<TransportJob> {
    throw new Error('Not implemented');
  },

  async completePickup(
    _jobId: string,
    _data: { pickupCompletedAt?: string; notes?: string; pickupPhotos?: string[] }
  ): Promise<TransportJob> {
    throw new Error('Not implemented');
  },

  async completeDelivery(
    _jobId: string,
    _data: { deliveryCompletedAt?: string; notes?: string; deliveryPhotos?: string[] }
  ): Promise<TransportJob> {
    throw new Error('Not implemented');
  },

  async updateJobLocation(_jobId: string, _latitude: number, _longitude: number): Promise<void> {
    // no-op stub
  },

  async getAvailableRequests(): Promise<TransportRequest[]> {
    return [];
  },

  async getMyBids(): Promise<TransportBid[]> {
    return [];
  },

  async submitBid(_bidData: Partial<TransportBid> & { estimatedDuration?: number }): Promise<TransportBid> {
    throw new Error('Not implemented');
  },

  async getTransporterPerformance(_id: string): Promise<TransportPerformance> {
    return { completedJobs: 0, onTimeRate: 0, avgRating: 0, totalEarnings: 0 };
  },

  async getMyFleet(): Promise<{
    trucks: TransportFleetTruck[];
    drivers: TransportFleetDriver[];
    summary: TransportFleetSummary;
  }> {
    return {
      trucks: [],
      drivers: [],
      summary: {
        totalTrucks: 0,
        totalDrivers: 0,
        availableTrucks: 0,
        availableDrivers: 0,
        assignedDrivers: 0,
      },
    };
  },
};

export default transportService;
