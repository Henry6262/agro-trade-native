import { axios, API_BASE } from './config';
import type { UserRole, SimulationUser, TradeState } from './types';

export const userService = {
  getUsersByRole: async (role: UserRole): Promise<SimulationUser[]> => {
    const response = await axios.get(`${API_BASE}/simulation/users/${role}`);
    return response.data;
  },

  getFullTradeState: async (tradeOperationId: string): Promise<TradeState> => {
    const response = await axios.get(
      `${API_BASE}/simulation/trade-operation/${tradeOperationId}/full-state`
    );
    return response.data;
  },

  createTestUser: async (
    role: UserRole,
    name?: string,
    data?: any
  ): Promise<SimulationUser> => {
    const response = await axios.post(
      `${API_BASE}/simulation/users/create-test-user`,
      { role, name, data }
    );
    return response.data;
  },
};
