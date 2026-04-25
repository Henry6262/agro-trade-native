import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../../services/api';
import { API_ENDPOINTS } from '../../../../config/api';
import type { TradeOperation, Offer } from '../../../../types';
import { ErrorState, SkeletonCard, EnhancedTooltip } from '../../../../components/common';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatLocationString } from '../../../../utils/locationHelpers';
import { InspectionResultsPanel } from '../InspectionResultsPanel';
import { TradeFinalizationPanel } from '../TradeFinalizationPanel';
import { QuantityTrackingPanel } from '../QuantityTrackingPanel';
import { ReplacementSellerFinder } from '../ReplacementSellerFinder';
import { TransportManagementPanel } from '../TransportManagementPanel';
import { PhaseTransitionPanel } from './PhaseTransitionPanel';
import { useToast } from '@/hooks/use-toast';
import { getPhaseColorClasses, getStatusColorClasses } from '../../../../utils/workflowValidation';

export const TradeOperationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [operation, setOperation] = useState<TradeOperation | null>(null);
  const [inspections, setInspections] = useState<any[]>([]);
  const [transportData, setTransportData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestingInspection, setRequestingInspection] = useState<string | null>(null);
  const [showReplacementFinder, setShowReplacementFinder] = useState(false);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Memoized fetch function
  const fetchAllData = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [operationRes, inspectionsRes, transportRes] = await Promise.allSettled([
        api.get(API_ENDPOINTS.tradeOperations.byId(id)),
        api.get(API_ENDPOINTS.inspections.base + `/trade-operation/${id}`),
        api.get(API_ENDPOINTS.transport.byTradeOperation(id)),
      ]);

      // Handle operation response
      if (operationRes.status === 'fulfilled') {
        setOperation(operationRes.value.data);
      } else {
        throw new Error('Failed to load trade operation');
      }

      // Handle inspections response (optional)
      if (inspectionsRes.status === 'fulfilled') {
        setInspections(inspectionsRes.value.data || []);
      } else {
        setInspections([]);
      }

      // Handle transport response (optional)
      if (transportRes.status === 'fulfilled') {
        setTransportData(transportRes.value.data);
      } else {
        setTransportData(null);
      }
    } catch (err: any) {
      console.error('Error fetching trade operation data:', err);
      setError(err.message || 'Failed to load trade operation');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData, refetchTrigger]);

  // Refresh helper
  const refreshData = useCallback(() => {
    setRefetchTrigger(prev => prev + 1);
  }, []);

  const handleRequestInspection = async (offer: Offer) => {
    if (!offer.saleListingId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Sale listing information missing',
      });
      return;
    }

    try {
      setRequestingInspection(offer.id);

      await api.post(API_ENDPOINTS.inspections.base, {
        tradeOperationId: id,
        saleListingId: offer.saleListingId,
        priority: 'MEDIUM',
      });

      toast({
        title: 'Inspection Requested',
        description: 'Inspector will be notified to verify this offer',
      });

      // Refresh all data
      refreshData();
    } catch (err) {
      console.error('Error requesting inspection:', err);
      toast({
        variant: 'destructive',
        title: 'Failed to Request Inspection',
        description: 'Please try again later',
      });
    } finally {
      setRequestingInspection(null);
    }
  };

  const getOfferStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      pending: { variant: 'outline', label: 'PENDING' },
      accepted: { variant: 'default', label: 'ACCEPTED' },
      rejected: { variant: 'destructive', label: 'REJECTED' },
      countered: { variant: 'secondary', label: 'COUNTERED' },
      expired: { variant: 'destructive', label: 'EXPIRED' },
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-300 px-6 py-4 shadow-sm">
          <div className="h-12 flex items-center">
            <div className="w-24 h-8 bg-gray-200 rounded animate-pulse mr-4"></div>
            <div className="w-64 h-6 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          <SkeletonCard showHeader rows={3} />
          <SkeletonCard showHeader rows={5} />
          <SkeletonCard showHeader rows={4} />
        </div>
      </div>
    );
  }

  if (error || !operation) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-300 px-6 py-4 shadow-sm">
          <Button variant="outline" size="sm" onClick={() => navigate('/operations')}>
            ← Back to Operations
          </Button>
        </div>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <span className="text-6xl block mb-4">⚠️</span>
            <h2 className="text-xl font-bold text-text-primary mb-2">
              {error || 'Trade operation not found'}
            </h2>
            <p className="text-text-secondary mb-6">
              The trade operation you're looking for might have been deleted or doesn't exist.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate('/operations')}>
                ← Back to Operations
              </Button>
              <Button onClick={refreshData} className="bg-blue-600 hover:bg-blue-700">
                🔄 Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const acceptedOffers = operation.offers?.filter(o => o.status === 'accepted') || [];
  const pendingOffers = operation.offers?.filter(o => o.status === 'pending') || [];
  const rejectedOffers = operation.offers?.filter(o => o.status === 'rejected') || [];

  const hasAcceptedOffers = acceptedOffers.length > 0;
  // TODO: Fetch actual inspection data to check completion status
  const hasCompletedInspections = true; // Placeholder - will be calculated from actual inspection data

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-300 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <EnhancedTooltip content="Return to operations list">
              <Button variant="outline" size="sm" onClick={() => navigate('/operations')} aria-label="Back to operations">
                ← Back
              </Button>
            </EnhancedTooltip>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">
                Trade Operation #{operation.operationNumber}
              </h1>
              <p className="text-sm text-text-secondary mt-1">
                Created {new Date(operation.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 rounded-lg font-bold text-sm border ${getPhaseColorClasses(operation.phase)}`}>
              {operation.phase}
            </span>
            <span className={`px-4 py-2 rounded-lg font-bold text-sm border ${getStatusColorClasses(operation.status)}`}>
              {operation.status}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
                  {/* NI-15: Phase Transition Controls */}
          <PhaseTransitionPanel
            operationId={id!}
            currentPhase={operation.phase}
            onPhaseChanged={async () => setRefetchTrigger(p => p + 1)}
          />
        {/* Buyer Information */}
        <Card>
          <CardHeader className="bg-gradient-to-br from-blue-50 to-blue-100 border-b-2 border-blue-300">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏢</span>
              <div>
                <CardTitle>Buyer Information</CardTitle>
                <CardDescription>{operation.buyListing?.buyer?.company?.legalName || operation.buyListing?.buyer?.name}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-text-secondary mb-1">Product</p>
                <p className="font-semibold text-text-primary">{operation.buyListing?.product?.name}</p>
              </div>
              <div>
                <p className="text-xs text-text-secondary mb-1">Quantity Needed</p>
                <p className="font-semibold text-text-primary">{operation.totalQuantity || operation.buyListing?.quantity}{operation.buyListing?.unit}</p>
              </div>
              <div>
                <p className="text-xs text-text-secondary mb-1">Delivery Location</p>
                <p className="font-semibold text-text-primary">{formatLocationString(operation.buyListing?.deliveryAddress, ', ')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Offers Summary */}
        <div className="grid grid-cols-3 gap-4">
          <EnhancedTooltip content="Offers that sellers have accepted">
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-700">{acceptedOffers.length}</p>
                  <p className="text-xs text-text-secondary mt-1">✓ Accepted Offers</p>
                </div>
              </CardContent>
            </Card>
          </EnhancedTooltip>
          <EnhancedTooltip content="Offers awaiting seller response">
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-yellow-700">{pendingOffers.length}</p>
                  <p className="text-xs text-text-secondary mt-1">⏳ Pending Offers</p>
                </div>
              </CardContent>
            </Card>
          </EnhancedTooltip>
          <EnhancedTooltip content="Offers that sellers have declined">
            <Card className="hover:shadow-md transition-shadow cursor-help">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-700">{rejectedOffers.length}</p>
                  <p className="text-xs text-text-secondary mt-1">✗ Rejected Offers</p>
                </div>
              </CardContent>
            </Card>
          </EnhancedTooltip>
        </div>

        {/* Workflow Alert for Completed - Fixed height to prevent layout shift */}
        <div className="min-h-[64px]">
          {operation.status === 'COMPLETED' && (
            <Alert className="bg-green-50 border-green-300">
              <AlertDescription className="flex items-center gap-2">
                <span className="text-2xl">✅</span>
                <span className="text-green-900 font-semibold">
                  This trade operation has been completed and finalized.
                </span>
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Quantity Tracking */}
        {operation.buyListing && operation.offers && operation.offers.length > 0 && (
          <QuantityTrackingPanel
            buyListing={operation.buyListing}
            offers={operation.offers}
            onFindReplacements={() => setShowReplacementFinder(true)}
          />
        )}

        {/* Offers List */}
        <Card>
          <CardHeader>
            <CardTitle>Offers ({operation.offers?.length || 0})</CardTitle>
            <CardDescription>All offers sent to sellers for this trade operation</CardDescription>
          </CardHeader>
          <CardContent>
            {!operation.offers || operation.offers.length === 0 ? (
              <div className="text-center py-12 text-text-secondary">
                <span className="text-5xl opacity-30 block mb-3">📋</span>
                <p className="font-semibold">No offers created yet</p>
                <p className="text-sm mt-1">Offers will appear here once created</p>
              </div>
            ) : (
              <div className="space-y-3">
                {operation.offers.map((offer) => (
                  <div key={offer.id} className="border border-gray-300 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-bold text-text-primary">Seller Name</h4>
                          {getOfferStatusBadge(offer.status)}
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-text-secondary">Quantity</p>
                            <p className="font-semibold">{offer.quantity}{operation.buyListing?.unit}</p>
                          </div>
                          <div>
                            <p className="text-xs text-text-secondary">Price/Unit</p>
                            <p className="font-semibold">€{offer.pricePerUnit}</p>
                          </div>
                          <div>
                            <p className="text-xs text-text-secondary">Total Price</p>
                            <p className="font-semibold">€{offer.totalPrice}</p>
                          </div>
                          <div>
                            <p className="text-xs text-text-secondary">Created</p>
                            <p className="font-semibold">{new Date(offer.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                      {offer.status === 'accepted' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRequestInspection(offer)}
                          disabled={requestingInspection === offer.id}
                        >
                          {requestingInspection === offer.id ? (
                            <>
                              <span className="animate-spin mr-2">⏳</span>
                              Requesting...
                            </>
                          ) : (
                            '📷 Request Inspection'
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inspection Results Panel */}
        <InspectionResultsPanel tradeOperationId={id!} />

        {/* Transport Management Panel */}
        <TransportManagementPanel
          tradeOperationId={id!}
          operationPhase={operation.phase}
          operationStatus={operation.status}
          hasAcceptedOffers={hasAcceptedOffers}
          hasCompletedInspections={hasCompletedInspections}
          onTransportAssigned={refreshData}
        />

        {/* Trade Finalization Panel */}
        <TradeFinalizationPanel
          tradeOperationId={id!}
          operation={operation}
          inspections={inspections}
          transportData={transportData}
          onFinalized={refreshData}
        />

        {/* Financial Summary */}
        {operation.totalCost && (
          <Card>
            <CardHeader className="bg-gradient-to-br from-violet-50 to-violet-100 border-b-2 border-violet-300">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💰</span>
                <div>
                  <CardTitle>Financial Summary</CardTitle>
                  <CardDescription>Cost breakdown and profit estimation</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-xs text-text-secondary mb-1">Total Cost</p>
                  <p className="text-2xl font-bold text-text-primary">€{operation.totalCost.toFixed(2)}</p>
                </div>
                {operation.estimatedProfit && (
                  <div>
                    <p className="text-xs text-text-secondary mb-1">Estimated Profit</p>
                    <p className="text-2xl font-bold text-green-700">€{operation.estimatedProfit.toFixed(2)}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-text-secondary mb-1">Margin</p>
                  <p className="text-2xl font-bold text-violet-700">
                    {operation.estimatedProfit && operation.totalCost
                      ? ((operation.estimatedProfit / operation.totalCost) * 100).toFixed(1)
                      : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Replacement Seller Finder Modal */}
      {operation.buyListing && showReplacementFinder && (
        <ReplacementSellerFinder
          isOpen={showReplacementFinder}
          onClose={() => setShowReplacementFinder(false)}
          tradeOperationId={id!}
          productId={operation.buyListing.productId}
          neededQuantity={operation.buyListing.quantity}
          unit={operation.buyListing.unit}
          onSellersAdded={refreshData}
        />
      )}
    </div>
  );
};

export default TradeOperationDetail;
