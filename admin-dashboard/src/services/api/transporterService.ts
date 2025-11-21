import { axios, API_BASE } from './config';

export const transporterService = {
  submitBid: async (userId: string, data: {
    transportRequestId: string;
    bidAmount: number;
    estimatedDuration: number;
    vehicleType?: string;
    vehicleCapacity?: number;
  }) => {
    const response = await axios.post(
      `${API_BASE}/simulation/transporter/${userId}/submit-bid`,
      data
    );
    return response.data;
  },

  startJob: async (userId: string, jobId: string) => {
    const response = await axios.post(
      `${API_BASE}/simulation/transporter/${userId}/start-job`,
      { jobId }
    );
    return response.data;
  },

  completeDelivery: async (
    userId: string,
    jobId: string,
    deliveryNotes?: string
  ) => {
    const response = await axios.post(
      `${API_BASE}/simulation/transporter/${userId}/complete-delivery`,
      { jobId, deliveryNotes }
    );
    return response.data;
  },
};
