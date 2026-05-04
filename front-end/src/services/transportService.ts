import { apiClient } from './api';

export interface TransportPickupPoint {
  lat: number;
  lng: number;
  address?: string;
  quantity?: number;
  sellerId?: string;
  sellerName?: string;
  notes?: string;
}

export interface TransportDeliveryPoint {
  lat: number;
  lng: number;
  address?: string;
  addressId?: string;
}

export interface TransportTradeOperationSummary {
  id: string;
  operationNumber?: string | null;
  status?: string | null;
  phase?: string | null;
  profitMargin?: number | null;
  buyListing?: {
    id: string;
    quantity?: number | null;
    unit?: string | null;
    product?: {
      id: string;
      name: string;
      category?: string | null;
    } | null;
    buyer?: {
      id: string;
      name?: string | null;
      email?: string | null;
    } | null;
  } | null;
}

export interface TransportBidTransporterSummary {
  id: string;
  name?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  company?: {
    id: string;
    legalName?: string | null;
    registrationNumber?: string | null;
  } | null;
}

export interface TransportRequestSummary {
  id: string;
  requestNumber: string;
  status: string;
  tradeOperationId: string;
  totalWeight: number;
  requiredVehicleType?: string;
  pickupPoints: TransportPickupPoint[];
  deliveryPoint: TransportDeliveryPoint;
  estimatedDistance?: number;
  urgencyLevel?: string;
  biddingDeadline: string;
  maxBudget?: number;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  bidsCount?: number;
  lowestBid?: number;
  tradeOperation?: TransportTradeOperationSummary;
}

export interface TransportRequest extends TransportRequestSummary {
  bids?: TransportBid[];
  transportJob?: TransportJob;
}

export interface TransportBid {
  id: string;
  transportRequestId: string;
  tradeOperationId: string;
  transporterId: string;
  bidAmount: number;
  estimatedDuration: number;
  vehicleType?: string;
  vehicleCapacity?: number;
  status: string;
  submittedAt?: string;
  expiresAt?: string;
  transporter?: TransportBidTransporterSummary;
  transportRequest?: TransportRequestSummary;
}

export interface TransportJobLocation {
  lat: number;
  lng: number;
  address?: string;
  timestamp?: string;
}

export interface TransportPickupRecord {
  sellerId?: string;
  quantity?: number;
  notes?: string;
  completedAt?: string;
}

export interface TransportJob {
  id: string;
  jobNumber: string;
  transportRequestId: string;
  status: string;
  transporterId?: string;
  currentLocation?: TransportJobLocation;
  estimatedArrival?: string;
  pickupsCompleted?: TransportPickupRecord[];
  allPickupsComplete?: boolean;
  startedAt?: string;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  pickupPhotos?: string[];
  deliveryPhotos?: string[];
  proofOfDelivery?: string;
  notes?: string | null;
  transportRequest?: TransportRequestSummary;
}

export interface TransporterPerformance {
  transporterId: string;
  completedJobs: number;
  totalJobs: number;
  completionRate?: number;
  onTimeDeliveryRate?: number;
  recentJobs: TransportJob[];
}

export interface TransporterAnalyticsMetrics {
  totalBids: number;
  acceptedBids: number;
  winRate: number;
  pendingBids: number;
  activeJobs: number;
  completedJobs: number;
  onTimeDeliveryRate: number;
  averageBidAmount: number;
}

export interface TransporterAnalyticsSummary {
  metrics: TransporterAnalyticsMetrics;
  recentJobs: TransportJob[];
}

export interface TransportFleetTruck {
  id: string;
  licensePlate: string;
  model: string;
  capacityTons: number;
  status: 'available' | 'assigned' | 'maintenance';
  location: string;
  verified: boolean;
  driver?: string;
  assignment?: string | null;
}

export interface TransportFleetDriver {
  id: string;
  name: string;
  license: string;
  phone?: string | null;
  status: 'available' | 'assigned';
  experienceYears: number;
  assignment?: string | null;
}

export interface TransportFleetSummary {
  totalTrucks: number;
  availableTrucks: number;
  inTransitTrucks: number;
  verifiedTrucks: number;
  availableDrivers: number;
  assignedDrivers: number;
}

