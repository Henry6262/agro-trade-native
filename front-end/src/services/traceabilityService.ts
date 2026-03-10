import apiClient from './api';

export interface ProvenanceEvent {
  type: string;
  timestamp: string;
  actorRole: string;
  location: { lat?: number; lng?: number; region?: string };
  grade?: string;
  verified: boolean;
  blockchainTxHash?: string;
}

export interface ProvenanceResponse {
  tradeId: string;
  events: ProvenanceEvent[];
}

export interface TradeCertificate {
  certificateId: string;
  tradeId: string;
  issuedAt: string;
  standard: string;
  completedAt: string | null;
  inspectionGrade: string | null;
  verified: boolean;
  eventCount: number;
}

export const traceabilityService = {
  async getProvenance(tradeOperationId: string): Promise<ProvenanceResponse> {
    const response = await apiClient.get(`/traceability/${tradeOperationId}/provenance`);
    return response.data;
  },

  getQRUrl(tradeOperationId: string): string {
    // Return the URL to the QR code image endpoint
    const baseUrl = apiClient.defaults.baseURL ?? '';
    return `${baseUrl}/traceability/${tradeOperationId}/qr`;
  },

  async getCertificate(tradeOperationId: string): Promise<TradeCertificate> {
    const response = await apiClient.get(`/traceability/${tradeOperationId}/certificate`);
    return response.data;
  },
};
