export interface InspectionRequest {
  id: string;
  tradeOperationId: string;
  inspectorId?: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'rejected';
  scheduledDate?: string;
  completedDate?: string;
  findings?: string;
}

const inspectionService = {
  getByTradeOperation: async (tradeOperationId: string): Promise<InspectionRequest[]> => [],
  getById: async (id: string): Promise<InspectionRequest | null> => null,
  create: async (data: Partial<InspectionRequest>): Promise<InspectionRequest> =>
    data as InspectionRequest,
  update: async (id: string, data: Partial<InspectionRequest>): Promise<InspectionRequest> =>
    data as InspectionRequest,
};

export default inspectionService;
