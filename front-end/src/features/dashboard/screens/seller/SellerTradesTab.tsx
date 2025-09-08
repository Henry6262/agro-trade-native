import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
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
  Target,
  Award,
} from 'lucide-react-native';

import { Card, CardContent } from '../../../../shared/components/Card';
import { Badge } from '../../../../shared/components/Badge';

interface SellerTradesTabProps {
  id?: string;
}

export default function SellerTradesTab({ id }: SellerTradesTabProps = {}) {
  const [expandedTrade, setExpandedTrade] = useState<string | null>(null);
  const [activeTradeStage, setActiveTradeStage] = useState<number | null>(null);

  const earningsData = {
    totalEarnings: 156750,
    monthlyEarnings: 28500,
    completedTrades: 47,
    averagePerTrade: 3335,
    topProduct: 'Premium Wheat',
    growthRate: 23.5,
  };

  const activeTrades = [
    {
      id: "T001",
      product: "Premium Wheat",
      quantity: 25,
      agreedPricePerTon: 280,
      buyer: "GrainCorp Ltd",
      buyerLocation: "Chicago, IL",
      buyerFlag: "🇺🇸",
      transporter: "FastHaul Logistics",
      transporterTrucks: 3,
      licensePlate: "TRK-4521",
      status: "Awaiting Departure",
      pickupDate: "2025-01-25",
      estimatedDeparture: "2025-01-24 08:00",
      price: 7000,
      currentStage: 1,
    },
    {
      id: "T002",
      product: "Corn Grain",
      quantity: 40,
      agreedPricePerTon: 220,
      buyer: "FeedMaster Co",
      buyerLocation: "Kansas City, MO",
      buyerFlag: "🇺🇸",
      transporter: "AgriTransport",
      transporterTrucks: 2,
      licensePlate: "AGR-7834",
      status: "Traveling",
      pickupDate: "2025-01-22",
      estimatedDeparture: "2025-01-22 10:00",
      price: 8800,
      currentStage: 2,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-green-500"
      case "Low Stock":
        return "bg-yellow-500"
      case "Out of Stock":
        return "bg-red-500"
      case "Deal Accepted":
        return "bg-blue-500"
      case "Awaiting Departure":
        return "bg-orange-500"
      case "Traveling":
        return "bg-purple-500"
      case "At Location":
        return "bg-indigo-500"
      case "Completed":
        return "bg-green-600"
      case "Scheduled":
        return "bg-blue-500"
      default:
        return "bg-neutral-500"
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Deal Accepted":
        return <Package color="#ffffff" size={16} />;
      case "Awaiting Departure":
        return <Clock color="#ffffff" size={16} />;
      case "Traveling":
        return <Truck color="#ffffff" size={16} />;
      case "At Location":
        return <MapPin color="#ffffff" size={16} />;
      case "Completed":
        return <Package color="#ffffff" size={16} />;
      case "Scheduled":
        return <Calendar color="#ffffff" size={16} />;
      default:
        return <Package color="#ffffff" size={16} />;
    }
  };

  const getTradeStages = () => [
    { name: "Scheduled", description: "Pickup scheduled", icon: Calendar },
    { name: "Traveling", description: "Driver en route", icon: Truck },
    { name: "Arrived", description: "At pickup location", icon: MapPin },
    { name: "Completed", description: "Goods delivered", icon: CheckCircle },
  ];

  const renderStageIndicator = (currentStage: number) => {
    const stages = getTradeStages();
    const { width } = Dimensions.get('window');
    const isMobile = width < 768;
    const progressWidth = isMobile ? Math.min(width * 0.8, 320) : 400;
    
    return (
      <View className={`relative mb-6 ${isMobile ? 'mx-auto' : ''}`} style={{ maxWidth: progressWidth }}>
        <View className="absolute top-4 left-4 right-4 h-0.5 bg-neutral-700 z-0" />

        <View
          className="absolute top-4 left-4 h-0.5 bg-green-500 z-0"
          style={{
            width: (currentStage / (stages.length - 1)) * (progressWidth - 32),
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
                      ? 'bg-green-500'
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
                      ? 'text-green-400'
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

  const { width } = Dimensions.get('window');
  const isMobile = width < 768;

  return (
    <View className="flex-1 bg-black">
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View className="p-6">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-white">My Trades</Text>
            <Text className="text-neutral-400">Track your active trades and earnings performance</Text>
          </View>

          {/* 4 Small Earnings Cards - Responsive Grid */}
          <View className={`${isMobile ? 'flex-row flex-wrap' : 'flex-row justify-between gap-2'} mb-6`}>
            {/* Total Earnings Card */}
            <Card className={`bg-neutral-900 border-neutral-700 ${isMobile ? 'w-[48%] mb-2' : 'flex-1'}`}>
              <CardContent className="p-3">
                <View className="items-center">
                  <DollarSign color="#22c55e" size={20} />
                  <Text className="text-xs text-neutral-400 mt-1">Total</Text>
                  <Text className="text-lg font-bold text-white">
                    ${(earningsData.totalEarnings / 1000).toFixed(0)}k
                  </Text>
                  <Text className="text-xs text-green-400">+{earningsData.growthRate}%</Text>
                </View>
              </CardContent>
            </Card>

            {/* Monthly Earnings */}
            <Card className={`bg-neutral-900 border-neutral-700 ${isMobile ? 'w-[48%] mb-2' : 'flex-1'}`}>
              <CardContent className="p-3">
                <View className="items-center">
                  <Calendar color="#60a5fa" size={20} />
                  <Text className="text-xs text-neutral-400 mt-1">Month</Text>
                  <Text className="text-lg font-bold text-white">
                    ${(earningsData.monthlyEarnings / 1000).toFixed(0)}k
                  </Text>
                  <Text className="text-xs text-blue-400">Jan 2025</Text>
                </View>
              </CardContent>
            </Card>

            {/* Completed Trades */}
            <Card className={`bg-neutral-900 border-neutral-700 ${isMobile ? 'w-[48%] mb-2' : 'flex-1'}`}>
              <CardContent className="p-3">
                <View className="items-center">
                  <Target color="#8b5cf6" size={20} />
                  <Text className="text-xs text-neutral-400 mt-1">Trades</Text>
                  <Text className="text-lg font-bold text-white">{earningsData.completedTrades}</Text>
                  <Text className="text-xs text-purple-400">
                    ${(earningsData.averagePerTrade / 1000).toFixed(1)}k avg
                  </Text>
                </View>
              </CardContent>
            </Card>

            {/* Top Product */}
            <Card className={`bg-neutral-900 border-neutral-700 ${isMobile ? 'w-[48%] mb-2' : 'flex-1'}`}>
              <CardContent className="p-3">
                <View className="items-center">
                  <Award color="#fb923c" size={20} />
                  <Text className="text-xs text-neutral-400 mt-1">Top</Text>
                  <Text className="text-sm font-bold text-white">Wheat</Text>
                  <Text className="text-xs text-orange-400">45%</Text>
                </View>
              </CardContent>
            </Card>
          </View>

          {/* Active Trades */}
          <View>
            <Text className="text-xl font-semibold text-white mb-4">Active Trades</Text>
            {activeTrades.map((trade) => (
              <Card key={trade.id} className="bg-neutral-900 border-neutral-700 mb-4">
                <CardContent className="p-6">
                  <View className="flex-row justify-between items-start mb-6">
                    <View>
                      <Text className="text-lg font-semibold text-white">{trade.product}</Text>
                      <View className="flex-row items-center gap-4 mt-2">
                        <View className="flex-row items-center gap-1 bg-neutral-800/50 px-2 py-1 rounded">
                          <Weight color="#22c55e" size={16} />
                          <Text className="text-white font-medium text-sm">{trade.quantity} tons</Text>
                        </View>
                        <View className="flex-row items-center gap-1 bg-neutral-800/50 px-2 py-1 rounded">
                          <DollarSign color="#22c55e" size={16} />
                          <Text className="text-white font-medium text-sm">${trade.agreedPricePerTon}/ton</Text>
                        </View>
                        <View className="flex-row items-center gap-1 bg-green-500/20 px-2 py-1 rounded">
                          <Text className="text-green-300 text-xs">Total:</Text>
                          <Text className="text-green-400 font-bold text-sm">
                            ${trade.price.toLocaleString()}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Badge
                      className={`${getStatusColor(trade.status)} text-white flex-row items-center gap-1 px-2 py-1 rounded`}
                    >
                      {getStatusIcon(trade.status)}
                      <Text className="text-white text-xs">{trade.status}</Text>
                    </Badge>
                  </View>

                  {/* Fixed Progress Indicator Container */}
                  <View className="bg-neutral-900 -mx-6 px-6 py-3 -mt-4 mb-4 border-b border-neutral-700">
                    {renderStageIndicator(trade.currentStage)}
                  </View>

                  {/* Trade Details */}
                  <View className="mb-4">
                    <View className="mb-2">
                      <Text className="text-neutral-400 text-sm">Buyer:</Text>
                      <Text className="text-white font-medium">{trade.buyer}</Text>
                      <View className="flex-row items-center gap-1">
                        <MapPin color="#9ca3af" size={12} />
                        <Text className="text-neutral-400 text-sm">
                          {trade.buyerFlag} {trade.buyerLocation}
                        </Text>
                      </View>
                    </View>
                    <View className="mb-2">
                      <Text className="text-neutral-400 text-sm">Transporter:</Text>
                      <Text className="text-white font-medium">{trade.transporter}</Text>
                      <View className="flex-row items-center gap-2">
                        <Truck color="#9ca3af" size={12} />
                        <Text className="text-neutral-400 text-sm">{trade.transporterTrucks} trucks</Text>
                        <View className="flex-row items-center gap-1">
                          <Star color="#eab308" size={16} fill="#eab308" />
                          <Text className="text-neutral-400 text-sm">4.8</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View className="items-center mt-4">
                    <TouchableOpacity
                      onPress={() => {
                        if (expandedTrade === trade.id) {
                          setExpandedTrade(null);
                          setActiveTradeStage(null);
                        } else {
                          setExpandedTrade(trade.id);
                          setActiveTradeStage(trade.currentStage);
                        }
                      }}
                      className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded"
                    >
                      <Text className="text-neutral-400 hover:text-white text-sm">
                        {expandedTrade === trade.id ? "Hide Details" : "View Details"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {expandedTrade === trade.id && (
                    <View className="mt-4 pt-4 border-t border-neutral-700">
                      <View className="mb-4">
                        <Text className="text-sm font-medium text-white mb-2">Transport Details</Text>
                        <View className="space-y-1">
                          <View className="flex-row justify-between">
                            <Text className="text-neutral-400 text-sm">License Plate:</Text>
                            <Text className="text-white font-mono text-sm">{trade.licensePlate}</Text>
                          </View>
                          <View className="flex-row justify-between">
                            <Text className="text-neutral-400 text-sm">Fleet Size:</Text>
                            <Text className="text-white text-sm">{trade.transporterTrucks} trucks</Text>
                          </View>
                          <View className="flex-row justify-between">
                            <Text className="text-neutral-400 text-sm">Rating:</Text>
                            <View className="flex-row items-center gap-1">
                              <Star color="#eab308" size={12} fill="#eab308" />
                              <Text className="text-white text-sm">4.8/5</Text>
                            </View>
                          </View>
                        </View>
                      </View>

                      <View>
                        <Text className="text-sm font-medium text-white mb-2">Trade Summary</Text>
                        <View className="space-y-1">
                          <View className="flex-row justify-between">
                            <Text className="text-neutral-400 text-sm">Quantity:</Text>
                            <Text className="text-white text-sm">{trade.quantity} tons</Text>
                          </View>
                          <View className="flex-row justify-between">
                            <Text className="text-neutral-400 text-sm">Price/ton:</Text>
                            <Text className="text-white text-sm">${trade.agreedPricePerTon}</Text>
                          </View>
                          <View className="flex-row justify-between font-medium">
                            <Text className="text-neutral-400 text-sm">Total Value:</Text>
                            <Text className="text-green-400 text-sm">${trade.price.toLocaleString()}</Text>
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
        {/* Bottom Padding for Navigation */}
        <View className="h-20" />
      </ScrollView>
    </View>
  );
}