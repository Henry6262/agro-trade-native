import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '../../../../services/api';
import { API_ENDPOINTS } from '../../../../config/api';
import { transportAdminService } from '../../../../services/api';
import { useToast } from '@/hooks/use-toast';
import type { TransportData, TransportBid } from '../../../../types/listings';
import { formatLocationString } from '../../../../utils/locationHelpers';
import { SkeletonCard, CountdownTimer, EnhancedTooltip } from '../../../../components/common';

interface TransportManagementPanelProps {
  tradeOperationId: string;
  operationPhase: string;
  operationStatus: string;
  hasAcceptedOffers: boolean;
  hasCompletedInspections: boolean;
  onTransportAssigned?: () => void;
}

export const TransportManagementPanel: React.FC<TransportManagementPanelProps> = ({
  tradeOperationId,
  operationPhase,
  operationStatus,
  hasAcceptedOffers,
  hasCompletedInspections,
  onTransportAssigned,
}) => {
  const { toast } = useToast();
  const [transportData, setTransportData] = useState<TransportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creatingRequest, setCreatingRequest] = useState(false);
  const [processingBid, setProcessingBid] = useState<string | null>(null);

  // Only show panel if conditions are met
  const shouldShowPanel =
    hasAcceptedOffers &&
    hasCompletedInspections &&
    operationStatus !== 'COMPLETED' &&
    operationStatus !== 'CANCELLED';

  useEffect(() => {
    if (shouldShowPanel) {
      fetchTransportData();
    }
  }, [tradeOperationId, shouldShowPanel]);

  const fetchTransportData = async () => {
    try {
      setLoading(true);
      const response = await transportAdminService.getByTradeOperation(tradeOperationId);
      setTransportData(response);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching transport data:', err);
      setError('Failed to load transport information');
      setTransportData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransportRequest = async () => {
    try {
      setCreatingRequest(true);

      await transportAdminService.autoCreateRequest(tradeOperationId);

      toast({
        title: 'Transport Request Created',
        description: 'Transport companies have been notified',
      });

      await fetchTransportData();
    } catch (err) {
      console.error('Error creating transport request:', err);
      toast({
        variant: 'destructive',
        title: 'Failed to Create Request',
        description: 'Please try again later',
      });
    } finally {
      setCreatingRequest(false);
    }
  };

  const handleApproveBid = async (bidId: string) => {
    try {
      setProcessingBid(bidId);

      await transportAdminService.approveBid(bidId);

      toast({
        title: 'Transport Approved',
        description: 'Transport company has been assigned to this operation',
      });

      await fetchTransportData();
      onTransportAssigned?.();
    } catch (err) {
      console.error('Error approving transport:', err);
      toast({
        variant: 'destructive',
        title: 'Failed to Approve',
        description: 'Please try again later',
      });
    } finally {
      setProcessingBid(null);
    }
  };

  const handleRejectBid = async (bidId: string) => {
    try {
      setProcessingBid(bidId);

      await transportAdminService.rejectBid(bidId);

      toast({
        title: 'Transport Rejected',
        description: 'Company has been notified',
      });

      await fetchTransportData();
    } catch (err) {
      console.error('Error rejecting transport:', err);
      toast({
        variant: 'destructive',
        title: 'Failed to Reject',
        description: 'Please try again later',
      });
    } finally {
      setProcessingBid(null);
    }
  };

  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      PENDING: 'outline',
      CONFIRMED: 'default',
      DECLINED: 'destructive',
      ACCEPTED: 'default',
      REJECTED: 'destructive',
    };
    return variants[status] || 'outline';
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!shouldShowPanel) {
    return null;
  }

  if (loading) {
    return (
      <SkeletonCard showHeader rows={4} />
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <span className="text-4xl opacity-30">⚠️</span>
            <p className="mt-2 text-text-secondary">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchTransportData} className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Phase 3: Transport Assigned - Show job tracking
  if (transportData?.job) {
    const job = transportData.job;
    const assignedBid = transportData.bids.find((bid) => bid.status === 'ACCEPTED');

    return (
      <Card>
        <CardHeader className="bg-gradient-to-br from-green-50 to-green-100 border-b-2 border-green-300">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✅</span>
            <div>
              <CardTitle>Transport Assigned</CardTitle>
              <CardDescription>
                {assignedBid?.transportCompany?.companyName || 'Transport Company'} - {assignedBid?.truckCount || 0}{' '}
                trucks
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-text-secondary">Job Status</p>
              <Badge variant="default">{job.status}</Badge>
            </div>
            <div>
              <p className="text-xs text-text-secondary">Started</p>
              <p className="font-semibold">{formatDate(job.startedAt)}</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary">ETA</p>
              <p className="font-semibold">{formatDate(job.estimatedArrival)}</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary">Progress</p>
              <p className="font-semibold">{job.progress}%</p>
            </div>
          </div>

          {/* Animated Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-text-secondary">Transport Progress</span>
              <span className="text-sm font-bold text-green-700">{job.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden border border-gray-300 shadow-inner">
              <div
                className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2"
                style={{ width: `${job.progress}%` }}
              >
                {job.progress > 15 && (
                  <span className="text-white text-xs font-bold">🚛</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Phase 2: Request Created - Show responses
  if (transportData?.request) {
    const request = transportData.request;
    const bids = transportData.bids || [];
    const confirmedBids = bids.filter((bid) => bid.status === 'CONFIRMED');
    const pendingBids = bids.filter((bid) => bid.status === 'PENDING');
    const declinedBids = bids.filter((bid) => bid.status === 'DECLINED');

    return (
      <Card>
        <CardHeader className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-b-2 border-indigo-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🚚</span>
              <div>
                <CardTitle>Transport Request #{request.requestNumber}</CardTitle>
                <CardDescription>Sent to {bids.length} transport companies</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {request.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Request Details */}
          <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-gray-200">
            <div>
              <p className="text-xs text-text-secondary">Total Weight</p>
              <p className="font-semibold">{request.totalWeight} tons</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary">Pickup Points</p>
              <p className="font-semibold">{request.pickupPoints.length} locations</p>
            </div>
            <CountdownTimer
              targetDate={request.deliveryDeadline}
              label="Delivery Deadline"
            />
          </div>

          {/* Company Responses */}
          <div className="space-y-3">
            <h3 className="font-bold text-lg mb-4">Transport Company Responses</h3>

            {bids.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">
                <span className="text-5xl opacity-30 block mb-3 animate-pulse">📭</span>
                <p className="font-semibold text-lg">No responses yet</p>
                <p className="text-sm mt-2">Waiting for transport companies to respond...</p>
                <div className="mt-4 flex items-center justify-center gap-2 text-xs">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </div>
              </div>
            ) : (
              <>
                {/* Confirmed Bids */}
                {confirmedBids.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-green-700 mb-2">
                      ✅ Confirmed ({confirmedBids.length})
                    </h4>
                    <div className="space-y-2">
                      {confirmedBids.map((bid) => (
                        <BidCard
                          key={bid.id}
                          bid={bid}
                          onApprove={handleApproveBid}
                          onReject={handleRejectBid}
                          processing={processingBid === bid.id}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending Bids */}
                {pendingBids.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-yellow-700 mb-2">⏳ Pending ({pendingBids.length})</h4>
                    <div className="space-y-2">
                      {pendingBids.map((bid) => (
                        <BidCard key={bid.id} bid={bid} onApprove={handleApproveBid} onReject={handleRejectBid} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Declined Bids */}
                {declinedBids.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-red-700 mb-2">❌ Declined ({declinedBids.length})</h4>
                    <div className="space-y-2">
                      {declinedBids.map((bid) => (
                        <BidCard key={bid.id} bid={bid} onApprove={handleApproveBid} onReject={handleRejectBid} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Phase 1: Pre-Request State - Show create button
  return (
    <Card>
      <CardHeader className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-b-2 border-indigo-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚚</span>
            <div>
              <CardTitle>Transport Coordination</CardTitle>
              <CardDescription>Arrange transport for this trade operation</CardDescription>
            </div>
          </div>
          <Button onClick={handleCreateTransportRequest} disabled={creatingRequest} size="lg">
            {creatingRequest ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Creating...
              </>
            ) : (
              <>📦 Create Transport Request</>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="text-center py-8">
          <span className="text-6xl opacity-20 block mb-4">🚛</span>
          <p className="text-text-secondary font-semibold">No transport request created yet</p>
          <p className="text-sm text-text-secondary mt-2">
            Click the button above to create a transport request and notify transport companies
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

// Bid Card Component
interface BidCardProps {
  bid: TransportBid;
  onApprove?: (bidId: string) => void;
  onReject?: (bidId: string) => void;
  processing?: boolean;
}

const BidCard: React.FC<BidCardProps> = ({ bid, onApprove, onReject, processing }) => {
  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      PENDING: 'outline',
      CONFIRMED: 'default',
      DECLINED: 'destructive',
      ACCEPTED: 'default',
      REJECTED: 'destructive',
    };
    return variants[status] || 'outline';
  };

  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition-all duration-200 bg-white hover:border-indigo-300">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <EnhancedTooltip content={`Transport company: ${bid.transportCompany?.companyName}`}>
            <h4 className="font-bold text-text-primary mb-2 cursor-help">{bid.transportCompany?.companyName || 'Unknown Company'}</h4>
          </EnhancedTooltip>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-text-secondary">Trucks Offered</p>
              <p className="font-semibold">{bid.truckCount} trucks</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary">Total Capacity</p>
              <p className="font-semibold">{bid.totalCapacity} tons</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary">Status</p>
              <Badge variant={getStatusBadgeVariant(bid.status)}>{bid.status}</Badge>
            </div>
          </div>
        </div>
        {bid.status === 'CONFIRMED' && onApprove && onReject && (
          <div className="flex gap-2 ml-4">
            <Button
              size="sm"
              className="bg-green-600 text-white hover:bg-green-700"
              onClick={() => onApprove(bid.id)}
              disabled={processing}
            >
              {processing ? (
                <>
                  <span className="animate-spin mr-1">⏳</span>
                  Processing...
                </>
              ) : (
                '✅ Approve'
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => onReject(bid.id)}
              disabled={processing}
            >
              ❌ Reject
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransportManagementPanel;
