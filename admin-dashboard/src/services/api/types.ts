export type UserRole = 'BUYER' | 'FARMER' | 'TRANSPORTER' | 'INSPECTOR' | 'ADMIN' | 'COMPANY_ADMIN';

export type SimulationUser = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  company?: {
    id: string;
    legalName: string;
  };
};

export type TradeState = {
  operation: any;
  state: {
    phase: string;
    status: string;
    totalQuantityNeeded: number;
    securedQuantity: number;
    quantityGap: number;
    pendingNegotiations: number;
    activeTransport: any;
    inspections: {
      total: number;
      pending: number;
      completed: number;
    };
  };
  actors: {
    buyer: any;
    sellers: any[];
    transporters: any[];
    inspectors: any[];
  };
};
