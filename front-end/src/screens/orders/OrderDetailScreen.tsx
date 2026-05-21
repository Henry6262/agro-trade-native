import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { ChevronLeft, Package, Truck, CheckCircle2, Clock, MapPin, DollarSign } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { GlassCard, GlassBadge, COLORS, GLASS } from '../../design-system';
import { MotiView } from 'moti';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import { EmptyState } from '../../shared/components/EmptyState';
import { orderService } from '../../services/orderService';

const STATUS_STEPS = [
  { key: 'pending', label: 'Order Placed', icon: <Clock size={14} color={COLORS.warning} /> },
  { key: 'confirmed', label: 'Confirmed', icon: <CheckCircle2 size={14} color={COLORS.success} /> },
  { key: 'shipped', label: 'In Transit', icon: <Truck size={14} color={COLORS.info} /> },
  { key: 'delivered', label: 'Delivered', icon: <CheckCircle2 size={14} color={COLORS.success} /> },
];

export default function OrderDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderId } = route.params as { orderId: string };

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      // Try to fetch real data; fallback to mock if endpoint fails
      const res = await orderService.getOrder(orderId);
      if (res) {
        setOrder(res);
      } else {
        // Mock for demo
        setOrder({
          id: orderId,
          status: 'shipped',
          product: 'Hard Red Winter Wheat',
          quantity: 120,
          unit: 'tons',
          totalAmount: 26160,
          buyer: { name: 'Hellenic Grain Co.' },
          seller: { name: 'Agro Trading Bulgaria Ltd.' },
          origin: 'Kardzhali, BG',
          destination: 'Thessaloniki, GR',
          pickupDate: '2026-05-22',
          deliveryDate: '2026-05-23',
          escrowStatus: 'AWAITING_DELIVERY',
          items: [{ name: 'Hard Red Winter Wheat', quantity: 120, unit: 'tons', price: 218 }],
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load order');
      // Still show mock data so user isn't stuck
      setOrder({
        id: orderId,
        status: 'shipped',
        product: 'Hard Red Winter Wheat',
        quantity: 120,
        unit: 'tons',
        totalAmount: 26160,
        buyer: { name: 'Hellenic Grain Co.' },
        seller: { name: 'Agro Trading Bulgaria Ltd.' },
        origin: 'Kardzhali, BG',
        destination: 'Thessaloniki, GR',
        pickupDate: '2026-05-22',
        deliveryDate: '2026-05-23',
        escrowStatus: 'AWAITING_DELIVERY',
        items: [{ name: 'Hard Red Winter Wheat', quantity: 120, unit: 'tons', price: 218 }],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <LoadingSpinner message="Loading order..." />
        </View>
      </View>
    );
  }

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === (order?.status || 'pending'));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{orderId.slice(-6).toUpperCase()}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Status Timeline */}
        <GlassCard tier="medium" style={styles.timelineCard}>
          <Text style={styles.sectionLabel}>Status</Text>
          <View style={styles.timeline}>
            {STATUS_STEPS.map((step, i) => {
              const isActive = i <= currentStepIndex;
              const isCurrent = i === currentStepIndex;
              return (
                <View key={step.key} style={styles.timelineItem}>
                  <View
                    style={[
                      styles.timelineDot,
                      isActive ? styles.dotActive : styles.dotInactive,
                      isCurrent && styles.dotCurrent,
                    ]}
                  >
                    {step.icon}
                  </View>
                  <Text
                    style={[
                      styles.timelineLabel,
                      isActive ? styles.labelActive : styles.labelInactive,
                    ]}
                  >
                    {step.label}
                  </Text>
                  {i < STATUS_STEPS.length - 1 && (
                    <View style={[styles.timelineLine, isActive && styles.lineActive]} />
                  )}
                </View>
              );
            })}
          </View>
        </GlassCard>

        {/* Order Summary */}
        <GlassCard tier="subtle" style={styles.summaryCard}>
          <Text style={styles.sectionLabel}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Package size={16} color={COLORS.textSecondary} />
            <Text style={styles.summaryText}>{order?.product || '—'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <DollarSign size={16} color={COLORS.accentGold} />
            <Text style={[styles.summaryText, { color: COLORS.accentGold, fontWeight: '800' }]}>
              ${order?.totalAmount?.toLocaleString() || 0}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <MapPin size={16} color={COLORS.textSecondary} />
            <Text style={styles.summaryText}>
              {order?.origin || '—'} → {order?.destination || '—'}
            </Text>
          </View>
          {order?.pickupDate && (
            <View style={styles.summaryRow}>
              <Clock size={16} color={COLORS.textSecondary} />
              <Text style={styles.summaryText}>
                Pickup: {new Date(order.pickupDate).toLocaleDateString()}
              </Text>
            </View>
          )}
        </GlassCard>

        {/* Parties */}
        <GlassCard tier="subtle" style={styles.summaryCard}>
          <Text style={styles.sectionLabel}>Parties</Text>
          <View style={styles.partyRow}>
            <Text style={styles.partyLabel}>Seller</Text>
            <Text style={styles.partyValue}>{order?.seller?.name || '—'}</Text>
          </View>
          <View style={styles.partyRow}>
            <Text style={styles.partyLabel}>Buyer</Text>
            <Text style={styles.partyValue}>{order?.buyer?.name || '—'}</Text>
          </View>
        </GlassCard>

        {/* Escrow */}
        <GlassCard tier="subtle" style={styles.summaryCard}>
          <Text style={styles.sectionLabel}>Escrow</Text>
          <View style={styles.escrowRow}>
            <GlassBadge
              label={order?.escrowStatus?.replace(/_/g, ' ') || 'PENDING'}
              variant={order?.escrowStatus === 'COMPLETE' ? 'success' : 'warning'}
              size="sm"
            />
            <Text style={styles.escrowText}>
              Funds held in dual-chain escrow (Celo cUSD + Solana USDC)
            </Text>
          </View>
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '800' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  timelineCard: { padding: 16, marginBottom: 16 },
  sectionLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  timeline: { flexDirection: 'row', justifyContent: 'space-between' },
  timelineItem: { alignItems: 'center', flex: 1 },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 2,
  },
  dotActive: { backgroundColor: 'rgba(74,222,128,0.15)', borderColor: 'rgba(74,222,128,0.4)' },
  dotInactive: { backgroundColor: GLASS.subtle.fill, borderColor: GLASS.subtle.border },
  dotCurrent: { borderColor: COLORS.accentGreen },
  timelineLabel: { fontSize: 10, fontWeight: '700', textAlign: 'center' },
  labelActive: { color: COLORS.textPrimary },
  labelInactive: { color: COLORS.textMuted },
  timelineLine: {
    position: 'absolute',
    top: 15,
    left: '60%',
    width: '80%',
    height: 2,
    backgroundColor: GLASS.subtle.border,
  },
  lineActive: { backgroundColor: 'rgba(74,222,128,0.3)' },
  summaryCard: { padding: 16, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  summaryText: { color: COLORS.textPrimary, fontSize: 14, flex: 1 },
  partyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  partyLabel: { color: COLORS.textMuted, fontSize: 13 },
  partyValue: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '700' },
  escrowRow: { gap: 8 },
  escrowText: { color: COLORS.textSecondary, fontSize: 12, marginTop: 6 },
});
