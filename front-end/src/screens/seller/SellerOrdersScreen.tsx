import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import {
  Package,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  DollarSign,
  Calendar,
  User,
  Phone,
  Mail,
  MessageSquare,
  ChevronRight,
  Filter,
  Search,
  AlertCircle,
  FileText,
  Download,
  Eye,
  TrendingUp,
  Star,
  Shield,
} from 'lucide-react-native';

import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';

interface Order {
  id: string;
  orderNumber: string;
  product: string;
  productId: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalValue: number;
  buyer: {
    name: string;
    company: string;
    location: string;
    rating: number;
    verified: boolean;
    phone: string;
    email: string;
  };
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded';
  paymentTerms: string;
  orderDate: string;
  deliveryDate: string;
  actualDeliveryDate?: string;
  shipping: {
    method: string;
    carrier: string;
    trackingNumber?: string;
    estimatedDays: number;
    address: string;
  };
  documents: string[];
  notes?: string;
  stage: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export default function SellerOrdersScreen({ navigation }: any) {
  const [selectedTab, setSelectedTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const orders: Order[] = [
    {
      id: 'ORD001',
      orderNumber: '#ORD-2025-001',
      product: 'Premium Wheat',
      productId: 'P001',
      quantity: 50,
      unit: 'tons',
      pricePerUnit: 285,
      totalValue: 14250,
      buyer: {
        name: 'John Smith',
        company: 'GrainTech Solutions',
        location: 'Chicago, IL',
        rating: 4.8,
        verified: true,
        phone: '+1 312-555-0123',
        email: 'john@graintech.com',
      },
      status: 'confirmed',
      paymentStatus: 'partial',
      paymentTerms: '50% advance, 50% on delivery',
      orderDate: '2025-01-20',
      deliveryDate: '2025-02-15',
      shipping: {
        method: 'Truck',
        carrier: 'FastHaul Logistics',
        trackingNumber: 'FH123456789',
        estimatedDays: 5,
        address: '123 Industrial Ave, Chicago, IL 60601',
      },
      documents: ['Invoice', 'Quality Certificate', 'Shipping Label'],
      notes: 'Rush delivery required for production schedule',
      stage: 1,
      priority: 'high',
    },
    {
      id: 'ORD002',
      orderNumber: '#ORD-2025-002',
      product: 'Soybeans',
      productId: 'P003',
      quantity: 75,
      unit: 'tons',
      pricePerUnit: 375,
      totalValue: 28125,
      buyer: {
        name: 'Sarah Johnson',
        company: 'FoodChain Inc',
        location: 'Detroit, MI',
        rating: 4.9,
        verified: true,
        phone: '+1 313-555-0456',
        email: 'sarah@foodchain.com',
      },
      status: 'shipped',
      paymentStatus: 'paid',
      paymentTerms: 'Full payment in advance',
      orderDate: '2025-01-18',
      deliveryDate: '2025-02-10',
      shipping: {
        method: 'Train',
        carrier: 'RailCargo Express',
        trackingNumber: 'RC987654321',
        estimatedDays: 7,
        address: '456 Commerce St, Detroit, MI 48201',
      },
      documents: ['Invoice', 'Quality Certificate', 'Bill of Lading'],
      notes: 'Premium grade required for export',
      stage: 3,
      priority: 'medium',
    },
    {
      id: 'ORD003',
      orderNumber: '#ORD-2025-003',
      product: 'Corn Grain',
      productId: 'P002',
      quantity: 30,
      unit: 'tons',
      pricePerUnit: 220,
      totalValue: 6600,
      buyer: {
        name: 'Mike Brown',
        company: 'AgriProcess Corp',
        location: 'Milwaukee, WI',
        rating: 4.5,
        verified: false,
        phone: '+1 414-555-0789',
        email: 'mike@agriprocess.com',
      },
      status: 'pending',
      paymentStatus: 'pending',
      paymentTerms: 'Net 30 days',
      orderDate: '2025-01-22',
      deliveryDate: '2025-02-18',
      shipping: {
        method: 'Truck',
        carrier: 'Midwest Transport',
        estimatedDays: 3,
        address: '789 Farm Road, Milwaukee, WI 53201',
      },
      documents: ['Proforma Invoice'],
      stage: 0,
      priority: 'low',
    },
  ];

  const stats = {
    totalOrders: orders.length,
    activeOrders: orders.filter(o => ['confirmed', 'processing', 'shipped'].includes(o.status)).length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    completedOrders: orders.filter(o => o.status === 'delivered').length,
    totalRevenue: orders.reduce((sum, o) => sum + o.totalValue, 0),
    averageOrderValue: orders.reduce((sum, o) => sum + o.totalValue, 0) / orders.length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'confirmed': return '#3b82f6';
      case 'processing': return '#8b5cf6';
      case 'shipped': return '#06b6d4';
      case 'delivered': return '#22c55e';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#22c55e';
      case 'partial': return '#f59e0b';
      case 'pending': return '#ef4444';
      case 'refunded': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
      case 'low': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const renderOrderStage = (stage: number) => {
    const stages = [
      { name: 'Pending', icon: Clock },
      { name: 'Confirmed', icon: CheckCircle },
      { name: 'Processing', icon: Package },
      { name: 'Shipped', icon: Truck },
      { name: 'Delivered', icon: MapPin },
    ];

    return (
      <View className="mb-4">
        <View className="flex-row justify-between px-2">
          {stages.map((s, index) => {
            const IconComponent = s.icon;
            const isCompleted = index <= stage;
            const isCurrent = index === stage;

            return (
              <View key={index} className="items-center">
                <View
                  className={`w-8 h-8 rounded-full items-center justify-center ${
                    isCompleted
                      ? isCurrent ? 'bg-blue-500' : 'bg-green-500'
                      : 'bg-neutral-700'
                  }`}
                >
                  <IconComponent
                    color="#ffffff"
                    size={16}
                  />
                </View>
                <Text className={`text-xs mt-1 ${
                  isCompleted ? 'text-white' : 'text-neutral-500'
                }`}>
                  {s.name}
                </Text>
              </View>
            );
          })}
        </View>
        <View className="flex-row absolute top-4 left-8 right-8">
          <View className={`flex-1 h-0.5 ${stage >= 1 ? 'bg-green-500' : 'bg-neutral-700'}`} />
          <View className={`flex-1 h-0.5 ${stage >= 2 ? 'bg-green-500' : 'bg-neutral-700'}`} />
          <View className={`flex-1 h-0.5 ${stage >= 3 ? 'bg-green-500' : 'bg-neutral-700'}`} />
          <View className={`flex-1 h-0.5 ${stage >= 4 ? 'bg-green-500' : 'bg-neutral-700'}`} />
        </View>
      </View>
    );
  };

  const OrderCard = ({ order }: { order: Order }) => (
    <Card variant="dark" className="mb-4 bg-neutral-900 border-neutral-700">
      <CardContent className="p-4">
        {/* Order Header */}
        <View className="flex-row justify-between items-start mb-3">
          <View>
            <View className="flex-row items-center gap-2">
              <Text className="text-lg font-semibold text-white">{order.orderNumber}</Text>
              <View 
                className="px-2 py-0.5 rounded"
                style={{ backgroundColor: `${getPriorityColor(order.priority)}20` }}
              >
                <Text 
                  className="text-xs capitalize"
                  style={{ color: getPriorityColor(order.priority) }}
                >
                  {order.priority}
                </Text>
              </View>
            </View>
            <Text className="text-neutral-400 text-sm">{order.product}</Text>
          </View>
          <View className="items-end">
            <View 
              className="px-2 py-1 rounded mb-1"
              style={{ backgroundColor: `${getStatusColor(order.status)}20` }}
            >
              <Text 
                className="text-xs capitalize font-medium"
                style={{ color: getStatusColor(order.status) }}
              >
                {order.status}
              </Text>
            </View>
            <View 
              className="px-2 py-1 rounded"
              style={{ backgroundColor: `${getPaymentStatusColor(order.paymentStatus)}20` }}
            >
              <Text 
                className="text-xs capitalize"
                style={{ color: getPaymentStatusColor(order.paymentStatus) }}
              >
                Payment: {order.paymentStatus}
              </Text>
            </View>
          </View>
        </View>

        {/* Order Details */}
        <View className="flex-row gap-3 mb-3">
          <View className="flex-1 bg-neutral-800/50 p-2 rounded">
            <Text className="text-neutral-400 text-xs mb-1">Quantity</Text>
            <Text className="text-white font-semibold">{order.quantity} {order.unit}</Text>
          </View>
          <View className="flex-1 bg-neutral-800/50 p-2 rounded">
            <Text className="text-neutral-400 text-xs mb-1">Total Value</Text>
            <Text className="text-green-400 font-semibold">${order.totalValue.toLocaleString()}</Text>
          </View>
          <View className="flex-1 bg-neutral-800/50 p-2 rounded">
            <Text className="text-neutral-400 text-xs mb-1">Delivery</Text>
            <Text className="text-white font-semibold">
              {new Date(order.deliveryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
          </View>
        </View>

        {/* Buyer Info */}
        <View className="bg-neutral-800/30 p-3 rounded mb-3">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              <User color="#60a5fa" size={14} />
              <Text className="text-white font-medium">{order.buyer.company}</Text>
              {order.buyer.verified && (
                <Shield color="#22c55e" size={14} />
              )}
            </View>
            <View className="flex-row items-center gap-1">
              <Star color="#f59e0b" size={12} />
              <Text className="text-white text-sm">{order.buyer.rating}</Text>
            </View>
          </View>
          <Text className="text-neutral-400 text-sm">{order.buyer.name}</Text>
          <View className="flex-row items-center gap-1 mt-1">
            <MapPin color="#9ca3af" size={12} />
            <Text className="text-neutral-400 text-xs">{order.buyer.location}</Text>
          </View>
        </View>

        {/* Order Progress */}
        {renderOrderStage(order.stage)}

        {/* Shipping Info */}
        <View className="flex-row items-center justify-between mb-3 p-3 bg-neutral-800/30 rounded">
          <View className="flex-row items-center gap-2">
            <Truck color="#60a5fa" size={16} />
            <View>
              <Text className="text-white text-sm">{order.shipping.carrier}</Text>
              <Text className="text-neutral-400 text-xs">{order.shipping.method} • {order.shipping.estimatedDays} days</Text>
            </View>
          </View>
          {order.shipping.trackingNumber && (
            <TouchableOpacity className="bg-blue-500/20 px-2 py-1 rounded">
              <Text className="text-blue-400 text-xs">Track</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Actions */}
        <View className="flex-row gap-2">
          <TouchableOpacity 
            className="flex-1 bg-blue-500 py-2 rounded items-center"
            onPress={() => setSelectedOrder(order)}
          >
            <Text className="text-white text-sm font-medium">View Details</Text>
          </TouchableOpacity>
          <TouchableOpacity className="px-3 py-2 bg-neutral-800 rounded items-center justify-center">
            <MessageSquare color="#ffffff" size={16} />
          </TouchableOpacity>
          <TouchableOpacity className="px-3 py-2 bg-neutral-800 rounded items-center justify-center">
            <FileText color="#ffffff" size={16} />
          </TouchableOpacity>
        </View>
      </CardContent>
    </Card>
  );

  return (
    <View className="flex-1 bg-black">
      {/* Header */}
      <View className="px-6 pt-6 pb-4">
        <View className="mb-4">
          <Text className="text-2xl font-bold text-white">Orders & Trades</Text>
          <Text className="text-neutral-400">Manage your sales orders</Text>
        </View>

        {/* Stats Overview */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <Card variant="dark" className="mr-3 bg-neutral-900 border-neutral-700" style={{ width: 120 }}>
            <CardContent className="p-3">
              <Text className="text-neutral-400 text-xs mb-1">Total Orders</Text>
              <Text className="text-white text-xl font-bold">{stats.totalOrders}</Text>
              <Text className="text-green-400 text-xs">+12% this month</Text>
            </CardContent>
          </Card>
          <Card variant="dark" className="mr-3 bg-neutral-900 border-neutral-700" style={{ width: 120 }}>
            <CardContent className="p-3">
              <Text className="text-neutral-400 text-xs mb-1">Active</Text>
              <Text className="text-blue-400 text-xl font-bold">{stats.activeOrders}</Text>
              <Text className="text-neutral-400 text-xs">In progress</Text>
            </CardContent>
          </Card>
          <Card variant="dark" className="mr-3 bg-neutral-900 border-neutral-700" style={{ width: 120 }}>
            <CardContent className="p-3">
              <Text className="text-neutral-400 text-xs mb-1">Pending</Text>
              <Text className="text-amber-400 text-xl font-bold">{stats.pendingOrders}</Text>
              <Text className="text-neutral-400 text-xs">Need action</Text>
            </CardContent>
          </Card>
          <Card variant="dark" className="bg-neutral-900 border-neutral-700" style={{ width: 140 }}>
            <CardContent className="p-3">
              <Text className="text-neutral-400 text-xs mb-1">Revenue</Text>
              <Text className="text-green-400 text-xl font-bold">${(stats.totalRevenue / 1000).toFixed(1)}k</Text>
              <Text className="text-green-400 text-xs">+23% growth</Text>
            </CardContent>
          </Card>
        </ScrollView>

        {/* Search and Filter */}
        <View className="bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 flex-row items-center gap-3 mb-4">
          <Search color="#9ca3af" size={20} />
          <TextInput
            placeholder="Search orders..."
            placeholderTextColor="#6b7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 text-white"
          />
          <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
            <Filter color="#60a5fa" size={20} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View className="flex-row gap-2">
          {['active', 'pending', 'completed', 'cancelled'].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setSelectedTab(tab)}
              className={`px-4 py-2 rounded-lg ${
                selectedTab === tab ? 'bg-blue-500' : 'bg-neutral-800'
              }`}
            >
              <Text className={`capitalize ${
                selectedTab === tab ? 'text-white' : 'text-neutral-400'
              } font-medium`}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Orders List */}
      <ScrollView className="px-6">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </ScrollView>

      {/* Order Details Modal */}
      {selectedOrder && (
        <Modal
          visible={!!selectedOrder}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setSelectedOrder(null)}
        >
          <View className="flex-1 bg-black/80">
            <View className="flex-1 bg-neutral-900 mt-20 rounded-t-3xl">
              <ScrollView>
                <View className="px-6 py-4 border-b border-neutral-700">
                  <View className="flex-row justify-between items-center">
                    <View>
                      <Text className="text-xl font-semibold text-white">{selectedOrder.orderNumber}</Text>
                      <Text className="text-neutral-400">{selectedOrder.product}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                      <Text className="text-blue-400">Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View className="px-6 py-4 space-y-4">
                  {/* Order Summary */}
                  <View className="bg-neutral-800 rounded-lg p-4">
                    <Text className="text-white font-medium mb-3">Order Summary</Text>
                    <View className="space-y-2">
                      <View className="flex-row justify-between">
                        <Text className="text-neutral-400">Quantity</Text>
                        <Text className="text-white">{selectedOrder.quantity} {selectedOrder.unit}</Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-neutral-400">Price per Unit</Text>
                        <Text className="text-white">${selectedOrder.pricePerUnit}</Text>
                      </View>
                      <View className="flex-row justify-between pt-2 border-t border-neutral-700">
                        <Text className="text-white font-medium">Total Value</Text>
                        <Text className="text-green-400 font-bold">${selectedOrder.totalValue.toLocaleString()}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Buyer Details */}
                  <View className="bg-neutral-800 rounded-lg p-4">
                    <Text className="text-white font-medium mb-3">Buyer Information</Text>
                    <View className="space-y-3">
                      <View className="flex-row items-center gap-2">
                        <User color="#60a5fa" size={16} />
                        <Text className="text-white">{selectedOrder.buyer.name}</Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <Phone color="#60a5fa" size={16} />
                        <Text className="text-white">{selectedOrder.buyer.phone}</Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <Mail color="#60a5fa" size={16} />
                        <Text className="text-white">{selectedOrder.buyer.email}</Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <MapPin color="#60a5fa" size={16} />
                        <Text className="text-white">{selectedOrder.shipping.address}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Documents */}
                  <View className="bg-neutral-800 rounded-lg p-4">
                    <Text className="text-white font-medium mb-3">Documents</Text>
                    <View className="space-y-2">
                      {selectedOrder.documents.map((doc, index) => (
                        <TouchableOpacity 
                          key={index} 
                          className="flex-row items-center justify-between p-3 bg-neutral-700 rounded"
                        >
                          <View className="flex-row items-center gap-2">
                            <FileText color="#60a5fa" size={16} />
                            <Text className="text-white">{doc}</Text>
                          </View>
                          <Download color="#60a5fa" size={16} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View className="flex-row gap-3 pb-4">
                    <TouchableOpacity className="flex-1 bg-green-500 py-3 rounded-lg items-center">
                      <Text className="text-white font-medium">Update Status</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="flex-1 bg-blue-500 py-3 rounded-lg items-center">
                      <Text className="text-white font-medium">Contact Buyer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}