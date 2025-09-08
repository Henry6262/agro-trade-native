import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
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

import { Card, CardContent } from '../../../../shared/components/Card';
import { Badge } from '../../../../shared/components/Badge';

interface BuyerOrdersTabProps {
  id?: string;
}

export default function BuyerOrdersTab({ id }: BuyerOrdersTabProps = {}) {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const buyerStats = {
    totalSpent: 245600,
    monthlySpent: 42300,
    completedOrders: 32,
    averagePerOrder: 7675,
    topProduct: 'Premium Wheat',
    savingsRate: 15.2,
  };

  const activeOrders = [
    {
      id: 'O001',
      product: 'Premium Wheat',
      quantity: 35,
      maxPricePerTon: 290,
      seller: 'GreenFields Farm',
      sellerLocation: 'Iowa, USA',
      sellerFlag: '🇺🇸',
      transporter: 'FastHaul Logistics',
      transporterTrucks: 2,
      licensePlate: 'TRK-4521',
      status: 'In Transit',
      deliveryDate: '2025-01-28',
      estimatedArrival: '2025-01-27 14:00',
      totalCost: 10150,
      currentStage: 2,
      qualityRequirements: ['Organic', 'Non-GMO', 'Protein 15%+'],
    },
    {
      id: 'O002',
      product: 'Soybeans',
      quantity: 50,
      maxPricePerTon: 360,
      seller: 'Prairie Harvest Co',
      sellerLocation: 'Illinois, USA',
      sellerFlag: '🇺🇸',
      transporter: 'AgriTransport',
      transporterTrucks: 3,
      licensePlate: 'AGR-7834',
      status: 'Scheduled',
      deliveryDate: '2025-02-02',
      estimatedArrival: null,
      totalCost: 18000,
      currentStage: 0,
      qualityRequirements: ['Organic', 'Protein 18%'],
    },
  ];

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

  return (
    <ScrollView 
      className="flex-1 bg-black"
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
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

        {/* 2-column layout for Incoming Offers and Active Orders */}
        <View className="flex-row gap-6">
          {/* Incoming Offers */}
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

          {/* Active Orders */}
          <View className="flex-1 space-y-4">
            <Text className="text-xl font-semibold text-white">Active Orders</Text>
            {activeOrders.map((order) => (
              <Card key={order.id} className="bg-neutral-900 border-neutral-700">
                <CardContent className="p-6">
                  <View className="flex-row justify-between items-start mb-6">
                    <View>
                      <Text className="text-lg font-semibold text-white">{order.product}</Text>
                      <View className="flex-row items-center gap-4 mt-2">
                        <View className="flex-row items-center gap-1 bg-neutral-800/50 px-2 py-1 rounded">
                          <Weight color="#60a5fa" size={16} />
                          <Text className="text-white font-medium text-sm">{order.quantity} tons</Text>
                        </View>
                        <View className="flex-row items-center gap-1 bg-neutral-800/50 px-2 py-1 rounded">
                          <DollarSign color="#60a5fa" size={16} />
                          <Text className="text-white font-medium text-sm">${order.maxPricePerTon}/ton max</Text>
                        </View>
                        <View className="flex-row items-center gap-1 bg-blue-500/20 px-2 py-1 rounded">
                          <Text className="text-blue-300 text-xs">Total:</Text>
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
                    <View>
                      <Text className="text-sm text-neutral-400">Seller:</Text>
                      <Text className="text-white font-medium">{order.seller}</Text>
                      <View className="flex-row items-center gap-1">
                        <MapPin color="#9CA3AF" size={12} />
                        <Text className="text-neutral-400 text-sm">{order.sellerFlag} {order.sellerLocation}</Text>
                      </View>
                    </View>
                    <View>
                      <Text className="text-sm text-neutral-400">Transporter:</Text>
                      <Text className="text-white font-medium">{order.transporter}</Text>
                      <View className="flex-row items-center gap-2 text-neutral-400">
                        <Truck color="#9CA3AF" size={12} />
                        <Text className="text-neutral-400 text-sm">{order.transporterTrucks} trucks</Text>
                        <View className="flex-row items-center gap-1">
                          <Star color="#eab308" size={16} />
                          <Text className="text-neutral-400 text-sm">4.8</Text>
                        </View>
                      </View>
                    </View>
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
                            <Text className="text-neutral-400">Delivery Date:</Text>
                            <Text className="text-white">{new Date(order.deliveryDate).toLocaleDateString()}</Text>
                          </View>
                          <View className="flex-row justify-between">
                            <Text className="text-neutral-400">License Plate:</Text>
                            <Text className="text-white font-mono">{order.licensePlate}</Text>
                          </View>
                          <View className="flex-row justify-between font-medium">
                            <Text className="text-neutral-400">Total Cost:</Text>
                            <Text className="text-blue-400">${order.totalCost.toLocaleString()}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  )}
                </CardContent>
              </Card>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}