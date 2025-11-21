import React, { useState, useEffect } from 'react';
import { TradePhase, TradeStatus } from '../../../../types';
import type { TradeSeller } from '../../../../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { NegotiationsDetailPanel } from './NegotiationsDetailPanel';
import { InspectionRequestButton } from './InspectionRequestButton';
import api from '../../../../services/api';
import { API_ENDPOINTS } from '../../../../config/api';

interface SellerDetail extends TradeSeller {
  name?: string;
  quantity?: number;
  price?: number;
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
  open: boolean;
  operationId: string;
  onClose: () => void;
}

export const OfferDetailsModal: React.FC<OfferDetailsModalProps> = ({ open, operationId, onClose }) => {
  const [operation, setOperation] = useState<TradeOperationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch operation details
  const fetchDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(API_ENDPOINTS.tradeOperations.byId(operationId));
      setOperation(response.data);
    } catch (err: any) {
      console.error('Error fetching operation details:', err);
      setError(err.response?.data?.message || 'Failed to fetch operation details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  const fulfillment = operation ? calculateFulfillment() : { total: 0, percentage: 0 };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <DialogTitle>Loading operation details...</DialogTitle>
          </div>
        ) : error || !operation ? (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4 text-lg">{error || 'Operation not found'}</p>
            <Button onClick={onClose} variant="secondary">
              Close
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Trade Operation Details</DialogTitle>
              <DialogDescription>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                  ID: {operation.id}
                </code>
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="negotiations">Negotiations</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Buyer Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">Buyer</h3>
              <p className="text-lg font-bold text-blue-900">{operation.buyer.name}</p>
              <p className="text-sm text-blue-700 mt-1">
                {operation.buyer.requestedQuantity}t @ €{operation.buyer.maxPrice}/t
              </p>
              {operation.buyer.location && (
                <p className="text-xs text-blue-600 mt-1">{operation.buyer.location}</p>
              )}
            </CardContent>
          </Card>

          {/* Profit Info */}
          <Card className={operation.profit.isViable ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
            <CardContent className="p-4">
              <h3 className={`text-sm font-semibold mb-2 ${operation.profit.isViable ? 'text-green-800' : 'text-red-800'}`}>
                Profit
              </h3>
              <p className={`text-2xl font-bold ${operation.profit.isViable ? 'text-green-900' : 'text-red-900'}`}>
                €{operation.profit.estimated.toFixed(2)}
              </p>
              <p className={`text-sm mt-1 ${operation.profit.isViable ? 'text-green-700' : 'text-red-700'}`}>
                {operation.profit.margin.toFixed(2)}% margin
              </p>
            </CardContent>
          </Card>

          {/* Transport Info */}
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4">
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
            </CardContent>
          </Card>
        </div>

        {/* Quantity Fulfillment Bar */}
        <Card className="mb-6 bg-muted/50">
          <CardContent className="p-4">
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
          </CardContent>
        </Card>

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
                  <th className="text-center p-3 text-sm font-semibold text-gray-700">Verification</th>
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
                    <td className="text-center p-3">
                      {seller.isVerified ? (
                        <Badge className="bg-green-100 text-green-800 border-green-300">
                          <CheckCircle2 className="w-3 h-3 mr-1 inline" />
                          VERIFIED
                        </Badge>
                      ) : seller.status === 'FAILED_INSPECTION' ? (
                        <Badge className="bg-red-100 text-red-800 border-red-300">
                          <XCircle className="w-3 h-3 mr-1 inline" />
                          FAILED
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                          <Clock className="w-3 h-3 mr-1 inline" />
                          PENDING
                        </Badge>
                      )}
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

            {/* Metadata */}
            <Separator className="my-6" />
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

            <DialogFooter className="mt-6">
              <div className="flex items-center justify-between w-full">
                <div className="flex gap-3">
                  <InspectionRequestButton
                    tradeOperationId={operation.id}
                    sellers={operation.sellers}
                    onInspectionRequested={fetchDetails}
                  />
                  <Button
                    onClick={handleApproveAll}
                    className="bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    Approve All (stub)
                  </Button>
                  <Button
                    onClick={handleRejectAll}
                    variant="destructive"
                    size="sm"
                  >
                    Reject All (stub)
                  </Button>
                  <Button
                    onClick={handleOptimizeTransport}
                    className="bg-purple-600 hover:bg-purple-700"
                    size="sm"
                  >
                    Optimize Transport (stub)
                  </Button>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleFinalizeTrade}
                    size="sm"
                  >
                    Finalize Trade (stub)
                  </Button>
                  <Button
                    onClick={onClose}
                    variant="secondary"
                    size="sm"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </DialogFooter>
              </TabsContent>

              <TabsContent value="negotiations">
                <NegotiationsDetailPanel tradeOperationId={operation.id} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OfferDetailsModal;
