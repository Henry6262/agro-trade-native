import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  TrendingUp,
  MessageSquare,
  Send,
  Eye,
  Timer,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react-native';
import { tradeOperationService } from '@services/tradeOperationService';
import { negotiationService } from '@services/negotiationService';

interface Negotiation {
  id: string;
  tradeSellerId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED' | 'EXPIRED' | 'WITHDRAWN';
  currentOffer: {
    price: number;
    quantity: number;
    terms?: string;
  };
  counterOffer?: {
    price: number;
    quantity: number;
    terms?: string;
    reason?: string;
  };
  expiresAt: string;
  hoursUntilExpiry?: number;
  isExpiringSoon?: boolean;
  tradeSeller: {
    id: string;
    seller: {
      id: string;
      name: string;
      email: string;
    };
  };
  profitImpact?: {
    estimatedProfit: number;
    profitMargin: number;
    warning?: string;
  };
}

interface TradeOperation {
  id: string;
  operationNumber: string;
  status: string;
  phase: string;
  buyListing?: any;
  sellers?: any[];
  profitMargin?: number;
  estimatedProfit?: number;
  createdAt: string;
  negotiations?: Negotiation[];
  negotiationSummary?: {
    total: number;
    pending: number;
    countered: number;
    accepted: number;
    rejected: number;
    expired: number;
    withdrawn: number;
  };
}

interface Props {
  onSelectOperation: (operation: TradeOperation) => void;
  onSendOffer: (tradeOperationId: string, tradeSellerId: string) => void;
  onCounterOffer: (negotiationId: string) => void;
}

