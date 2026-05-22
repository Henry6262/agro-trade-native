export interface TransportJob {
  id: string;
  status: string;
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
}

export interface TransportBid {
  id: string;
  requestId: string;
  transporterId: string;
  price: number;
  estimatedDays: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface TransportFleetTruck {
  id: string;
  plateNumber: string;
  type: string;
  capacity: number;
  status: 'available' | 'in_use' | 'maintenance';
  driver?: string;
}

export interface TransportFleetDriver {
  id: string;
  name: string;
  licenseType: string;
  experience: number;
  status: 'available' | 'assigned' | 'off_duty';
}

export interface TransportFleetSummary {
  totalTrucks: number;
  totalDrivers: number;
  availableTrucks: number;
  availableDrivers: number;
  assignedDrivers: number;
}

export interface TransportPerformance {
  completedJobs: number;
  onTimeRate: number;
  avgRating: number;
  totalEarnings: number;
}

const transportService = {
  async getMyJobs(): Promise<TransportJob[]> {
    return [];
  },

  async startJob(_jobId: string, _data: { startedAt: string }): Promise<TransportJob> {
    throw new Error('Not implemented');
  },

  async completePickup(
    _jobId: string,
    _data: { pickupCompletedAt: string; notes?: string }
  ): Promise<TransportJob> {
    throw new Error('Not implemented');
  },

  async completeDelivery(
    _jobId: string,
    _data: { deliveryCompletedAt: string; notes?: string }
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

  async submitBid(_bidData: Omit<TransportBid, 'id' | 'createdAt'>): Promise<TransportBid> {
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
