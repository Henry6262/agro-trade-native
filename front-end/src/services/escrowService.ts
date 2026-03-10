import apiClient from './api';

export interface EscrowStatus {
  tradeOperationId: string;
  buyer: string;
  seller: string;
  amountWei: string;
  state:
    | 'AWAITING_PAYMENT'
    | 'AWAITING_DELIVERY'
    | 'COMPLETE'
    | 'DISPUTED'
    | 'REFUNDED'
    | 'UNKNOWN';
  tradeId: string;
}

export interface CreateEscrowParams {
  tradeOperationId: string;
  buyerAddress: string;
  sellerAddress: string;
  amountEth: string;
}

export const escrowService = {
  async createEscrow(params: CreateEscrowParams): Promise<{ txHash: string }> {
    const response = await apiClient.post('/escrow/create', params);
    return response.data;
  },

  async releaseFunds(tradeOperationId: string): Promise<{ txHash: string }> {
    const response = await apiClient.post(`/escrow/${tradeOperationId}/release`);
    return response.data;
  },

  async raiseDispute(tradeOperationId: string): Promise<{ txHash: string }> {
    const response = await apiClient.post(`/escrow/${tradeOperationId}/dispute`);
    return response.data;
  },

  async getStatus(tradeOperationId: string): Promise<EscrowStatus> {
    const response = await apiClient.get(`/escrow/${tradeOperationId}/status`);
    return response.data;
  },
};
