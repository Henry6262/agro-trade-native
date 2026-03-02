import React, { useState, useEffect } from 'react';
import { NegotiationStatus } from '../../../../types';
import type { Negotiation } from '../../../../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, RefreshCw, Clock, CheckCircle2, XCircle, ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../../services/api';
import { API_ENDPOINTS } from '../../../../config/api';

interface NegotiationsDetailPanelProps {
  tradeOperationId: string;
  onClose?: () => void;
}

export const NegotiationsDetailPanel: React.FC<NegotiationsDetailPanelProps> = ({
  tradeOperationId,
  onClose
}) => {
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  // Fetch negotiations for the trade operation
  const fetchNegotiations = async (showToast = false) => {
    try {
      setError(null);
      if (!loading) setRefreshing(true);

      const response = await api.get(
        API_ENDPOINTS.negotiations.byTradeOperation(tradeOperationId)
      );

      setNegotiations(response.data.data || []);

      if (showToast) {
        toast.success('Negotiations refreshed', {
          description: `Found ${response.data.data?.length || 0} negotiation(s)`,
        });
      }
    } catch (err: unknown) {
      console.error('Error fetching negotiations:', err);
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const errorMsg = axiosErr.response?.data?.message || 'Failed to fetch negotiations';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNegotiations();
  }, [tradeOperationId]);

  // Get status badge styling
  const getStatusBadgeStyle = (status: NegotiationStatus) => {
    switch (status) {
      case NegotiationStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200';
      case NegotiationStatus.ACCEPTED:
        return 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200';
      case NegotiationStatus.REJECTED:
        return 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200';
      case NegotiationStatus.COUNTERED:
        return 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200';
      case NegotiationStatus.EXPIRED:
        return 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200';
      case NegotiationStatus.WITHDRAWN:
        return 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Get status icon
  const getStatusIcon = (status: NegotiationStatus) => {
    switch (status) {
      case NegotiationStatus.PENDING:
        return <Clock className="w-4 h-4" />;
      case NegotiationStatus.ACCEPTED:
        return <CheckCircle2 className="w-4 h-4" />;
      case NegotiationStatus.REJECTED:
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  // Check if expired
  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  // Accept a counter-offer
  const handleAcceptCounter = async (negotiationId: string) => {
    try {
      setAcceptingId(negotiationId);
      await api.post(`/negotiations/${negotiationId}/accept`, {});
      toast.success('Counter-offer accepted successfully');
      fetchNegotiations();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr.response?.data?.message || 'Failed to accept counter-offer';
      toast.error(msg);
    } finally {
      setAcceptingId(null);
    }
  };

  // Calculate summary statistics
  const summary = {
    total: negotiations.length,
    pending: negotiations.filter(n => n.status === NegotiationStatus.PENDING).length,
    accepted: negotiations.filter(n => n.status === NegotiationStatus.ACCEPTED).length,
    rejected: negotiations.filter(n => n.status === NegotiationStatus.REJECTED).length,
    countered: negotiations.filter(n => n.status === NegotiationStatus.COUNTERED).length,
  };

  if (loading && negotiations.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-gray-600">Loading negotiations...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Negotiations Details</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Trade Operation: <code className="text-xs bg-gray-100 px-2 py-1 rounded">{tradeOperationId.substring(0, 8)}...</code>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => fetchNegotiations(true)}
              disabled={refreshing}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            {onClose && (
              <Button onClick={onClose} variant="secondary" size="sm">
                Close
              </Button>
            )}
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

        {/* Summary Statistics */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          <Card className="bg-gray-50">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-gray-800">{summary.total}</p>
              <p className="text-xs text-gray-600 mt-1">Total</p>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-yellow-800">{summary.pending}</p>
              <p className="text-xs text-yellow-700 mt-1">Pending</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-green-800">{summary.accepted}</p>
              <p className="text-xs text-green-700 mt-1">Accepted</p>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-red-800">{summary.rejected}</p>
              <p className="text-xs text-red-700 mt-1">Rejected</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-blue-800">{summary.countered}</p>
              <p className="text-xs text-blue-700 mt-1">Countered</p>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-6" />

        {/* Negotiations List */}
        {negotiations.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600 text-lg font-semibold">No negotiations found</p>
            <p className="text-gray-500 text-sm mt-2">Negotiations will appear here once created</p>
          </div>
        ) : (
          <div className="space-y-4">
            {negotiations.map((negotiation) => (
              <Card key={negotiation.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <Badge className={getStatusBadgeStyle(negotiation.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(negotiation.status)}
                            {negotiation.status}
                          </span>
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {negotiation.type}
                        </Badge>
                        {isExpired(negotiation.expiresAt) && negotiation.status === NegotiationStatus.PENDING && (
                          <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                            EXPIRED
                          </Badge>
                        )}
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 text-xs mb-1">Offered Price</p>
                          <p className="font-semibold text-lg">€{negotiation.offeredPrice.toFixed(2)}/t</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-xs mb-1">Offered Quantity</p>
                          <p className="font-semibold text-lg">{negotiation.offeredQuantity}t</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-xs mb-1">Total Value</p>
                          <p className="font-semibold">
                            €{(negotiation.offeredPrice * negotiation.offeredQuantity).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-xs mb-1">Created</p>
                          <p className="font-medium">{formatRelativeTime(negotiation.createdAt)}</p>
                        </div>
                      </div>

                      {/* Terms */}
                      {negotiation.terms && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Terms</p>
                          <p className="text-sm text-gray-800">{negotiation.terms}</p>
                        </div>
                      )}

                      {/* Timestamps */}
                      <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
                        <div>
                          <span className="font-semibold">Expires:</span>{' '}
                          {new Date(negotiation.expiresAt).toLocaleString()}
                        </div>
                        {negotiation.respondedAt && (
                          <div>
                            <span className="font-semibold">Responded:</span>{' '}
                            {new Date(negotiation.respondedAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="ml-4 flex flex-col items-end gap-2">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded block">
                        {negotiation.id.substring(0, 8)}...
                      </code>
                      {negotiation.status === NegotiationStatus.COUNTERED && (
                        <Button
                          size="sm"
                          variant="default"
                          className="gap-1 bg-green-600 hover:bg-green-700"
                          disabled={acceptingId === negotiation.id}
                          onClick={() => handleAcceptCounter(negotiation.id)}
                        >
                          {acceptingId === negotiation.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <ThumbsUp className="w-3 h-3" />
                          )}
                          Accept Counter
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NegotiationsDetailPanel;
