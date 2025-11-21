import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  X,
  ChevronRight,
  Package,
  Users,
  Truck,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  TrendingUp,
  MapPin,
  Calendar,
  ArrowRight,
  RefreshCw,
  FileText,
} from 'lucide-react-native';
import {
  TradeOperation,
  TradePhase,
  TradeStatus,
  TradeSeller,
  TimelineEvent,
} from '../../../../../types/trade-operations';
import { tradeOperationService } from '@services/tradeOperationService';
import { negotiationService, Negotiation } from '@services/negotiationService';
import { inspectionService, InspectionRequest } from '@services/inspectionService';

interface TradeOperationDetailDrawerProps {
  visible: boolean;
  operationId: string | null;
  onClose: () => void;
  onRefresh?: () => void;
}

export const TradeOperationDetailDrawer: React.FC<TradeOperationDetailDrawerProps> = ({
  visible,
  operationId,
  onClose,
  onRefresh,
}) => {
  const [operation, setOperation] = useState<TradeOperation | null>(null);
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [inspections, setInspections] = useState<InspectionRequest[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'sellers' | 'negotiations' | 'timeline'>(
    'overview'
  );

  // Fetch operation details
  const fetchOperationDetails = async (showLoader = true) => {
    if (!operationId) return;

    if (showLoader) setIsLoading(true);
    try {
      // Fetch main operation data
      const operationData = await tradeOperationService.getTradeOperation(operationId);
      setOperation(operationData);

      // Fetch negotiations
      const negotiationsData = await negotiationService.getTradeNegotiations(operationId);
      setNegotiations(negotiationsData);

      // Fetch inspections
      const inspectionsData = await inspectionService.getInspectionsByTradeOperation(operationId);
      setInspections(inspectionsData);

      // TODO: Fetch timeline events
      // const timelineData = await tradeOperationService.getTimeline(operationId);
      // setTimeline(timelineData);
    } catch (error) {
      console.error('Error fetching operation details:', error);
      Alert.alert('Error', 'Failed to load operation details');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (visible && operationId) {
      fetchOperationDetails();
      // Set up polling for real-time updates
      const interval = setInterval(() => {
        fetchOperationDetails(false);
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(interval);
    }
  }, [visible, operationId]);

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchOperationDetails(false);
  };

  // Handle phase transition
  const handlePhaseTransition = async (nextPhase: TradePhase) => {
    if (!operation) return;

    Alert.alert(
      'Confirm Phase Change',
      `Move to ${nextPhase.replace('_', ' ').toLowerCase()} phase?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await tradeOperationService.updateTradeOperation(operation.id, {
                phase: nextPhase,
              });
              await fetchOperationDetails();
              Alert.alert('Success', 'Phase updated successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to update phase');
            }
          },
        },
      ]
    );
  };

  // Get phase color
  const getPhaseColor = (phase: TradePhase) => {
    switch (phase) {
      case TradePhase.COMPLETED:
        return 'text-green-600';
      case TradePhase.CANCELLED:
        return 'text-red-600';
      case TradePhase.IN_PROGRESS:
      case TradePhase.TRANSPORT_MATCHING:
        return 'text-blue-600';
      default:
        return 'text-orange-600';
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: TradeStatus) => {
    switch (status) {
      case TradeStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case TradeStatus.PAUSED:
        return 'bg-yellow-100 text-yellow-800';
      case TradeStatus.COMPLETED:
        return 'bg-blue-100 text-blue-800';
      case TradeStatus.CANCELLED:
      case TradeStatus.FAILED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Render tabs
  const renderTabs = () => (
    <View className="flex-row border-b border-gray-200">
      {(['overview', 'sellers', 'negotiations', 'timeline'] as const).map((tab) => (
        <TouchableOpacity
          key={tab}
          onPress={() => setActiveTab(tab)}
          className={`flex-1 py-3 ${activeTab === tab ? 'border-b-2 border-blue-500' : ''}`}
        >
          <Text
            className={`text-center text-sm font-semibold ${
              activeTab === tab ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Render overview tab
  const renderOverview = () => {
    if (!operation) return null;

    return (
      <ScrollView className="flex-1 p-4">
        {/* Operation Info */}
        <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
          <View className="flex-row justify-between items-start mb-3">
            <View>
              <Text className="text-lg font-bold text-gray-800">{operation.operationNumber}</Text>
              <Text className="text-sm text-gray-600 mt-1">
                Created {new Date(operation.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <View className={`px-3 py-1 rounded-full ${getStatusBadgeColor(operation.status)}`}>
              <Text className="text-xs font-semibold">{operation.status}</Text>
            </View>
          </View>

          <View className="flex-row items-center mb-2">
            <Clock size={14} color="#6B7280" />
            <Text className={`ml-2 font-semibold ${getPhaseColor(operation.phase)}`}>
              {operation.phase.replace(/_/g, ' ')}
            </Text>
          </View>
        </View>

        {/* Buyer Info */}
        {operation.buyListing && (
          <View className="bg-blue-50 rounded-lg p-4 mb-4">
            <Text className="text-blue-800 font-bold mb-2">Buyer Details</Text>
            <View className="space-y-1">
              <Text className="text-blue-700">
                {operation.buyListing.buyer?.name || 'Unknown Buyer'}
              </Text>
              <Text className="text-blue-600 text-sm">
                Product: {operation.buyListing.product?.name}
              </Text>
              <Text className="text-blue-600 text-sm">
                Quantity: {operation.buyListing.quantity} {operation.buyListing.unit}
              </Text>
              <Text className="text-blue-600 text-sm">
                Max Price: €{operation.buyListing.maxPricePerUnit}/unit
              </Text>
            </View>
          </View>
        )}

        {/* Profit Summary */}
        {(operation.estimatedProfit !== undefined || operation.profitMargin !== undefined) && (
          <View className="bg-green-50 rounded-lg p-4 mb-4">
            <View className="flex-row items-center mb-2">
              <TrendingUp size={18} color="#16A34A" />
              <Text className="text-green-800 font-bold ml-2">Profit Analysis</Text>
            </View>
            <View className="space-y-1">
              {operation.estimatedProfit !== undefined && (
                <Text className="text-green-700">
                  Estimated Profit: €{operation.estimatedProfit.toFixed(2)}
                </Text>
              )}
              {operation.profitMargin !== undefined && (
                <Text className="text-green-700">
                  Profit Margin: {operation.profitMargin.toFixed(1)}%
                </Text>
              )}
              {operation.totalPurchaseCost !== undefined && (
                <Text className="text-green-600 text-sm">
                  Purchase Cost: €{operation.totalPurchaseCost.toFixed(2)}
                </Text>
              )}
              {operation.estimatedTransportCost !== undefined && (
                <Text className="text-green-600 text-sm">
                  Transport Cost: €{operation.estimatedTransportCost.toFixed(2)}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Inspection Status */}
        {inspections.length > 0 && (
          <View className="bg-yellow-50 rounded-lg p-4 mb-4">
            <View className="flex-row items-center mb-2">
              <CheckCircle size={18} color="#EAB308" />
              <Text className="text-yellow-800 font-bold ml-2">Quality Inspections</Text>
            </View>
            <View className="space-y-2">
              {inspections.map((inspection) => (
                <View key={inspection.id} className="flex-row justify-between items-center">
                  <Text className="text-yellow-700 text-sm">
                    {inspection.saleListing?.seller?.name || 'Seller'}
                  </Text>
                  <View
                    className={`px-2 py-1 rounded ${
                      inspection.status === 'COMPLETED'
                        ? 'bg-green-100'
                        : inspection.status === 'IN_PROGRESS'
                          ? 'bg-blue-100'
                          : inspection.status === 'SCHEDULED'
                            ? 'bg-purple-100'
                            : 'bg-yellow-100'
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        inspection.status === 'COMPLETED'
                          ? 'text-green-800'
                          : inspection.status === 'IN_PROGRESS'
                            ? 'text-blue-800'
                            : inspection.status === 'SCHEDULED'
                              ? 'text-purple-800'
                              : 'text-yellow-800'
                      }`}
                    >
                      {inspection.status}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
            <TouchableOpacity
              onPress={async () => {
                if (!operation) return;
                const unverifiedSellers = operation.sellers.filter(
                  (s) => s.status === 'ACCEPTED' && !s.isVerified
                );
                if (unverifiedSellers.length === 0) {
                  Alert.alert('Info', 'All accepted sellers already have inspection requests');
                  return;
                }

                try {
                  const saleListingIds = unverifiedSellers.map((s) => s.saleListingId);
                  await inspectionService.requestInspectionsForTrade(
                    operation.id,
                    saleListingIds,
                    'MEDIUM'
                  );
                  Alert.alert(
                    'Success',
                    `Requested inspections for ${unverifiedSellers.length} sellers`
                  );
                  fetchOperationDetails();
                } catch (error) {
                  Alert.alert('Error', 'Failed to request inspections');
                }
              }}
              className="mt-3 bg-yellow-500 py-2 rounded flex-row items-center justify-center"
            >
              <CheckCircle size={14} color="white" />
              <Text className="text-white text-sm font-medium ml-1">Request All Inspections</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Action Buttons */}
        <View className="space-y-3">
          {operation.phase === TradePhase.SELLER_NEGOTIATION && (
            <TouchableOpacity
              onPress={() => handlePhaseTransition(TradePhase.TRANSPORT_MATCHING)}
              className="bg-blue-500 py-3 rounded-lg flex-row items-center justify-center"
            >
              <Truck size={18} color="white" />
              <Text className="text-white font-semibold ml-2">Proceed to Transport</Text>
            </TouchableOpacity>
          )}

          {operation.phase === TradePhase.TRANSPORT_MATCHING && (
            <TouchableOpacity
              onPress={() => Alert.alert('Info', 'Transport bidding in progress')}
              className="bg-orange-500 py-3 rounded-lg flex-row items-center justify-center"
            >
              <Clock size={18} color="white" />
              <Text className="text-white font-semibold ml-2">Awaiting Transport Bids</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  };

  // Render sellers tab
  const renderSellers = () => {
    if (!operation?.sellers) return null;

    return (
      <ScrollView className="flex-1 p-4">
        {operation.sellers.map((seller) => (
          <View key={seller.id} className="bg-white rounded-lg p-4 mb-3 border border-gray-200">
            <View className="flex-row justify-between items-start mb-2">
              <Text className="font-semibold text-gray-800">
                {seller.seller?.name || `Seller ${seller.sellerId.slice(-4)}`}
              </Text>
              <View
                className={`px-2 py-1 rounded ${
                  seller.status === 'ACCEPTED'
                    ? 'bg-green-100'
                    : seller.status === 'REJECTED'
                      ? 'bg-red-100'
                      : 'bg-yellow-100'
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    seller.status === 'ACCEPTED'
                      ? 'text-green-800'
                      : seller.status === 'REJECTED'
                        ? 'text-red-800'
                        : 'text-yellow-800'
                  }`}
                >
                  {seller.status}
                </Text>
              </View>
            </View>

            <View className="space-y-1">
              <Text className="text-gray-600 text-sm">
                Quantity: {seller.requestedQuantity} {seller.unit}
              </Text>
              {seller.finalPrice && (
                <Text className="text-green-600 font-semibold">
                  Agreed Price: €{seller.finalPrice}/unit
                </Text>
              )}
              {seller.isVerified && (
                <View className="flex-row items-center mt-1">
                  <CheckCircle size={14} color="#16A34A" />
                  <Text className="text-green-600 text-sm ml-1">Verified</Text>
                </View>
              )}
            </View>

            <View className="flex-row space-x-2 mt-3">
              {seller.status === 'INVITED' && (
                <TouchableOpacity
                  onPress={() => Alert.alert('Info', 'Opening negotiation modal...')}
                  className="flex-1 bg-blue-500 py-2 rounded flex-row items-center justify-center"
                >
                  <MessageSquare size={14} color="white" />
                  <Text className="text-white text-sm font-medium ml-1">Send Offer</Text>
                </TouchableOpacity>
              )}

              {seller.status === 'ACCEPTED' && !seller.isVerified && (
                <TouchableOpacity
                  onPress={async () => {
                    try {
                      await inspectionService.createInspectionRequest({
                        tradeOperationId: operation!.id,
                        saleListingId: seller.saleListingId,
                        priority: 'MEDIUM',
                        notes: `Inspection requested for ${seller.seller?.name}`,
                      });
                      Alert.alert('Success', 'Inspection requested successfully');
                      fetchOperationDetails();
                    } catch (error) {
                      Alert.alert('Error', 'Failed to request inspection');
                    }
                  }}
                  className="flex-1 bg-green-500 py-2 rounded flex-row items-center justify-center"
                >
                  <CheckCircle size={14} color="white" />
                  <Text className="text-white text-sm font-medium ml-1">Request Inspection</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {operation.sellers.length === 0 && (
          <View className="py-8 items-center">
            <Users size={48} color="#9CA3AF" />
            <Text className="text-gray-500 mt-3">No sellers added yet</Text>
          </View>
        )}
      </ScrollView>
    );
  };

  // Render negotiations tab
  const renderNegotiations = () => {
    return (
      <ScrollView className="flex-1 p-4">
        {negotiations.map((negotiation) => (
          <View
            key={negotiation.id}
            className="bg-white rounded-lg p-4 mb-3 border border-gray-200"
          >
            <View className="flex-row justify-between items-start mb-2">
              <Text className="font-semibold text-gray-800">
                {negotiation.type === 'BUYER_OFFER' ? 'Buyer' : 'Seller'} Negotiation
              </Text>
              <View
                className={`px-2 py-1 rounded ${
                  negotiation.status === 'ACCEPTED'
                    ? 'bg-green-100'
                    : negotiation.status === 'REJECTED'
                      ? 'bg-red-100'
                      : negotiation.status === 'EXPIRED'
                        ? 'bg-gray-100'
                        : 'bg-yellow-100'
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    negotiation.status === 'ACCEPTED'
                      ? 'text-green-800'
                      : negotiation.status === 'REJECTED'
                        ? 'text-red-800'
                        : negotiation.status === 'EXPIRED'
                          ? 'text-gray-800'
                          : 'text-yellow-800'
                  }`}
                >
                  {negotiation.status}
                </Text>
              </View>
            </View>

            <View className="space-y-1">
              <Text className="text-gray-600 text-sm">
                Offered Price: €{negotiation.offeredPrice}/unit
              </Text>
              <Text className="text-gray-600 text-sm">Quantity: {negotiation.quantity} units</Text>
              {negotiation.message && (
                <Text className="text-gray-600 text-sm italic">"{negotiation.message}"</Text>
              )}
              <Text className="text-gray-500 text-xs">Round {negotiation.roundNumber || 1}</Text>
            </View>

            <View className="mt-3 flex-row space-x-2">
              <TouchableOpacity
                onPress={() => Alert.alert('Info', 'View offer history')}
                className="flex-1 bg-gray-100 py-2 rounded"
              >
                <Text className="text-gray-700 text-sm text-center">View Details</Text>
              </TouchableOpacity>

              {negotiation.status === 'PENDING' && (
                <TouchableOpacity
                  onPress={() => Alert.alert('Info', 'Respond to offer')}
                  className="flex-1 bg-blue-500 py-2 rounded"
                >
                  <Text className="text-white text-sm text-center">Respond</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {negotiations.length === 0 && (
          <View className="py-8 items-center">
            <MessageSquare size={48} color="#9CA3AF" />
            <Text className="text-gray-500 mt-3">No negotiations yet</Text>
          </View>
        )}
      </ScrollView>
    );
  };

  // Render timeline tab
  const renderTimeline = () => {
    // Mock timeline data for now
    const mockTimeline = operation
      ? ([
          {
            id: '1',
            phase: TradePhase.BUYER_SELECTION,
            timestamp: operation.createdAt,
            description: 'Trade operation created',
            actor: 'System',
          },
          {
            id: '2',
            phase: operation.phase,
            timestamp: operation.updatedAt,
            description: `Phase changed to ${operation.phase.replace(/_/g, ' ').toLowerCase()}`,
            actor: 'Admin',
          },
        ] as TimelineEvent[])
      : [];

    return (
      <ScrollView className="flex-1 p-4">
        {mockTimeline.map((event, index) => (
          <View key={event.id} className="flex-row mb-4">
            <View className="items-center mr-3">
              <View
                className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-green-500' : 'bg-blue-500'}`}
              />
              {index < mockTimeline.length - 1 && (
                <View className="w-0.5 flex-1 bg-gray-300 mt-1" />
              )}
            </View>

            <View className="flex-1 pb-4">
              <Text className="text-gray-800 font-semibold">{event.description}</Text>
              <Text className="text-gray-500 text-xs mt-1">
                {new Date(event.timestamp).toLocaleString()}
              </Text>
              <Text className="text-gray-500 text-xs">by {event.actor}</Text>
            </View>
          </View>
        ))}

        {mockTimeline.length === 0 && (
          <View className="py-8 items-center">
            <Clock size={48} color="#9CA3AF" />
            <Text className="text-gray-500 mt-3">No timeline events yet</Text>
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="bg-white border-b border-gray-200">
          <View className="flex-row items-center justify-between p-4">
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-800">Trade Operation Details</Text>
              {operation && (
                <Text className="text-sm text-gray-600 mt-1">{operation.operationNumber}</Text>
              )}
            </View>
            <View className="flex-row items-center space-x-3">
              <TouchableOpacity onPress={handleRefresh} className="p-2 rounded-full bg-gray-100">
                <RefreshCw size={20} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} className="p-2 rounded-full bg-gray-100">
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Tabs */}
          {renderTabs()}
        </View>

        {/* Content */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="text-gray-600 mt-3">Loading details...</Text>
          </View>
        ) : (
          <View className="flex-1">
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'sellers' && renderSellers()}
            {activeTab === 'negotiations' && renderNegotiations()}
            {activeTab === 'timeline' && renderTimeline()}
          </View>
        )}
      </View>
    </Modal>
  );
};
