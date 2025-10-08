import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';
import { useAuthStore } from '@stores/auth.store';

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

interface ApiResponse<T> {
  data: T;
  error?: { code: string; message: string };
}

class TransportService {
  private getHeaders = async () => {
    let token = useAuthStore.getState().token;

    if (!token) {
      const persisted = await AsyncStorage.getItem('auth-storage');
      if (persisted) {
        try {
          const parsed = JSON.parse(persisted);
          token = parsed?.state?.token ?? null;
        } catch (error) {
          console.warn('Failed to parse persisted auth storage', error);
        }
      }
    }

    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  // Get available transport requests (for bidding)
  async getAvailableRequests(): Promise<TransportRequest[]> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_URL}/transport/requests/available`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transport requests');
      }

      const data: ApiResponse<TransportRequest[]> = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching transport requests:', error);
      throw error;
    }
  }

  // Get transport request by ID
  async getRequestById(requestId: string): Promise<TransportRequest> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_URL}/transport/requests/${requestId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transport request');
      }

      const data: ApiResponse<TransportRequest> = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching transport request:', error);
      throw error;
    }
  }

  // Submit a bid for a transport request
  async submitBid(bidData: {
    transportRequestId: string;
    bidAmount: number;
    estimatedDuration: number;
    vehicleType: string;
    vehicleCapacity?: number;
    expiresAt?: string;
  }): Promise<TransportBid> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_URL}/transport/bids`, {
        method: 'POST',
        headers,
        body: JSON.stringify(bidData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit bid');
      }

      const data: ApiResponse<TransportBid> = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error submitting bid:', error);
      throw error;
    }
  }

  // Get my bids
  async getMyBids(): Promise<TransportBid[]> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_URL}/transport/my-bids`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bids');
      }

      const data: ApiResponse<TransportBid[]> = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching bids:', error);
      throw error;
    }
  }

  // Get my transport jobs
  async getMyJobs(): Promise<TransportJob[]> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_URL}/transport/my-jobs`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }

      const data: ApiResponse<TransportJob[]> = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching jobs:', error);
      throw error;
    }
  }

  // Start a transport job
  async startJob(jobId: string, payload?: { actualPickupTime?: string; notes?: string }): Promise<TransportJob> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_URL}/transport/jobs/${jobId}/start`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload ?? {}),
      });

      if (!response.ok) {
        throw new Error('Failed to start job');
      }

      const data: ApiResponse<TransportJob> = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error starting job:', error);
      throw error;
    }
  }

  // Update job status
  async updateJobStatus(jobId: string, statusData: {
    status: string;
    currentLocation?: { lat: number; lng: number; address?: string };
    estimatedArrival?: string;
    notes?: string;
  }): Promise<TransportJob> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_URL}/transport/jobs/${jobId}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(statusData),
      });

      if (!response.ok) {
        throw new Error('Failed to update job status');
      }

      const data: ApiResponse<TransportJob> = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error updating job status:', error);
      throw error;
    }
  }

  // Complete pickup
  async completePickup(jobId: string, pickupData: {
    pickupNotes?: string;
    actualWeight?: number;
    pickupPhotos?: string[];
  }): Promise<TransportJob> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_URL}/transport/jobs/${jobId}/pickup`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(pickupData),
      });

      if (!response.ok) {
        throw new Error('Failed to complete pickup');
      }

      const data: ApiResponse<TransportJob> = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error completing pickup:', error);
      throw error;
    }
  }

  // Complete delivery
  async completeDelivery(jobId: string, deliveryData: {
    deliveryPhotos?: string[];
    proofOfDelivery?: string;
    deliveryNotes?: string;
    recipientSignature?: string;
  }): Promise<TransportJob> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_URL}/transport/jobs/${jobId}/deliver`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(deliveryData),
      });

      if (!response.ok) {
        throw new Error('Failed to complete delivery');
      }

      const data: ApiResponse<TransportJob> = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error completing delivery:', error);
      throw error;
    }
  }

  async getTransporterPerformance(transporterId: string): Promise<TransporterPerformance> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_URL}/transport/analytics/transporter-performance/${transporterId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transporter performance');
      }

      const data: ApiResponse<TransporterPerformance> = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching transporter performance:', error);
      throw error;
    }
  }
}

export default new TransportService();
