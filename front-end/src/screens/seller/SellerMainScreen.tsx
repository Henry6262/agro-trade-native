import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {
  Package,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  BarChart3,
  Users,
  ArrowRight,
  Bell,
  ShieldCheck,
  Star,
  Award,
  Target,
  Calendar,
  Clock,
  ChevronRight,
} from 'lucide-react-native';

import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';

const { width } = Dimensions.get('window');

interface SellerMainScreenProps {
  navigation?: any;
}

export default function SellerMainScreen({ navigation }: SellerMainScreenProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const metrics = {
    totalRevenue: 156750,
    monthlyRevenue: 28500,
    activeProducts: 24,
    totalOrders: 142,
    pendingOrders: 8,
    completedOrders: 134,
    averageRating: 4.8,
    totalReviews: 89,
    conversionRate: 68,
    repeatCustomers: 45,
    growthRate: 23.5,
    topProduct: 'Premium Wheat',
  };

  const quickStats = [
    {
      icon: DollarSign,
      label: 'Total Revenue',
      value: `$${(metrics.totalRevenue / 1000).toFixed(0)}k`,
      change: '+23.5%',
      trend: 'up',
      color: '#22c55e',
    },
    {
      icon: Package,
      label: 'Active Products',
      value: metrics.activeProducts.toString(),
      change: '+3',
      trend: 'up',
      color: '#3b82f6',
    },
    {
      icon: ShoppingCart,
      label: 'Total Orders',
      value: metrics.totalOrders.toString(),
      change: '+12%',
      trend: 'up',
      color: '#8b5cf6',
    },
    {
      icon: Star,
      label: 'Rating',
      value: metrics.averageRating.toFixed(1),
      change: `${metrics.totalReviews} reviews`,
      trend: 'neutral',
      color: '#f59e0b',
    },
  ];

  const menuItems = [
    {
      id: 'products',
      title: 'Product Management',
      subtitle: 'Add, edit and manage products',
      icon: Package,
      color: '#3b82f6',
      badge: metrics.activeProducts.toString(),
      screen: 'SellerProducts',
    },
    {
      id: 'orders',
      title: 'Orders & Trades',
      subtitle: 'Track and fulfill orders',
      icon: ShoppingCart,
      color: '#22c55e',
      badge: metrics.pendingOrders.toString(),
      badgeColor: '#ef4444',
      screen: 'SellerOrders',
    },
    {
      id: 'inventory',
      title: 'Inventory',
      subtitle: 'Stock levels and management',
      icon: Package,
      color: '#8b5cf6',
      screen: 'SellerInventory',
    },
    {
      id: 'analytics',
      title: 'Analytics & Reports',
      subtitle: 'Performance insights',
      icon: BarChart3,
      color: '#f59e0b',
      screen: 'SellerAnalytics',
    },
    {
      id: 'pricing',
      title: 'Pricing & Promotions',
      subtitle: 'Manage prices and deals',
      icon: DollarSign,
      color: '#06b6d4',
      screen: 'SellerPricing',
    },
    {
      id: 'insights',
      title: 'Market Insights',
      subtitle: 'Demand and trends',
      icon: TrendingUp,
      color: '#ec4899',
      screen: 'SellerInsights',
    },
    {
      id: 'customers',
      title: 'Customer Management',
      subtitle: 'Buyer relationships',
      icon: Users,
      color: '#10b981',
      screen: 'SellerCustomers',
    },
    {
      id: 'profile',
      title: 'Profile & Settings',
      subtitle: 'Business information',
      icon: ShieldCheck,
      color: '#6366f1',
      screen: 'SellerProfile',
    },
  ];

  const recentActivities = [
    {
      id: '1',
      type: 'order',
      title: 'New Order Received',
      description: '50 tons of Premium Wheat',
      time: '5 mins ago',
      icon: ShoppingCart,
      color: '#22c55e',
    },
    {
      id: '2',
      type: 'payment',
      title: 'Payment Received',
      description: '$14,250 from GrainTech Solutions',
      time: '2 hours ago',
      icon: DollarSign,
      color: '#3b82f6',
    },
    {
      id: '3',
      type: 'review',
      title: 'New Review',
      description: '5 star rating from FoodChain Inc',
      time: '4 hours ago',
      icon: Star,
      color: '#f59e0b',
    },
    {
      id: '4',
      type: 'inventory',
      title: 'Low Stock Alert',
      description: 'Corn Grain below 20 tons',
      time: '6 hours ago',
      icon: Package,
      color: '#ef4444',
    },
  ];

  return (
    <ScrollView className="flex-1 bg-black">
      {/* Header */}
      <View className="px-6 pt-6 pb-4">
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="text-3xl font-bold text-white">Seller Dashboard</Text>
            <Text className="text-neutral-400 mt-1">Welcome back, John's Farm</Text>
          </View>
          <TouchableOpacity className="bg-neutral-800 p-3 rounded-full">
            <Bell color="#ffffff" size={20} />
          </TouchableOpacity>
        </View>

        {/* Verification Badge */}
        <Card variant="dark" className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border-green-500/30">
          <CardContent className="p-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <ShieldCheck color="#22c55e" size={24} />
              <View>
                <Text className="text-white font-semibold">Verified Premium Seller</Text>
                <Text className="text-green-400 text-sm">Quality certified • Trusted partner</Text>
              </View>
            </View>
            <View className="flex-row items-center gap-2">
              <Award color="#f59e0b" size={20} />
              <Text className="text-amber-400 font-bold">Gold</Text>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* Quick Stats */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6 mb-6">
        {quickStats.map((stat, index) => (
          <Card key={index} variant="dark" className="mr-3 bg-neutral-900 border-neutral-700" style={{ width: width * 0.42 }}>
            <CardContent className="p-4">
              <View className="flex-row items-center justify-between mb-2">
                <View className="p-2 rounded-lg" style={{ backgroundColor: `${stat.color}20` }}>
                  <stat.icon color={stat.color} size={20} />
                </View>
                {stat.trend === 'up' && (
                  <View className="bg-green-500/20 px-2 py-1 rounded">
                    <Text className="text-green-400 text-xs font-medium">{stat.change}</Text>
                  </View>
                )}
                {stat.trend === 'neutral' && (
                  <Text className="text-neutral-400 text-xs">{stat.change}</Text>
                )}
              </View>
              <Text className="text-neutral-400 text-sm mb-1">{stat.label}</Text>
              <Text className="text-white text-2xl font-bold">{stat.value}</Text>
            </CardContent>
          </Card>
        ))}
      </ScrollView>

      {/* Performance Overview */}
      <View className="px-6 mb-6">
        <Card variant="dark" className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <View className="flex-row justify-between items-center">
              <CardTitle className="text-white">Performance Overview</CardTitle>
              <View className="flex-row gap-2">
                {['week', 'month', 'year'].map((period) => (
                  <TouchableOpacity
                    key={period}
                    onPress={() => setSelectedPeriod(period)}
                    className={`px-3 py-1 rounded ${
                      selectedPeriod === period ? 'bg-blue-500' : 'bg-neutral-800'
                    }`}
                  >
                    <Text className={`text-xs capitalize ${
                      selectedPeriod === period ? 'text-white' : 'text-neutral-400'
                    }`}>
                      {period}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </CardHeader>
          <CardContent className="p-4">
            <View className="space-y-4">
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center gap-2">
                  <Target color="#22c55e" size={16} />
                  <Text className="text-neutral-300">Conversion Rate</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-white font-semibold">{metrics.conversionRate}%</Text>
                  <Text className="text-green-400 text-xs">+5%</Text>
                </View>
              </View>
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center gap-2">
                  <Users color="#3b82f6" size={16} />
                  <Text className="text-neutral-300">Repeat Customers</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-white font-semibold">{metrics.repeatCustomers}%</Text>
                  <Text className="text-green-400 text-xs">+8%</Text>
                </View>
              </View>
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center gap-2">
                  <TrendingUp color="#8b5cf6" size={16} />
                  <Text className="text-neutral-300">Growth Rate</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-white font-semibold">{metrics.growthRate}%</Text>
                  <Text className="text-green-400 text-xs">+2.3%</Text>
                </View>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* Menu Grid */}
      <View className="px-6 mb-6">
        <Text className="text-xl font-semibold text-white mb-4">Quick Actions</Text>
        <View className="flex-row flex-wrap justify-between">
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => navigation?.navigate(item.screen)}
              className="w-[48%] mb-3"
            >
              <Card variant="dark" className="bg-neutral-900 border-neutral-700">
                <CardContent className="p-4">
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="p-2 rounded-lg" style={{ backgroundColor: `${item.color}20` }}>
                      <item.icon color={item.color} size={20} />
                    </View>
                    {item.badge && (
                      <View 
                        className="px-2 py-1 rounded"
                        style={{ backgroundColor: item.badgeColor ? `${item.badgeColor}20` : '#3b82f620' }}
                      >
                        <Text 
                          className="text-xs font-medium"
                          style={{ color: item.badgeColor || '#3b82f6' }}
                        >
                          {item.badge}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-white font-medium mb-1">{item.title}</Text>
                  <Text className="text-neutral-400 text-xs">{item.subtitle}</Text>
                </CardContent>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Activities */}
      <View className="px-6 pb-6">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-semibold text-white">Recent Activities</Text>
          <TouchableOpacity className="flex-row items-center gap-1">
            <Text className="text-blue-400 text-sm">View All</Text>
            <ChevronRight color="#60a5fa" size={16} />
          </TouchableOpacity>
        </View>
        <Card variant="dark" className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            {recentActivities.map((activity, index) => (
              <View 
                key={activity.id}
                className={`flex-row items-start gap-3 ${
                  index < recentActivities.length - 1 ? 'mb-4 pb-4 border-b border-neutral-800' : ''
                }`}
              >
                <View className="p-2 rounded-lg" style={{ backgroundColor: `${activity.color}20` }}>
                  <activity.icon color={activity.color} size={16} />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-medium">{activity.title}</Text>
                  <Text className="text-neutral-400 text-sm">{activity.description}</Text>
                  <View className="flex-row items-center gap-1 mt-1">
                    <Clock color="#6b7280" size={12} />
                    <Text className="text-neutral-500 text-xs">{activity.time}</Text>
                  </View>
                </View>
              </View>
            ))}
          </CardContent>
        </Card>
      </View>
    </ScrollView>
  );
}