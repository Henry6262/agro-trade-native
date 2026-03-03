import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import {
  ArrowLeft,
  Users,
  Package,
  DollarSign,
  CheckCircle,
  XCircle,
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  MoreVertical,
  Timer,
  RefreshCw,
} from 'lucide-react-native';
import { negotiationService } from '@services/negotiationService';
import { tradeOperationService } from '@services/tradeOperationService';
import { GlassCard, GlassBadge, GlassButton } from '../../../../../design-system';
import { COLORS } from '../../../../../design-system';

const DIVIDER = { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 8 };

interface Props {
  tradeOperationId: string;
  onBack: () => void;
  onCounterOffer: (negotiationId: string, currentOffer: any) => void;
}

interface NegotiationDetails {
  id: string;
  tradeSellerId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED' | 'EXPIRED' | 'WITHDRAWN';
  currentOffer: { price: number; quantity: number; terms?: string };
  counterOffer?: { price: number; quantity: number; terms?: string; reason?: string };
  expiresAt: string;
  hoursUntilExpiry?: number;
  isExpiringSoon?: boolean;
  tradeSeller: {
    id: string;
    seller: { id: string; name: string; email: string; phone?: string };
    saleListing?: { id: string; quantity: number; askingPrice: number; location?: string };
  };
  profitImpact?: { estimatedProfit: number; profitMargin: number; warning?: string };
  offerHistory?: any[];
}

interface TradeOperationDetails {
  id: string;
  operationNumber: string;
  status: string;
  phase: string;
  buyListing?: {
    product: { name: string; category: string };
    quantity: number;
    unit: string;
    maxPricePerUnit: number;
    buyer: { name: string };
  };
  targetProfitMargin: number;
  estimatedProfit?: number;
  profitMargin?: number;
}

