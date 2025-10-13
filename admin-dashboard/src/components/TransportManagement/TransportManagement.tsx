import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2, Truck } from 'lucide-react';
import { handleApiError } from '../../utils/errorHandler';
import type { TransportRequest, TransportRequestStatus } from '../../types/transport';
import { BidReviewModal } from './BidReviewModal';
import { RouteMapModal } from './RouteMapModal';

const API_BASE_URL = 'http://localhost:4001';

export const TransportManagement: React.FC = () => {
  const [requests, setRequests] = useState<TransportRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<TransportRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<TransportRequestStatus | 'ALL'>('ALL');
  const [showBidModal, setShowBidModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);

  useEffect(() => {
    fetchTransportRequests();
    const interval = setInterval(fetchTransportRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchTransportRequests = async () => {
    try {
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/transport-requests`);
      setRequests(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch transport requests:', err);
      setError('Failed to load transport requests. Please try again.');
      handleApiError(err, 'Failed to load transport requests');
      setLoading(false);
    }
  };

  const handleBidAction = async (bidId: string, action: 'accept' | 'reject') => {
    try {
      await axios.patch(`${API_BASE_URL}/transport-bids/${bidId}/${action}`);
      await fetchTransportRequests();
      if (selectedRequest) {
        const updatedRequest = requests.find(r => r.id === selectedRequest.id);
        if (updatedRequest) {
          setSelectedRequest(updatedRequest);
        }
      }
    } catch (err) {
      console.error(`Failed to ${action} bid:`, err);
      handleApiError(err, `Failed to ${action} bid`);
      throw err; // Re-throw to be handled by BidReviewModal
    }
  };

  const filteredRequests = requests.filter(request =>
    filterStatus === 'ALL' || request.status === filterStatus
  );

  const getStatusBadge = (status: TransportRequestStatus) => {
    const badges = {
      OPEN: { emoji: '🟢', text: 'OPEN', color: 'bg-green-100 text-green-800' },
      ASSIGNED: { emoji: '✅', text: 'ASSIGNED', color: 'bg-blue-100 text-blue-800' },
      IN_TRANSIT: { emoji: '🚚', text: 'IN TRANSIT', color: 'bg-orange-100 text-orange-800' },
      COMPLETED: { emoji: '✔️', text: 'COMPLETED', color: 'bg-gray-100 text-gray-800' },
    };
    const badge = badges[status];
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${badge.color}`}>
        {badge.emoji} {badge.text}
      </span>
    );
  };

  const calculateTimeRemaining = (deadline: string) => {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Transport Management</h1>

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
                      Operation #{request.tradeOperation.operationNumber}
                    </h2>
                    <p className="text-gray-600">
                      Buyer: {request.tradeOperation.buyer.businessName}
                    </p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">Total Weight</p>
                    <p className="text-lg font-semibold">{request.tradeOperation.totalQuantity}t</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">Distance</p>
                    <p className="text-lg font-semibold">{request.totalDistance}km</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">Est. Cost</p>
                    <p className="text-lg font-semibold">€{request.estimatedCost.toFixed(2)}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">Deadline</p>
                    <p className="text-lg font-semibold text-orange-600">
                      {calculateTimeRemaining(request.biddingDeadline)}
                    </p>
                  </div>
                </div>

                {/* Route Info */}
                <div className="mb-4 text-sm text-gray-700">
                  <p>📍 {request.pickupPoints.length} Pickup Point{request.pickupPoints.length > 1 ? 's' : ''} → 1 Delivery Point</p>
                </div>

                {/* Truck Tracking */}
                <div className="mb-4">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-medium">🚚 Trucks:</span>
                    <span className="text-blue-600 font-semibold">{request.trucksNeeded} needed</span>
                    <span className="text-green-600 font-semibold">{request.trucksReserved} reserved</span>
                    <span className="text-orange-600 font-semibold">
                      {request.trucksNeeded - request.trucksReserved} remaining
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-500 h-3 rounded-full transition-all"
                      style={{ width: `${(request.trucksReserved / request.trucksNeeded) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedRequest(request);
                      setShowBidModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Bids ({request.bids.length})
                  </button>
                  <button
                    onClick={() => {
                      setSelectedRequest(request);
                      setShowMapModal(true);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
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
      {showBidModal && selectedRequest && (
        <BidReviewModal
          request={selectedRequest}
          onClose={() => {
            setShowBidModal(false);
            setSelectedRequest(null);
          }}
          onBidAction={handleBidAction}
        />
      )}

      {/* Route Map Modal */}
      {showMapModal && selectedRequest && (
        <RouteMapModal
          request={selectedRequest}
          onClose={() => {
            setShowMapModal(false);
            setSelectedRequest(null);
          }}
        />
      )}
    </div>
  );
};
