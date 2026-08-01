// Simulation Types
export type UserRole = 'BUYER' | 'FARMER' | 'TRANSPORTER' | 'INSPECTOR' | 'ADMIN' | 'COMPANY_ADMIN';

export interface SimulationUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  company?: {
    id: string;
    legalName: string;
  };
}

export interface TradeState {
  operation: unknown;
  state: {
    phase: string;
    status: string;
    totalQuantityNeeded: number;
    securedQuantity: number;
    quantityGap: number;
    pendingNegotiations: number;
    activeTransport: unknown;
    inspections: {
      total: number;
      pending: number;
      completed: number;
    };
  };
  actors: {
    buyer: SimulationUser | null;
    sellers: SimulationUser[];
    transporters: SimulationUser[];
    inspectors: SimulationUser[];
  };
}
