import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { tradeOperationService, negotiationService } from '../../../../../services';
import type {
  BuyListing,
  SaleListing,
  TradeOperation,
  MatchingSeller,
  ProfitCalculation,
  TransportEstimate,
} from '@services/tradeOperationService';
import type { Negotiation } from '@services/negotiationService';

interface UseTradeOperationsReturn {
  // Data
  buyListings: BuyListing[];
  sellListings: SaleListing[];
  tradeOperations: TradeOperation[];
  currentTradeOperation: TradeOperation | null;
  matchingSellers: MatchingSeller[];
  profitCalculation: ProfitCalculation | null;
  transportEstimate: TransportEstimate | null;
  activeNegotiations: Negotiation[];

  // Loading states
  isLoadingBuyListings: boolean;
  isLoadingSellListings: boolean;
  isLoadingMatchingSellers: boolean;
  isCreatingTrade: boolean;
  isCalculatingProfit: boolean;
  isEstimatingTransport: boolean;
  isSendingOffers: boolean;

  // Actions
  loadBuyListings: () => Promise<void>;
  loadSellListings: () => Promise<void>;
  createTradeOperation: (
    buyListingId: string,
    targetProfitMargin: number
  ) => Promise<TradeOperation | null>;
  findMatchingSellers: (tradeOperationId: string, maxDistance?: number) => Promise<void>;
  selectSellers: (
    tradeOperationId: string,
    sellers: {
      sellerId: string;
      saleListingId: string;
      requestedQuantity: number;
    }[]
  ) => Promise<boolean>;
  calculateProfit: (tradeOperationId: string) => Promise<void>;
  estimateTransportCost: (params: {
    origin: { latitude: number; longitude: number; address: string };
    pickupLocations?: {
      latitude: number;
      longitude: number;
      address: string;
      quantity: number;
    }[];
    destination: { latitude: number; longitude: number; address: string };
    quantity: number;
    vehicleType: string;
  }) => Promise<void>;
  sendBuyerOffer: (params: {
    tradeOperationId: string;
    buyerId: string;
    offeredPrice: number;
    quantity: number;
    message?: string;
  }) => Promise<Negotiation | null>;
  sendSellerOffer: (params: {
    tradeOperationId: string;
    sellerId: string;
    offeredPrice: number;
    quantity: number;
    message?: string;
  }) => Promise<Negotiation | null>;
  sendBulkOffers: (params: {
    tradeOperationId: string;
    buyerOffer: { price: number; message?: string };
    sellerOffers: { sellerId: string; price: number; quantity: number }[];
  }) => Promise<boolean>;
  loadTradeOperations: () => Promise<void>;
  refreshCurrentTrade: (tradeOperationId: string) => Promise<void>;

  // Error handling
  error: string | null;
  clearError: () => void;
}