export const NegotiationManagementScreen: React.FC<Props> = ({
  tradeOperationId,
  onBack,
  onCounterOffer,
}) => {
  const [negotiations, setNegotiations] = useState<NegotiationDetails[]>([]);
  const [tradeOperation, setTradeOperation] = useState<TradeOperationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [expandedNegotiations, setExpandedNegotiations] = useState<Set<string>>(new Set());
  const [summary, setSummary] = useState<any>(null);

  const loadNegotiations = async () => {
    try {
      const opDetails = await tradeOperationService.getTradeOperation(tradeOperationId);
      setTradeOperation(opDetails as any);
      const response = await negotiationService.getNegotiations(
        tradeOperationId,
        selectedStatus || undefined
      );
      setNegotiations(response.negotiations || []);
      setSummary(response.summary);
    } catch (error) {
      console.error('Failed to load negotiations:', error);
      Alert.alert('Error', 'Failed to load negotiation details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNegotiations();
    const interval = setInterval(loadNegotiations, 30000);
    return () => clearInterval(interval);
  }, [tradeOperationId, selectedStatus]);

  const handleAccept = async (negotiationId: string) => {
    Alert.alert('Accept Offer', 'Are you sure you want to accept this offer?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Accept',
        onPress: async () => {
          try {
            await negotiationService.acceptOffer(negotiationId);
            Alert.alert('Success', 'Offer accepted successfully');
            loadNegotiations();
          } catch {
            Alert.alert('Error', 'Failed to accept offer');
          }
        },
      },
    ]);
  };

  const handleReject = async (negotiationId: string) => {
    Alert.alert('Reject Offer', 'Are you sure you want to reject this offer?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            await negotiationService.rejectOffer(negotiationId, 'Price not acceptable');
            Alert.alert('Success', 'Offer rejected');
            loadNegotiations();
          } catch {
            Alert.alert('Error', 'Failed to reject offer');
          }
        },
      },
    ]);
  };

  const handleWithdraw = async (negotiationId: string) => {
    Alert.alert('Withdraw Offer', 'Are you sure you want to withdraw this offer?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Withdraw',
        style: 'destructive',
        onPress: async () => {
          try {
            await negotiationService.withdrawOffer(negotiationId, 'Strategic decision');
            Alert.alert('Success', 'Offer withdrawn');
            loadNegotiations();
          } catch {
            Alert.alert('Error', 'Failed to withdraw offer');
          }
        },
      },
    ]);
  };

  const handleExtendExpiry = async (negotiationId: string) => {
    Alert.alert('Extend Expiry', 'Extend offer expiration by 24 hours?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Extend',
        onPress: async () => {
          try {
            await negotiationService.extendExpiry(
              negotiationId,
              24,
              'More time needed for decision'
            );
            Alert.alert('Success', 'Expiry extended by 24 hours');
            loadNegotiations();
          } catch {
            Alert.alert('Error', 'Failed to extend expiry');
          }
        },
      },
    ]);
  };

  const toggleExpanded = (negotiationId: string) => {
    setExpandedNegotiations((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(negotiationId)) {
        newSet.delete(negotiationId);
      } else {
        newSet.add(negotiationId);
      }
      return newSet;
    });
  };

  const getStatusVariant = (
    status: string
  ): 'warning' | 'success' | 'danger' | 'info' | 'muted' => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'ACCEPTED':
        return 'success';
      case 'REJECTED':
        return 'danger';
      case 'COUNTERED':
        return 'info';
      case 'EXPIRED':
        return 'muted';
      case 'WITHDRAWN':
        return 'muted';
      default:
        return 'muted';
    }
  };

  const renderNegotiation = (negotiation: NegotiationDetails) => {
    const isExpanded = expandedNegotiations.has(negotiation.id);

    return (
      <TouchableOpacity
        key={negotiation.id}
        onPress={() => toggleExpanded(negotiation.id)}
        activeOpacity={0.85}
      >
        <GlassCard tier="subtle" animate={false} style={styles.negotiationCard}>
          {/* Header */}
          <View style={styles.cardTopRow}>
            <View style={styles.headerLeft}>
              <Text style={styles.sellerName}>{negotiation.tradeSeller.seller.name}</Text>
              <View style={styles.badgeRow}>
                <GlassBadge
                  label={negotiation.status}
                  variant={getStatusVariant(negotiation.status)}
                  size="sm"
                />
                {negotiation.isExpiringSoon && (
                  <View style={styles.expiryRow}>
                    <AlertTriangle size={11} color="#F59E0B" />
                    <Text style={styles.expiryText}>
                      Expires in {Math.floor(negotiation.hoursUntilExpiry || 0)}h
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity style={styles.moreBtn}>
              <MoreVertical size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Current Offer */}
          <GlassCard tier="subtle" animate={false} style={styles.offerBox}>
            <Text style={styles.offerLabel}>Current Offer</Text>
            <View style={styles.offerRow}>
              <View style={styles.offerItem}>
                <DollarSign size={14} color={COLORS.textMuted} />
                <Text style={styles.goldPrice}>€{negotiation.currentOffer.price}/unit</Text>
              </View>
              <View style={styles.offerItem}>
                <Package size={14} color={COLORS.textMuted} />
                <Text style={styles.offerValue}>{negotiation.currentOffer.quantity} units</Text>
              </View>
            </View>
          </GlassCard>

          {/* Counter Offer */}
          {negotiation.counterOffer && (
            <GlassCard
              tier="subtle"
              animate={false}
              style={[
                styles.offerBox,
                { backgroundColor: 'rgba(96,165,250,0.08)', borderColor: 'rgba(96,165,250,0.2)' },
              ]}
            >
              <Text style={[styles.offerLabel, { color: COLORS.info }]}>Counter Offer</Text>
              <View style={styles.offerRow}>
                <View style={styles.offerItem}>
                  <DollarSign size={14} color={COLORS.info} />
                  <Text style={[styles.goldPrice, { color: COLORS.info }]}>
                    €{negotiation.counterOffer.price}/unit
                  </Text>
                </View>
                <View style={styles.offerItem}>
                  <Package size={14} color={COLORS.info} />
                  <Text style={[styles.offerValue, { color: COLORS.info }]}>
                    {negotiation.counterOffer.quantity} units
                  </Text>
                </View>
              </View>
              {negotiation.counterOffer.reason && (
                <Text style={styles.counterReason}>
                  &quot;{negotiation.counterOffer.reason}&quot;
                </Text>
              )}
            </GlassCard>
          )}

          {/* Profit Impact */}
          {negotiation.profitImpact && (
            <View style={styles.profitRow}>
              <TrendingUp
                size={14}
                color={
                  negotiation.profitImpact.profitMargin >= 5 ? COLORS.accentGreen : COLORS.danger
                }
              />
              <Text
                style={[
                  styles.profitText,
                  {
                    color:
                      negotiation.profitImpact.profitMargin >= 5
                        ? COLORS.accentGreen
                        : COLORS.danger,
                  },
                ]}
              >
                Profit Margin: {negotiation.profitImpact.profitMargin.toFixed(1)}%
                {negotiation.profitImpact.warning && ' ⚠️'}
              </Text>
            </View>
          )}

          {/* Expanded Details */}
          {isExpanded && (
            <View style={styles.expandedSection}>
              <View style={DIVIDER} />
              <Text style={styles.detailSectionLabel}>Seller Details</Text>
              <Text style={styles.detailText}>Email: {negotiation.tradeSeller.seller.email}</Text>
              {negotiation.tradeSeller.seller.phone && (
                <Text style={styles.detailText}>Phone: {negotiation.tradeSeller.seller.phone}</Text>
              )}
              {negotiation.tradeSeller.saleListing?.location && (
                <Text style={styles.detailText}>
                  Location: {negotiation.tradeSeller.saleListing.location}
                </Text>
              )}

              {negotiation.offerHistory && negotiation.offerHistory.length > 0 && (
                <>
                  <Text style={[styles.detailSectionLabel, { marginTop: 10 }]}>
                    Negotiation History ({negotiation.offerHistory.length} rounds)
                  </Text>
                  {negotiation.offerHistory.slice(-3).map((history, index) => (
                    <Text key={index} style={styles.detailText}>
                      Round {index + 1}: €{history.price} - {history.status}
                    </Text>
                  ))}
                </>
              )}

              <View style={styles.actionsRow}>
                {negotiation.status === 'PENDING' && (
                  <>
                    <GlassButton
                      label="Accept"
                      onPress={() => handleAccept(negotiation.id)}
                      variant="primary"
                      size="sm"
                      leftIcon={<CheckCircle size={13} color="#fff" />}
                    />
                    <GlassButton
                      label="Reject"
                      onPress={() => handleReject(negotiation.id)}
                      variant="danger"
                      size="sm"
                      leftIcon={<XCircle size={13} color="#fff" />}
                    />
                    {negotiation.isExpiringSoon && (
                      <GlassButton
                        label="Extend"
                        onPress={() => handleExtendExpiry(negotiation.id)}
                        variant="secondary"
                        size="sm"
                        leftIcon={<Timer size={13} color={COLORS.textPrimary} />}
                      />
                    )}
                    <GlassButton
                      label="Withdraw"
                      onPress={() => handleWithdraw(negotiation.id)}
                      variant="ghost"
                      size="sm"
                      leftIcon={<XCircle size={13} color={COLORS.textSecondary} />}
                    />
                  </>
                )}
                {negotiation.status === 'COUNTERED' && (
                  <>
                    <GlassButton
                      label="Respond"
                      onPress={() => onCounterOffer(negotiation.id, negotiation.counterOffer)}
                      variant="secondary"
                      size="sm"
                      leftIcon={<MessageSquare size={13} color={COLORS.textPrimary} />}
                    />
                    <GlassButton
                      label="Accept Counter"
                      onPress={() => handleAccept(negotiation.id)}
                      variant="primary"
                      size="sm"
                      leftIcon={<CheckCircle size={13} color="#fff" />}
                    />
                    <GlassButton
                      label="Reject"
                      onPress={() => handleReject(negotiation.id)}
                      variant="danger"
                      size="sm"
                      leftIcon={<XCircle size={13} color="#fff" />}
                    />
                    <GlassButton
                      label="Withdraw"
                      onPress={() => handleWithdraw(negotiation.id)}
                      variant="ghost"
                      size="sm"
                      leftIcon={<XCircle size={13} color={COLORS.textSecondary} />}
                    />
                  </>
                )}
              </View>
            </View>
          )}
        </GlassCard>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.accentGreen} />
        <Text style={styles.loaderText}>Loading negotiations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <GlassCard tier="subtle" animate={false} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <ArrowLeft size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>
              {tradeOperation?.operationNumber || 'Negotiations'}
            </Text>
            <Text style={styles.headerSub}>
              {tradeOperation?.buyListing?.product.name} - {tradeOperation?.buyListing?.quantity}{' '}
              {tradeOperation?.buyListing?.unit}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              setRefreshing(true);
              loadNegotiations();
            }}
            style={styles.refreshBtn}
          >
            <RefreshCw size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </GlassCard>

      {/* Status filter chips */}
      {summary && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filtersContent}
        >
          {[
            { key: null, label: `All (${summary.total || 0})` },
            summary.pending > 0 && { key: 'PENDING', label: `Pending (${summary.pending})` },
            summary.countered > 0 && {
              key: 'COUNTERED',
              label: `Countered (${summary.countered})`,
            },
            summary.accepted > 0 && { key: 'ACCEPTED', label: `Accepted (${summary.accepted})` },
          ]
            .filter(Boolean)
            .map((item: any) => (
              <TouchableOpacity
                key={String(item.key)}
                onPress={() => setSelectedStatus(item.key)}
                style={[styles.chip, selectedStatus === item.key && styles.chipActive]}
              >
                <Text
                  style={[styles.chipText, selectedStatus === item.key && styles.chipTextActive]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
        </ScrollView>
      )}

      {/* Profit overview */}
      {tradeOperation && (
        <GlassCard tier="subtle" animate={false} style={styles.profitOverview}>
          <View style={styles.profitOverviewRow}>
            <View style={styles.profitField}>
              <Text style={styles.profitFieldLabel}>Target Margin</Text>
              <Text style={styles.goldValue}>{tradeOperation.targetProfitMargin}%</Text>
            </View>
            <View style={styles.profitField}>
              <Text style={styles.profitFieldLabel}>Current Margin</Text>
              <Text
                style={[
                  styles.goldValue,
                  {
                    color:
                      (tradeOperation.profitMargin || 0) >= 5 ? COLORS.accentGreen : COLORS.danger,
                  },
                ]}
              >
                {tradeOperation.profitMargin?.toFixed(1) || '0.0'}%
              </Text>
            </View>
            <View style={styles.profitField}>
              <Text style={styles.profitFieldLabel}>Est. Profit</Text>
              <Text
                style={[
                  styles.goldValue,
                  {
                    color:
                      (tradeOperation.estimatedProfit || 0) > 0
                        ? COLORS.accentGreen
                        : COLORS.danger,
                  },
                ]}
              >
                €{tradeOperation.estimatedProfit?.toFixed(0) || '0'}
              </Text>
            </View>
          </View>
        </GlassCard>
      )}

      {/* List */}
      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadNegotiations();
            }}
            tintColor={COLORS.accentGreen}
          />
        }
      >
        {negotiations.length === 0 ? (
          <View style={styles.emptyState}>
            <Users size={44} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No Negotiations Yet</Text>
            <Text style={styles.emptyText}>Send offers to sellers to start negotiations</Text>
          </View>
        ) : (
          negotiations.map((n) => renderNegotiation(n))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  backBtn: { padding: 4 },
  badgeRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  cardTopRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: 'rgba(74,222,128,0.15)', borderColor: 'rgba(74,222,128,0.35)' },
  chipText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: COLORS.accentGreen },
  counterReason: { color: COLORS.info, fontSize: 11, fontStyle: 'italic', marginTop: 4 },
  detailSectionLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  detailText: { color: COLORS.textMuted, fontSize: 12 },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    gap: 10,
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: { color: COLORS.textSecondary, fontSize: 13, textAlign: 'center' },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
  expandedSection: { gap: 4, marginTop: 8 },
  expiryRow: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  expiryText: { color: '#F59E0B', fontSize: 11, fontWeight: '600' },
  filtersContent: { gap: 8, paddingHorizontal: 16 },
  filtersScroll: { marginBottom: 8 },
  goldPrice: { color: COLORS.accentGold, fontFamily: 'monospace', fontSize: 13, fontWeight: '700' },
  goldValue: { color: COLORS.accentGold, fontFamily: 'monospace', fontSize: 16, fontWeight: '800' },
  header: { margin: 16, marginBottom: 8 },
  headerLeft: { flex: 1, gap: 6 },
  headerRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  headerSub: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  headerText: { flex: 1 },
  headerTitle: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '800' },
  list: { flex: 1, paddingHorizontal: 16 },
  loaderContainer: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
  },
  loaderText: { color: COLORS.textSecondary, fontSize: 14 },
  moreBtn: { padding: 2 },
  negotiationCard: { marginBottom: 12 },
  offerBox: { marginBottom: 8, padding: 12 },
  offerItem: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  offerLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  offerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  offerValue: { color: COLORS.textPrimary, fontSize: 13 },
  profitField: { alignItems: 'center', flex: 1 },
  profitFieldLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  profitOverview: { marginBottom: 8, marginHorizontal: 16 },
  profitOverviewRow: { flexDirection: 'row', justifyContent: 'space-between' },
  profitRow: { alignItems: 'center', flexDirection: 'row', gap: 6, marginTop: 4 },
  profitText: { fontSize: 12, fontWeight: '600' },
  refreshBtn: { padding: 6 },
  root: { backgroundColor: 'transparent', flex: 1 },
  sellerName: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '700' },
});
