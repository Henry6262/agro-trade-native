import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Bell,
  Package,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Truck,
  Shield,
  ChevronRight,
  Wheat,
  AlertCircle,
} from 'lucide-react-native';

import { DashboardStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../stores/auth.store';
import sellerService, { SellerOfferSummary, SellerTradeRecord } from '../../services/sellerService';
import { sellerOfferService } from '../../services/sellerOfferService';
import { orderService } from '../../services/orderService';
import { productService } from '../../services/productService';
import { Product, Order } from '../../shared/types';
import {
  GradientBackground,
  GlassCard,
  GlassBadge,
  GlassButton,
  COLORS,
} from '../../design-system';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import { EmptyState } from '../../shared/components/EmptyState';

type NavigationProp = NativeStackNavigationProp<DashboardStackParamList>;

export default function UnifiedDashboardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();
  const role = (user?.role || 'FARMER').toLowerCase();
  const isSeller = role === 'farmer' || role === 'seller';
  const isBuyer = role === 'buyer';
  const isTransporter = role === 'transporter' || role === 'transport';

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [offers, setOffers] = useState<SellerOfferSummary[]>([]);
  const [trades, setTrades] = useState<SellerTradeRecord[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      if (isSeller) {
        const [offersRes, tradesRes] = await Promise.all([
          sellerService.getMyOffers(),
          sellerService.getMyTrades({ limit: 10 }),
        ]);
        setOffers(offersRes.data?.offers || []);
        setTrades(Array.isArray(tradesRes) ? tradesRes : tradesRes.items || []);
      } else if (isBuyer) {
        const [ordersRes, productsRes] = await Promise.all([
          orderService.getOrders({ limit: 10 }),
          productService.getProducts(),
        ]);
        setOrders(ordersRes.data || []);
        setProducts(productsRes.data || []);
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    }
  }, [isSeller, isBuyer]);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleAccept = async (negotiationId: string) => {
    setActionLoading(negotiationId);
    await sellerOfferService.acceptOffer(negotiationId);
    await fetchData();
    setActionLoading(null);
  };

  const handleReject = async (negotiationId: string) => {
    setActionLoading(negotiationId);
    await sellerOfferService.rejectOffer(negotiationId);
    await fetchData();
    setActionLoading(null);
  };

  const navigateToTrade = (tradeId: string) => navigation.navigate('TradeDetail', { tradeId });
  const navigateToProduct = (productId: string) =>
    navigation.navigate('TradeDetail', { tradeId: productId } as any);

  // ─── SELLER VIEW ───
  const renderSellerView = () => (
    <>
      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <StatBox
          value={offers.filter((o) => (o.status || '').toLowerCase() === 'pending').length}
          label="New Offers"
          icon={<Bell size={16} color={COLORS.accentGold} />}
        />
        <StatBox
          value={trades.length}
          label="Active Trades"
          icon={<Package size={16} color="#4ADE80" />}
        />
        <StatBox
          value={trades.filter((t) => (t.status || '').toLowerCase() === 'complete').length}
          label="Completed"
          icon={<TrendingUp size={16} color="#4ADE80" />}
        />
      </View>

      {/* Offers Section */}
      <SectionHeader title="Incoming Offers" count={offers.length} />
      {offers
        .filter((o) => (o.status || '').toLowerCase() === 'pending')
        .slice(0, 3)
        .map((offer) => (
          <GlassCard key={offer.id} tier="medium" style={styles.offerCard} animate={false}>
            <View style={styles.offerHeader}>
              <Text style={styles.offerProduct}>{offer.product}</Text>
              <GlassBadge label={offer.status} variant="warning" size="sm" />
            </View>
            <Text style={styles.offerMeta}>
              {offer.buyer} • {offer.quantity} tons @ ${offer.offeredPricePerTon}/ton
            </Text>
            <Text style={styles.offerValue}>
              Total:{' '}
              <Text style={{ color: COLORS.accentGold, fontWeight: '800' }}>
                ${offer.totalValue.toLocaleString()}
              </Text>
            </Text>
            <View style={styles.offerActions}>
              <GlassButton
                label="Reject"
                onPress={() => handleReject(offer.negotiationId)}
                variant="ghost"
                size="sm"
                style={styles.actionBtn}
                disabled={actionLoading === offer.negotiationId}
              />
              <GlassButton
                label="Accept"
                onPress={() => handleAccept(offer.negotiationId)}
                variant="primary"
                size="sm"
                style={styles.actionBtn}
                disabled={actionLoading === offer.negotiationId}
              />
            </View>
          </GlassCard>
        ))}
      {offers.filter((o) => (o.status || '').toLowerCase() === 'pending').length === 0 && (
        <EmptyState
          title="No pending offers"
          subtitle="Buyers will send offers here."
          icon={<Bell size={28} color="rgba(255,255,255,0.2)" />}
        />
      )}

      {/* Trades Section */}
      <SectionHeader title="Active Trades" count={trades.length} />
      {trades.slice(0, 5).map((trade) => (
        <TouchableOpacity
          key={trade.id}
          onPress={() => navigateToTrade(trade.id)}
          activeOpacity={0.8}
        >
          <GlassCard tier="subtle" style={styles.tradeCard} animate={false}>
            <View style={styles.tradeRow}>
              <Package size={16} color="rgba(255,255,255,0.5)" />
              <View style={styles.tradeInfo}>
                <Text style={styles.tradeName}>{trade.productName || trade.product?.name}</Text>
                <Text style={styles.tradeMeta}>
                  {trade.buyerName || trade.buyer?.name} • {trade.agreedQuantity || trade.quantity}{' '}
                  {trade.unit}
                </Text>
              </View>
              <ChevronRight size={14} color="rgba(255,255,255,0.3)" />
            </View>
          </GlassCard>
        </TouchableOpacity>
      ))}
    </>
  );

  // ─── BUYER VIEW ───
  const renderBuyerView = () => (
    <>
      <View style={styles.statsRow}>
        <StatBox
          value={orders.length}
          label="Orders"
          icon={<ShoppingCart size={16} color={COLORS.accentGold} />}
        />
        <StatBox
          value={orders.filter((o) => (o.status || '').toLowerCase() === 'pending').length}
          label="Pending"
          icon={<Bell size={16} color="#FCD34D" />}
        />
        <StatBox
          value={orders.filter((o) => (o.status || '').toLowerCase() === 'delivered').length}
          label="Delivered"
          icon={<TrendingUp size={16} color="#4ADE80" />}
        />
      </View>

      <SectionHeader title="Browse Marketplace" count={products.length} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productScroll}>
        {products.slice(0, 8).map((product) => (
          <TouchableOpacity
            key={product.id}
            onPress={() => navigateToProduct(product.id)}
            activeOpacity={0.8}
          >
            <GlassCard tier="medium" style={styles.productCard} animate={false}>
              <View style={styles.productImage}>
                <Wheat size={24} color="rgba(255,255,255,0.2)" />
              </View>
              <Text style={styles.productCardName} numberOfLines={1}>
                {product.name}
              </Text>
              <Text style={styles.productCardPrice}>
                ${product.price}/{product.unit}
              </Text>
              <Text style={styles.productCardSeller} numberOfLines={1}>
                {product.seller?.name}
              </Text>
            </GlassCard>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <SectionHeader title="My Orders" count={orders.length} />
      {orders.slice(0, 5).map((order) => (
        <GlassCard key={order.id} tier="subtle" style={styles.tradeCard} animate={false}>
          <View style={styles.tradeRow}>
            <ShoppingCart size={16} color="rgba(255,255,255,0.5)" />
            <View style={styles.tradeInfo}>
              <Text style={styles.tradeName}>Order #{order.id.slice(-6).toUpperCase()}</Text>
              <Text style={styles.tradeMeta}>
                {order.items?.length || 0} items • ${order.totalAmount}
              </Text>
            </View>
            <GlassBadge label={order.status} variant="muted" size="sm" />
          </View>
        </GlassCard>
      ))}
    </>
  );

  // ─── TRANSPORTER VIEW ───
  const renderTransporterView = () => (
    <EmptyState
      title="Transporter Dashboard"
      subtitle="Available transport jobs and your active deliveries will appear here."
      icon={<Truck size={32} color="rgba(255,255,255,0.3)" />}
    />
  );

  if (loading && !refreshing) {
    return (
      <GradientBackground>
        <View style={styles.center}>
          <LoadingSpinner message="Loading your dashboard..." />
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good day,</Text>
            <Text style={styles.name}>{user?.name || 'Guest'}</Text>
          </View>
          <View style={styles.roleBadge}>
            <Shield size={12} color={COLORS.accentGreen} />
            <Text style={styles.roleText}>
              {isSeller ? 'SELLER' : isBuyer ? 'BUYER' : 'TRANSPORTER'}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4ADE80" />
          }
        >
          {isSeller && renderSellerView()}
          {isBuyer && renderBuyerView()}
          {isTransporter && renderTransporterView()}
        </ScrollView>
      </View>
    </GradientBackground>
  );
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionCount}>{count}</Text>
    </View>
  );
}