export const ActiveOperationsTab: React.FC<Props> = ({
  onSelectOperation,
  onSendOffer,
  onCounterOffer,
}) => {
  const [operations, setOperations] = useState<TradeOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedOperations, setExpandedOperations] = useState<Set<string>>(new Set());

  const loadOperations = async () => {
    try {
      const ops = await tradeOperationService.getTradeOperations('ACTIVE');

      // Load negotiations for each operation
      const opsWithNegotiations = await Promise.all(
        ops.map(async (op) => {
          try {
            const negotiations = await negotiationService.getNegotiations(op.id);
            return {
              ...op,
              negotiations: negotiations.negotiations,
              negotiationSummary: negotiations.summary,
            };
          } catch (error) {
            console.error(`Failed to load negotiations for ${op.id}:`, error);
            return op;
          }
        })
      );

      setOperations(opsWithNegotiations);
    } catch (error) {
      console.error('Failed to load operations:', error);
      Alert.alert('Error', 'Failed to load active operations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOperations();
    // Set up polling for updates every 30 seconds
    const interval = setInterval(loadOperations, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleExpanded = (operationId: string) => {
    setExpandedOperations((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(operationId)) {
        newSet.delete(operationId);
      } else {
        newSet.add(operationId);
      }
      return newSet;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock };
      case 'ACCEPTED':
        return { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle };
      case 'REJECTED':
        return { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle };
      case 'COUNTERED':
        return { bg: 'bg-blue-100', text: 'text-blue-800', icon: MessageSquare };
      case 'EXPIRED':
        return { bg: 'bg-gray-100', text: 'text-gray-800', icon: Timer };
      case 'WITHDRAWN':
        return { bg: 'bg-gray-100', text: 'text-gray-600', icon: XCircle };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', icon: Package };
    }
  };

  const renderNegotiationItem = (negotiation: Negotiation, operation: TradeOperation) => {
    const status = getStatusColor(negotiation.status);
    const StatusIcon = status.icon;

    return (
      <View key={negotiation.id} className="bg-white rounded-lg p-3 mb-2 border border-gray-200">
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <View className="flex-row items-center mb-1">
              <Text className="font-semibold text-gray-800">
                {negotiation.tradeSeller.seller.name}
              </Text>
              <View className={`ml-2 px-2 py-0.5 rounded-full ${status.bg}`}>
                <Text className={`text-xs font-medium ${status.text}`}>{negotiation.status}</Text>
              </View>
            </View>

            <View className="flex-row items-center space-x-4">
              <Text className="text-sm text-gray-600">
                €{negotiation.currentOffer.price}/unit × {negotiation.currentOffer.quantity} units
              </Text>
              {negotiation.counterOffer && (
                <View className="flex-row items-center">
                  <ArrowUpRight size={14} color="#EF4444" />
                  <Text className="text-sm text-red-600 ml-1">
                    €{negotiation.counterOffer.price}
                  </Text>
                </View>
              )}
            </View>

            {negotiation.isExpiringSoon && (
              <View className="flex-row items-center mt-1">
                <AlertTriangle size={14} color="#F59E0B" />
                <Text className="text-xs text-amber-600 ml-1">
                  Expires in {Math.floor(negotiation.hoursUntilExpiry || 0)}h
                </Text>
              </View>
            )}

            {negotiation.profitImpact && (
              <View className="flex-row items-center mt-1">
                <TrendingUp
                  size={14}
                  color={negotiation.profitImpact.profitMargin >= 5 ? '#10B981' : '#EF4444'}
                />
                <Text
                  className={`text-xs ml-1 ${
                    negotiation.profitImpact.profitMargin >= 5 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  Margin: {negotiation.profitImpact.profitMargin.toFixed(1)}%
                  {negotiation.profitImpact.warning && ' ⚠️'}
                </Text>
              </View>
            )}
          </View>

          <View className="flex-row items-center space-x-2">
            {negotiation.status === 'COUNTERED' && (
              <TouchableOpacity
                onPress={() => onCounterOffer(negotiation.id)}
                className="px-3 py-1.5 bg-blue-600 rounded-lg"
              >
                <Text className="text-white text-xs font-medium">Respond</Text>
              </TouchableOpacity>
            )}
            {negotiation.status === 'PENDING' && negotiation.isExpiringSoon && (
              <TouchableOpacity
                onPress={() => Alert.alert('Follow Up', 'Send reminder to seller?')}
                className="px-3 py-1.5 bg-amber-600 rounded-lg"
              >
                <Text className="text-white text-xs font-medium">Follow Up</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderOperation = (operation: TradeOperation) => {
    const isExpanded = expandedOperations.has(operation.id);
    const summary = operation.negotiationSummary;
    const hasUrgentItems = operation.negotiations?.some(
      (n) => n.isExpiringSoon || n.status === 'COUNTERED'
    );

    return (
      <TouchableOpacity
        key={operation.id}
        onPress={() => toggleExpanded(operation.id)}
        className="bg-white rounded-lg p-4 mb-3 border border-gray-200"
      >
        {/* Header */}
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className="text-lg font-bold text-gray-800">{operation.operationNumber}</Text>
              {hasUrgentItems && (
                <View className="ml-2 px-2 py-0.5 bg-amber-100 rounded-full">
                  <Text className="text-xs font-medium text-amber-800">Action Required</Text>
                </View>
              )}
            </View>
            <Text className="text-gray-600 text-sm mt-1">
              {operation.buyListing?.product?.name || 'Product'} -{' '}
              {operation.buyListing?.quantity || 0} units
            </Text>
          </View>

          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onSelectOperation(operation);
            }}
            className="p-2"
          >
            <Eye size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Negotiation Summary */}
        {summary && (
          <View className="bg-gray-50 rounded-lg p-3 mb-3">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Negotiation Status</Text>
            <View className="flex-row flex-wrap">
              {summary.pending > 0 && (
                <View className="flex-row items-center mr-4 mb-1">
                  <Clock size={14} color="#F59E0B" />
                  <Text className="text-xs text-gray-600 ml-1">{summary.pending} Pending</Text>
                </View>
              )}
              {summary.countered > 0 && (
                <View className="flex-row items-center mr-4 mb-1">
                  <MessageSquare size={14} color="#3B82F6" />
                  <Text className="text-xs text-gray-600 ml-1">{summary.countered} Countered</Text>
                </View>
              )}
              {summary.accepted > 0 && (
                <View className="flex-row items-center mr-4 mb-1">
                  <CheckCircle size={14} color="#10B981" />
                  <Text className="text-xs text-gray-600 ml-1">{summary.accepted} Accepted</Text>
                </View>
              )}
              {summary.rejected > 0 && (
                <View className="flex-row items-center mr-4 mb-1">
                  <XCircle size={14} color="#EF4444" />
                  <Text className="text-xs text-gray-600 ml-1">{summary.rejected} Rejected</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Profit Metrics */}
        <View className="flex-row justify-between items-center mb-2">
          <View className="flex-row items-center">
            <TrendingUp size={16} color="#6B7280" />
            <Text className="text-sm text-gray-600 ml-2">
              Target Margin: {operation.profitMargin || 0}%
            </Text>
          </View>
          {operation.estimatedProfit && (
            <Text
              className={`text-sm font-semibold ${
                operation.estimatedProfit > 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              €{operation.estimatedProfit.toFixed(0)}
            </Text>
          )}
        </View>

        {/* Verification Status */}
        {operation.sellers && operation.sellers.length > 0 && (
          <View className="flex-row items-center mb-2">
            <CheckCircle size={14} color="#16A34A" />
            <Text className="text-xs text-gray-600 ml-1">
              {operation.sellers.filter((s) => s.isVerified).length}/{operation.sellers.length}{' '}
              sellers verified
            </Text>
          </View>
        )}

        {/* Sellers without negotiations */}
        {operation.sellers?.filter(
          (s) => !operation.negotiations?.find((n) => n.tradeSellerId === s.id)
        )?.length > 0 && (
          <View className="bg-blue-50 rounded-lg p-2 mb-2">
            <Text className="text-xs text-blue-800 font-medium">
              {
                operation.sellers.filter(
                  (s) => !operation.negotiations?.find((n) => n.tradeSellerId === s.id)
                ).length
              }{' '}
              sellers awaiting offers
            </Text>
            <TouchableOpacity
              onPress={() => {
                const sellersWithoutOffers =
                  operation.sellers?.filter(
                    (s) => !operation.negotiations?.find((n) => n.tradeSellerId === s.id)
                  ) || [];
                if (sellersWithoutOffers.length > 0) {
                  onSendOffer(operation.id, sellersWithoutOffers[0].id);
                }
              }}
              className="mt-1 flex-row items-center"
            >
              <Send size={14} color="#2563EB" />
              <Text className="text-xs text-blue-600 ml-1 font-medium">Send Offers</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Expanded Negotiations List */}
        {isExpanded && operation.negotiations && operation.negotiations.length > 0 && (
          <View className="mt-3 pt-3 border-t border-gray-200">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Active Negotiations</Text>
            {operation.negotiations.map((negotiation) =>
              renderNegotiationItem(negotiation, operation)
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-gray-600 mt-2">Loading active operations...</Text>
      </View>
    );
  }

  if (operations.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 p-8">
        <Package size={64} color="#9CA3AF" />
        <Text className="text-gray-600 text-lg font-semibold mt-4">No Active Operations</Text>
        <Text className="text-gray-500 text-center mt-2">
          Create a new trade operation to start managing negotiations
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadOperations();
          }}
        />
      }
    >
      <View className="p-4">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold text-gray-800">Active Trade Operations</Text>
          <View className="flex-row items-center space-x-2">
            <View className="px-3 py-1 bg-blue-100 rounded-full">
              <Text className="text-blue-600 text-sm font-medium">{operations.length} Active</Text>
            </View>
          </View>
        </View>

        {operations.map(renderOperation)}
      </View>
    </ScrollView>
  );
};
