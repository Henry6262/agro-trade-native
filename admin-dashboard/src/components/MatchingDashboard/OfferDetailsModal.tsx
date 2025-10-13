import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TradePhase, TradeStatus } from '../../types';

interface SellerDetail {
  id: string;
  name: string;
  quantity: number;
  price: number;
  status: string;
  quality?: string;
  distance?: number;
}

interface BuyerDetail {
  id: string;
  name: string;
  requestedQuantity: number;
  maxPrice: number;
  location?: string;
}

interface ProfitDetail {
  estimated: number;
  margin: number;
  isViable: boolean;
  actual?: number;
  actualMargin?: number;
}

interface TransportDetail {
  estimatedCost: number;
  distance: number;
  optimized: boolean;
  vehicleType?: string;
  actualCost?: number;
}

interface TradeOperationDetail {
  id: string;
  phase: TradePhase;
  status: TradeStatus;
  buyer: BuyerDetail;
  sellers: SellerDetail[];
  profit: ProfitDetail;
  transport: TransportDetail;
  createdAt: Date;
  updatedAt: Date;
  expectedDeliveryDate?: Date;
  confirmedAt?: Date;
  completedAt?: Date;
}

interface OfferDetailsModalProps {
  operationId: string;
  onClose: () => void;
}

export const OfferDetailsModal: React.FC<OfferDetailsModalProps> = ({ operationId, onClose }) => {
  const [operation, setOperation] = useState<TradeOperationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch operation details
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(`http://localhost:4001/trade-operations/${operationId}`);
        setOperation(response.data);
      } catch (err: any) {
        console.error('Error fetching operation details:', err);
        setError(err.response?.data?.message || 'Failed to fetch operation details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [operationId]);

  // Get seller status badge color
  const getSellerStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'COUNTER_OFFER':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Calculate quantity fulfillment
  const calculateFulfillment = () => {
    if (!operation) return { total: 0, percentage: 0 };

    const totalSellerQuantity = operation.sellers.reduce((sum, s) => sum + s.quantity, 0);
    const percentage = (totalSellerQuantity / operation.buyer.requestedQuantity) * 100;

    return {
      total: totalSellerQuantity,
      percentage: Math.min(percentage, 100),
    };
  };

  // Handle action buttons (stubs for now)
  const handleApproveAll = () => {
    alert('Approve All functionality will be implemented in the next phase');
  };

  const handleRejectAll = () => {
    alert('Reject All functionality will be implemented in the next phase');
  };

  const handleOptimizeTransport = () => {
    alert('Optimize Transport functionality will be implemented in the next phase');
  };

  const handleFinalizeTrade = () => {
    alert('Finalize Trade functionality will be implemented in the next phase');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-5xl w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-700">Loading operation details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !operation) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-5xl w-full mx-4">
          <div className="text-center">
            <p className="text-red-600 mb-4 text-lg">{error || 'Operation not found'}</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const fulfillment = calculateFulfillment();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-5xl w-full mx-4 my-8">
        {/* Header */}
        <div className="mb-6 border-b pb-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Trade Operation Details</h2>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono mt-2 inline-block">
                ID: {operation.id}
              </code>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Buyer Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">Buyer</h3>
            <p className="text-lg font-bold text-blue-900">{operation.buyer.name}</p>
            <p className="text-sm text-blue-700 mt-1">
              {operation.buyer.requestedQuantity}t @ €{operation.buyer.maxPrice}/t
            </p>
            {operation.buyer.location && (
              <p className="text-xs text-blue-600 mt-1">{operation.buyer.location}</p>
            )}
          </div>

          {/* Profit Info */}
          <div className={`border rounded-lg p-4 ${operation.profit.isViable ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <h3 className={`text-sm font-semibold mb-2 ${operation.profit.isViable ? 'text-green-800' : 'text-red-800'}`}>
              Profit
            </h3>
            <p className={`text-2xl font-bold ${operation.profit.isViable ? 'text-green-900' : 'text-red-900'}`}>
              €{operation.profit.estimated.toFixed(2)}
            </p>
            <p className={`text-sm mt-1 ${operation.profit.isViable ? 'text-green-700' : 'text-red-700'}`}>
              {operation.profit.margin.toFixed(2)}% margin
            </p>
          </div>

          {/* Transport Info */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-purple-800 mb-2">Transport</h3>
            <p className="text-lg font-bold text-purple-900">
              €{operation.transport.estimatedCost.toFixed(2)}
            </p>
            <p className="text-sm text-purple-700 mt-1">
              {operation.transport.distance.toFixed(0)}km
            </p>
            {operation.transport.optimized && (
              <span className="text-xs text-purple-600 mt-1 inline-block">Optimized</span>
            )}
          </div>
        </div>

        {/* Quantity Fulfillment Bar */}
        <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">Quantity Fulfillment</h3>
            <span className="text-sm font-medium text-gray-600">
              {fulfillment.total}t / {operation.buyer.requestedQuantity}t ({fulfillment.percentage.toFixed(1)}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className={`h-full transition-all ${
                fulfillment.percentage >= 100 ? 'bg-green-500' : fulfillment.percentage >= 80 ? 'bg-blue-500' : 'bg-yellow-500'
              }`}
              style={{ width: `${fulfillment.percentage}%` }}
            />
          </div>
        </div>

        {/* Sellers Table */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Seller Breakdown</h3>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Seller</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Quantity</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Price/Unit</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Total</th>
                  <th className="text-center p-3 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Distance</th>
                  {operation.sellers.some(s => s.quality) && (
                    <th className="text-center p-3 text-sm font-semibold text-gray-700">Quality</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {operation.sellers.map((seller) => (
                  <tr key={seller.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-3">
                      <p className="font-medium text-sm text-gray-800">{seller.name}</p>
                      <code className="text-xs text-gray-500 font-mono">{seller.id.substring(0, 8)}...</code>
                    </td>
                    <td className="text-right p-3 text-sm">{seller.quantity}t</td>
                    <td className="text-right p-3 text-sm">€{seller.price?.toFixed(2) || '-'}</td>
                    <td className="text-right p-3 text-sm font-semibold">
                      €{seller.price ? (seller.quantity * seller.price).toFixed(2) : '-'}
                    </td>
                    <td className="text-center p-3">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getSellerStatusColor(seller.status)}`}>
                        {seller.status}
                      </span>
                    </td>
                    <td className="text-right p-3 text-sm">
                      {seller.distance ? `${seller.distance.toFixed(0)}km` : '-'}
                    </td>
                    {operation.sellers.some(s => s.quality) && (
                      <td className="text-center p-3 text-xs">
                        {seller.quality || '-'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-bold">
                  <td className="p-3 text-sm">Total</td>
                  <td className="text-right p-3 text-sm">{fulfillment.total}t</td>
                  <td colSpan={operation.sellers.some(s => s.quality) ? 5 : 4}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <button
                onClick={handleApproveAll}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                Approve All (stub)
              </button>
              <button
                onClick={handleRejectAll}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Reject All (stub)
              </button>
              <button
                onClick={handleOptimizeTransport}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                Optimize Transport (stub)
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleFinalizeTrade}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Finalize Trade (stub)
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
            <div>
              <span className="font-semibold">Created:</span>{' '}
              {new Date(operation.createdAt).toLocaleString()}
            </div>
            <div>
              <span className="font-semibold">Last Updated:</span>{' '}
              {new Date(operation.updatedAt).toLocaleString()}
            </div>
            {operation.expectedDeliveryDate && (
              <div>
                <span className="font-semibold">Expected Delivery:</span>{' '}
                {new Date(operation.expectedDeliveryDate).toLocaleString()}
              </div>
            )}
            {operation.confirmedAt && (
              <div>
                <span className="font-semibold">Confirmed:</span>{' '}
                {new Date(operation.confirmedAt).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferDetailsModal;