function StatBox({ value, label, icon }: { value: number; label: string; icon: React.ReactNode }) {
  return (
    <GlassCard tier="subtle" style={styles.statBox} animate={false}>
      {icon}
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  actionBtn: { flex: 1 },
  center: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 },
  container: { flex: 1, paddingTop: 60 },
  greeting: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  name: { color: '#fff', fontSize: 20, fontWeight: '800' },
  offerActions: { flexDirection: 'row', gap: 10 },
  offerCard: { marginBottom: 10, padding: 14 },
  offerHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  offerMeta: { color: 'rgba(255,255,255,0.55)', fontSize: 13, marginBottom: 4 },
  offerProduct: { color: '#fff', flex: 1, fontSize: 15, fontWeight: '700' },
  offerValue: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 12 },
  productCard: { alignItems: 'center', marginRight: 10, padding: 12, width: 140 },
  productCardName: { color: '#fff', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  productCardPrice: { color: COLORS.accentGold, fontSize: 13, fontWeight: '700', marginTop: 4 },
  productCardSeller: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  productImage: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    height: 60,
    justifyContent: 'center',
    marginBottom: 10,
    width: 60,
  },
  productScroll: { marginBottom: 16 },
  roleBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(74,222,128,0.12)',
    borderColor: 'rgba(74,222,128,0.25)',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  roleText: { color: COLORS.accentGreen, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  sectionCount: { color: COLORS.accentGold, fontSize: 13, fontWeight: '700' },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  statBox: { alignItems: 'center', flex: 1, gap: 6, padding: 12 },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statValue: { color: '#fff', fontSize: 20, fontWeight: '800' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  tradeCard: { marginBottom: 8, padding: 12 },
  tradeInfo: { flex: 1 },
  tradeMeta: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 },
  tradeName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  tradeRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
});
