import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2, Truck, Plus } from 'lucide-react';
import type { TransportRequestListItem, TransportRequestSummary } from '../../../../types';

type TransportRequestStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
import type { TradeOperation } from '../../../../types';
import { transportAdminService } from '../../../../services/api';
import { BidReviewModal } from './BidReviewModal';
import { RouteMapModal } from './RouteMapModal';
import TransportOverviewMap from './TransportOverviewMap';
import { CreateTransportModal } from './CreateTransportModal';

interface TransportManagementProps {
  tradeOperation?: TradeOperation;
  onUpdate?: () => Promise<void>;
}

export const TransportManagement: React.FC<TransportManagementProps> = ({ tradeOperation, onUpdate }) => {
  const [requests, setRequests] = useState<TransportRequestListItem[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<TransportRequestListItem | null>(null);
  const [requestDetail, setRequestDetail] = useState<TransportRequestSummary | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<TransportRequestStatus | 'ALL'>('ALL');
  const [showBidModal, setShowBidModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchTransportRequests();
    const interval = setInterval(fetchTransportRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchTransportRequests = async () => {
    try {
      setError(null);
      const response = await transportAdminService.getRequests({ limit: 50 });
      setRequests(response.data || []);
    } catch (err) {
      console.error('Failed to fetch transport requests:', err);
      setError('Failed to load transport requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBidAction = async (bidId: string, action: 'accept' | 'reject') => {
    try {
      if (action === 'accept') {
        await transportAdminService.approveBid(bidId);
      } else {
        await transportAdminService.rejectBid(bidId);
      }
      await fetchTransportRequests();
      if (selectedRequest) {
        const updatedRequest = requests.find(r => r.id === selectedRequest.id);
        if (updatedRequest) {
          setSelectedRequest(updatedRequest);
        }
      }
    } catch (err) {
      console.error(`Failed to ${action} bid:`, err);
      toast.error(`Failed to ${action} bid`);
      throw err;
    }
  };

  const filteredRequests = requests.filter(request =>
    filterStatus === 'ALL' || request.status === filterStatus
  );

  const needsAttention = (request: TransportRequestListItem) => {
    const noBids = (request.bidsCount ?? request.bids?.length ?? 0) === 0;
    const deadlineSoon =
      request.biddingDeadline &&
      new Date(request.biddingDeadline).getTime() - Date.now() < 24 * 60 * 60 * 1000 &&
      request.status === 'OPEN';
    const overdueJob =
      request.job &&
      request.job.status !== 'COMPLETED' &&
      request.job.estimatedArrival &&
      new Date(request.job.estimatedArrival).getTime() < Date.now();
    return noBids || deadlineSoon || overdueJob;
  };

  const summary = {
    total: requests.length,
    open: requests.filter((r) => r.status === 'OPEN').length,
    assigned: requests.filter((r) => r.status === 'ASSIGNED').length,
    inTransit: requests.filter((r) => r.status === 'IN_TRANSIT').length,
    completed: requests.filter((r) => r.status === 'COMPLETED').length,
    attention: requests.filter(needsAttention).length,
  };

  const loadRequestDetail = async (requestId: string) => {
    try {
      setDetailLoading(true);
      const detail = await transportAdminService.getRequestById(requestId);
      setRequestDetail(detail);
    } catch (err) {
      console.error('Failed to load transport request detail', err);
      toast.error('Failed to load request details');
    } finally {
      setDetailLoading(false);
    }
  };

  const getStatusBadge = (status: TransportRequestStatus | string) => {
    const badges = {
      OPEN: { emoji: '🟢', text: 'OPEN', color: 'bg-green-100 text-green-800' },
      ASSIGNED: { emoji: '✅', text: 'ASSIGNED', color: 'bg-blue-100 text-blue-800' },
      IN_TRANSIT: { emoji: '🚚', text: 'IN TRANSIT', color: 'bg-orange-100 text-orange-800' },
      COMPLETED: { emoji: '✔️', text: 'COMPLETED', color: 'bg-gray-100 text-gray-800' },
      CANCELLED: { emoji: '⚪', text: 'CANCELLED', color: 'bg-gray-200 text-gray-700' },
    };
    const badge = badges[status as keyof typeof badges] || badges.OPEN;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${badge.color}`}>
        {badge.emoji} {badge.text}
      </span>
    );
  };

  const calculateTimeRemaining = (deadline?: string | null) => {
    if (!deadline) return '—';
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - now.getTime();

    if (diff < 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours < 1) return `${minutes}m remaining`;
    return `${hours}h ${minutes}m remaining`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <div className="text-xl text-gray-600 font-semibold">Loading transport requests...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
<div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Transport Management</h1>
          <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"><Plus className="w-5 h-5" /> Create Transport Request</button>
        </div>
                    {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-lg">
                    {error}            
            <button
              onClick={fetchTransportRequests}
              className="ml-4 underline"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-xs text-slate-500 uppercase">Total requests</p>
            <p className="text-2xl font-bold text-slate-900">{summary.total}</p>
            <p className="text-xs text-slate-500 mt-1">
              Open {summary.open} · Assigned {summary.assigned} · In transit {summary.inTransit}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-xs text-slate-500 uppercase">Completed</p>
            <p className="text-2xl font-bold text-emerald-600">{summary.completed}</p>
            <p className="text-xs text-slate-500 mt-1">Ready for invoicing</p>
          </div>
          <div className="bg-white rounded-lg border border-amber-200 p-4 bg-amber-50">
            <p className="text-xs text-amber-700 uppercase">Needs attention</p>
            <p className="text-2xl font-bold text-amber-700">{summary.attention}</p>
            <p className="text-xs text-amber-700 mt-1">
              No bids, deadlines near, or overdue transports
            </p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="mb-6 flex gap-2">
          {(['ALL', 'OPEN', 'ASSIGNED', 'IN_TRANSIT', 'COMPLETED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {status === 'ALL' ? 'All' : status.replace('_', ' ')}
            </button>
          ))}
        </div>

        <TransportOverviewMap requests={filteredRequests} />

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            <Truck className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-lg font-semibold text-gray-600">No transport requests found</p>
            <p className="text-sm text-gray-500 mt-2">
              {filterStatus === 'ALL'
                ? 'Create a trade operation to generate transport requests'
                : `No requests with status: ${filterStatus}`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Operation #{request.tradeOperation?.operationNumber || 'N/A'}
                    </h2>
                    <p className="text-gray-600">
                      Buyer: {request.tradeOperation?.buyListing?.buyer?.name || 'Unknown'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(request.status)}
                    {needsAttention(request) && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                        ⚠ Needs attention
                      </span>
                    )}
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">Total Weight</p>
                    <p className="text-lg font-semibold">{request.totalWeight}t</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">Pickup Points</p>
                    <p className="text-lg font-semibold">{request.pickupPoints.length}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">Bids</p>
                    <p className="text-lg font-semibold">{request.bidsCount ?? 0}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">Deadline</p>
                    <p className="text-lg font-semibold text-orange-600">
                      {calculateTimeRemaining(request.biddingDeadline || '')}
                    </p>
                  </div>
                </div>

                {/* Route Info */}
                <div className="mb-4 text-sm text-gray-700">
                  <p>📍 {request.pickupPoints.length} Pickup Point{request.pickupPoints.length > 1 ? 's' : ''} → 1 Delivery Point</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      setSelectedRequest(request);
                      await loadRequestDetail(request.id);
                      setShowBidModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
                    disabled={detailLoading}
                  >
                    {detailLoading && selectedRequest?.id === request.id
                      ? 'Loading…'
                      : `View Bids (${request.bidsCount ?? 0})`}
                  </button>
                  <button
                    onClick={async () => {
                      setSelectedRequest(request);
                      await loadRequestDetail(request.id);
                      setShowMapModal(true);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-60"
                    disabled={detailLoading}
                  >
                    View Map
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bid Review Modal */}
      {showBidModal && requestDetail && (
        <BidReviewModal
          request={requestDetail}
          onClose={() => {
            setShowBidModal(false);
            setSelectedRequest(null);
            setRequestDetail(null);
          }}
          onBidAction={handleBidAction}
        />
      )}

      {/* Route Map Modal */}
      {showMapModal && requestDetail && (
        <RouteMapModal
          request={requestDetail}
          onClose={() => {
            setShowMapModal(false);
            setSelectedRequest(null);
            setRequestDetail(null);
          }}
        />
      )}
            {/* NI-14: Create Transport Request Modal */}
      {showCreateModal && (
        <CreateTransportModal
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchTransportRequests}
        />
      )}
    </div>
  );
};