export const useTradeOperations = (): UseTradeOperationsReturn => {
  // Data state
  const [buyListings, setBuyListings] = useState<BuyListing[]>([]);
  const [sellListings, setSellListings] = useState<SaleListing[]>([]);
  const [tradeOperations, setTradeOperations] = useState<TradeOperation[]>([]);
  const [currentTradeOperation, setCurrentTradeOperation] = useState<TradeOperation | null>(null);
  const [matchingSellers, setMatchingSellers] = useState<MatchingSeller[]>([]);
  const [profitCalculation, setProfitCalculation] = useState<ProfitCalculation | null>(null);
  const [transportEstimate, setTransportEstimate] = useState<TransportEstimate | null>(null);
  const [activeNegotiations, setActiveNegotiations] = useState<Negotiation[]>([]);

  // Loading states
  const [isLoadingBuyListings, setIsLoadingBuyListings] = useState(false);
  const [isLoadingSellListings, setIsLoadingSellListings] = useState(false);
  const [isLoadingMatchingSellers, setIsLoadingMatchingSellers] = useState(false);
  const [isCreatingTrade, setIsCreatingTrade] = useState(false);
  const [isCalculatingProfit, setIsCalculatingProfit] = useState(false);
  const [isEstimatingTransport, setIsEstimatingTransport] = useState(false);
  const [isSendingOffers, setIsSendingOffers] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Error handling helper
  const handleError = useCallback((error: any, context: string) => {
    console.error(`Error in ${context}:`, error);
    const message = error.response?.data?.message || error.message || `Failed to ${context}`;
    setError(message);
    Alert.alert('Error', message);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load buy listings
  const loadBuyListings = useCallback(async () => {
    try {
      setIsLoadingBuyListings(true);
      clearError();
      const listings = await tradeOperationService.getActiveBuyListings();
      setBuyListings(listings);
    } catch (err) {
      handleError(err, 'load buy listings');
    } finally {
      setIsLoadingBuyListings(false);
    }
  }, [handleError, clearError]);

  // Load sell listings
  const loadSellListings = useCallback(async () => {
    try {
      setIsLoadingSellListings(true);
      clearError();
      const listings = await tradeOperationService.getActiveSellListings();
      setSellListings(listings);
    } catch (err) {
      handleError(err, 'load sell listings');
    } finally {
      setIsLoadingSellListings(false);
    }
  }, [handleError, clearError]);

  // Load all trade operations
  const loadTradeOperations = useCallback(async () => {
    try {
      const operations = await tradeOperationService.getAllTradeOperations();
      // Ensure we always set an array, even if the response is undefined or null
      setTradeOperations(operations || []);
    } catch (err) {
      handleError(err, 'load trade operations');
      // Set empty array on error to prevent undefined errors
      setTradeOperations([]);
    }
  }, [handleError]);

  // Create trade operation
  const createTradeOperation = useCallback(
    async (buyListingId: string, targetProfitMargin: number) => {
      try {
        setIsCreatingTrade(true);
        clearError();
        const tradeOperation = await tradeOperationService.createTradeOperation(
          buyListingId,
          targetProfitMargin
        );
        setCurrentTradeOperation(tradeOperation);

        // Refresh trade operations list
        await loadTradeOperations();

        return tradeOperation;
      } catch (err) {
        handleError(err, 'create trade operation');
        return null;
      } finally {
        setIsCreatingTrade(false);
      }
    },
    [handleError, clearError, loadTradeOperations]
  );

  // Find matching sellers
  const findMatchingSellers = useCallback(
    async (tradeOperationId: string, maxDistance?: number) => {
      try {
        setIsLoadingMatchingSellers(true);
        clearError();
        const result = await tradeOperationService.findMatchingSellers(
          tradeOperationId,
          maxDistance
        );
        setMatchingSellers(result?.sellers || []);
      } catch (err) {
        handleError(err, 'find matching sellers');
      } finally {
        setIsLoadingMatchingSellers(false);
      }
    },
    [handleError, clearError]
  );

  // Select sellers for trade
  const selectSellers = useCallback(
    async (
      tradeOperationId: string,
      sellers: {
        sellerId: string;
        saleListingId: string;
        requestedQuantity: number;
      }[]
    ) => {
      try {
        clearError();
        await tradeOperationService.selectSellers(tradeOperationId, sellers);

        // Refresh current trade operation
        await refreshCurrentTrade(tradeOperationId);

        return true;
      } catch (err) {
        handleError(err, 'select sellers');
        return false;
      }
    },
    [handleError, clearError]
  );

  // Calculate profit
  const calculateProfit = useCallback(
    async (tradeOperationId: string) => {
      try {
        setIsCalculatingProfit(true);
        clearError();
        const calculation = await tradeOperationService.calculateProfit(tradeOperationId, {
          includeSensitivity: true,
          includeRiskAssessment: true,
        });
        setProfitCalculation(calculation);
      } catch (err) {
        handleError(err, 'calculate profit');
      } finally {
        setIsCalculatingProfit(false);
      }
    },
    [handleError, clearError]
  );

  // Estimate transport cost
  const estimateTransportCost = useCallback(
    async (params: {
      origin: { latitude: number; longitude: number; address: string };
      pickupLocations?: {
        latitude: number;
        longitude: number;
        address: string;
        quantity: number;
      }[];
      destination: { latitude: number; longitude: number; address: string };
      quantity: number;
      vehicleType: string;
    }) => {
      try {
        setIsEstimatingTransport(true);
        clearError();
        const estimate = await tradeOperationService.estimateTransportCost(params);
        setTransportEstimate(estimate);
      } catch (err) {
        handleError(err, 'estimate transport cost');
      } finally {
        setIsEstimatingTransport(false);
      }
    },
    [handleError, clearError]
  );

  // Send buyer offer
  const sendBuyerOffer = useCallback(
    async (params: {
      tradeOperationId: string;
      buyerId: string;
      offeredPrice: number;
      quantity: number;
      message?: string;
    }) => {
      try {
        setIsSendingOffers(true);
        clearError();
        const negotiation = await negotiationService.createBuyerOffer(params);

        // Add to active negotiations
        setActiveNegotiations((prev) => [...prev, negotiation]);

        return negotiation;
      } catch (err) {
        handleError(err, 'send buyer offer');
        return null;
      } finally {
        setIsSendingOffers(false);
      }
    },
    [handleError, clearError]
  );

  // Send seller offer
  const sendSellerOffer = useCallback(
    async (params: {
      tradeOperationId: string;
      sellerId: string;
      offeredPrice: number;
      quantity: number;
      message?: string;
    }) => {
      try {
        setIsSendingOffers(true);
        clearError();
        const negotiation = await negotiationService.createSellerOffer(params);

        // Add to active negotiations
        setActiveNegotiations((prev) => [...prev, negotiation]);

        return negotiation;
      } catch (err) {
        handleError(err, 'send seller offer');
        return null;
      } finally {
        setIsSendingOffers(false);
      }
    },
    [handleError, clearError]
  );

  // Send bulk offers to all parties
  const sendBulkOffers = useCallback(
    async (params: {
      tradeOperationId: string;
      buyerOffer: { price: number; message?: string };
      sellerOffers: { sellerId: string; price: number; quantity: number }[];
    }) => {
      try {
        setIsSendingOffers(true);
        clearError();

        // Send individual offers to each seller since bulk endpoint is not available
        const sellerResults = await Promise.allSettled(
          params.sellerOffers.map((offer) =>
            negotiationService.createOfferForSeller({
              tradeOperationId: params.tradeOperationId,
              sellerId: offer.sellerId,
              price: offer.price,
              quantity: offer.quantity,
            })
          )
        );

        const successfulOffers = sellerResults
          .filter((r): r is PromiseFulfilledResult<Negotiation> => r.status === 'fulfilled')
          .map((r) => r.value);

        const failedCount = sellerResults.filter((r) => r.status === 'rejected').length;

        // Update active negotiations
        setActiveNegotiations((prev) => [...prev, ...successfulOffers]);

        if (failedCount > 0) {
          Alert.alert(
            'Offers Partially Sent',
            `${successfulOffers.length} offers sent successfully, ${failedCount} failed.`,
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Offers Sent', `All ${successfulOffers.length} offers sent successfully.`, [
            { text: 'OK' },
          ]);
        }

        return successfulOffers.length > 0;
      } catch (err) {
        handleError(err, 'send bulk offers');
        return false;
      } finally {
        setIsSendingOffers(false);
      }
    },
    [handleError, clearError]
  );

  // Refresh current trade operation
  const refreshCurrentTrade = useCallback(
    async (tradeOperationId: string) => {
      try {
        const trade = await tradeOperationService.getTradeOperation(tradeOperationId);
        setCurrentTradeOperation(trade);
      } catch (err) {
        handleError(err, 'refresh trade operation');
      }
    },
    [handleError]
  );

  // Load initial data on mount
  useEffect(() => {
    loadBuyListings();
    loadSellListings();
    loadTradeOperations();
  }, [loadBuyListings, loadSellListings, loadTradeOperations]);

  return {
    // Data
    buyListings,
    sellListings,
    tradeOperations,
    currentTradeOperation,
    matchingSellers,
    profitCalculation,
    transportEstimate,
    activeNegotiations,

    // Loading states
    isLoadingBuyListings,
    isLoadingSellListings,
    isLoadingMatchingSellers,
    isCreatingTrade,
    isCalculatingProfit,
    isEstimatingTransport,
    isSendingOffers,

    // Actions
    loadBuyListings,
    loadSellListings,
    createTradeOperation,
    findMatchingSellers,
    selectSellers,
    calculateProfit,
    estimateTransportCost,
    sendBuyerOffer,
    sendSellerOffer,
    sendBulkOffers,
    loadTradeOperations,
    refreshCurrentTrade,

    // Error handling
    error,
    clearError,
  };
};
