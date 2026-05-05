import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Package,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Truck,
  Wheat,
} from 'lucide-react-native';

import { DashboardStackParamList } from '../../../navigation/types';
import { orderService } from '../../../services/orderService';
import { productService } from '../../../services/productService';
import { Order, Product } from '../../../shared/types';
import { GlassCard, StatCard, GlassBadge, COLORS } from '../../../design-system';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { EmptyState } from '../../../shared/components/EmptyState';

interface BuyerDashboardSectionProps {
  activeTab?: string;
}

type NavigationProp = NativeStackNavigationProp<DashboardStackParamList>;

export function BuyerDashboardSection({ activeTab = 'orders' }: BuyerDashboardSectionProps) {
  const navigation = useNavigation<NavigationProp>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    pending: number;
    completed: number;
    cancelled: number;
    totalSpent: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const [ordersRes, statsData, productsRes] = await Promise.all([
        orderService.getOrders({ limit: 20 }),
        orderService.getOrderStats(),
        productService.getProducts(),
      ]);
      setOrders(ordersRes.data || []);
      setStats(statsData);
      setProducts(productsRes.data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load orders');
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const navigateToOrder = (orderId: string) => {
    // OrderDetail lives in the root stack / orders tab
    // Navigate via root navigator from within dashboard
    (navigation as any).getParent()?.navigate('OrderDetail', { orderId });
  };

  const getStatusConfig = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'delivered' || s === 'complete' || s === 'confirmed')
      return { icon: <CheckCircle2 size={14} color="#4ADE80" />, color: '#4ADE80', label: status.toUpperCase() };
    if (s === 'cancelled' || s === 'refunded')
      return { icon: <XCircle size={14} color="#F87171" />, color: '#F87171', label: status.toUpperCase() };
    if (s === 'shipped')
      return { icon: <Truck size={14} color="#4ADE80" />, color: '#4ADE80', label: 'IN TRANSIT' };
    if (s === 'pending')
      return { icon: <Clock size={14} color="#FCD34D" />, color: '#FCD34D', label: 'PENDING' };
    return { icon: <Package size={14} color="#FCD34D" />, color: '#FCD34D', label: status.toUpperCase() };
  };

  const renderStats = () => {
    if (!stats) return null;
    return (
      <View style={styles.statsRow}>
        <StatCard
          label="Total Orders"
          value={stats.total}
          icon={<ShoppingCart size={16} color={COLORS.accentGold} />}
          color={COLORS.accentGold}
          style={styles.statCard}
          delay={0}
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          icon={<Clock size={16} color="#FCD34D" />}
          color="#FCD34D"
          style={styles.statCard}
          delay={50}
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          icon={<CheckCircle2 size={16} color="#4ADE80" />}
          color="#4ADE80"
          style={styles.statCard}
          delay={100}
        />
        <StatCard
          label="Total Spent"
          value={stats.totalSpent}
          prefix="$"
          icon={<DollarSign size={16} color="#FCD34D" />}
          color="#FCD34D"
          style={styles.statCard}
          delay={150}
        />
      </View>
    );
  };

  const renderOrders = () => {
    if (orders.length === 0) {
      return (
        <EmptyState
          title="No orders yet"
          subtitle="Your orders will appear here once you start purchasing products."
          icon={<ShoppingCart size={32} color="rgba(255,255,255,0.3)" />}
        />
      );
    }
    return (
      <View style={styles.list}>
        {orders.map((order, index) => {
          const statusConfig = getStatusConfig(order.status);
          const totalItems = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
          return (
            <TouchableOpacity
              key={order.id || index}
              onPress={() => navigateToOrder(order.id)}
              activeOpacity={0.8}
            >
              <GlassCard tier="medium" style={styles.listCard} delay={index * 40}>
                <View style={styles.listCardHeader}>
                  <View style={styles.listCardTitleRow}>
                    <Text style={styles.listCardTitle} numberOfLines={1}>
                      Order #{order.id.slice(-6).toUpperCase()}
                    </Text>
                    <ChevronRight size={16} color="rgba(255,255,255,0.4)" />
                  </View>
                  <GlassBadge label={statusConfig.label} variant="muted" size="sm" />
                </View>
                <View style={styles.listCardMeta}>
                  <Text style={styles.listCardMetaText}>
                    {order.items?.length || 0} product{order.items?.length !== 1 ? 's' : ''}
                  </Text>
                  <Text style={styles.listCardMetaText}>•</Text>
                  <Text style={styles.listCardMetaText}>{totalItems} units</Text>
                </View>
                <View style={styles.orderFooter}>
                  <Text style={styles.orderTotal}>
                    ${order.totalAmount?.toLocaleString() || 0}
                  </Text>
                  <Text style={styles.orderDate}>
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                  </Text>
                </View>
              </GlassCard>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderRequests = () => (
    <EmptyState
      title="Purchase Requests"
      subtitle="Request quotes from sellers and track your RFQs here."
      icon={<Package size={32} color="rgba(255,255,255,0.3)" />}
    />
  );

  const navigateToProduct = (productId: string) => {
    (navigation as any).getParent()?.navigate('ProductDetail', { productId });
  };

  const renderMarket = () => {
    if (products.length === 0) {
      return (
        <EmptyState
          title="No products available"
          subtitle="Check back later for new listings."
          icon={<Wheat size={32} color="rgba(255,255,255,0.3)" />}
        />
      );
    }
    return (
      <View style={styles.list}>
        {products.map((product, index) => (
          <TouchableOpacity
            key={product.id || index}
            onPress={() => navigateToProduct(product.id)}
            activeOpacity={0.8}
          >
            <GlassCard tier="medium" style={styles.listCard} delay={index * 40}>
              <View style={styles.listCardHeader}>
                <View style={styles.listCardTitleRow}>
                  <Text style={styles.listCardTitle} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <ChevronRight size={16} color="rgba(255,255,255,0.4)" />
                </View>
                <GlassBadge
                  label={product.quality?.grade || 'A'}
                  variant="success"
                  size="sm"
                />
              </View>
              <View style={styles.listCardMeta}>
                <Text style={styles.listCardMetaText}>
                  {product.category?.name || 'General'}
                </Text>
                <Text style={styles.listCardMetaText}>•</Text>
                <Text style={styles.listCardMetaText}>
                  {product.quantity} {product.unit} available
                </Text>
              </View>
              <View style={styles.orderFooter}>
                <Text style={styles.orderTotal}>
                  ${product.price}/{product.unit}
                </Text>
                <Text style={styles.orderDate}>
                  {product.seller?.name || 'Unknown Seller'}
                </Text>
              </View>
            </GlassCard>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <LoadingSpinner message="Loading orders..." />
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={styles.center}>
        <EmptyState
          title="Error loading orders"
          subtitle={error}
          cta="Retry"
          onPress={fetchData}
          icon={<AlertCircle size={32} color="#F87171" />}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4ADE80" />
      }
    >
      {renderStats()}
      <View style={styles.tabContent}>
        {activeTab === 'orders' && renderOrders()}
        {activeTab === 'requests' && renderRequests()}
        {(activeTab === 'market' || activeTab === 'intelligence') && renderMarket()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: '47%',
    minWidth: 140,
  },
  tabContent: {
    flex: 1,
  },
  list: {
    gap: 12,
  },
  listCard: {
    marginBottom: 12,
  },
  listCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  listCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  listCardTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  listCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  listCardMetaText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  orderTotal: {
    color: COLORS.accentGold,
    fontSize: 16,
    fontWeight: '800',
  },
  orderDate: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
});

export default BuyerDashboardSection;
