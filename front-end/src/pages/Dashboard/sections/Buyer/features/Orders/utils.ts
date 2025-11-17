import type { BuyerIncomingOffer, BuyerOrder, BuyerStatistics } from './types';

export const getDefaultBuyerStatistics = (): BuyerStatistics => ({
  totalSpent: 0,
  monthlySpent: 0,
  completedOrders: 0,
  averagePerOrder: 0,
  topProduct: 'N/A',
  savingsRate: 0,
});

export const getPhaseStatus = (phase: string): string => {
  switch (phase) {
    case 'INITIATION':
      return 'Pending';
    case 'SELLER_NEGOTIATION':
      return 'Negotiating';
    case 'TRANSPORT_MATCHING':
      return 'Finding Transport';
    case 'IN_TRANSIT':
      return 'In Transit';
    case 'DELIVERY':
      return 'Delivering';
    case 'PAYMENT':
      return 'Payment';
    case 'COMPLETED':
      return 'Delivered';
    default:
      return phase;
  }
};

export const getPhaseStage = (phase: string): number => {
  switch (phase) {
    case 'INITIATION':
    case 'SELLER_NEGOTIATION':
      return 0;
    case 'TRANSPORT_MATCHING':
      return 1;
    case 'IN_TRANSIT':
      return 2;
    case 'DELIVERY':
    case 'PAYMENT':
      return 3;
    case 'COMPLETED':
      return 4;
    default:
      return 0;
  }
};

export const mapOperationToOrder = (operation: any): BuyerOrder => ({
  id: operation.id,
  operationNumber: operation.operationNumber,
  product: operation.buyListing?.product?.name || 'Unknown Product',
  quantity: operation.targetQuantity,
  maxPricePerTon: operation.buyListing?.maxPricePerUnit || 0,
  phase: operation.phase,
  status: getPhaseStatus(operation.phase),
  totalCost: operation.targetQuantity * (operation.buyListing?.maxPricePerUnit || 0),
  currentStage: getPhaseStage(operation.phase),
  qualityRequirements: operation.buyListing?.qualityRequirements || [],
  securedQuantity: operation.securedQuantity ?? 0,
  estimatedProfit: operation.estimatedProfit,
  createdAt: operation.createdAt,
  updatedAt: operation.updatedAt,
});

export const buildMockIncomingOffers = (): BuyerIncomingOffer[] => [
  {
    id: 'IO001',
    product: 'Premium Wheat',
    quantity: 40,
    offeredPricePerTon: 275,
    totalValue: 11000,
    seller: 'Midwest Grain Co',
    sellerLocation: 'Nebraska, USA',
    sellerFlag: '🇺🇸',
    adminNote:
      'High-quality wheat available for immediate delivery. Seller offers competitive pricing for bulk orders.',
    deadline: '2025-01-26',
    responseTime: '16 hours',
    qualityOffered: ['Organic', 'Non-GMO', 'Protein 14%'],
    deliveryDate: '2025-01-30',
  },
  {
    id: 'IO002',
    product: 'Corn Grain',
    quantity: 60,
    offeredPricePerTon: 210,
    totalValue: 12600,
    seller: 'Golden Harvest Farm',
    sellerLocation: 'Kansas, USA',
    sellerFlag: '🇺🇸',
    adminNote: 'Fresh corn harvest with excellent moisture content. Perfect for feed production.',
    deadline: '2025-01-29',
    responseTime: '3 days',
    qualityOffered: ['Grade A', 'Moisture 14%'],
    deliveryDate: '2025-02-05',
  },
];
