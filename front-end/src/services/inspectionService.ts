import { apiClient } from './api';

export interface InspectionRequest {
  id: string;
  tradeOperationId: string;
  inspectorId?: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'rejected';
  scheduledDate?: string;
  completedDate?: string;
  findings?: string;
  saleListingId?: string;
  priority?: string;
  notes?: string;
  saleListing?: {
    seller?: { name?: string } | null;
    address?: { address?: string } | null;
  } | null;
}

interface SubmitResultsPayload {
  findings?: string;
  score?: number;
  qualityScore?: number;
  verificationResult?: unknown;
  recommendVerification?: boolean;
  notes?: string;
  photos?: string[];
  status?: string;
}

const inspectionService = {
  getByTradeOperation: async (tradeOperationId: string): Promise<InspectionRequest[]> => {
    const { data } = await apiClient.get<InspectionRequest[]>(
      `/inspections/trade-operation/${tradeOperationId}`,
    );
    return data ?? [];
  },

  getInspectionsByTradeOperation: async (
    tradeOperationId: string,
  ): Promise<InspectionRequest[]> => {
    const { data } = await apiClient.get<InspectionRequest[]>(
      `/inspections/trade-operation/${tradeOperationId}`,
    );
    return data ?? [];
  },

  getById: async (id: string): Promise<InspectionRequest | null> => {
    try {
      // No dedicated GET /inspections/:id on backend — list and filter.
      const { data } = await apiClient.get<{ data: InspectionRequest[] }>('/inspections');
      return data?.data?.find((i) => i.id === id) ?? null;
    } catch {
      return null;
    }
  },

  create: async (data: Partial<InspectionRequest>): Promise<InspectionRequest> => {
    const { data: created } = await apiClient.post<InspectionRequest>('/inspections', data);
    return created;
  },

  update: async (
    id: string,
    data: Partial<InspectionRequest>,
  ): Promise<InspectionRequest> => {
    const { data: updated } = await apiClient.patch<InspectionRequest>(
      `/inspections/${id}`,
      data,
    );
    return updated;
  },

  acceptJob: async (
    id: string,
    payload?: string | { inspectorId: string; estimatedArrival: string },
  ): Promise<InspectionRequest> => {
    // Backend accepts a job via PUT /:id/status with status=ASSIGNED|IN_PROGRESS.
    // Caller convention: passing inspectorId/estimatedArrival is informational —
    // the backend resolves the inspectorId from the JWT.
    const status = typeof payload === 'string' ? payload : 'IN_PROGRESS';
    const { data } = await apiClient.put<InspectionRequest>(
      `/inspections/${id}/status`,
      { status },
    );
    return data;
  },

  getInspectorMissions: async (inspectorId: string): Promise<InspectionRequest[]> => {
    const { data } = await apiClient.get<InspectionRequest[]>(
      `/inspections/inspector/${inspectorId}`,
    );
    return data ?? [];
  },

  assignInspector: async (
    inspectionId: string,
    inspectorId: string,
  ): Promise<InspectionRequest> => {
    const { data } = await apiClient.put<InspectionRequest>(
      `/inspections/${inspectionId}/assign`,
      { inspectorId },
    );
    return data;
  },

  submitInspectionResults: async (
    id: string,
    payload: SubmitResultsPayload,
  ): Promise<InspectionRequest> => {
    const { data } = await apiClient.post<InspectionRequest>(
      `/inspections/${id}/results`,
      payload,
    );
    return data;
  },

  requestInspectionsForTrade: async (
    tradeOperationId: string,
    saleListingIds: string[],
  ): Promise<void> => {
    await apiClient.post('/inspections/batch', {
      tradeOperationId,
      saleListingIds,
    });
  },
};

export { inspectionService };
export default inspectionService;
