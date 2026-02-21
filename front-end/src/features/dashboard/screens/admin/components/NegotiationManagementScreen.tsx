import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  ArrowLeft,
  Users,
  Package,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Send,
  AlertTriangle,
  TrendingUp,
  MoreVertical,
  Timer,
  RefreshCw,
} from 'lucide-react-native';
import { negotiationService } from '@services/negotiationService';
import { tradeOperationService } from '@services/tradeOperationService';

interface Props {
  tradeOperationId: string;
  onBack: () => void;
  onCounterOffer: (negotiationId: string, currentOffer: any) => void;
}

interface NegotiationDetails {
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
      phone?: string;
    };
    saleListing?: {
      id: string;
      quantity: number;
      askingPrice: number;
      location?: string;
    };
  };
  profitImpact?: {
    estimatedProfit: number;
    profitMargin: number;
    warning?: string;
  };
  offerHistory?: any[];
}

interface TradeOperationDetails {
  id: string;
  operationNumber: string;
  status: string;
  phase: string;
  buyListing?: {
    product: {
      name: string;
      category: string;
    };
    quantity: number;
    unit: string;
    maxPricePerUnit: number;
    buyer: {
      name: string;
    };
  };
  targetProfitMargin: number;
  estimatedProfit?: number;
  profitMargin?: number;
}