export interface TransportFleetResponse {
  summary: TransportFleetSummary;
  trucks: TransportFleetTruck[];
  drivers: TransportFleetDriver[];
}

export const transportService = {
  // Get all transport requests (with optional filters)
  async getTransportRequests(params?: {
    status?: string;
    urgencyLevel?: string;
  }): Promise<TransportRequest[]> {
    try {
      const response = await apiClient.get('/transport/requests', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching transport requests:', error);
      throw error;
    }
  },

  async getAvailableRequests(params?: {
    radius?: number;
    minWeight?: number;
    maxWeight?: number;
  }): Promise<TransportRequest[]> {
    try {
      const response = await apiClient.get('/transport/requests/available', { params });
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error('Error fetching available transport requests:', error);
      throw error;
    }
  },

  // Get transport request by ID
  async getRequestById(requestId: string): Promise<TransportRequest> {
    try {
      const response = await apiClient.get(`/transport/requests/${requestId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching transport request:', error);
      throw error;
    }
  },

  // Submit a bid for a transport request
  async submitBid(bidData: {
    transportRequestId: string;
    tradeOperationId: string;
    bidAmount: number;
    estimatedDuration: number;
    vehicleType?: string;
    vehicleCapacity?: number;
    expiresAt?: string;
  }): Promise<TransportBid> {
    try {
      const response = await apiClient.post('/transport/bids', bidData);
      return response.data;
    } catch (error) {
      console.error('Error submitting bid:', error);
      throw error;
    }
  },

  // Get transport bids (for transporter - filtered by their ID automatically)
  async getMyBids(params?: {
    transportRequestId?: string;
    status?: string;
  }): Promise<TransportBid[]> {
    try {
      const response = await apiClient.get('/transport/bids', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching bids:', error);
      throw error;
    }
  },

  // Get transport jobs (for transporter - filtered by their ID automatically)
  async getMyJobs(params?: { status?: string }): Promise<TransportJob[]> {
    try {
      const response = await apiClient.get('/transport/jobs', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching jobs:', error);
      throw error;
    }
  },

  // Start a transport job
  async startJob(
    jobId: string,
    payload?: { actualPickupTime?: string; notes?: string }
  ): Promise<TransportJob> {
    try {
      const response = await apiClient.post(`/transport/jobs/${jobId}/start`, payload ?? {});
      return response.data;
    } catch (error) {
      console.error('Error starting job:', error);
      throw error;
    }
  },

  // Update job status
  async updateJobStatus(
    jobId: string,
    statusData: {
      status: string;
      currentLocation?: { lat: number; lng: number; address?: string };
      estimatedArrival?: string;
      notes?: string;
    }
  ): Promise<TransportJob> {
    try {
      const response = await apiClient.put(`/transport/jobs/${jobId}/status`, statusData);
      return response.data;
    } catch (error) {
      console.error('Error updating job status:', error);
      throw error;
    }
  },

  // Complete pickup
  async completePickup(
    jobId: string,
    pickupData: {
      pickupNotes?: string;
      actualWeight?: number;
      pickupPhotos?: string[];
    }
  ): Promise<TransportJob> {
    try {
      const response = await apiClient.post(`/transport/jobs/${jobId}/pickup`, pickupData);
      return response.data;
    } catch (error) {
      console.error('Error completing pickup:', error);
      throw error;
    }
  },

  // Complete delivery
  async completeDelivery(
    jobId: string,
    deliveryData: {
      deliveryPhotos?: string[] | undefined;
      proofOfDelivery?: string | undefined;
      deliveryNotes?: string | undefined;
      recipientSignature?: string | undefined;
    }
  ): Promise<TransportJob> {
    try {
      const response = await apiClient.post(`/transport/jobs/${jobId}/delivery`, deliveryData);
      return response.data;
    } catch (error) {
      console.error('Error completing delivery:', error);
      throw error;
    }
  },

  // Update job location (GPS tracking during IN_TRANSIT)
  async updateJobLocation(jobId: string, latitude: number, longitude: number): Promise<void> {
    try {
      await apiClient.put(`/transport/jobs/${jobId}/location`, { latitude, longitude });
    } catch (error) {
      console.error('Error updating job location:', error);
      throw error;
    }
  },

  // Get transporter performance metrics
  async getTransporterPerformance(transporterId: string): Promise<TransporterPerformance> {
    try {
      const response = await apiClient.get(
        `/transport/analytics/transporter-performance/${transporterId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching transporter performance:', error);
      throw error;
    }
  },

  async getMyAnalytics(): Promise<TransporterAnalyticsSummary> {
    try {
      const response = await apiClient.get('/transport/me/analytics');
      return {
        metrics: response.data.metrics,
        recentJobs: response.data.recentJobs ?? [],
      };
    } catch (error) {
      console.error('Error fetching transporter analytics:', error);
      throw error;
    }
  },

  async getMyFleet(): Promise<TransportFleetResponse> {
    try {
      const response = await apiClient.get('/transport-company/me/fleet');
      return response.data;
    } catch (error) {
      console.error('Error fetching transporter fleet:', error);
      throw error;
    }
  },

  // ==================== TRUCK CRUD OPERATIONS ====================

  async createTruck(data: {
    licensePlate: string;
    model: string;
    capacityTons: number;
    location?: { lat: number; lng: number; address?: string };
    vehicleType?: string;
  }): Promise<TransportFleetTruck> {
    try {
      const response = await apiClient.post('/transport-company/me/trucks', data);
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error('Error creating truck:', error);
      throw error;
    }
  },

  async updateTruck(
    truckId: string,
    data: {
      licensePlate?: string;
      model?: string;
      capacityTons?: number;
      location?: { lat: number; lng: number; address?: string };
      vehicleType?: string;
      status?: 'available' | 'assigned' | 'maintenance';
    }
  ): Promise<TransportFleetTruck> {
    try {
      const response = await apiClient.put(`/transport-company/me/trucks/${truckId}`, data);
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error('Error updating truck:', error);
      throw error;
    }
  },

  async deleteTruck(truckId: string): Promise<void> {
    try {
      await apiClient.delete(`/transport-company/me/trucks/${truckId}`);
    } catch (error) {
      console.error('Error deleting truck:', error);
      throw error;
    }
  },

  // ==================== DRIVER CRUD OPERATIONS ====================

  async createDriver(data: {
    firstName: string;
    lastName: string;
    licenseNumber: string;
    phone: string;
    experienceYears?: number;
    email?: string;
    licenseClasses?: string[];
  }): Promise<TransportFleetDriver> {
    try {
      const response = await apiClient.post('/transport-company/me/drivers', data);
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error('Error creating driver:', error);
      throw error;
    }
  },

  async updateDriver(
    driverId: string,
    data: {
      firstName?: string;
      lastName?: string;
      licenseNumber?: string;
      phone?: string;
      experienceYears?: number;
      email?: string;
      licenseClasses?: string[];
      status?: 'available' | 'assigned' | 'offline' | 'on_break';
    }
  ): Promise<TransportFleetDriver> {
    try {
      const response = await apiClient.put(`/transport-company/me/drivers/${driverId}`, data);
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error('Error updating driver:', error);
      throw error;
    }
  },

  async deleteDriver(driverId: string): Promise<void> {
    try {
      await apiClient.delete(`/transport-company/me/drivers/${driverId}`);
    } catch (error) {
      console.error('Error deleting driver:', error);
      throw error;
    }
  },

  // ==================== DRIVER ASSIGNMENT OPERATIONS ====================

  async assignDriver(truckId: string, driverId: string): Promise<void> {
    try {
      await apiClient.post(`/transport-company/me/trucks/${truckId}/assign-driver`, {
        driverId,
      });
    } catch (error) {
      console.error('Error assigning driver:', error);
      throw error;
    }
  },

  async unassignDriver(truckId: string): Promise<void> {
    try {
      await apiClient.delete(`/transport-company/me/trucks/${truckId}/unassign-driver`);
    } catch (error) {
      console.error('Error unassigning driver:', error);
      throw error;
    }
  },
};

export default transportService;
