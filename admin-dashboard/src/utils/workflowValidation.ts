/**
 * Workflow Validation Utilities
 *
 * Centralized validation logic for trade operation workflows.
 * Ensures all prerequisites are met before allowing phase transitions.
 */

import type { TradeOperation, Offer } from '../types/listings';

export interface WorkflowValidationResult {
  canFinalize: boolean;
  inspectionsComplete: boolean;
  transportComplete: boolean;
  quantityFulfilled: boolean;
  allOffersFinalized: boolean;
  hasAcceptedOffers: boolean;
  isActiveOperation: boolean;
  blockers: string[];
  warnings: string[];
}

export interface InspectionSummary {
  total: number;
  completed: number;
  passed: number;
  failed: number;
  pending: number;
  allComplete: boolean;
  allPassed: boolean;
}

export interface TransportSummary {
  hasRequest: boolean;
  hasAssignedTransport: boolean;
  isComplete: boolean;
  status?: string;
  progress?: number;
}

export interface QuantitySummary {
  required: number;
  offered: number;
  accepted: number;
  fulfilled: number;
  shortfall: number;
  percentFulfilled: number;
  isFulfilled: boolean;
}

/**
 * Validates if a trade operation workflow is complete and ready for finalization
 */
export const validateWorkflowComplete = (
  operation: TradeOperation,
  inspectionSummary: InspectionSummary,
  transportSummary: TransportSummary,
  quantitySummary: QuantitySummary
): WorkflowValidationResult => {
  const blockers: string[] = [];
  const warnings: string[] = [];

  // Check accepted offers
  const hasAcceptedOffers = operation.offers?.some(o => o.status === 'accepted') || false;
  if (!hasAcceptedOffers) {
    blockers.push('No offers have been accepted yet');
  }

  // Check inspections
  const inspectionsComplete = inspectionSummary.allComplete && inspectionSummary.allPassed;
  if (!inspectionSummary.allComplete) {
    blockers.push(`${inspectionSummary.pending} inspections still pending`);
  }
  if (inspectionSummary.completed > 0 && !inspectionSummary.allPassed) {
    blockers.push(`${inspectionSummary.failed} inspections failed quality checks`);
  }

  // Check transport
  const transportComplete = transportSummary.isComplete;
  if (!transportSummary.hasRequest) {
    blockers.push('Transport request not created');
  } else if (!transportSummary.hasAssignedTransport) {
    warnings.push('Transport not yet assigned');
  } else if (!transportSummary.isComplete) {
    blockers.push('Transport delivery not complete');
  }

  // Check quantity fulfillment
  const quantityFulfilled = quantitySummary.isFulfilled;
  if (!quantityFulfilled) {
    if (quantitySummary.percentFulfilled < 90) {
      blockers.push(`Only ${quantitySummary.percentFulfilled.toFixed(0)}% of required quantity fulfilled`);
    } else {
      warnings.push(`${quantitySummary.shortfall}${operation.buyListing?.unit || ''} shortfall (${quantitySummary.percentFulfilled.toFixed(1)}% fulfilled)`);
    }
  }

  // Check all offers finalized
  const allOffersFinalized = operation.offers?.every(o => o.status !== 'pending') || false;
  if (!allOffersFinalized) {
    const pendingCount = operation.offers?.filter(o => o.status === 'pending').length || 0;
    warnings.push(`${pendingCount} offers still pending response`);
  }

  // Check operation is active
  const isActiveOperation = operation.status === 'ACTIVE';
  if (!isActiveOperation) {
    blockers.push(`Operation status is ${operation.status}, must be ACTIVE to finalize`);
  }

  // Can finalize if no blockers and critical checks pass
  const canFinalize =
    blockers.length === 0 &&
    hasAcceptedOffers &&
    inspectionsComplete &&
    transportComplete &&
    quantityFulfilled &&
    isActiveOperation;

  return {
    canFinalize,
    inspectionsComplete,
    transportComplete,
    quantityFulfilled,
    allOffersFinalized,
    hasAcceptedOffers,
    isActiveOperation,
    blockers,
    warnings,
  };
};

/**
 * Calculates inspection summary from inspection results
 */
export const calculateInspectionSummary = (inspections: any[]): InspectionSummary => {
  const total = inspections.length;
  const completed = inspections.filter(i => i.status === 'COMPLETED').length;
  const pending = inspections.filter(i => ['PENDING', 'SCHEDULED', 'IN_PROGRESS'].includes(i.status)).length;

  // An inspection passes if quality score >= 70
  const passed = inspections.filter(i =>
    i.status === 'COMPLETED' &&
    i.qualityScore !== null &&
    i.qualityScore !== undefined &&
    i.qualityScore >= 70
  ).length;

  const failed = completed - passed;

  return {
    total,
    completed,
    passed,
    failed,
    pending,
    allComplete: total > 0 && completed === total,
    allPassed: total > 0 && completed === total && passed === total,
  };
};

/**
 * Calculates transport summary from transport data
 */
