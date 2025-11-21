import type { BuyerIncomingOffer, BuyerOrder, BuyerStatistics } from './types';
import type { BuyerOffer, BuyerStats } from '@services/buyerService';

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

export const deriveBuyerStatistics = (
  operations: any[],
  backendStats?: BuyerStats
): BuyerStatistics => {
  if (!operations.length && !backendStats) {
    return getDefaultBuyerStatistics();
  }

  const totalSpent = operations.reduce((sum, operation) => {
    const quantity = Number(operation.securedQuantity ?? operation.targetQuantity ?? 0);
    const price = Number(operation.buyListing?.maxPricePerUnit ?? 0);
    return sum + quantity * price;
  }, 0);

  const completedOrders = operations.filter((operation) => operation.phase === 'COMPLETED').length;
  const averagePerOrder =
    completedOrders > 0 ? Math.round(totalSpent / Math.max(completedOrders, 1)) : 0;

  const topProduct =
    operations.reduce<Record<string, number>>((acc, operation) => {
      const productName = operation.buyListing?.product?.name;
      if (!productName) return acc;
      acc[productName] = (acc[productName] ?? 0) + 1;
      return acc;
    }, {}) ?? {};

  const [topProductName] = Object.entries(topProduct).sort(([, a], [, b]) => b - a)[0] ?? [
    'N/A',
    0,
  ];

  return {
    totalSpent,
    monthlySpent: totalSpent, // TODO: refine once backend exposes month totals
    completedOrders,
    averagePerOrder,
    topProduct: topProductName,
    savingsRate: backendStats ? backendStats.acceptedOffers : 0,
  };
};

export const mapOfferToIncoming = (offer: BuyerOffer): BuyerIncomingOffer => {
  const quantity = Number(offer.quantity ?? 0);
  const price = Number(offer.price ?? 0);

  return {
    id: offer.id,
    product: offer.product?.name ?? offer.saleListing?.product?.name ?? 'Offer',
    quantity,
    offeredPricePerTon: price,
    totalValue: quantity * price,
    seller: offer.saleListing?.sellerId ?? 'Seller',
    sellerLocation: offer.saleListing?.product?.category ?? '—',
    sellerFlag: undefined,
    adminNote: 'Offer received via negotiation',
    deadline: offer.updatedAt ?? offer.createdAt ?? new Date().toISOString(),
    responseTime: '—',
    qualityOffered: [],
    deliveryDate: offer.updatedAt ?? offer.createdAt ?? new Date().toISOString(),
  };
};
