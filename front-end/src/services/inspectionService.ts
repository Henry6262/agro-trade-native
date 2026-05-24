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

const inspectionService = {
  getByTradeOperation: async (tradeOperationId: string): Promise<InspectionRequest[]> => [],
  getInspectionsByTradeOperation: async (
    tradeOperationId: string
  ): Promise<InspectionRequest[]> => [],
  getById: async (id: string): Promise<InspectionRequest | null> => null,
  create: async (data: Partial<InspectionRequest>): Promise<InspectionRequest> =>
    data as InspectionRequest,
  update: async (id: string, data: Partial<InspectionRequest>): Promise<InspectionRequest> =>
    data as InspectionRequest,
  acceptJob: async (
    _id: string,
    _data?: string | { inspectorId: string; estimatedArrival: string }
  ): Promise<InspectionRequest> => ({}) as InspectionRequest,
  getInspectorMissions: async (_inspectorId: string): Promise<InspectionRequest[]> => [],
  assignInspector: async (
    _tradeOperationId: string,
    _inspectorId: string
  ): Promise<InspectionRequest> => ({}) as InspectionRequest,
  submitInspectionResults: async (
    _id: string,
    _data: {
      findings?: string;
      score?: number;
      qualityScore?: number;
      verificationResult?: unknown;
      recommendVerification?: boolean;
      notes?: string;
      photos?: string[];
      status?: string;
    }
  ): Promise<InspectionRequest> => ({}) as InspectionRequest,
  requestInspectionsForTrade: async (
    _tradeOperationId: string,
    _saleListingIds: string[]
  ): Promise<void> => {
    throw new Error('Not implemented');
  },
};

export { inspectionService };
export default inspectionService;
