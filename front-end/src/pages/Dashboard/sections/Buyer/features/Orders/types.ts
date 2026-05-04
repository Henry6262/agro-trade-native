export interface BuyerStatistics {
  totalSpent: number;
  monthlySpent: number;
  completedOrders: number;
  averagePerOrder: number;
  topProduct: string;
  savingsRate: number;
}

export interface MatchedSeller {
  id: string;
  sellerName: string;
  agreedPricePerUnit: number | null;
  quantity: number | null;
  status: string;
}

export interface BuyerOrder {
  id: string;
  operationNumber?: string;
  product: string;
  quantity: number;
  maxPricePerTon: number;
  phase: string;
  status: string;
  totalCost: number;
  currentStage: number;
  qualityRequirements: string[];
  securedQuantity: number;
  estimatedProfit?: number;
  sellers: MatchedSeller[];
  createdAt: string;
  updatedAt: string;
}

export interface BuyerIncomingOffer {
  id: string;
  product: string;
  quantity: number;
  offeredPricePerTon: number;
  totalValue: number;
  seller: string;
  sellerLocation: string;
  sellerFlag?: string | undefined;
  adminNote: string;
  deadline: string;
  responseTime: string;
  qualityOffered: string[];
  deliveryDate: string;
}

export interface BuyerOrdersHookResult {
  orders: BuyerOrder[];
  stats: BuyerStatistics;
  incomingOffers: BuyerIncomingOffer[];
  expandedOrderId: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isFetchingMore: boolean;
  hasMore: boolean;
  toggleOrderExpand: (orderId: string) => void;
  refresh: () => Promise<void>;
  fetchMore: () => Promise<void>;
}

export interface BuyerTimelineEvent {
  id: string;
  type: 'TRADE' | 'NEGOTIATION' | 'TRANSPORT' | 'INSPECTION';
  title: string;
  status: string;
  timestamp: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface BuyerTimelineHookResult {
  events: BuyerTimelineEvent[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}
