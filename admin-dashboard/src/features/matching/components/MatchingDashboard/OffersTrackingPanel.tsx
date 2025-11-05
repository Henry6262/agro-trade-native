import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { RefreshCw, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { handleApiError } from '../../../../utils/errorHandler';
import { TradePhase, TradeStatus, NegotiationStatus } from '../../../../types';
import type { Negotiation } from '../../../../types';
import api from '../../../../services/api';
import { API_ENDPOINTS } from '../../../../config/api';

interface SellerSummary {
  id: string;
  name: string;
  quantity: number;
  price: number;
  status: string;
  quality?: string;
  distance?: number;
}

interface BuyerSummary {
  id: string;
  name: string;
  requestedQuantity: number;
  maxPrice: number;
  location?: string;
}

interface ProfitSummary {
  estimated: number;
  margin: number;
  isViable: boolean;
  actual?: number;
  actualMargin?: number;
}

interface TransportSummary {
  estimatedCost: number;
  distance: number;
  optimized: boolean;
  vehicleType?: string;
  actualCost?: number;
}

interface TradeOperation {
  id: string;
  phase: TradePhase;
  status: TradeStatus;
  buyer: BuyerSummary;
  sellers: SellerSummary[];
  profit: ProfitSummary;
  transport: TransportSummary;
  createdAt: Date;
  updatedAt: Date;
  expectedDeliveryDate?: Date;
  confirmedAt?: Date;
  completedAt?: Date;
}

interface NegotiationSummary {
  [tradeOperationId: string]: {
    pending: number;
    accepted: number;
    rejected: number;
    total: number;
  };
}

interface OffersTrackingPanelProps {
  onViewDetails?: (operationId: string) => void;
}

export const OffersTrackingPanel: React.FC<OffersTrackingPanelProps> = ({ onViewDetails }) => {
  const [operations, setOperations] = useState<TradeOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [negotiations, setNegotiations] = useState<NegotiationSummary>({});

  // Fetch negotiation status for a trade operation
  const fetchNegotiationStatus = async (tradeOperationId: string) => {
    try {
      const response = await api.get(
        API_ENDPOINTS.negotiations.byTradeOperation(tradeOperationId)
      );

      const negotiationsList: Negotiation[] = response.data.data || [];

      // Calculate summary
      const summary = {
        pending: negotiationsList.filter(n => n.status === NegotiationStatus.PENDING).length,
        accepted: negotiationsList.filter(n => n.status === NegotiationStatus.ACCEPTED).length,
        rejected: negotiationsList.filter(n => n.status === NegotiationStatus.REJECTED).length,
        total: negotiationsList.length,
      };

      return summary;
    } catch (err: any) {
      console.error(`Error fetching negotiations for ${tradeOperationId}:`, err);
      return { pending: 0, accepted: 0, rejected: 0, total: 0 };
    }
  };

  // Fetch active trade operations
  const fetchOperations = async (showToast = false) => {
    try {
      setError(null);
      if (!loading) setIsRefreshing(true);

      const response = await api.get(API_ENDPOINTS.tradeOperations.base, {
        params: {
          status: 'ACTIVE',
          limit: 50,
        },
      });

      const ops = response.data.data || [];
      setOperations(ops);

      // Fetch negotiation status for each operation
      const negotiationPromises = ops.map(async (op: TradeOperation) => {
        const summary = await fetchNegotiationStatus(op.id);
        return { id: op.id, summary };
      });

      const negotiationResults = await Promise.all(negotiationPromises);
      const negotiationMap: NegotiationSummary = {};
      negotiationResults.forEach(({ id, summary }) => {
        negotiationMap[id] = summary;
      });
      setNegotiations(negotiationMap);

      if (showToast) {
        toast.success('Operations refreshed', {
          description: `Found ${ops.length} active operation(s)`,
        });
      }
    } catch (err: any) {
      console.error('Error fetching trade operations:', err);
      const errorMsg = err.response?.data?.message || 'Failed to fetch trade operations';
      setError(errorMsg);
      handleApiError(err, 'Failed to fetch trade operations');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchOperations();
  }, []);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchOperations();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Format date to relative time
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  // Calculate time remaining until expected delivery
  const formatTimeRemaining = (expectedDate?: Date) => {
    if (!expectedDate) return '-';

    const now = new Date();
    const diff = new Date(expectedDate).getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return 'Overdue';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `${days} days`;
  };

  // Get status badge color
  const getStatusColor = (status: TradeStatus) => {
    switch (status) {
      case TradeStatus.ACTIVE:
        return 'bg-green-100 text-green-800 border-green-300';
      case TradeStatus.DRAFT:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case TradeStatus.COMPLETED:
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case TradeStatus.CANCELLED:
        return 'bg-red-100 text-red-800 border-red-300';
      case TradeStatus.PAUSED:
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Get phase badge color
  const getPhaseColor = (phase: TradePhase) => {
    switch (phase) {
      case TradePhase.INITIATION:
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case TradePhase.SELLER_NEGOTIATION:
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case TradePhase.TRANSPORT_MATCHING:
        return 'bg-cyan-100 text-cyan-800 border-cyan-300';
      case TradePhase.IN_TRANSIT:
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case TradePhase.DELIVERY:
        return 'bg-teal-100 text-teal-800 border-teal-300';
      case TradePhase.PAYMENT:
        return 'bg-green-100 text-green-800 border-green-300';
      case TradePhase.COMPLETED:
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading && operations.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trade operations...</p>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Active Trade Operations</CardTitle>
            <CardDescription>
              Tracking {operations.length} active operation{operations.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={(checked) => setAutoRefresh(checked === true)}
            />
            <Label htmlFor="auto-refresh" className="text-sm text-gray-600 cursor-pointer">
              Auto-refresh (10s)
            </Label>
          </div>
          <Button
            onClick={() => fetchOperations(true)}
            disabled={isRefreshing || loading}
            aria-label="Refresh trade operations"
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-300 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Operations Table */}
        {operations.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600 text-lg font-semibold">No active trade operations found</p>
            <p className="text-gray-500 text-sm mt-2">Create offers from the matching dashboard to see them here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="text-left p-3 text-sm font-semibold text-gray-700">Operation ID</th>
                <th className="text-left p-3 text-sm font-semibold text-gray-700">Buyer</th>
                <th className="text-center p-3 text-sm font-semibold text-gray-700">Sellers</th>
                <th className="text-center p-3 text-sm font-semibold text-gray-700">Negotiations</th>
                <th className="text-center p-3 text-sm font-semibold text-gray-700">Phase</th>
                <th className="text-center p-3 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-right p-3 text-sm font-semibold text-gray-700">Profit</th>
                <th className="text-center p-3 text-sm font-semibold text-gray-700">Time Remaining</th>
                <th className="text-center p-3 text-sm font-semibold text-gray-700">Created</th>
                <th className="text-center p-3 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {operations.map((operation) => (
                <tr key={operation.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="p-3">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                      {operation.id.substring(0, 8)}...
                    </code>
                  </td>
                  <td className="p-3">
                    <div>
                      <p className="font-medium text-sm text-gray-800">{operation.buyer.name}</p>
                      <p className="text-xs text-gray-600">
                        {operation.buyer.requestedQuantity}t @ €{operation.buyer.maxPrice}/t
                      </p>
                    </div>
                  </td>
                  <td className="text-center p-3">
                    <span className="inline-flex items-center justify-center bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm font-semibold">
                      {operation.sellers.length}
                    </span>
                  </td>
                  <td className="text-center p-3">
                    <div className="flex items-center justify-center gap-1 flex-wrap">
                      {negotiations[operation.id] ? (
                        <>
                          {negotiations[operation.id].pending > 0 && (
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200">
                              {negotiations[operation.id].pending} PENDING
                            </Badge>
                          )}
                          {negotiations[operation.id].accepted > 0 && (
                            <Badge className="bg-green-100 text-green-800 border-green-300 hover:bg-green-200">
                              {negotiations[operation.id].accepted} ACCEPTED
                            </Badge>
                          )}
                          {negotiations[operation.id].rejected > 0 && (
                            <Badge className="bg-red-100 text-red-800 border-red-300 hover:bg-red-200">
                              {negotiations[operation.id].rejected} REJECTED
                            </Badge>
                          )}
                          {negotiations[operation.id].total === 0 && (
                            <span className="text-xs text-gray-500">No negotiations</span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">Loading...</span>
                      )}
                    </div>
                  </td>
                  <td className="text-center p-3">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getPhaseColor(operation.phase)}`}>
                      {operation.phase}
                    </span>
                  </td>
                  <td className="text-center p-3">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(operation.status)}`}>
                      {operation.status}
                    </span>
                  </td>
                  <td className="text-right p-3">
                    <div>
                      <p className={`font-semibold text-sm ${operation.profit.isViable ? 'text-green-600' : 'text-red-600'}`}>
                        €{operation.profit.estimated.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-600">{operation.profit.margin.toFixed(2)}% margin</p>
                    </div>
                  </td>
                  <td className="text-center p-3">
                    <span className="text-sm text-gray-700">
                      {formatTimeRemaining(operation.expectedDeliveryDate)}
                    </span>
                  </td>
                  <td className="text-center p-3">
                    <span className="text-xs text-gray-600">
                      {formatRelativeTime(operation.createdAt)}
                    </span>
                  </td>
                  <td className="text-center p-3">
                    <Button
                      onClick={() => onViewDetails?.(operation.id)}
                      size="sm"
                    >
                      View Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OffersTrackingPanel;
