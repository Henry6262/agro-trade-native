import { api } from '@shared/utils/api';

export interface InspectionRequest {
  id: string;
  tradeOperationId: string;
  saleListingId: string;
  inspectorId?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  requestedDate: Date;
  scheduledDate?: Date;
  completedDate?: Date;
  latitude: number;
  longitude: number;
  address: string;
  notes?: string;
  photos: string[];
  qualityScore?: number;
  verificationResult?: any;
  inspector?: {
    id: string;
    name: string;
    email: string;
  };
  saleListing?: {
    id: string;
    seller: {
      id: string;
      name: string;
    };
    product: {
      id: string;
      name: string;
      type: string;
    };
    quantity: number;
    pricePerUnit: number;
  };
  tradeOperation?: {
    id: string;
    phase: string;
    buyListing?: {
      buyer: {
        id: string;
        name: string;
      };
    };
  };
}

export interface CreateInspectionRequestDto {
  tradeOperationId: string;
  saleListingId: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  requestedDate?: Date;
  notes?: string;
}

export interface SubmitInspectionResultsDto {
  qualityScore: number;
  verificationResult: {
    actualQuantity?: number;
    actualQuality?: string;
    moistureContent?: number;
    foreignMatter?: number;
    brokenGrains?: number;
    discoloration?: boolean;
    pestDamage?: boolean;
    productSpecifications?: {
      variety?: string;
      grade?: string;
      origin?: string;
      harvestDate?: Date;
    };
  };
  notes?: string;
  photos?: string[];
  recommendVerification: boolean;
}

export interface InspectionStats {
  total: number;
  pending: number;
  scheduled: number;
  inProgress: number;
  completed: number;
  avgQualityScore: number;
}

export const inspectionService = {
  // Create an inspection request
  async createInspectionRequest(data: CreateInspectionRequestDto): Promise<InspectionRequest> {
    const response = await api.post('/inspections', data);
    return response.data;
  },

  // Create batch inspection requests
  async createBatchInspections(
    tradeOperationId: string,
    saleListingIds: string[],
    priority: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM'
  ): Promise<InspectionRequest[]> {
    const response = await api.post(`/inspections/batch`, {
      tradeOperationId,
      saleListingIds,
      priority,
    });
    return response.data;
  },

  // Request inspections for a trade operation (from trade operations controller)
  async requestInspectionsForTrade(
    tradeOperationId: string,
    saleListingIds: string[],
    priority: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM'
  ): Promise<InspectionRequest[]> {
    const response = await api.post(`/trade-operations/${tradeOperationId}/request-inspections`, {
      saleListingIds,
      priority,
    });
    return response.data;
  },

  // Get all inspections for a trade operation
  async getInspectionsByTradeOperation(tradeOperationId: string): Promise<InspectionRequest[]> {
    const response = await api.get(`/inspections/trade-operation/${tradeOperationId}`);
    return response.data;
  },

  // Get available inspectors
  async getAvailableInspectors(): Promise<any[]> {
    const response = await api.get('/inspections/inspectors/available');
    return response.data;
  },

  // Assign an inspector to an inspection
  async assignInspector(inspectionId: string, inspectorId: string): Promise<InspectionRequest> {
    const response = await api.patch(`/inspections/${inspectionId}/assign`, { inspectorId });
    return response.data;
  },

  // Update inspection status
  async updateInspectionStatus(
    inspectionId: string,
    status: 'PENDING' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  ): Promise<InspectionRequest> {
    const response = await api.patch(`/inspections/${inspectionId}/status`, { status });
    return response.data;
  },

  // Submit inspection results (for inspector)
  async submitInspectionResults(
    inspectionId: string,
    data: SubmitInspectionResultsDto
  ): Promise<InspectionRequest> {
    const response = await api.post(`/inspections/${inspectionId}/results`, data);
    return response.data;
  },

  // Get inspector's missions
  async getInspectorMissions(
    inspectorId: string,
    status?: 'PENDING' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED'
  ): Promise<InspectionRequest[]> {
    const params = status ? { status } : {};
    const response = await api.get(`/inspections/inspector/${inspectorId}`, { params });
    return response.data;
  },

  // Get single inspection details
  async getInspection(inspectionId: string): Promise<InspectionRequest> {
    const response = await api.get(`/inspections/${inspectionId}`);
    return response.data;
  },

  // Get inspection statistics
  async getInspectionStats(): Promise<InspectionStats> {
    const response = await api.get('/inspections/stats');
    return response.data;
  },
};