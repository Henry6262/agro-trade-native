import type { BuyerIncomingOffer, BuyerOrder, BuyerStatistics } from './types';
import type { BuyerOffer, BuyerStats } from '@services/buyerService';

export const getDefaultBuyerStatistics = (): BuyerStatistics => ({
  totalSpent: 0, monthlySpent: 0, completedOrders: 0,
  averagePerOrder: 0, topProduct: 'N/A', savingsRate: 0,
});

const PHASE_STATUS: Record<string, string> = {
  INITIATION: 'Pending', SELLER_NEGOTIATION: 'Negotiating',
  TRANSPORT_MATCHING: 'Finding Transport', IN_TRANSIT: 'In Transit',
  DELIVERY: 'Delivering', PAYMENT: 'Payment', COMPLETED: 'Delivered',
};

export const getPhaseStatus = (phase: string): string => PHASE_STATUS[phase] ?? phase;

const PHASE_STAGE: Record<string, number> = {
  INITIATION: 0, SELLER_NEGOTIATION: 0, TRANSPORT_MATCHING: 1,
  IN_TRANSIT: 2, DELIVERY: 3, PAYMENT: 3, COMPLETED: 4,
};

export const getPhaseStage = (phase: string): number => PHASE_STAGE[phase] ?? 0;

const PHASES_WITH_SELLERS = new Set([
  'SELLER_MATCHING', 'SELLER_NEGOTIATION', 'INSPECTION_PENDING',
  'TRANSPORT_MATCHING', 'TRANSPORT_BIDDING', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED',
]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mapOperationToOrder = (operation: any): BuyerOrder => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawSellers: any[] = Array.isArray(operation.sellers) ? operation.sellers : [];
  const sellers: BuyerOrder['sellers'] = PHASES_WITH_SELLERS.has(operation.phase)
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rawSellers.map((s: any) => ({
        id: s.id ?? s.sellerId ?? '',
        sellerName: s.sellerName ?? s.seller?.name ?? s.seller?.email ?? 'Unknown Seller',
        agreedPricePerUnit: s.agreedPricePerUnit ?? s.finalPrice ?? null,
        quantity: s.quantity ?? null,
        status: s.status ?? 'UNKNOWN',
      }))
    : [];
  return {
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
    sellers,
    createdAt: operation.createdAt,
    updatedAt: operation.updatedAt,
  };
};

export const deriveBuyerStatistics = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  operations: any[],
  backendStats?: BuyerStats
): BuyerStatistics => {
  if (!operations.length && !backendStats) return getDefaultBuyerStatistics();
  const totalSpent = operations.reduce((sum, operation) => {
    const quantity = Number(operation.securedQuantity ?? operation.targetQuantity ?? 0);
    const price = Number(operation.buyListing?.maxPricePerUnit ?? 0);
    return sum + quantity * price;
  }, 0);
  const completedOrders = operations.filter((op) => op.phase === 'COMPLETED').length;
  const averagePerOrder = completedOrders > 0 ? Math.round(totalSpent / Math.max(completedOrders, 1)) : 0;
  const topProduct = operations.reduce<Record<string, number>>((acc, operation) => {
    const productName = operation.buyListing?.product?.name;
    if (!productName) return acc;
    acc[productName] = (acc[productName] ?? 0) + 1;
    return acc;
  }, {}) ?? {};
  const [topProductName] = Object.entries(topProduct).sort(([, a], [, b]) => b - a)[0] ?? ['N/A', 0];
  return {
    totalSpent, monthlySpent: totalSpent,
    completedOrders, averagePerOrder,
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
    quantity, offeredPricePerTon: price, totalValue: quantity * price,
    seller: offer.saleListing?.sellerId ?? 'Seller',
    sellerLocation: offer.saleListing?.product?.category ?? '\u2014',
    sellerFlag: undefined,
    adminNote: 'Offer received via negotiation',
    deadline: offer.updatedAt ?? offer.createdAt ?? new Date().toISOString(),
    responseTime: '\u2014',
    qualityOffered: [],
    deliveryDate: offer.updatedAt ?? offer.createdAt ?? new Date().toISOString(),
  };
};
