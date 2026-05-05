import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Shield,
  Package,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react-native';

import sellerService from '../../services/sellerService';
import { orderService } from '../../services/orderService';
import { escrowService } from '../../services/escrowService';
import { useAuthStore } from '../../stores/auth.store';
import { GlassCard, GlassBadge, COLORS } from '../../design-system';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import { EmptyState } from '../../shared/components/EmptyState';

const ESCROW_CONFIG: Record<string, { label: string; color: string; icon: any; desc: string }> = {
  AWAITING_PAYMENT: { label: 'AWAITING PAYMENT', color: '#FCD34D', icon: Clock, desc: 'Buyer has not deposited funds yet' },
  AWAITING_DELIVERY: { label: 'FUNDS LOCKED', color: '#4ADE80', icon: Shield, desc: 'Payment secured. Awaiting delivery.' },
  COMPLETE: { label: 'RELEASED', color: '#4ADE80', icon: CheckCircle2, desc: 'Funds released to seller' },
  DISPUTED: { label: 'DISPUTED', color: '#F87171', icon: AlertTriangle, desc: 'Under admin review' },
  REFUNDED: { label: 'REFUNDED', color: 'rgba(255,255,255,0.35)', icon: XCircle, desc: 'Funds returned to buyer' },
};

export default function TradeHubScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const role = (user?.role || 'FARMER').toLowerCase();
  const isSeller = role === 'farmer' || role === 'seller';

  const [trades, setTrades] = useState<any[]>([]);
  const [escrowMap, setEscrowMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrades();
  }, []);

  const loadTrades = async () => {
    setLoading(true);
    try {
      let tradeList: any[] = [];
      if (isSeller) {
        const res = await sellerService.getMyTrades({ limit: 20 });
        tradeList = Array.isArray(res) ? res : res.items || [];
      } else {
        const res = await orderService.getOrders({ limit: 20 });
        tradeList = (res.data || []).map((o: any) => ({
          id: o.id,
          tradeOperationId: o.id,
          productName: o.items?.[0]?.product?.name || 'Order',
          status: o.status,
          buyerName: o.buyer?.name,
          agreedQuantity: o.items?.[0]?.quantity,
          unit: o.items?.[0]?.product?.unit,
          agreedPrice: o.totalAmount,
          updatedAt: o.updatedAt,
        }));
      }
      setTrades(tradeList);

      // Fetch escrow statuses in parallel
      const escrowStatuses: Record<string, any> = {};
      await Promise.all(
        tradeList.map(async (t) => {
          if (t.tradeOperationId) {
            try {
              const status = await escrowService.getStatus(t.tradeOperationId);
              escrowStatuses[t.tradeOperationId] = status;
            } catch {
              // Escrow may not exist yet
            }
          }
        })
      );
      setEscrowMap(escrowStatuses);
    } catch (err) {
      console.error('TradeHub load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getEscrowUI = (tradeOperationId?: string) => {
    const escrow = tradeOperationId ? escrowMap[tradeOperationId] : null;
    if (!escrow) {
      return {
        label: 'NO ESCROW',
        color: 'rgba(255,255,255,0.3)',
        icon: Shield,
        desc: 'Escrow will be created when payment is confirmed',
      };
    }
    return ESCROW_CONFIG[escrow.state] || ESCROW_CONFIG['AWAITING_PAYMENT'] || {
      label: 'UNKNOWN',
      color: 'rgba(255,255,255,0.3)',
      icon: Shield,
      desc: 'Escrow status unknown',
    };
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Trade Hub</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.center}>
          <LoadingSpinner message="Loading trades..." />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trade Hub</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {trades.length === 0 ? (
          <EmptyState
            title="No active trades"
            subtitle={isSeller ? 'Your trades will appear here once offers are accepted.' : 'Your orders will appear here.'}
            icon={<Package size={32} color="rgba(255,255,255,0.2)" />}
          />
        ) : (
          trades.map((trade) => {
            const escrowUI = getEscrowUI(trade.tradeOperationId)!;
            const EscrowIcon = escrowUI.icon;
            return (
              <TouchableOpacity key={trade.id} activeOpacity={0.8}>
                <GlassCard tier="medium" style={styles.tradeCard} animate={false}>
                  <View style={styles.tradeHeader}>
                    <Text style={styles.tradeName}>{trade.productName || 'Trade'}</Text>
                    <GlassBadge label={escrowUI.label} variant="muted" size="sm" />
                  </View>

                  <View style={styles.escrowRow}>
                    <EscrowIcon size={16} color={escrowUI.color} />
                    <Text style={[styles.escrowLabel, { color: escrowUI.color }]}>{escrowUI.desc}</Text>
                  </View>

                  <View style={styles.tradeMetaRow}>
                    <Text style={styles.tradeMeta}>
                      {isSeller ? trade.buyerName : trade.sellerName || 'Seller'} • {trade.agreedQuantity || trade.quantity || 0} {trade.unit || 'tons'}
                    </Text>
                    <Text style={styles.tradePrice}>${trade.agreedPrice || trade.totalAmount || 0}</Text>
                  </View>

                  {trade.tradeOperationId && escrowMap[trade.tradeOperationId]?.txHash && (
                    <Text style={styles.txHash} numberOfLines={1}>
                      Tx: {escrowMap[trade.tradeOperationId].txHash}
                    </Text>
                  )}
                </GlassCard>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#021207' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  tradeCard: { padding: 14, marginBottom: 10 },
  tradeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  tradeName: { color: '#fff', fontSize: 15, fontWeight: '700', flex: 1 },
  escrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, padding: 10, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10 },
  escrowLabel: { fontSize: 12, fontWeight: '600' },
  tradeMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tradeMeta: { color: 'rgba(255,255,255,0.55)', fontSize: 13 },
  tradePrice: { color: COLORS.accentGold, fontSize: 14, fontWeight: '700' },
  txHash: { color: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'monospace', marginTop: 8 },
});
