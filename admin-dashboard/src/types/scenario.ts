// Shared scenario types for the admin dashboard

export interface ScenarioStep {
  step: number;
  description?: string;
  actor: string;
  action: string;
  payload?: any;
  data?: any;
  status?: 'pending' | 'in_progress' | 'completed' | 'failed' | 'active' | 'accepted' | 'rejected' | 'passed' | 'assigned' | 'pending_bids' | 'in_transit' | 'price_adjusted' | 'bid_submitted' | 'delivered' | 'bid_accepted' | 'confirmed' | 'processing' | 'archived' | string;
  result?: any;
  error?: string;
  duration?: number;
}
