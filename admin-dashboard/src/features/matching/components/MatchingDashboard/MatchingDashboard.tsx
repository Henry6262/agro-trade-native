import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { BuyListing, SaleListing } from '../../../../types/listings';
import type { TransportCostResult, Negotiation, NegotiationStatus } from '../../../../types';
import { formatLocationString } from '../../../../utils/locationHelpers';
import { getBuyerTargetPrice, getSellerUnitPrice } from '../../../../utils/pricing';
import { tradeOperationService, negotiationService } from '../../../../services/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  buildAutoOfferPlan,
  type AutoOfferPlan,
  type AutoOfferPlanOffer,
  type AutoOfferSkip,
} from '../../utils/autoOffer';
import BulgariaMap from './BulgariaMap';
import BuyerOrdersPanel from './BuyerOrdersPanel';
import SellerCardsPanel from './SellerCardsPanel';
import PricingModal from './PricingModal';

interface SellerAllocation {
  seller: SaleListing;
  allocatedQuantity: number;
}

export const MatchingDashboard: React.FC = () => {
  const [selectedOrder, setSelectedOrder] = useState<BuyListing | null>(null);
  const [selectedSellers, setSelectedSellers] = useState<SellerAllocation[]>([]);
  const [highlightedSellerId, setHighlightedSellerId] = useState<string | undefined>();
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [availableSellers, setAvailableSellers] = useState<SaleListing[]>([]);
  const [transportEstimates, setTransportEstimates] = useState<Record<string, TransportCostResult>>({});
  const [transportLoading, setTransportLoading] = useState(false);
  const [transportError, setTransportError] = useState<string | null>(null);
  const [transportWarnings, setTransportWarnings] = useState<string[]>([]);
  const [sendingAutoOffers, setSendingAutoOffers] = useState(false);
  const [createdTradeOperationId, setCreatedTradeOperationId] = useState<string | null>(null);
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [negotiationsLoading, setNegotiationsLoading] = useState(false);

  // Calculate total selected quantity (smart allocation)
  const selectedQuantity = useMemo(() => {
    return selectedSellers.reduce((sum, allocation) => sum + allocation.allocatedQuantity, 0);
  }, [selectedSellers]);

  const pricingSummary = useMemo(() => {
    return selectedSellers.reduce(
      (acc, allocation) => {
        const unitPrice = getSellerUnitPrice(allocation.seller);
        if (unitPrice !== null) {
          acc.estimatedCost += unitPrice * allocation.allocatedQuantity;
          acc.sellersWithPricing += 1;
        }
        return acc;
      },
      { estimatedCost: 0, sellersWithPricing: 0 },
    );
  }, [selectedSellers]);

  const estimatedCost = pricingSummary.estimatedCost;
  const hasPricingData = pricingSummary.sellersWithPricing > 0;
  const selectedTransportCost = useMemo(() => {
    return selectedSellers.reduce((sum, allocation) => {
      const estimate = transportEstimates[allocation.seller.sellerId];
      if (!estimate) return sum;
      return sum + estimate.transportCost;
    }, 0);
  }, [selectedSellers, transportEstimates]);

  const buyerTargetPrice = selectedOrder ? getBuyerTargetPrice(selectedOrder) : null;

  // Map negotiations by sale listing ID for easy lookup
  const negotiationBySaleListingId = useMemo(() => {
    const map = new Map<string, Negotiation>();
    negotiations.forEach(neg => {
      // Try multiple paths to get the sale listing ID
      const saleListingId =
        (neg as any).saleListingId ||
        neg.tradeSeller?.saleListingId ||
        (neg as any).saleListing?.id;

      if (saleListingId) {
        map.set(saleListingId, neg);
      }
    });

    console.debug('Negotiation map created', {
      totalNegotiations: negotiations.length,
      mappedNegotiations: map.size,
      saleListingIds: Array.from(map.keys()),
      negotiations: negotiations.map(n => ({
        id: n.id,
        status: n.status,
        saleListingId: (n as any).saleListingId || n.tradeSeller?.saleListingId,
      })),
    });

    return map;
  }, [negotiations]);

  const autoOfferPlan: AutoOfferPlan | null = useMemo(() => {
    if (!selectedOrder) return null;
    if (availableSellers.length === 0) return null;

    return buildAutoOfferPlan(
      selectedOrder,
      availableSellers,
      transportEstimates,
    );
  }, [selectedOrder, availableSellers, transportEstimates]);

  const recommendedOffersByListing = useMemo(() => {
    if (!autoOfferPlan) return {} as Record<string, AutoOfferPlanOffer>;
    return Object.fromEntries(
      autoOfferPlan.offers.map((offer) => [offer.saleListingId, offer]),
    ) as Record<string, AutoOfferPlanOffer>;
  }, [autoOfferPlan]);

  const skipReasonsByListing = useMemo(() => {
    if (!autoOfferPlan) return {} as Record<string, AutoOfferSkip>;
    const mapping: Record<string, AutoOfferSkip> = {};
    autoOfferPlan.skipped.forEach((skip) => {
      if (skip.saleListingId) {
        mapping[skip.saleListingId] = skip;
      }
    });
    return mapping;
  }, [autoOfferPlan]);

  const autoOfferSummary = useMemo(() => {
    if (!selectedOrder || !autoOfferPlan) {
      return null;
    }

    const hasBuyerPrice = autoOfferPlan.hasBuyerTargetPrice;
    const readyCount = autoOfferPlan.offers.length;
    const canSend =
      hasBuyerPrice &&
      readyCount > 0 &&
      !sendingAutoOffers &&
      !transportLoading;

    let statusMessage = '';
    if (!hasBuyerPrice) {
      statusMessage = 'Set a buyer max price to enable auto offers';
    } else if (readyCount === 0) {
      statusMessage = 'No golden matches yet';
    } else if (sendingAutoOffers) {
      statusMessage = 'Sending offers…';
    } else {
      statusMessage = `${readyCount} golden match${readyCount === 1 ? '' : 'es'} ready`;
    }

    return {
      hasBuyerPrice,
      readyCount,
      canSend,
      sending: sendingAutoOffers,
      statusMessage,
    };
  }, [selectedOrder, autoOfferPlan, sendingAutoOffers, transportLoading]);

  const buyerAddressId =
    selectedOrder?.deliveryAddressId ??
    selectedOrder?.deliveryAddress?.id ??
    null;
  const selectedOrderId = selectedOrder?.id;

  const handleSellersLoaded = useCallback((sellers: SaleListing[]) => {
    setAvailableSellers(sellers);
  }, []);

  const handleSendAutomaticOffers = useCallback(async () => {
    if (sendingAutoOffers) {
      return;
    }

    if (!selectedOrder) {
      toast.warning('Select a buyer order first.');
      return;
    }

    if (!autoOfferPlan || !autoOfferPlan.hasBuyerTargetPrice) {
      toast.warning('Set a buyer max price to enable automatic offers.');
      return;
    }

    if (autoOfferPlan.offers.length === 0) {
      toast.warning('No viable sellers found for automatic offers yet.');
      return;
    }

    try {
      setSendingAutoOffers(true);

      const dto = {
        buyListingId: selectedOrder.id,
        sellers: autoOfferPlan.offers.map((offer) => ({
          sellerId: offer.sellerId,
          saleListingId: offer.saleListingId,
          quantity: offer.quantity,
          offerPrice: offer.offerPrice,
        })),
      };

      // Step 1: Create trade operation (backend automatically creates negotiations)
      const response = await tradeOperationService.create(dto);

      if (!response.tradeOperationId) {
        throw new Error('Trade operation was not created');
      }

      const tradeOpId = response.tradeOperationId;

      // Step 2: Save trade operation ID to trigger polling
      setCreatedTradeOperationId(tradeOpId);

      // Step 3: Parse negotiations from response and update UI immediately
      const freshNegotiations = response.negotiations || [];

      // Map the response format to our expected Negotiation format
      const mappedNegotiations = freshNegotiations.map((n: any) => ({
        id: n.id,
        tradeSellerId: n.tradeSellerId,
        status: n.status,
        saleListingId: n.saleListingId,
        tradeSeller: {
          saleListingId: n.saleListingId,
          seller: {
            id: n.sellerId,
            name: n.sellerName,
          },
        },
        expiresAt: n.expiresAt,
      }));

      setNegotiations(mappedNegotiations);

      console.debug('Negotiations created and mapped:', {
        count: mappedNegotiations.length,
        negotiations: mappedNegotiations.map(n => ({
          id: n.id,
          saleListingId: n.saleListingId,
          status: n.status,
        })),
      });

      toast.success('Automatic offers dispatched', {
        description: [
          `${dto.sellers.length} seller${dto.sellers.length === 1 ? '' : 's'} notified`,
          autoOfferPlan.remainingQuantity > 0
            ? `${autoOfferPlan.remainingQuantity}t still unallocated`
            : 'All required quantity covered',
          autoOfferPlan.skipped.length > 0
            ? `${autoOfferPlan.skipped.length} seller${autoOfferPlan.skipped.length === 1 ? '' : 's'} queued or needing manual review`
            : null,
        ]
          .filter(Boolean)
          .join(' • '),
      });

      setSelectedSellers(
        autoOfferPlan.offers.map((offer) => ({
          seller: offer.seller,
          allocatedQuantity: offer.quantity,
        })),
      );

      setShowPricingModal(false);

      console.debug('Trade operation created with negotiations', { tradeOpId, negotiations: freshNegotiations.length });
    } catch (error) {
      console.error('Failed to send automatic offers', error);
      toast.error('Failed to send automatic offers. Please try again.');
    } finally {
      setSendingAutoOffers(false);
    }
  }, [sendingAutoOffers, selectedOrder, autoOfferPlan]);

  useEffect(() => {
    if (!selectedOrderId || !buyerAddressId) {
      setTransportEstimates({});
      setTransportError(null);
      setTransportLoading(false);
       setTransportWarnings([]);
      return;
    }

    if (availableSellers.length === 0) {
      setTransportEstimates({});
      setTransportError(null);
      setTransportLoading(false);
       setTransportWarnings([]);
      return;
    }

    let ignore = false;

    const calculateTransport = async () => {
      try {
        setTransportLoading(true);
        setTransportError(null);
        setTransportWarnings([]);

        const sellerIds = Array.from(
          new Set(
            availableSellers
              .map((seller) => seller.sellerId)
              .filter((id): id is string => Boolean(id)),
          ),
        );

        if (sellerIds.length === 0) {
          if (!ignore) {
            setTransportEstimates({});
          }
          return;
        }

        const response = await tradeOperationService.calculateTransport({
          sellerIds,
          buyerAddressId,
        });

        if (ignore) return;

        const mapping: Record<string, TransportCostResult> = {};
        (response.results || []).forEach((result) => {
          mapping[result.sellerId] = result;
        });

        setTransportEstimates(mapping);
        setTransportWarnings(response.warnings ?? []);
      } catch (err) {
        if (ignore) return;
        console.error('Failed to calculate transport estimates:', err);
        setTransportError('Unable to calculate transport estimates');
        setTransportEstimates({});
        setTransportWarnings([]);
      } finally {
        if (!ignore) {
          setTransportLoading(false);
        }
      }
    };

    calculateTransport();

    return () => {
      ignore = true;
    };
  }, [selectedOrderId, buyerAddressId, availableSellers]);

  // Fetch and poll negotiations for the created trade operation
  useEffect(() => {
    if (!createdTradeOperationId) {
      setNegotiations([]);
      return;
    }

    let ignore = false;
    let pollInterval: NodeJS.Timeout | null = null;

    const fetchNegotiations = async () => {
      try {
        setNegotiationsLoading(true);
        const negs = await negotiationService.getByTradeOperation(createdTradeOperationId);
        if (!ignore) {
          setNegotiations(negs);
        }
      } catch (error) {
        console.error('Failed to fetch negotiations:', error);
        if (!ignore) {
          setNegotiations([]);
        }
      } finally {
        if (!ignore) {
          setNegotiationsLoading(false);
        }
      }
    };

    // Initial fetch
    fetchNegotiations();

    // Poll every 30 seconds
    pollInterval = setInterval(() => {
      fetchNegotiations();
    }, 30000);

    return () => {
      ignore = true;
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [createdTradeOperationId]);

  // Handle buyer order selection
  const handleOrderSelect = useCallback(async (order: BuyListing) => {
    setSelectedOrder(order);
    setSelectedSellers([]); // Clear seller selections when changing order
    setAvailableSellers([]);
    setTransportWarnings([]);

    // Fetch existing trade operations for this buy listing
    try {
      const allTradeOps = await tradeOperationService.getAll();
      const matchingTradeOps = allTradeOps.filter(op => op.buyListingId === order.id);

      // Get the most recent trade operation
      if (matchingTradeOps.length > 0) {
        const mostRecent = matchingTradeOps.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];

        setCreatedTradeOperationId(mostRecent.id);
      } else {
        setCreatedTradeOperationId(null);
      }
    } catch (error) {
      console.error('Failed to fetch trade operations for buyer:', error);
      setCreatedTradeOperationId(null);
    }
  }, []);

  // Handle seller toggle with smart quantity allocation
  const handleSellerToggle = (seller: SaleListing) => {
    setSelectedSellers((prev) => {
      const isSelected = prev.some((allocation) => allocation.seller.id === seller.id);

      if (isSelected) {
        // Remove seller
        return prev.filter((allocation) => allocation.seller.id !== seller.id);
      } else {
        // Add seller with smart allocation
        if (!selectedOrder) return prev;

        const currentTotal = prev.reduce((sum, allocation) => sum + allocation.allocatedQuantity, 0);
        const remaining = selectedOrder.quantity - currentTotal;

        // Only allocate what's needed, not the seller's full quantity
        const allocatedQuantity = Math.min(seller.quantity, remaining);

        return [...prev, { seller, allocatedQuantity }];
      }
    });
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedOrder(null);
    setSelectedSellers([]);
    setAvailableSellers([]);
    setTransportEstimates({});
    setTransportError(null);
    setTransportLoading(false);
    setTransportWarnings([]);
  };

  // Map markers for buyers
  const buyerMarkers = selectedOrder
    ? [
        {
          id: selectedOrder.id,
          name: selectedOrder.buyer?.company?.legalName || selectedOrder.buyer?.name || 'Unknown Buyer',
          lat: selectedOrder.deliveryAddress?.latitude || 42.7,
          lng: selectedOrder.deliveryAddress?.longitude || 25.5,
          product: selectedOrder.product?.name,
          quantity: selectedOrder.quantity,
        },
      ]
    : [];

  // Map markers for sellers (only when order is selected)
  const sellerMarkers = selectedOrder
    ? selectedSellers.map(({ seller, allocatedQuantity }) => ({
        id: seller.id,
        name: seller.seller?.company?.legalName || seller.seller?.name || 'Unknown Seller',
        lat: seller.address?.latitude || 42.7,
        lng: seller.address?.longitude || 25.5,
        product: seller.product?.name,
        quantity: allocatedQuantity,
        verified: false, // Note: verification not implemented in Company model yet
      }))
    : [];

  // Determine if Create Offers button should be enabled
  const canCreateOffers =
    selectedOrder && selectedQuantity > 0 && selectedQuantity >= selectedOrder.quantity;

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-300 px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🗺️</span>
          <div>
            <h1 className="text-xl font-bold text-text-primary">
              Map-Based Matching System
            </h1>
            <p className="text-sm text-text-secondary mt-0.5">
              Select a buyer order, match with sellers, and create offers
            </p>
          </div>
        </div>
      </div>

      {/* Map & Selection Preview Section */}
      <div className="flex border-b-4 border-gray-300" style={{ height: '50vh' }}>
        {/* Map - 25% width */}
        <div className="w-1/4 border-r-4 border-gray-300 p-4">
          <BulgariaMap
            buyers={buyerMarkers}
            sellers={sellerMarkers}
            selectedBuyerId={selectedOrder?.id}
            selectedSellerId={highlightedSellerId}
            selectedSellerIds={selectedSellers.map((s) => s.seller.id)}
            onBuyerClick={(id) => {
              // Optionally handle buyer pin click
            }}
            onSellerClick={(id) => {
              setHighlightedSellerId(id);
            }}
          />
        </div>

        {/* Selection Preview - 75% width */}
        <div className="w-3/4 bg-gray-50 overflow-y-auto">
          {!selectedOrder ? (
            <div className="h-full flex flex-col items-center justify-center text-text-secondary">
              <span className="text-6xl opacity-30 mb-4">🎯</span>
              <h3 className="text-xl font-bold text-text-primary mb-2">No Selection Yet</h3>
              <p className="text-sm">Select a buyer order from the panel below to start building a trade operation</p>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {/* Top Row: Buyer Card (left) + Quick Metrics (right) */}
              <div className="grid grid-cols-3 gap-4">
                {/* Compact Buyer Card - Blue Accent */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-300 p-4 shadow-md">
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-lg">🏢</span>
                    <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wide">Target Buyer</h3>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-shrink-0">
                      {selectedOrder.product?.image ? (
                        <img
                          src={selectedOrder.product.image}
                          alt={selectedOrder.product?.name}
                          className="w-14 h-14 object-cover rounded-lg border-2 border-blue-200"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center border-2 border-blue-200">
                          <span className="text-2xl">🏢</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-blue-950 truncate">{selectedOrder.buyer?.company?.legalName || selectedOrder.buyer?.name || 'Unknown'}</h4>
                      <p className="text-xs font-semibold text-blue-800 truncate">{selectedOrder.product?.name || 'Unknown Product'}</p>
                      <p className="text-xs text-blue-700 truncate">📍 {formatLocationString(selectedOrder.deliveryAddress, ', ')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-200 text-blue-900 px-2 py-1 rounded-md text-xs font-bold border border-blue-400">
                      📦 {selectedOrder.quantity}{selectedOrder.unit}
                    </span>
                    <span className="bg-white text-green-800 px-2 py-1 rounded-md text-xs font-bold border border-green-400">
                      {buyerTargetPrice !== null
                        ? `💵 Max €${buyerTargetPrice.toFixed(
                            buyerTargetPrice % 1 === 0 ? 0 : 2,
                          )}/${selectedOrder.unit}`
                        : '💵 Max price not set'}
                    </span>
                  </div>
                  {autoOfferPlan && autoOfferPlan.hasBuyerTargetPrice && (
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="text-xs text-blue-800">
                        {autoOfferPlan.offers.length > 0
                          ? `${autoOfferPlan.offers.length} golden match${autoOfferPlan.offers.length === 1 ? '' : 'es'} ready`
                          : 'No golden matches yet'}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={
                          sendingAutoOffers ||
                          transportLoading ||
                          !autoOfferPlan.hasBuyerTargetPrice ||
                          autoOfferPlan.offers.length === 0
                        }
                        onClick={handleSendAutomaticOffers}
                      >
                        {sendingAutoOffers ? 'Sending…' : 'Send Automatic Offers'}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Quick Metrics - Purple/Violet Accent */}
                <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl border-2 border-violet-300 p-4 shadow-md">
                  <div className="flex items-center gap-1 mb-3">
                    <span className="text-lg">📊</span>
                    <h3 className="text-xs font-bold text-violet-900 uppercase tracking-wide">Trade Summary</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-2 border border-violet-200">
                      <p className="text-xs text-violet-700 mb-1 font-semibold">Allocated</p>
                      <p className="text-xl font-bold text-violet-950">
                        {selectedQuantity}<span className="text-sm text-violet-700">/{selectedOrder.quantity}{selectedOrder.unit}</span>
                      </p>
                      {selectedQuantity >= selectedOrder.quantity ? (
                        <p className="text-xs text-green-700 font-semibold mt-1">✅ Complete</p>
                      ) : (
                        <p className="text-xs text-orange-700 font-semibold mt-1">⚠️ {selectedOrder.quantity - selectedQuantity}{selectedOrder.unit} left</p>
                      )}
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-violet-200">
                      <p className="text-xs text-violet-700 mb-1 font-semibold">Est. Cost</p>
                      <p className="text-xl font-bold text-violet-950">
                        {hasPricingData ? `€${estimatedCost.toFixed(0)}` : '—'}
                      </p>
                      <p className="text-xs text-violet-700 mt-1">
                        {buyerTargetPrice !== null
                          ? `of €${(buyerTargetPrice * selectedOrder.quantity).toFixed(0)}`
                          : 'Awaiting buyer target price'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Transport Summary */}
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border-2 border-emerald-300 p-4 shadow-md">
                  <div className="flex items-center gap-1 mb-3">
                    <span className="text-lg">🚚</span>
                    <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wide">Transport</h3>
                  </div>
                  {transportLoading ? (
                    <p className="text-sm text-emerald-800 font-semibold">Calculating routes…</p>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-xl font-bold text-emerald-900">
                        {selectedTransportCost > 0 ? `€${selectedTransportCost.toFixed(0)}` : '—'}
                      </p>
                      <p className="text-xs text-emerald-700">
                        {selectedTransportCost > 0
                          ? 'Estimated transport cost for selected sellers'
                          : 'Select sellers to estimate transport'}
                      </p>
                    </div>
                  )}
                  {transportError && !transportLoading && (
                    <p className="text-xs text-red-600 font-semibold mt-2">⚠️ {transportError}</p>
                  )}
                  {!transportError && !transportLoading && transportWarnings.length > 0 && (
                    <ul className="text-xs text-amber-700 mt-2 space-y-1">
                      {transportWarnings.map((warning) => (
                        <li key={warning}>⚠️ {warning}</li>
                      ))}
                    </ul>
                  )}
                </div>

              </div>

              {/* Selected Sellers - 2 Column Grid - Green Accent */}
              {selectedSellers.length > 0 ? (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">🧑‍🌾</span>
                    <h3 className="text-xs font-bold text-green-900 uppercase tracking-wide">
                      Selected Sellers ({selectedSellers.length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedSellers.map(({ seller, allocatedQuantity }) => {
                      const unitPrice = getSellerUnitPrice(seller);
                      const formattedUnitPrice =
                        unitPrice !== null
                          ? `€${unitPrice.toFixed(unitPrice % 1 === 0 ? 0 : 2)}`
                          : '—';
                      const totalCost =
                        unitPrice !== null ? unitPrice * allocatedQuantity : null;

                      return (
                        <div
                          key={seller.id}
                          className="bg-white rounded-lg border-2 border-green-300 p-3 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex-shrink-0">
                              {seller.product?.image ? (
                                <img
                                  src={seller.product.image}
                                  alt={seller.product?.name}
                                  className="w-10 h-10 object-cover rounded border-2 border-green-200"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-green-50 rounded flex items-center justify-center border-2 border-green-200">
                                  <span className="text-lg">🧑‍🌾</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-bold text-xs text-text-primary truncate">
                                {seller.seller?.company?.legalName || seller.seller?.name || 'Unknown Seller'}
                              </h5>
                              <p className="text-xs text-text-secondary">
                                <span className="font-semibold text-green-700">{allocatedQuantity}{seller.unit}</span> <span className="text-gray-400">of</span> {seller.quantity}{seller.unit}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between bg-green-50 rounded px-2 py-1.5 border border-green-200">
                            <span className="text-xs font-bold text-green-900">
                              {formattedUnitPrice}{formattedUnitPrice !== '—' ? `/${seller.unit}` : ''}
                            </span>
                            <span className="text-xs font-semibold text-green-700">
                              {totalCost !== null ? `€${totalCost.toFixed(0)} total` : '—'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300 p-8 text-center">
                  <span className="text-5xl opacity-20 mb-3 block">🧑‍🌾</span>
                  <h4 className="font-bold text-sm text-gray-600 mb-1">No Sellers Selected</h4>
                  <p className="text-xs text-gray-500">Select sellers from the panel below to build your trade operation</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Container with 5% horizontal margin */}
      <div className="mx-[5%]">
        {/* Bottom Panels */}
        <div className="flex-1 flex">
          {/* Left Panel: Buyer Orders */}
          <div className="w-1/2 border-r border-gray-200 overflow-hidden">
            <BuyerOrdersPanel
              selectedOrderId={selectedOrder?.id}
              onOrderSelect={handleOrderSelect}
              autoOfferSummary={autoOfferSummary}
              onSendAutoOffers={handleSendAutomaticOffers}
            />
          </div>

          {/* Right Panel: Seller Cards */}
          <div className="w-1/2 overflow-hidden">
            <SellerCardsPanel
              filterProduct={selectedOrder?.product?.name}
              selectedSellerIds={selectedSellers.map((allocation) => allocation.seller.id)}
              onSellerToggle={handleSellerToggle}
              highlightedSellerId={highlightedSellerId}
              onSellersLoaded={handleSellersLoaded}
              transportCosts={transportEstimates}
              transportLoading={transportLoading}
              transportError={transportError}
              transportWarnings={transportWarnings}
              recommendedSellerIds={autoOfferPlan?.offers.map((offer) => offer.saleListingId)}
              recommendationDetails={recommendedOffersByListing}
              recommendationReasons={skipReasonsByListing}
              negotiationBySaleListingId={negotiationBySaleListingId}
            />
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white border-t border-gray-300 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-text-secondary">
            {selectedOrder ? (
              <div className="flex items-center gap-3">
                <span>
                  <span className="font-semibold text-text-primary">{selectedSellers.length}</span> {selectedSellers.length === 1 ? 'seller' : 'sellers'} selected
                </span>
                <span>•</span>
                <span>
                  <span className="font-semibold text-text-primary">{selectedQuantity}t</span> of{' '}
                  <span className="font-semibold text-text-primary">{selectedOrder.quantity}t</span> allocated
                </span>
              </div>
            ) : (
              'Select a buyer order to begin'
            )}
          </div>
          <Button
            disabled={!canCreateOffers}
            onClick={() => setShowPricingModal(true)}
          >
            Create Offers
          </Button>
        </div>
      </div>

      {/* Pricing Modal */}
      {selectedOrder && selectedSellers.length > 0 && (
        <PricingModal
          open={showPricingModal}
          selectedSellers={selectedSellers.map((allocation) => allocation.seller)}
          buyerOrder={selectedOrder}
          onClose={() => setShowPricingModal(false)}
          onSubmit={(offers) => {
            console.log('Offers submitted:', offers);
            setShowPricingModal(false);
            // Week 2: Implement actual API call
          }}
        />
      )}
    </div>
  );
};

export default MatchingDashboard;
