import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  Package,
  User,
  Truck,
  Shield,
  Clock,
  MapPin,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react-native';

import { DashboardStackParamList } from '../../navigation/types';
import sellerService, { SellerTradeRecord } from '../../services/sellerService';
import negotiationService, { Negotiation } from '../../services/negotiationService';
import escrowService, { EscrowStatus } from '../../services/escrowService';
import { GlassCard, GlassBadge, COLORS } from '../../design-system';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import { EmptyState } from '../../shared/components/EmptyState';

type TradeDetailRouteProp = RouteProp<DashboardStackParamList, 'TradeDetail'>;
type TradeDetailNavigationProp = NativeStackNavigationProp<DashboardStackParamList>;

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  pending: { icon: <Clock size={14} color="#FCD34D" />, color: '#FCD34D', label: 'PENDING' },
  confirmed: {
    icon: <CheckCircle2 size={14} color="#4ADE80" />,
    color: '#4ADE80',
    label: 'CONFIRMED',
  },
  processing: {
    icon: <Package size={14} color="#4ADE80" />,
    color: '#4ADE80',
    label: 'PROCESSING',
  },
  shipped: { icon: <Truck size={14} color="#4ADE80" />, color: '#4ADE80', label: 'IN TRANSIT' },
  delivered: {
    icon: <CheckCircle2 size={14} color="#4ADE80" />,
    color: '#4ADE80',
    label: 'DELIVERED',
  },
  complete: {
    icon: <CheckCircle2 size={14} color="#4ADE80" />,
    color: '#4ADE80',
    label: 'COMPLETE',
  },
  cancelled: { icon: <XCircle size={14} color="#F87171" />, color: '#F87171', label: 'CANCELLED' },
  disputed: {
    icon: <AlertCircle size={14} color="#F87171" />,
    color: '#F87171',
    label: 'DISPUTED',
  },
  refunded: {
    icon: <XCircle size={14} color="rgba(255,255,255,0.35)" />,
    color: 'rgba(255,255,255,0.35)',
    label: 'REFUNDED',
  },
};

const ESCROW_STATE_CONFIG: Record<string, { variant: any; label: string; description: string }> = {
  AWAITING_PAYMENT: {
    variant: 'warning',
    label: 'AWAITING PAYMENT',
    description: 'Buyer has not yet deposited funds into escrow.',
  },
  AWAITING_DELIVERY: {
    variant: 'info',
    label: 'FUNDS LOCKED',
    description: 'Payment is secured in escrow. Awaiting delivery confirmation.',
  },
  COMPLETE: {
    variant: 'success',
    label: 'RELEASED',
    description: 'Funds have been released to the seller.',
  },
  DISPUTED: {
    variant: 'danger',
    label: 'DISPUTED',
    description: 'A dispute has been raised. Admin review in progress.',
  },
  REFUNDED: {
    variant: 'muted',
    label: 'REFUNDED',
    description: 'Funds have been returned to the buyer.',
  },
};