export const calculateTransportSummary = (transportData: any | null): TransportSummary => {
  if (!transportData) {
    return {
      hasRequest: false,
      hasAssignedTransport: false,
      isComplete: false,
    };
  }

  const hasRequest = !!transportData.request;
  const hasAssignedTransport = !!transportData.job;
  const isComplete = transportData.job?.status === 'COMPLETED';

  return {
    hasRequest,
    hasAssignedTransport,
    isComplete,
    status: transportData.job?.status || transportData.request?.status,
    progress: transportData.job?.progress,
  };
};

/**
 * Calculates quantity summary from offers
 */
export const calculateQuantitySummary = (
  requiredQuantity: number,
  offers: Offer[] = []
): QuantitySummary => {
  const offered = offers.reduce((sum, o) => sum + o.quantity, 0);
  const accepted = offers
    .filter(o => o.status === 'accepted')
    .reduce((sum, o) => sum + o.quantity, 0);

  // For now, fulfilled equals accepted (in full workflow, this would track actual delivery)
  const fulfilled = accepted;
  const shortfall = Math.max(0, requiredQuantity - fulfilled);
  const percentFulfilled = requiredQuantity > 0 ? (fulfilled / requiredQuantity) * 100 : 0;
  const isFulfilled = fulfilled >= requiredQuantity;

  return {
    required: requiredQuantity,
    offered,
    accepted,
    fulfilled,
    shortfall,
    percentFulfilled,
    isFulfilled,
  };
};

/**
 * Calculates financial summary for a trade operation
 */
export interface FinancialSummary {
  totalPurchaseCost: number;
  totalTransportCost: number;
  totalOperationalCost: number;
  sellerRevenue: number;
  estimatedProfit: number;
  profitMargin: number;
  hasData: boolean;
}

export const calculateFinancialSummary = (
  operation: TradeOperation,
  transportCost: number = 0
): FinancialSummary => {
  const acceptedOffers = operation.offers?.filter(o => o.status === 'accepted') || [];

  if (acceptedOffers.length === 0) {
    return {
      totalPurchaseCost: 0,
      totalTransportCost: 0,
      totalOperationalCost: 0,
      sellerRevenue: 0,
      estimatedProfit: 0,
      profitMargin: 0,
      hasData: false,
    };
  }

  const totalPurchaseCost = acceptedOffers.reduce((sum, offer) => sum + offer.totalPrice, 0);
  const totalTransportCost = transportCost;
  const totalOperationalCost = totalPurchaseCost + totalTransportCost;

  // Revenue calculation: buyer's max price * accepted quantity
  const acceptedQuantity = acceptedOffers.reduce((sum, offer) => sum + offer.quantity, 0);
  const sellerRevenue = (operation.buyListing?.maxPricePerUnit || 0) * acceptedQuantity;

  const estimatedProfit = sellerRevenue - totalOperationalCost;
  const profitMargin = totalOperationalCost > 0 ? (estimatedProfit / totalOperationalCost) * 100 : 0;

  return {
    totalPurchaseCost,
    totalTransportCost,
    totalOperationalCost,
    sellerRevenue,
    estimatedProfit,
    profitMargin,
    hasData: true,
  };
};

/**
 * Validates if inspection can be requested for an offer
 */
export const canRequestInspection = (offer: Offer): { canRequest: boolean; reason?: string } => {
  if (offer.status !== 'accepted') {
    return { canRequest: false, reason: 'Offer must be accepted before inspection' };
  }

  if (!offer.saleListingId) {
    return { canRequest: false, reason: 'Sale listing information missing' };
  }

  return { canRequest: true };
};

/**
 * Validates if transport can be requested
 */
export const canRequestTransport = (
  hasAcceptedOffers: boolean,
  inspectionSummary: InspectionSummary
): { canRequest: boolean; reason?: string } => {
  if (!hasAcceptedOffers) {
    return { canRequest: false, reason: 'Must have accepted offers before requesting transport' };
  }

  if (!inspectionSummary.allComplete) {
    return { canRequest: false, reason: 'All inspections must be completed before requesting transport' };
  }

  if (!inspectionSummary.allPassed) {
    return { canRequest: false, reason: 'All inspections must pass quality checks before requesting transport' };
  }

  return { canRequest: true };
};

/**
 * Formats currency values consistently
 */
export const formatCurrency = (amount: number, currency: string = 'EUR'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Formats percentage values consistently
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Determines phase color classes for UI
 */
export const getPhaseColorClasses = (phase: string): string => {
  const colors: Record<string, string> = {
    MATCHING: 'bg-blue-100 text-blue-800 border-blue-300',
    NEGOTIATION: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    INSPECTION: 'bg-purple-100 text-purple-800 border-purple-300',
    TRANSPORT: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    DELIVERY: 'bg-green-100 text-green-800 border-green-300',
    COMPLETED: 'bg-gray-100 text-gray-800 border-gray-300',
  };
  return colors[phase] || 'bg-gray-100 text-gray-800 border-gray-300';
};

/**
 * Determines status color classes for UI
 */
export const getStatusColorClasses = (status: string): string => {
  const colors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800 border-gray-300',
    ACTIVE: 'bg-green-100 text-green-800 border-green-300',
    PAUSED: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    CANCELLED: 'bg-red-100 text-red-800 border-red-300',
    COMPLETED: 'bg-blue-100 text-blue-800 border-blue-300',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
};