export const NegotiationManagementScreen: React.FC<Props> = ({
  tradeOperationId,
  onBack,
  onCounterOffer,
}) => {
  const [negotiations, setNegotiations] = useState<NegotiationDetails[]>([]);
  const [tradeOperation, setTradeOperation] = useState<TradeOperationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [expandedNegotiations, setExpandedNegotiations] = useState<Set<string>>(new Set());
  const [summary, setSummary] = useState<any>(null);

  const loadNegotiations = async () => {
    try {
      // Load trade operation details
      const opDetails = await tradeOperationService.getTradeOperation(tradeOperationId);
      setTradeOperation(opDetails as any);

      // Load negotiations with summary
      const response = await negotiationService.getNegotiations(
        tradeOperationId,
        selectedStatus || undefined
      );

      setNegotiations(response.negotiations || []);
      setSummary(response.summary);
    } catch (error) {
      console.error('Failed to load negotiations:', error);
      Alert.alert('Error', 'Failed to load negotiation details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNegotiations();
    // Refresh every 30 seconds
    const interval = setInterval(loadNegotiations, 30000);
    return () => clearInterval(interval);
  }, [tradeOperationId, selectedStatus]);

  const handleAccept = async (negotiationId: string) => {
    Alert.alert('Accept Offer', 'Are you sure you want to accept this offer?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Accept',
        onPress: async () => {
          try {
            await negotiationService.acceptOffer(negotiationId);
            Alert.alert('Success', 'Offer accepted successfully');
            loadNegotiations();
          } catch (error) {
            Alert.alert('Error', 'Failed to accept offer');
          }
        },
      },
    ]);
  };

  const handleReject = async (negotiationId: string) => {
    Alert.alert('Reject Offer', 'Are you sure you want to reject this offer?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            await negotiationService.rejectOffer(negotiationId, 'Price not acceptable');
            Alert.alert('Success', 'Offer rejected');
            loadNegotiations();
          } catch (error) {
            Alert.alert('Error', 'Failed to reject offer');
          }
        },
      },
    ]);
  };

  const handleWithdraw = async (negotiationId: string) => {
    Alert.alert('Withdraw Offer', 'Are you sure you want to withdraw this offer?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Withdraw',
        style: 'destructive',
        onPress: async () => {
          try {
            await negotiationService.withdrawOffer(negotiationId, 'Strategic decision');
            Alert.alert('Success', 'Offer withdrawn');
            loadNegotiations();
          } catch (error) {
            Alert.alert('Error', 'Failed to withdraw offer');
          }
        },
      },
    ]);
  };

  const handleExtendExpiry = async (negotiationId: string) => {
    Alert.alert('Extend Expiry', 'Extend offer expiration by 24 hours?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Extend',
        onPress: async () => {
          try {
            await negotiationService.extendExpiry(
              negotiationId,
              24,
              'More time needed for decision'
            );
            Alert.alert('Success', 'Expiry extended by 24 hours');
            loadNegotiations();
          } catch (error) {
            Alert.alert('Error', 'Failed to extend expiry');
          }
        },
      },
    ]);
  };

  const toggleExpanded = (negotiationId: string) => {
    setExpandedNegotiations((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(negotiationId)) {
        newSet.delete(negotiationId);
      } else {
        newSet.add(negotiationId);
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

  const renderNegotiation = (negotiation: NegotiationDetails) => {
    const isExpanded = expandedNegotiations.has(negotiation.id);
    const status = getStatusColor(negotiation.status);
    const StatusIcon = status.icon;

    return (
      <TouchableOpacity
        key={negotiation.id}
        onPress={() => toggleExpanded(negotiation.id)}
        className="bg-white rounded-lg p-4 mb-3 border border-gray-200"
      >
        {/* Header */}
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-800">
              {negotiation.tradeSeller.seller.name}
            </Text>
            <View className="flex-row items-center mt-1">
              <View className={`px-2 py-0.5 rounded-full ${status.bg}`}>
                <Text className={`text-xs font-medium ${status.text}`}>{negotiation.status}</Text>
              </View>
              {negotiation.isExpiringSoon && (
                <View className="ml-2 flex-row items-center">
                  <AlertTriangle size={12} color="#F59E0B" />
                  <Text className="text-xs text-amber-600 ml-1">
                    Expires in {Math.floor(negotiation.hoursUntilExpiry || 0)}h
                  </Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity className="p-1">
            <MoreVertical size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Current Offer */}
        <View className="bg-gray-50 rounded-lg p-3 mb-2">
          <Text className="text-sm font-semibold text-gray-700 mb-2">Current Offer</Text>
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center">
              <DollarSign size={16} color="#6B7280" />
              <Text className="text-gray-800 ml-1">€{negotiation.currentOffer.price}/unit</Text>
            </View>
            <View className="flex-row items-center">
              <Package size={16} color="#6B7280" />
              <Text className="text-gray-800 ml-1">{negotiation.currentOffer.quantity} units</Text>
            </View>
          </View>
        </View>

        {/* Counter Offer if exists */}
        {negotiation.counterOffer && (
          <View className="bg-blue-50 rounded-lg p-3 mb-2">
            <Text className="text-sm font-semibold text-blue-800 mb-2">Counter Offer</Text>
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <DollarSign size={16} color="#2563EB" />
                <Text className="text-blue-800 ml-1">€{negotiation.counterOffer.price}/unit</Text>
              </View>
              <View className="flex-row items-center">
                <Package size={16} color="#2563EB" />
                <Text className="text-blue-800 ml-1">
                  {negotiation.counterOffer.quantity} units
                </Text>
              </View>
            </View>
            {negotiation.counterOffer.reason && (
              <Text className="text-xs text-blue-600 mt-2">
                "{negotiation.counterOffer.reason}"
              </Text>
            )}
          </View>
        )}

        {/* Profit Impact */}
        {negotiation.profitImpact && (
          <View className="flex-row items-center mb-2">
            <TrendingUp
              size={16}
              color={negotiation.profitImpact.profitMargin >= 5 ? '#10B981' : '#EF4444'}
            />
            <Text
              className={`text-sm ml-2 ${
                negotiation.profitImpact.profitMargin >= 5 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              Profit Margin: {negotiation.profitImpact.profitMargin.toFixed(1)}%
              {negotiation.profitImpact.warning && ' ⚠️'}
            </Text>
          </View>
        )}

        {/* Expanded Details */}
        {isExpanded && (
          <View className="mt-3 pt-3 border-t border-gray-200">
            {/* Seller Details */}
            <View className="mb-3">
              <Text className="text-sm font-semibold text-gray-700 mb-1">Seller Details</Text>
              <Text className="text-xs text-gray-600">
                Email: {negotiation.tradeSeller.seller.email}
              </Text>
              {negotiation.tradeSeller.seller.phone && (
                <Text className="text-xs text-gray-600">
                  Phone: {negotiation.tradeSeller.seller.phone}
                </Text>
              )}
              {negotiation.tradeSeller.saleListing?.location && (
                <Text className="text-xs text-gray-600">
                  Location: {negotiation.tradeSeller.saleListing.location}
                </Text>
              )}
            </View>

            {/* Offer History */}
            {negotiation.offerHistory && negotiation.offerHistory.length > 0 && (
              <View className="mb-3">
                <Text className="text-sm font-semibold text-gray-700 mb-1">
                  Negotiation History ({negotiation.offerHistory.length} rounds)
                </Text>
                {negotiation.offerHistory.slice(-3).map((history, index) => (
                  <Text key={index} className="text-xs text-gray-600">
                    Round {index + 1}: €{history.price} - {history.status}
                  </Text>
                ))}
              </View>
            )}

            {/* Action Buttons */}
            <View className="flex-row flex-wrap gap-2">
              {negotiation.status === 'PENDING' && (
                <>
                  <TouchableOpacity
                    onPress={() => handleAccept(negotiation.id)}
                    className="px-3 py-2 bg-green-600 rounded-lg flex-row items-center"
                  >
                    <CheckCircle size={14} color="white" />
                    <Text className="text-white text-xs font-medium ml-1">Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleReject(negotiation.id)}
                    className="px-3 py-2 bg-red-600 rounded-lg flex-row items-center"
                  >
                    <XCircle size={14} color="white" />
                    <Text className="text-white text-xs font-medium ml-1">Reject</Text>
                  </TouchableOpacity>
                  {negotiation.isExpiringSoon && (
                    <TouchableOpacity
                      onPress={() => handleExtendExpiry(negotiation.id)}
                      className="px-3 py-2 bg-amber-600 rounded-lg flex-row items-center"
                    >
                      <Timer size={14} color="white" />
                      <Text className="text-white text-xs font-medium ml-1">Extend</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
              {negotiation.status === 'COUNTERED' && (
                <>
                  <TouchableOpacity
                    onPress={() => onCounterOffer(negotiation.id, negotiation.counterOffer)}
                    className="px-3 py-2 bg-blue-600 rounded-lg flex-row items-center"
                  >
                    <MessageSquare size={14} color="white" />
                    <Text className="text-white text-xs font-medium ml-1">Respond</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleAccept(negotiation.id)}
                    className="px-3 py-2 bg-green-600 rounded-lg flex-row items-center"
                  >
                    <CheckCircle size={14} color="white" />
                    <Text className="text-white text-xs font-medium ml-1">Accept Counter</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleReject(negotiation.id)}
                    className="px-3 py-2 bg-red-600 rounded-lg flex-row items-center"
                  >
                    <XCircle size={14} color="white" />
                    <Text className="text-white text-xs font-medium ml-1">Reject</Text>
                  </TouchableOpacity>
                </>
              )}
              {(negotiation.status === 'PENDING' || negotiation.status === 'COUNTERED') && (
                <TouchableOpacity
                  onPress={() => handleWithdraw(negotiation.id)}
                  className="px-3 py-2 bg-gray-600 rounded-lg flex-row items-center"
                >
                  <XCircle size={14} color="white" />
                  <Text className="text-white text-xs font-medium ml-1">Withdraw</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-gray-600 mt-2">Loading negotiations...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={onBack} className="p-2">
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          <View className="flex-1 ml-2">
            <Text className="text-xl font-bold text-gray-800">
              {tradeOperation?.operationNumber || 'Negotiations'}
            </Text>
            <Text className="text-sm text-gray-600">
              {tradeOperation?.buyListing?.product.name} - {tradeOperation?.buyListing?.quantity}{' '}
              {tradeOperation?.buyListing?.unit}
            </Text>
          </View>
        </View>
      </View>

      {/* Summary Cards */}
      {summary && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 py-3">
          <TouchableOpacity
            onPress={() => setSelectedStatus(null)}
            className={`px-4 py-2 rounded-lg mr-2 ${
              selectedStatus === null ? 'bg-blue-600' : 'bg-white border border-gray-200'
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                selectedStatus === null ? 'text-white' : 'text-gray-700'
              }`}
            >
              All ({summary.total || 0})
            </Text>
          </TouchableOpacity>
          {summary.pending > 0 && (
            <TouchableOpacity
              onPress={() => setSelectedStatus('PENDING')}
              className={`px-4 py-2 rounded-lg mr-2 ${
                selectedStatus === 'PENDING' ? 'bg-yellow-600' : 'bg-yellow-100'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  selectedStatus === 'PENDING' ? 'text-white' : 'text-yellow-800'
                }`}
              >
                Pending ({summary.pending})
              </Text>
            </TouchableOpacity>
          )}
          {summary.countered > 0 && (
            <TouchableOpacity
              onPress={() => setSelectedStatus('COUNTERED')}
              className={`px-4 py-2 rounded-lg mr-2 ${
                selectedStatus === 'COUNTERED' ? 'bg-blue-600' : 'bg-blue-100'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  selectedStatus === 'COUNTERED' ? 'text-white' : 'text-blue-800'
                }`}
              >
                Countered ({summary.countered})
              </Text>
            </TouchableOpacity>
          )}
          {summary.accepted > 0 && (
            <TouchableOpacity
              onPress={() => setSelectedStatus('ACCEPTED')}
              className={`px-4 py-2 rounded-lg mr-2 ${
                selectedStatus === 'ACCEPTED' ? 'bg-green-600' : 'bg-green-100'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  selectedStatus === 'ACCEPTED' ? 'text-white' : 'text-green-800'
                }`}
              >
                Accepted ({summary.accepted})
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {/* Profit Overview */}
      {tradeOperation && (
        <View className="mx-4 mb-3 p-3 bg-white rounded-lg border border-gray-200">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-sm text-gray-600">Target Margin</Text>
              <Text className="text-lg font-bold text-gray-800">
                {tradeOperation.targetProfitMargin}%
              </Text>
            </View>
            <View>
              <Text className="text-sm text-gray-600">Current Margin</Text>
              <Text
                className={`text-lg font-bold ${
                  (tradeOperation.profitMargin || 0) >= 5 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {tradeOperation.profitMargin?.toFixed(1) || '0.0'}%
              </Text>
            </View>
            <View>
              <Text className="text-sm text-gray-600">Est. Profit</Text>
              <Text
                className={`text-lg font-bold ${
                  (tradeOperation.estimatedProfit || 0) > 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                €{tradeOperation.estimatedProfit?.toFixed(0) || '0'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Negotiations List */}
      <ScrollView
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadNegotiations();
            }}
          />
        }
      >
        {negotiations.length === 0 ? (
          <View className="flex-1 justify-center items-center py-8">
            <Users size={48} color="#9CA3AF" />
            <Text className="text-gray-600 text-lg font-semibold mt-4">No Negotiations Yet</Text>
            <Text className="text-gray-500 text-center mt-2">
              Send offers to sellers to start negotiations
            </Text>
          </View>
        ) : (
          negotiations.map((negotiation) => renderNegotiation(negotiation))
        )}
      </ScrollView>
    </View>
  );
};