export default function TradeDetailScreen() {
  const navigation = useNavigation<TradeDetailNavigationProp>();
  const route = useRoute<TradeDetailRouteProp>();
  const { tradeId } = route.params;

  const [trade, setTrade] = useState<SellerTradeRecord | null>(null);
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [escrow, setEscrow] = useState<EscrowStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTradeDetails();
  }, [tradeId]);

  const loadTradeDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const tradesRes = await sellerService.getMyTrades({ limit: 100 });
      const tradesList = Array.isArray(tradesRes) ? tradesRes : tradesRes.items || [];
      const foundTrade = tradesList.find((t) => t.id === tradeId || t.tradeOperationId === tradeId);

      if (!foundTrade) {
        setError('Trade not found');
        setLoading(false);
        return;
      }

      setTrade(foundTrade);

      if (foundTrade.tradeOperationId) {
        try {
          const negs = await negotiationService.getTradeNegotiations(foundTrade.tradeOperationId);
          setNegotiations(negs);
        } catch {
          setNegotiations([]);
        }

        try {
          const escrowData = await escrowService.getStatus(foundTrade.tradeOperationId);
          setEscrow(escrowData);
        } catch {
          setEscrow(null);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load trade details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status?: string | null) => {
    const s = (status || 'pending').toLowerCase();
    return STATUS_CONFIG[s] || STATUS_CONFIG['pending'];
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Trade Details</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.center}>
          <LoadingSpinner message="Loading trade details..." />
        </View>
      </View>
    );
  }

  if (error || !trade) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Trade Details</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.center}>
          <EmptyState
            title="Error"
            subtitle={error || 'Trade not found'}
            cta="Go Back"
            onPress={() => navigation.goBack()}
            icon={<AlertCircle size={32} color="#F87171" />}
          />
        </View>
      </View>
    );
  }

  const statusConfig = getStatusConfig(trade.status)!;
  const escrowConfig = escrow ? ESCROW_STATE_CONFIG[escrow.state] : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trade Details</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Status Banner */}
        <GlassCard tier="strong" style={styles.statusBanner}>
          <View style={styles.statusRow}>
            {statusConfig.icon}
            <Text style={[styles.statusLabel, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
          <Text style={styles.statusSubtext}>Trade ID: {trade.tradeOperationId || trade.id}</Text>
        </GlassCard>

        {/* Product Info */}
        <GlassCard tier="medium" style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Product</Text>
          <View style={styles.infoRow}>
            <Package size={16} color="rgba(255,255,255,0.5)" />
            <Text style={styles.infoText}>
              {trade.productName || trade.product?.name || 'Unknown Product'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <User size={16} color="rgba(255,255,255,0.5)" />
            <Text style={styles.infoText}>
              {trade.buyerName || trade.buyer?.name || 'Unknown Buyer'}
            </Text>
          </View>
          {trade.buyerLocation && (
            <View style={styles.infoRow}>
              <MapPin size={16} color="rgba(255,255,255,0.5)" />
              <Text style={styles.infoText}>{trade.buyerLocation}</Text>
            </View>
          )}
        </GlassCard>

        {/* Trade Terms */}
        <GlassCard tier="medium" style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Terms</Text>
          <View style={styles.termsGrid}>
            <View style={styles.termItem}>
              <Text style={styles.termLabel}>Quantity</Text>
              <Text style={styles.termValue}>
                {trade.agreedQuantity || trade.quantity || 0} {trade.unit || 'tons'}
              </Text>
            </View>
            <View style={styles.termItem}>
              <Text style={styles.termLabel}>Price / Unit</Text>
              <Text style={styles.termValue}>
                ${trade.agreedPrice || trade.agreedPricePerTon || trade.agreedPricePerUnit || 0}
              </Text>
            </View>
            <View style={styles.termItem}>
              <Text style={styles.termLabel}>Total Value</Text>
              <Text style={[styles.termValue, styles.termValueHighlight]}>
                $
                {(
                  (trade.agreedQuantity || trade.quantity || 0) *
                  (trade.agreedPrice || trade.agreedPricePerTon || trade.agreedPricePerUnit || 0)
                ).toLocaleString()}
              </Text>
            </View>
            {trade.pickupDate && (
              <View style={styles.termItem}>
                <Text style={styles.termLabel}>Pickup</Text>
                <Text style={styles.termValue}>
                  {new Date(trade.pickupDate).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </GlassCard>

        {/* Escrow Status */}
        <GlassCard tier="medium" style={styles.sectionCard}>
          <View style={styles.escrowHeader}>
            <Shield size={16} color={COLORS.accentGold} />
            <Text style={styles.sectionTitle}>Escrow Status</Text>
          </View>
          {escrow && escrowConfig ? (
            <View>
              <View style={styles.escrowStatusRow}>
                <GlassBadge label={escrowConfig.label} variant={escrowConfig.variant} size="md" />
                <Text style={styles.escrowAmount}>
                  {escrow.amountFormatted || `${escrow.amount} ${escrow.token}`}
                </Text>
              </View>
              <Text style={styles.escrowDescription}>{escrowConfig.description}</Text>
              {escrow.txHash && (
                <Text style={styles.escrowTx} numberOfLines={1}>
                  Tx: {escrow.txHash}
                </Text>
              )}
              <View style={styles.escrowMeta}>
                <Text style={styles.escrowMetaText}>Chain: {escrow.chain}</Text>
                <Text style={styles.escrowMetaText}>•</Text>
                <Text style={styles.escrowMetaText}>
                  {escrow.createdAt ? new Date(escrow.createdAt).toLocaleDateString() : 'N/A'}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.escrowEmpty}>
              <Text style={styles.escrowEmptyText}>
                No escrow record yet. Funds will be locked once the buyer confirms payment.
              </Text>
            </View>
          )}
        </GlassCard>

        {/* Transport */}
        {trade.transporter && (
          <GlassCard tier="medium" style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Transporter</Text>
            <View style={styles.infoRow}>
              <Truck size={16} color="rgba(255,255,255,0.5)" />
              <Text style={styles.infoText}>{trade.transporter.name || 'Assigned'}</Text>
            </View>
            {trade.transporter.fleetSize && (
              <Text style={styles.transporterMeta}>
                Fleet: {trade.transporter.fleetSize} vehicles
              </Text>
            )}
          </GlassCard>
        )}

        {/* Negotiation History */}
        <GlassCard tier="medium" style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Negotiation History</Text>
          {negotiations.length === 0 ? (
            <Text style={styles.negotiationEmpty}>No negotiation history available.</Text>
          ) : (
            <View style={styles.negotiationList}>
              {negotiations.map((neg, idx) => (
                <View key={neg.id || idx} style={styles.negotiationItem}>
                  <View style={styles.negotiationHeader}>
                    <GlassBadge
                      label={neg.status}
                      variant={
                        neg.status === 'ACCEPTED'
                          ? 'success'
                          : neg.status === 'REJECTED'
                            ? 'danger'
                            : neg.status === 'COUNTERED'
                              ? 'warning'
                              : 'info'
                      }
                      size="sm"
                    />
                    <Text style={styles.negotiationRound}>Round {neg.roundNumber || 1}</Text>
                  </View>
                  <Text style={styles.negotiationPrice}>
                    ${neg.currentOffer?.price || 0} / {neg.currentOffer?.quantity || 0} tons
                  </Text>
                  {neg.message && <Text style={styles.negotiationMessage}>{neg.message}</Text>}
                </View>
              ))}
            </View>
          )}
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  center: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: '#021207',
    flex: 1,
  },
  escrowAmount: {
    color: COLORS.accentGold,
    fontSize: 16,
    fontWeight: '800',
  },
  escrowDescription: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  escrowEmpty: {
    paddingVertical: 8,
  },
  escrowEmptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    lineHeight: 18,
  },
  escrowHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  escrowMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  escrowMetaText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
  escrowStatusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  escrowTx: {
    color: 'rgba(255,255,255,0.35)',
    fontFamily: 'monospace',
    fontSize: 11,
    marginBottom: 8,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 60,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  infoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  infoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  negotiationEmpty: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    paddingVertical: 12,
    textAlign: 'center',
  },
  negotiationHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  negotiationItem: {
    borderBottomColor: 'rgba(255,255,255,0.06)',
    borderBottomWidth: 1,
    paddingBottom: 12,
  },
  negotiationList: {
    gap: 12,
  },
  negotiationMessage: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    lineHeight: 18,
  },
  negotiationPrice: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  negotiationRound: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  statusBanner: {
    marginBottom: 16,
    padding: 16,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  statusSubtext: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginTop: 6,
  },
  termItem: {
    minWidth: '45%',
  },
  termLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  termValue: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  termValueHighlight: {
    color: COLORS.accentGold,
  },
  termsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  transporterMeta: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    marginLeft: 26,
    marginTop: 4,
  },
});
