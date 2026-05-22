import { apiClient } from './api';

export type EscrowState =
  | 'AWAITING_PAYMENT'
  | 'AWAITING_DELIVERY'
  | 'COMPLETE'
  | 'DISPUTED'
  | 'REFUNDED';

export type EscrowChain = 'CELO' | 'SOLANA';

export interface EscrowStatus {
  tradeOperationId: string;
  tradeId: string;
  buyer: string;
  seller: string;
  state: EscrowState;
  amount: string;
  amountFormatted: string;
  token: string;
  chain: EscrowChain;
  txHash?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EscrowActionResponse {
  success: boolean;
  txHash: string;
  state: EscrowState;
  message?: string;
}

export const escrowService = {
  // Get on-chain escrow status for a trade (admin-only backend endpoint)
  getStatus: async (tradeOperationId: string): Promise<EscrowStatus> => {
    const response = await apiClient.get<EscrowStatus>(`/escrow/${tradeOperationId}/status`);
    return response.data;
  },

  // Create escrow (admin only)
  createEscrow: async (params: {
    tradeOperationId: string;
    buyerAddress: string;
    sellerAddress: string;
    amountEth: string;
    chain?: EscrowChain;
  }): Promise<EscrowActionResponse> => {
    const response = await apiClient.post<EscrowActionResponse>('/escrow/create', params);
    return response.data;
  },

  // Release funds (admin only)
  releaseFunds: async (tradeOperationId: string): Promise<EscrowActionResponse> => {
    const response = await apiClient.post<EscrowActionResponse>(
      `/escrow/${tradeOperationId}/release`
    );
    return response.data;
  },

  // Raise dispute (admin only)
  raiseDispute: async (tradeOperationId: string): Promise<EscrowActionResponse> => {
    const response = await apiClient.post<EscrowActionResponse>(
      `/escrow/${tradeOperationId}/dispute`
    );
    return response.data;
  },

  // Resolve dispute (admin only)
  resolveDispute: async (
    tradeOperationId: string,
    releaseToBuyer: boolean
  ): Promise<EscrowActionResponse> => {
    const response = await apiClient.post<EscrowActionResponse>(
      `/escrow/${tradeOperationId}/resolve`,
      { releaseToBuyer }
    );
    return response.data;
  },

  // Refund (admin only)
  refund: async (tradeOperationId: string): Promise<EscrowActionResponse> => {
    const response = await apiClient.post<EscrowActionResponse>(
      `/escrow/${tradeOperationId}/refund`
    );
    return response.data;
  },
};

export default escrowService;
