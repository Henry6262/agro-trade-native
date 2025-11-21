import React, { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { TransportRequestSummary, TransportBidSummary } from '../../../../types';

interface BidReviewModalProps {
  request: TransportRequestSummary;
  onClose: () => void;
  onBidAction: (bidId: string, action: 'accept' | 'reject') => void;
}

const statusBadge: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
  ACCEPTED: { label: 'Accepted', className: 'bg-green-100 text-green-800' },
  REJECTED: { label: 'Rejected', className: 'bg-rose-100 text-rose-800' },
  DECLINED: { label: 'Declined', className: 'bg-rose-100 text-rose-800' },
};

const vehicleLabel: Record<string, string> = {
  FLATBED: 'Flatbed',
  REFRIGERATED: 'Refrigerated',
  TANKER: 'Tanker',
  CONTAINER: 'Container',
};

export const BidReviewModal: React.FC<BidReviewModalProps> = ({ request, onClose, onBidAction }) => {
  const [processingBidId, setProcessingBidId] = useState<string | null>(null);

  const handleAction = async (bid: TransportBidSummary, action: 'accept' | 'reject') => {
    setProcessingBidId(bid.id);
    try {
      await onBidAction(bid.id, action);
      toast.success(`Bid ${action === 'accept' ? 'accepted' : 'rejected'}`);
    } catch (error) {
      toast.error(`Failed to ${action} bid`);
      throw error;
    } finally {
      setProcessingBidId(null);
    }
  };

  const bids = [...request.bids].sort((a, b) => {
    const order = { ACCEPTED: 0, PENDING: 1, REJECTED: 2, DECLINED: 3 } as const;
    return (order[a.status as keyof typeof order] ?? 1) - (order[b.status as keyof typeof order] ?? 1);
  });

  const buyerName = request.deliveryPoint?.buyerName || 'Unknown buyer';
  const biddingDeadline = request.biddingDeadline
    ? new Date(request.biddingDeadline).toLocaleString()
    : '—';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-blue-600 text-white p-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">Transport bids · Request #{request.requestNumber}</h2>
            <p className="text-sm text-blue-100">Buyer: {buyerName}</p>
          </div>
          <button onClick={onClose} className="text-2xl leading-none font-bold">
            ×
          </button>
        </div>

        <div className="bg-gray-50 border-b px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-slate-500">Total weight</p>
            <p className="text-lg font-semibold">{request.totalWeight} t</p>
          </div>
          <div>
            <p className="text-slate-500">Pickup points</p>
            <p className="text-lg font-semibold">{request.pickupPoints.length}</p>
          </div>
          <div>
            <p className="text-slate-500">Bids received</p>
            <p className="text-lg font-semibold">{bids.length}</p>
          </div>
          <div>
            <p className="text-slate-500">Bidding deadline</p>
            <p className="text-lg font-semibold">{biddingDeadline}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {bids.length === 0 ? (
            <div className="text-center text-slate-500">No bids submitted yet for this request.</div>
          ) : (
            <div className="space-y-4">
              {bids.map((bid) => (
                <div
                  key={bid.id}
                  className="border border-slate-200 rounded-lg p-4 bg-white flex flex-col gap-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">
                        {bid.transportCompanyName || bid.transporterName || 'Transporter'}
                      </p>
                      <p className="text-xs text-slate-500">
                        Submitted {bid.submittedAt ? new Date(bid.submittedAt).toLocaleString() : '—'}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        statusBadge[bid.status]?.className || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {statusBadge[bid.status]?.label || bid.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-600">
                    <div>
                      <p className="text-xs uppercase">Bid amount</p>
                      <p className="text-base font-semibold text-slate-900">
                        €
                        {typeof bid.bidAmount === 'number'
                          ? bid.bidAmount.toFixed(2)
                          : bid.bidAmount || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase">Duration</p>
                      <p className="text-base font-semibold text-slate-900">
                        {bid.estimatedDuration ? `${bid.estimatedDuration} h` : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase">Vehicle type</p>
                      <p className="text-base font-semibold text-slate-900">
                        {bid.vehicleType ? vehicleLabel[bid.vehicleType] || bid.vehicleType : 'Any'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase">Capacity</p>
                      <p className="text-base font-semibold text-slate-900">
                        {bid.vehicleCapacity ? `${bid.vehicleCapacity} t` : '—'}
                      </p>
                    </div>
                  </div>

                  {bid.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(bid, 'accept')}
                        disabled={processingBidId === bid.id}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        {processingBidId === bid.id ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> Approving…
                          </span>
                        ) : (
                          'Accept bid'
                        )}
                      </button>
                      <button
                        onClick={() => handleAction(bid, 'reject')}
                        disabled={processingBidId === bid.id}
                        className="px-4 py-2 bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
