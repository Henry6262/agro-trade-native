import { axios, API_BASE } from './config';

export const inspectorService = {
  acceptJob: async (userId: string, inspectionId: string) => {
    const response = await axios.post(
      `${API_BASE}/simulation/inspector/${userId}/accept-job`,
      { inspectionId }
    );
    return response.data;
  },

  submitResults: async (userId: string, data: {
    inspectionId: string;
    qualityScore: number;
    result: 'PASSED' | 'FAILED';
    notes?: string;
  }) => {
    const response = await axios.post(
      `${API_BASE}/simulation/inspector/${userId}/submit-results`,
      data
    );
    return response.data;
  },
};
