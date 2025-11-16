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
  MapPin,
  Weight,
  DollarSign,
  Truck,
  Package,
  Clock,
  Star,
  Calendar,
  CheckCircle,
  X,
  Target,
  Award,
} from 'lucide-react-native';

import { Card, CardContent } from '../../../../../../shared/components/Card';
import { Badge } from '../../../../../../shared/components/Badge';
import buyerService from '../../../../../../services/buyerService';
import { format } from 'date-fns';

interface BuyerOrdersTabProps {
  id?: string;
}

export default function BuyerOrdersTab({ id }: BuyerOrdersTabProps = {}) {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [tradeOperations, setTradeOperations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [operations, stats] = await Promise.all([
        buyerService.getMyTradeOperations(),
        buyerService.getMyStatistics(),
      ]);
      setTradeOperations(operations);
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to load buyer data:', error);
      Alert.alert('Error', 'Failed to load your orders');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const buyerStats = statistics || {
    totalSpent: 0,
    monthlySpent: 0,
    completedOrders: 0,
    averagePerOrder: 0,
    topProduct: 'N/A',
    savingsRate: 0,
  };

  // Map trade operations to the display format
  const activeOrders = tradeOperations.map((op) => ({
    id: op.id,
    operationNumber: op.operationNumber,
    product: op.buyListing?.product?.name || 'Unknown Product',
    quantity: op.targetQuantity,
    maxPricePerTon: op.buyListing?.maxPricePerUnit || 0,
    phase: op.phase,
    status: getPhaseStatus(op.phase),
    totalCost: op.targetQuantity * (op.buyListing?.maxPricePerUnit || 0),
    currentStage: getPhaseStage(op.phase),
    qualityRequirements: op.buyListing?.qualityRequirements || [],
    securedQuantity: op.securedQuantity,
    estimatedProfit: op.estimatedProfit,
    profitMargin: op.profitMargin,
    sellers: op.sellers || [],
    transportRequest: op.transportRequest,
    transportJob: op.transportJob,
    createdAt: op.createdAt,
    updatedAt: op.updatedAt,
  }));

  function getPhaseStatus(phase: string): string {
    switch (phase) {
      case 'INITIATION':
        return 'Pending';
      case 'SELLER_NEGOTIATION':
        return 'Negotiating';
      case 'TRANSPORT_MATCHING':
        return 'Finding Transport';
      case 'IN_TRANSIT':
        return 'In Transit';
      case 'DELIVERY':
        return 'Delivering';
      case 'PAYMENT':
        return 'Payment';
      case 'COMPLETED':
        return 'Delivered';
      default:
        return phase;
    }
  }

  function getPhaseStage(phase: string): number {
    switch (phase) {
      case 'INITIATION':
        return 0;
      case 'SELLER_NEGOTIATION':
        return 0;
      case 'TRANSPORT_MATCHING':
        return 1;
      case 'IN_TRANSIT':
        return 2;
      case 'DELIVERY':
        return 3;
      case 'PAYMENT':
        return 3;
      case 'COMPLETED':
        return 4;
      default:
        return 0;
    }
  }

  const incomingOffers = [
    {
      id: 'IO001',
      product: 'Premium Wheat',
      quantity: 40,
      offeredPricePerTon: 275,
      totalValue: 11000,
      seller: 'Midwest Grain Co',
      sellerLocation: 'Nebraska, USA',
      sellerFlag: '🇺🇸',
      adminNote: 'High-quality wheat available for immediate delivery. Seller offers competitive pricing for bulk orders.',
      deadline: '2025-01-26',
      responseTime: '16 hours',
      qualityOffered: ['Organic', 'Non-GMO', 'Protein 14%'],
      deliveryDate: '2025-01-30',
    },
    {
      id: 'IO002',
      product: 'Corn Grain',
      quantity: 60,
      offeredPricePerTon: 210,
      totalValue: 12600,
      seller: 'Golden Harvest Farm',
      sellerLocation: 'Kansas, USA',
      sellerFlag: '🇺🇸',
      adminNote: 'Fresh corn harvest with excellent moisture content. Perfect for feed production.',
      deadline: '2025-01-29',
      responseTime: '3 days',
      qualityOffered: ['Grade A', 'Moisture 14%'],
      deliveryDate: '2025-02-05',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-500';
      case 'Matched':
        return 'bg-blue-500';
      case 'Confirmed':
        return 'bg-green-500';
      case 'In Transit':
        return 'bg-purple-500';
      case 'Delivered':
        return 'bg-green-600';
      case 'Scheduled':
        return 'bg-blue-500';
      default:
        return 'bg-neutral-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return Clock;
      case 'Matched':
        return Target;
      case 'Confirmed':
        return CheckCircle;
      case 'In Transit':
        return Truck;
      case 'Delivered':
        return Package;
      case 'Scheduled':
        return Calendar;
      default:
        return Package;
    }
  };

  const getOrderStages = () => [
    { name: 'Scheduled', description: 'Order confirmed', icon: Calendar },
    { name: 'Traveling', description: 'In transit', icon: Truck },
    { name: 'Arrived', description: 'At destination', icon: MapPin },
    { name: 'Delivered', description: 'Order complete', icon: CheckCircle },
  ];

  const renderStageIndicator = (currentStage: number) => {
    const stages = getOrderStages();
    return (
      <View className="relative mb-6">
        <View className="absolute top-4 left-8 right-8 h-0.5 bg-neutral-700 z-0" />
        <View
          className="absolute top-4 left-8 h-0.5 bg-blue-500 z-0 transition-all duration-500"
          style={{
            width: `${(currentStage / (stages.length - 1)) * 100}%`,
            maxWidth: '75%',
          }}
        />

        <View className="flex-row justify-between relative z-10">
          {stages.map((stage, index) => {
            const IconComponent = stage.icon;
            const isCompleted = index < currentStage;
            const isCurrent = index === currentStage;

            return (
              <View key={index} className="flex flex-col items-center">
                <View
                  className={`w-8 h-8 rounded-full flex items-center justify-center relative ${
                    isCompleted
                      ? 'bg-blue-500'
                      : isCurrent
                        ? 'bg-yellow-500'
                        : 'bg-neutral-700'
                  }`}
                >
                  <IconComponent
                    color={isCompleted || isCurrent ? '#ffffff' : '#9CA3AF'}
                    size={16}
                  />
                  {isCurrent && (
                    <View className="absolute inset-0 rounded-full bg-yellow-500 opacity-75" />
                  )}
                </View>
                <Text
                  className={`text-xs text-center mt-2 max-w-16 ${
                    isCompleted
                      ? 'text-blue-400'
                      : isCurrent
                        ? 'text-yellow-400'
                        : 'text-neutral-500'
                  }`}
                >
                  {stage.name}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#60A5FA" />
        <Text className="text-gray-400 mt-4">Loading your orders...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      className="flex-1 bg-black"
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#60A5FA"
        />
      }
    >
      <View className="p-6 space-y-6">
        <View>
          <Text className="text-2xl font-bold text-white">My Orders</Text>
          <Text className="text-neutral-400">Track your orders and purchase performance</Text>
        </View>

        {/* 4-column stats grid */}
        <View className="flex-row gap-2 mb-6">
          <Card className="bg-neutral-900 border-neutral-700 flex-1">
            <CardContent className="p-3">
              <View className="text-center items-center">
                <DollarSign color="#60a5fa" size={20} />
                <Text className="text-xs text-neutral-400 mt-1">Total</Text>
                <Text className="text-lg font-bold text-white">${(buyerStats.totalSpent / 1000).toFixed(0)}k</Text>
                <Text className="text-xs text-blue-400">-{buyerStats.savingsRate}%</Text>
              </View>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-700 flex-1">
            <CardContent className="p-3">
              <View className="text-center items-center">
                <Calendar color="#22c55e" size={20} />
                <Text className="text-xs text-neutral-400 mt-1">Month</Text>
                <Text className="text-lg font-bold text-white">${(buyerStats.monthlySpent / 1000).toFixed(0)}k</Text>
                <Text className="text-xs text-green-400">Jan 2025</Text>
              </View>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-700 flex-1">
            <CardContent className="p-3">
              <View className="text-center items-center">
                <Target color="#8b5cf6" size={20} />
                <Text className="text-xs text-neutral-400 mt-1">Orders</Text>
                <Text className="text-lg font-bold text-white">{buyerStats.completedOrders}</Text>
                <Text className="text-xs text-purple-400">${(buyerStats.averagePerOrder / 1000).toFixed(1)}k avg</Text>
              </View>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-700 flex-1">
            <CardContent className="p-3">
              <View className="text-center items-center">
                <Award color="#f97316" size={20} />
                <Text className="text-xs text-neutral-400 mt-1">Top</Text>
                <Text className="text-sm font-bold text-white">Wheat</Text>
                <Text className="text-xs text-orange-400">42%</Text>
              </View>
            </CardContent>
          </Card>
        </View>

        {/* 2-column layout for Active Orders (Incoming Offers removed - now in buyer requests) */}
        <View className="flex-row gap-6">
          {/* Incoming Offers - HIDDEN (moved to buyer requests tab) */}
          {false && (
          <View className="flex-1 space-y-4">
            <Text className="text-xl font-semibold text-white">Incoming Offers</Text>
            {incomingOffers.map((offer) => (
              <Card key={offer.id} className="bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border-blue-500/30">
                <CardContent className="p-6">
                  <View className="flex-row justify-between items-start mb-4">
                    <View>
                      <Text className="text-lg font-semibold text-white">{offer.product}</Text>
                      <View className="flex-row items-center gap-4 mt-2">
                        <View className="flex-row items-center gap-1 bg-neutral-800/50 px-2 py-1 rounded">
                          <Weight color="#60a5fa" size={16} />
                          <Text className="text-white font-medium text-sm">{offer.quantity} tons</Text>
                        </View>
                        <View className="flex-row items-center gap-1 bg-neutral-800/50 px-2 py-1 rounded">
                          <DollarSign color="#60a5fa" size={16} />
                          <Text className="text-white font-medium text-sm">${offer.offeredPricePerTon}/ton</Text>
                        </View>
                        <View className="flex-row items-center gap-1 bg-blue-500/20 px-2 py-1 rounded">
                          <Text className="text-blue-300 text-xs">Total:</Text>
                          <Text className="text-blue-400 font-bold">${offer.totalValue.toLocaleString()}</Text>
                        </View>
                      </View>
                    </View>
                    <View className="bg-blue-500 px-2 py-1 rounded flex-row items-center gap-1">
                      <Clock color="#ffffff" size={12} />
                      <Text className="text-white text-xs">{offer.responseTime} left</Text>
                    </View>
                  </View>

                  <View className="space-y-2 mb-4">
                    <View>
                      <Text className="text-sm text-neutral-400">Seller:</Text>
                      <Text className="text-white font-medium">{offer.seller}</Text>
                      <View className="flex-row items-center gap-1 text-neutral-400">
                        <MapPin color="#9CA3AF" size={12} />
                        <Text className="text-neutral-400 text-sm">{offer.sellerFlag} {offer.sellerLocation}</Text>
                      </View>
                    </View>
                    <View>
                      <Text className="text-sm text-neutral-400">Quality Offered:</Text>
                      <View className="flex-row flex-wrap gap-1 mt-1">
                        {offer.qualityOffered.map((quality, index) => (
                          <Badge key={index} variant="outline" className="text-xs border-blue-400 text-blue-300">
                            {quality}
                          </Badge>
                        ))}
                      </View>
                    </View>
                  </View>

                  <View className="bg-neutral-800/50 rounded-lg p-3 mb-4">
                    <Text className="text-sm text-neutral-400">Admin Note:</Text>
                    <Text className="text-neutral-300 mt-1 text-sm">{offer.adminNote}</Text>
                  </View>

                  <View className="flex-row gap-2">
                    <TouchableOpacity className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex-row items-center gap-2">
                      <CheckCircle color="#ffffff" size={16} />
                      <Text className="text-white">Accept Offer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="border border-red-500 text-red-400 hover:bg-red-500/10 bg-transparent px-3 py-2 rounded flex-row items-center gap-1">
                      <X color="#ef4444" size={16} />
                      <Text className="text-red-400">Decline</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="border border-blue-500 text-blue-400 hover:bg-blue-500/10 bg-transparent px-3 py-2 rounded flex-row items-center gap-1">
                      <DollarSign color="#60a5fa" size={16} />
                      <Text className="text-blue-400">Counter Offer</Text>
                    </TouchableOpacity>
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
          )}

          {/* Active Orders - Now full width since incoming offers are hidden */}
          <View className="flex-1 space-y-4">
            <View className="flex-row justify-between items-center">
              <Text className="text-xl font-semibold text-white">Active Trade Operations</Text>
              <Badge variant="outline" className="text-xs border-blue-400 text-blue-300">
                {activeOrders.length} Active
              </Badge>
            </View>
            
            {activeOrders.length === 0 ? (
              <Card className="bg-neutral-900 border-neutral-700">
                <CardContent className="p-12 text-center">
                  <Package color="#6B7280" size={48} style={{ alignSelf: 'center', marginBottom: 12 }} />
                  <Text className="text-gray-400 text-lg mb-2">No Active Operations</Text>
                  <Text className="text-gray-500 text-sm">Your trade operations will appear here</Text>
                </CardContent>
              </Card>
            ) : (
              activeOrders.map((order) => (
              <Card key={order.id} className="bg-neutral-900 border-neutral-700">
                <CardContent className="p-6">
                  <View className="flex-row justify-between items-start mb-6">
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 mb-1">
                        <Text className="text-lg font-semibold text-white">{order.product}</Text>
                        <Text className="text-gray-500 text-sm">#{order.operationNumber}</Text>
                      </View>
                      <View className="flex-row items-center gap-4 mt-2">
                        <View className="flex-row items-center gap-1 bg-neutral-800/50 px-2 py-1 rounded">
                          <Weight color="#60a5fa" size={16} />
                          <Text className="text-white font-medium text-sm">{order.quantity} tons</Text>
                        </View>
                        <View className="flex-row items-center gap-1 bg-neutral-800/50 px-2 py-1 rounded">
                          <Package color="#34D399" size={16} />
                          <Text className="text-green-400 font-medium text-sm">{order.securedQuantity || 0} secured</Text>
                        </View>
                        <View className="flex-row items-center gap-1 bg-blue-500/20 px-2 py-1 rounded">
                          <Text className="text-blue-300 text-xs">Budget:</Text>
                          <Text className="text-blue-400 font-bold">${order.totalCost.toLocaleString()}</Text>
                        </View>
                      </View>
                    </View>
                    <View className={`${getStatusColor(order.status)} text-white flex-row items-center gap-1 px-2 py-1 rounded`}>
                      {React.createElement(getStatusIcon(order.status), {
                        color: '#ffffff',
                        size: 16,
                      })}
                      <Text className="text-white text-xs">{order.status}</Text>
                    </View>
                  </View>

                  {renderStageIndicator(order.currentStage)}

                  <View className="space-y-2">
                    {order.sellers && order.sellers.length > 0 && (
                      <View>
                        <Text className="text-sm text-neutral-400">Sellers ({order.sellers.length}):</Text>
                        {order.sellers.slice(0, 2).map((seller: any, index: number) => (
                          <View key={index} className="mt-1">
                            <Text className="text-white font-medium">{seller.seller?.name || 'Pending'}</Text>
                            {seller.agreedQuantity && (
                              <Text className="text-green-400 text-sm">{seller.agreedQuantity} tons confirmed</Text>
                            )}
                          </View>
                        ))}
                      </View>
                    )}
                    
                    {order.transportJob ? (
                      <View>
                        <Text className="text-sm text-neutral-400">Transport:</Text>
                        <Text className="text-white font-medium">{order.transportJob.transporter?.name || 'Assigned'}</Text>
                        <View className="flex-row items-center gap-2 text-neutral-400">
                          <Truck color="#9CA3AF" size={12} />
                          <Text className="text-neutral-400 text-sm">Job #{order.transportJob.jobNumber}</Text>
                        </View>
                      </View>
                    ) : order.transportRequest ? (
                      <View>
                        <Text className="text-sm text-neutral-400">Transport:</Text>
                        <Text className="text-yellow-400 font-medium">Finding transporters...</Text>
                        <Text className="text-neutral-400 text-sm">{order.transportRequest.bidsCount || 0} bids received</Text>
                      </View>
                    ) : (
                      <View>
                        <Text className="text-sm text-neutral-400">Transport:</Text>
                        <Text className="text-neutral-500">Not yet arranged</Text>
                      </View>
                    )}
                  </View>

                  <View className="mt-4 flex justify-center">
                    <TouchableOpacity
                      onPress={() =>
                        setExpandedOrder(expandedOrder === order.id ? null : order.id)
                      }
                      className="text-neutral-400 hover:text-white px-4 py-2 bg-transparent border-none"
                    >
                      <Text className="text-neutral-400 text-sm">
                        {expandedOrder === order.id ? 'Hide Details' : 'View Details'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {expandedOrder === order.id && (
                    <View className="mt-4 pt-4 border-t border-neutral-700 space-y-3">
                      <View>
                        <Text className="text-sm font-medium text-white">Quality Requirements</Text>
                        <View className="flex-row flex-wrap gap-1 mt-2">
                          {order.qualityRequirements.map((req, index) => (
                            <Badge key={index} variant="outline" className="text-xs border-blue-400 text-blue-300">
                              {req}
                            </Badge>
                          ))}
                        </View>
                      </View>
                      <View>
                        <Text className="text-sm font-medium text-white">Order Summary</Text>
                        <View className="text-sm space-y-1 mt-2">
                          <View className="flex-row justify-between">
                            <Text className="text-neutral-400">Created:</Text>
                            <Text className="text-white">{format(new Date(order.createdAt), 'MMM dd, yyyy')}</Text>
                          </View>
                          <View className="flex-row justify-between">
                            <Text className="text-neutral-400">Progress:</Text>
                            <Text className="text-white">{Math.round((order.securedQuantity / order.quantity) * 100)}%</Text>
                          </View>
                          {order.estimatedProfit && (
                            <View className="flex-row justify-between">
                              <Text className="text-neutral-400">Est. Savings:</Text>
                              <Text className="text-green-400">€{order.estimatedProfit.toLocaleString()}</Text>
                            </View>
                          )}
                          <View className="flex-row justify-between font-medium">
                            <Text className="text-neutral-400">Budget:</Text>
                            <Text className="text-blue-400">${order.totalCost.toLocaleString()}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  )}
                </CardContent>
              </Card>
            )))
            }
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
