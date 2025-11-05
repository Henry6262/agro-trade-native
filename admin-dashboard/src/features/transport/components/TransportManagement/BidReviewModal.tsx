import React, { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import type { TransportRequest, TransportBid } from '../../../../types/transport';

interface BidReviewModalProps {
  request: TransportRequest;
  onClose: () => void;
  onBidAction: (bidId: string, action: 'accept' | 'reject') => void;
}

export const BidReviewModal: React.FC<BidReviewModalProps> = ({
  request,
  onClose,
  onBidAction,
}) => {
  const [processingBidId, setProcessingBidId] = useState<string | null>(null);

  const handleAcceptBid = async (bid: TransportBid) => {
    if (request.trucksReserved >= request.trucksNeeded) {
      toast.error('Cannot accept bid', {
        description: 'All trucks are already reserved for this transport request.',
      });
      return;
    }

    setProcessingBidId(bid.id);
    try {
      await onBidAction(bid.id, 'accept');
      toast.success('Bid accepted successfully!', {
        description: `${bid.truckCount} truck(s) reserved from ${bid.companyName}`,
      });
    } catch (error) {
      toast.error('Failed to accept bid', {
        description: 'Please try again or contact support',
      });
    } finally {
      setProcessingBidId(null);
    }
  };

  const handleRejectBid = async (bid: TransportBid) => {
    setProcessingBidId(bid.id);
    try {
      await onBidAction(bid.id, 'reject');
      toast.success('Bid rejected', {
        description: `Bid from ${bid.companyName} has been rejected`,
      });
    } catch (error) {
      toast.error('Failed to reject bid', {
        description: 'Please try again or contact support',
      });
    } finally {
      setProcessingBidId(null);
    }
  };

  const getBidStatusBadge = (status: TransportBid['status']) => {
    const badges = {
      PENDING: { emoji: '⏳', text: 'PENDING', color: 'bg-yellow-100 text-yellow-800' },
      ACCEPTED: { emoji: '✅', text: 'ACCEPTED', color: 'bg-green-100 text-green-800' },
      REJECTED: { emoji: '❌', text: 'REJECTED', color: 'bg-red-100 text-red-800' },
    };
    const badge = badges[status];
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${badge.color}`}>
        {badge.emoji} {badge.text}
      </span>
    );
  };

  const renderStarRating = (rating: number = 0) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= rating ? 'text-yellow-400' : 'text-gray-300'}>
          ⭐
        </span>
      );
    }
    return <div className="flex">{stars}</div>;
  };

  const getVehicleTypeLabel = (type: TransportBid['vehicleType']) => {
    const labels = {
      FLATBED: 'Flatbed',
      REFRIGERATED: 'Refrigerated',
      TANKER: 'Tanker',
      CONTAINER: 'Container',
    };
    return labels[type];
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

  // Sort bids: ACCEPTED first, then PENDING, then REJECTED
  const sortedBids = [...request.bids].sort((a, b) => {
    const order = { ACCEPTED: 0, PENDING: 1, REJECTED: 2 };
    return order[a.status] - order[b.status];
  });

  const trucksRemaining = request.trucksNeeded - request.trucksReserved;
  const allTrucksReserved = trucksRemaining <= 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Review Bids - Operation #{request.tradeOperation.operationNumber}
              </h2>
              <p className="text-blue-100">
                Buyer: {request.tradeOperation.buyer.businessName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Summary Section */}
        <div className="bg-gray-50 p-6 border-b">
          <h3 className="font-semibold text-gray-900 mb-3">Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Weight</p>
              <p className="text-lg font-semibold">{request.tradeOperation.totalQuantity}t</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Distance</p>
              <p className="text-lg font-semibold">{request.totalDistance}km</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Trucks Needed</p>
              <p className="text-lg font-semibold">{request.trucksNeeded}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Budget</p>
              <p className="text-lg font-semibold">€{request.estimatedCost.toFixed(2)}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Trucks Reserved:</span>
              <span className="text-lg font-semibold text-green-600">{request.trucksReserved}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Remaining:</span>
              <span className="text-lg font-semibold text-orange-600">{trucksRemaining}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Deadline:</span>
              <span className="text-lg font-semibold text-red-600">
                {calculateTimeRemaining(request.biddingDeadline)}
              </span>
            </div>
          </div>
          {allTrucksReserved && (
            <div className="mt-3 p-3 bg-green-100 text-green-800 rounded-lg">
              ✓ All trucks have been reserved for this transport request.
            </div>
          )}
        </div>

        {/* Bids List */}
        <div className="flex-1 overflow-y-auto p-6">
          {sortedBids.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No bids received yet for this transport request.
            </div>
          ) : (
            <div className="space-y-4">
              {sortedBids.map((bid, index) => (
                <div
                  key={bid.id}
                  className={`border rounded-lg p-5 ${
                    bid.status === 'ACCEPTED'
                      ? 'border-green-300 bg-green-50'
                      : bid.status === 'REJECTED'
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {/* Bid Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        Bid #{index + 1}
                      </h4>
                      <p className="text-xl font-bold text-blue-600 mt-1">
                        {bid.companyName}
                      </p>
                    </div>
                    {getBidStatusBadge(bid.status)}
                  </div>

                  {/* Bid Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Trucks</p>
                      <p className="text-lg font-semibold">{bid.truckCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Bid Amount</p>
                      <p className="text-lg font-semibold">€{bid.bidAmount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Est. Duration</p>
                      <p className="text-lg font-semibold">{bid.estimatedDuration}h</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Vehicle Type</p>
                      <p className="text-lg font-semibold">{getVehicleTypeLabel(bid.vehicleType)}</p>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-1">Company Rating</p>
                    {renderStarRating(bid.rating)}
                  </div>

                  {/* Notes */}
                  {bid.notes && (
                    <div className="mb-4 p-3 bg-gray-100 rounded">
                      <p className="text-sm text-gray-600 mb-1">Notes</p>
                      <p className="text-sm text-gray-800">{bid.notes}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {bid.status === 'PENDING' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleAcceptBid(bid)}
                        disabled={processingBidId === bid.id || allTrucksReserved}
                        aria-label={`Accept bid from ${bid.companyName}`}
                        className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                          allTrucksReserved
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {processingBidId === bid.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Accept
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleRejectBid(bid)}
                        disabled={processingBidId === bid.id}
                        aria-label={`Reject bid from ${bid.companyName}`}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:bg-gray-300 flex items-center gap-2"
                      >
                        {processingBidId === bid.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" />
                            Reject
                          </>
                        )}
                      </button>
                    </div>
                  )}
                  {bid.status === 'ACCEPTED' && (
                    <div className="text-green-600 font-medium">✓ Accepted</div>
                  )}
                  {bid.status === 'REJECTED' && (
                    <div className="text-red-600 font-medium">✗ Rejected</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
