import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  Bell,
  TrendingUp,
  Package,
  Truck,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
} from 'lucide-react-native';

import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/Card';

export default function CommandCenterScreen() {
  const orders = [
    {
      id: 'ORD-001',
      product: 'WHEAT - 50 TONS',
      status: 'active',
      price: '$280/ton',
      icon: Clock,
    },
    {
      id: 'ORD-002',
      product: 'CORN - 25 TONS',
      status: 'matched',
      price: '$320/ton',
      icon: CheckCircle,
    },
    {
      id: 'ORD-003',
      product: 'RICE - 100 TONS',
      status: 'active',
      price: '$450/ton',
      icon: Clock,
    },
    {
      id: 'ORD-004',
      product: 'SOYBEANS - 75 TONS',
      status: 'transit',
      price: '$380/ton',
      icon: Truck,
    },
  ];

  const tradeEvents = [
    {
      time: '2 min ago',
      type: 'sale',
      trader: 'FarmCorp Ltd',
      action: 'completed sale of 50T wheat',
      location: 'Mumbai → Delhi',
      buyer: 'GrainTech',
      icon: CheckCircle,
      color: 'text-green-500',
    },
    {
      time: '5 min ago',
      type: 'match',
      trader: 'AgriSupply Co',
      action: 'order matched for 25T corn',
      location: 'Delhi',
      buyer: 'FoodChain Inc',
      icon: TrendingUp,
      color: 'text-yellow-500',
    },
    {
      time: '12 min ago',
      type: 'alert',
      trader: 'HarvestPro',
      action: 'transport delayed',
      location: 'Bangalore',
      buyer: null,
      icon: AlertCircle,
      color: 'text-orange-500',
    },
    {
      time: '18 min ago',
      type: 'listing',
      trader: 'CropMaster',
      action: 'listed 100T rice order',
      location: 'Chennai',
      buyer: null,
      icon: Package,
      color: 'text-blue-500',
    },
    {
      time: '25 min ago',
      type: 'delivery',
      trader: 'GreenFields',
      action: 'delivery completed',
      location: 'Kolkata',
      buyer: 'FoodChain Inc',
      icon: CheckCircle,
      color: 'text-green-500',
    },
    {
      time: '32 min ago',
      type: 'transport',
      trader: 'Swift Transport',
      action: 'pickup scheduled',
      location: 'Punjab → Mumbai',
      buyer: null,
      icon: Truck,
      color: 'text-purple-500',
    },
  ];

  const getStatusBadgeColor = (type: string) => {
    switch (type) {
      case 'sale':
        return 'bg-green-900';
      case 'match':
        return 'bg-yellow-900';
      case 'alert':
        return 'bg-orange-900';
      case 'delivery':
        return 'bg-green-900';
      case 'transport':
        return 'bg-purple-900';
      default:
        return 'bg-blue-900';
    }
  };

  const getStatusTextColor = (type: string) => {
    switch (type) {
      case 'sale':
        return 'text-green-300';
      case 'match':
        return 'text-yellow-300';
      case 'alert':
        return 'text-orange-300';
      case 'delivery':
        return 'text-green-300';
      case 'transport':
        return 'text-purple-300';
      default:
        return 'text-blue-300';
    }
  };

  const getIconColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#22c55e';
      case 'matched':
        return '#eab308';
      case 'transit':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  return (
    <View className="p-6 space-y-6">
      {/* Main Dashboard Grid - Using flexbox to simulate lg:grid-cols-12 */}
      <View className="flex-row flex-wrap gap-6">
        {/* Order Overview Card - 6 columns equivalent */}
        <View className="flex-1 min-w-[300px]">
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader className="pb-3">
              <View className="flex-row items-center gap-2">
                <Package color="#22c55e" size={16} />
                <Text className="text-sm font-medium text-neutral-300 tracking-wider">
                  ORDER OVERVIEW
                </Text>
              </View>
            </CardHeader>
            <CardContent>
              <View className="flex-row justify-around mb-6">
                <View className="items-center">
                  <Text className="text-2xl font-bold text-green-500 font-mono">47</Text>
                  <Text className="text-xs text-neutral-500">Sell Orders</Text>
                </View>
                <View className="items-center">
                  <Text className="text-2xl font-bold text-blue-500 font-mono">63</Text>
                  <Text className="text-xs text-neutral-500">Buy Orders</Text>
                </View>
                <View className="items-center">
                  <Text className="text-2xl font-bold text-yellow-500 font-mono">23</Text>
                  <Text className="text-xs text-neutral-500">Matched</Text>
                </View>
              </View>

              <View className="space-y-2">
                {orders.map((order) => {
                  const IconComponent = order.icon;
                  return (
                    <TouchableOpacity
                      key={order.id}
                      className="flex-row items-center justify-between p-3 bg-neutral-800 rounded hover:bg-neutral-700 transition-colors cursor-pointer"
                      activeOpacity={0.7}
                    >
                      <View className="flex-row items-center gap-3">
                        <IconComponent
                          color={getIconColor(order.status)}
                          size={16}
                        />
                        <View>
                          <Text className="text-xs text-white font-mono">{order.id}</Text>
                          <Text className="text-xs text-neutral-400">{order.product}</Text>
                        </View>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <Text className="text-xs text-green-400 font-mono">{order.price}</Text>
                        <ArrowRight color="#6b7280" size={12} />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </CardContent>
          </Card>
        </View>

        {/* Live Trade Events Card - 6 columns equivalent */}
        <View className="flex-1 min-w-[300px]">
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader className="pb-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Bell color="#f97316" size={16} />
                  <Text className="text-sm font-medium text-neutral-300 tracking-wider">
                    LIVE TRADE EVENTS
                  </Text>
                </View>
                <View className="w-2 h-2 bg-green-400 rounded-full" />
              </View>
            </CardHeader>
            <CardContent>
              <ScrollView className="max-h-80" showsVerticalScrollIndicator={false}>
                <View className="space-y-3">
                  {tradeEvents.map((event, index) => {
                    const IconComponent = event.icon;
                    return (
                      <TouchableOpacity
                        key={index}
                        className="flex-row items-start gap-3 p-3 bg-neutral-800 rounded hover:bg-neutral-700 transition-colors cursor-pointer"
                        activeOpacity={0.7}
                      >
                        <IconComponent
                          color={
                            event.color === 'text-green-500' ? '#22c55e' : 
                            event.color === 'text-yellow-500' ? '#eab308' :
                            event.color === 'text-orange-500' ? '#f97316' :
                            event.color === 'text-blue-500' ? '#3b82f6' :
                            event.color === 'text-purple-500' ? '#8b5cf6' : '#22c55e'
                          }
                          size={16}
                        />
                        <View className="flex-1 min-w-0">
                          <View className="flex-row items-center justify-between mb-1">
                            <Text className="text-xs text-neutral-400 font-mono">
                              {event.time}
                            </Text>
                            <View className={`px-2 py-0.5 rounded ${getStatusBadgeColor(event.type)}`}>
                              <Text className={`text-xs ${getStatusTextColor(event.type)}`}>
                                {event.type.toUpperCase()}
                              </Text>
                            </View>
                          </View>
                          <Text className="text-xs text-white">
                            <Text className="text-green-400 font-mono">{event.trader}</Text>
                            {' '}
                            {event.action}
                          </Text>
                          <Text className="text-xs text-neutral-400 mt-1">
                            📍 {event.location}
                            {event.buyer && (
                              <Text>
                                {' → '}
                                <Text className="text-blue-400 font-mono">{event.buyer}</Text>
                              </Text>
                            )}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </CardContent>
          </Card>
        </View>
      </View>

      {/* Trade Volume Overview Card - Full width (12 columns) */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader className="pb-3">
          <View className="flex-row items-center gap-2">
            <TrendingUp color="#22c55e" size={16} />
            <Text className="text-sm font-medium text-neutral-300 tracking-wider">
              TRADE VOLUME OVERVIEW
            </Text>
          </View>
        </CardHeader>
        <CardContent>
          <View className="h-48 relative">
            {/* Chart Grid Background - mimics the web version's grid */}
            <View className="absolute inset-0 opacity-20">
              {/* Horizontal grid lines */}
              <View className="absolute top-0 left-0 right-0 h-px bg-neutral-700" />
              <View className="absolute top-1/4 left-0 right-0 h-px bg-neutral-700" />
              <View className="absolute top-1/2 left-0 right-0 h-px bg-neutral-700" />
              <View className="absolute top-3/4 left-0 right-0 h-px bg-neutral-700" />
              <View className="absolute bottom-0 left-0 right-0 h-px bg-neutral-700" />
              
              {/* Vertical grid lines */}
              <View className="absolute top-0 bottom-0 left-0 w-px bg-neutral-700" />
              <View className="absolute top-0 bottom-0 left-1/4 w-px bg-neutral-700" />
              <View className="absolute top-0 bottom-0 left-1/2 w-px bg-neutral-700" />
              <View className="absolute top-0 bottom-0 left-3/4 w-px bg-neutral-700" />
              <View className="absolute top-0 bottom-0 right-0 w-px bg-neutral-700" />
            </View>

            {/* Simulated Chart Lines - approximates the SVG polylines */}
            <View className="absolute inset-0 flex-row items-end justify-between px-4 pb-4">
              <View className="h-24 w-1 bg-green-500 rounded-t" />
              <View className="h-20 w-1 bg-green-500 rounded-t" />
              <View className="h-22 w-1 bg-green-500 rounded-t" />
              <View className="h-18 w-1 bg-green-500 rounded-t" />
              <View className="h-19 w-1 bg-green-500 rounded-t" />
              <View className="h-17 w-1 bg-green-500 rounded-t" />
              <View className="h-20 w-1 bg-green-500 rounded-t" />
              <View className="h-16 w-1 bg-green-500 rounded-t" />
            </View>

            {/* Dashed white line overlay */}
            <View className="absolute inset-0 flex-row items-end justify-between px-4 pb-4">
              <View className="h-28 w-0.5 bg-white opacity-50 rounded-t" style={{ marginLeft: 10 }} />
              <View className="h-27 w-0.5 bg-white opacity-50 rounded-t" style={{ marginLeft: 10 }} />
              <View className="h-26 w-0.5 bg-white opacity-50 rounded-t" style={{ marginLeft: 10 }} />
              <View className="h-25 w-0.5 bg-white opacity-50 rounded-t" style={{ marginLeft: 10 }} />
              <View className="h-26 w-0.5 bg-white opacity-50 rounded-t" style={{ marginLeft: 10 }} />
              <View className="h-27 w-0.5 bg-white opacity-50 rounded-t" style={{ marginLeft: 10 }} />
              <View className="h-25 w-0.5 bg-white opacity-50 rounded-t" style={{ marginLeft: 10 }} />
              <View className="h-24 w-0.5 bg-white opacity-50 rounded-t" style={{ marginLeft: 10 }} />
            </View>

            {/* Y-axis labels */}
            <View className="absolute left-0 top-0 h-full flex flex-col justify-between -ml-5">
              <Text className="text-xs text-neutral-500 font-mono">500T</Text>
              <Text className="text-xs text-neutral-500 font-mono">400T</Text>
              <Text className="text-xs text-neutral-500 font-mono">300T</Text>
              <Text className="text-xs text-neutral-500 font-mono">200T</Text>
            </View>

            {/* X-axis labels */}
            <View className="absolute bottom-0 left-0 w-full flex-row justify-between -mb-6">
              <Text className="text-xs text-neutral-500 font-mono">Jan 28, 2025</Text>
              <Text className="text-xs text-neutral-500 font-mono">Feb 28, 2025</Text>
            </View>
          </View>
        </CardContent>
      </Card>
    </View>
  );
}