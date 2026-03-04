import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StyleSheet,
} from 'react-native';
import {
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  MessageSquare,
  Send,
  Eye,
  XCircle,
} from 'lucide-react-native';
import { tradeOperationService } from '@services/tradeOperationService';
import { negotiationService } from '@services/negotiationService';
import { GlassCard, GlassBadge, GlassButton } from '../../../../../design-system';
import { COLORS } from '../../../../../design-system';
import { getProductEmoji } from '../../../../../shared/utils/productEmoji';

interface Negotiation {
  id: string;
  tradeSellerId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED' | 'EXPIRED' | 'WITHDRAWN';
  currentOffer: {
    price: number;
    quantity: number;
    terms?: string;
  };
  counterOffer?: {
    price: number;
    quantity: number;
    terms?: string;
    reason?: string;
  };
  expiresAt: string;
  hoursUntilExpiry?: number;
  isExpiringSoon?: boolean;
  tradeSeller: {
    id: string;
    seller: {
      id: string;
      name: string;
      email: string;
    };
  };
  profitImpact?: {
    estimatedProfit: number;
    profitMargin: number;
    warning?: string;
  };
}

interface TradeOperation {
  id: string;
  operationNumber: string;
  status: string;
  phase: string;
  buyListing?: any;
  sellers?: any[];
  profitMargin?: number;
  estimatedProfit?: number;
  createdAt: string;
  negotiations?: Negotiation[];
  negotiationSummary?: {
    total: number;
    pending: number;
    countered: number;
    accepted: number;
    rejected: number;
    expired: number;
    withdrawn: number;
  };
}

interface Props {
  onSelectOperation: (operation: TradeOperation) => void;
  onSendOffer: (tradeOperationId: string, tradeSellerId: string) => void;
  onCounterOffer: (negotiationId: string) => void;
}

type NegotiationBadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'gold';

const getNegotiationBadgeVariant = (status: string): NegotiationBadgeVariant => {
  switch (status) {
    case 'ACCEPTED':
      return 'success';
    case 'COUNTERED':
      return 'info';
    case 'REJECTED':
      return 'danger';
    case 'PENDING':
      return 'warning';
    case 'EXPIRED':
    case 'WITHDRAWN':
      return 'muted';
    default:
      return 'muted';
  }
};

// "soft_wheat" → "Soft Wheat"
const formatProductName = (name?: string): string => {
  if (!name) return 'Product';
  return name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

// "OP-1772440681414" → "#681414"
const formatOpRef = (opNumber: string): string => `#${opNumber.slice(-6)}`;

export const ActiveOperationsTab: React.FC<Props> = ({
  onSelectOperation,
  onSendOffer,
  onCounterOffer,
}) => {
  const [operations, setOperations] = useState<TradeOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedOperations, setExpandedOperations] = useState<Set<string>>(new Set());

  const loadOperations = async () => {
    try {
      const ops = await tradeOperationService.getTradeOperations('ACTIVE');

      const opsWithNegotiations = await Promise.all(
        ops.map(async (op) => {
          try {
            const negotiations = await negotiationService.getNegotiations(op.id);
            return {
              ...op,
              negotiations: negotiations.negotiations,
              negotiationSummary: negotiations.summary,
            };
          } catch (error: any) {
            // 404 = operation has no negotiations yet — normal for new ops, not an error
            if (error?.response?.status !== 404) {
              console.error(`Failed to load negotiations for ${op.id}:`, error);
            }
            return {
              ...op,
              negotiations: [],
              negotiationSummary: {
                accepted: 0,
                countered: 0,
                expired: 0,
                pending: 0,
                rejected: 0,
                total: 0,
                withdrawn: 0,
              },
            };
          }
        })
      );

      setOperations(opsWithNegotiations as any);
    } catch (error) {
      console.error('Failed to load operations:', error);
      Alert.alert('Error', 'Failed to load active operations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOperations();
    const interval = setInterval(loadOperations, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleExpanded = (operationId: string) => {
    setExpandedOperations((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(operationId)) {
        newSet.delete(operationId);
      } else {
        newSet.add(operationId);
      }
      return newSet;
    });
  };

  const renderNegotiationItem = (negotiation: Negotiation, _operation: TradeOperation) => {
    return (
      <GlassCard key={negotiation.id} tier="subtle" animate={false} style={styles.negoCard}>
        <View style={styles.negoHeader}>
          <View style={styles.negoLeft}>
            <View style={styles.negoTitleRow}>
              <Text style={styles.negoName}>{negotiation.tradeSeller.seller.name}</Text>
              <GlassBadge
                label={negotiation.status}
                variant={getNegotiationBadgeVariant(negotiation.status)}
                size="sm"
                style={styles.negoBadge}
              />
            </View>

            <View style={styles.negoOfferRow}>
              <Text style={styles.negoPrice}>
                <Text style={styles.goldText}>€{negotiation.currentOffer.price}</Text>
                <Text style={styles.negoUnit}>
                  /unit × {negotiation.currentOffer.quantity} units
                </Text>
              </Text>
              {negotiation.counterOffer && (
                <View style={styles.counterRow}>
                  <TrendingUp size={13} color={COLORS.danger} />
                  <Text style={[styles.counterPrice, { color: COLORS.danger }]}>
                    {' '}
                    Counter: €{negotiation.counterOffer.price}
                  </Text>
                </View>
              )}
            </View>

            {negotiation.isExpiringSoon && (
              <View style={styles.expiryRow}>
                <AlertTriangle size={13} color="#F59E0B" />
                <Text style={styles.expiryText}>
                  {' '}
                  Expires in {Math.floor(negotiation.hoursUntilExpiry || 0)}h
                </Text>
              </View>
            )}

            {negotiation.profitImpact && (
              <View style={styles.marginRow}>
                <TrendingUp
                  size={13}
                  color={
                    negotiation.profitImpact.profitMargin >= 5 ? COLORS.accentGreen : COLORS.danger
                  }
                />
                <Text
                  style={[
                    styles.marginText,
                    {
                      color:
                        negotiation.profitImpact.profitMargin >= 5
                          ? COLORS.accentGreen
                          : COLORS.danger,
                    },
                  ]}
                >
                  {' '}
                  Margin: {(negotiation.profitImpact.profitMargin ?? 0).toFixed(1)}%
                  {negotiation.profitImpact.warning ? ' ⚠' : ''}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.negoActions}>
            {negotiation.status === 'COUNTERED' && (
              <GlassButton
                label="Respond"
                onPress={() => onCounterOffer(negotiation.id)}
                variant="secondary"
                size="sm"
              />
            )}
            {negotiation.status === 'PENDING' && negotiation.isExpiringSoon && (
              <GlassButton
                label="Follow Up"
                onPress={() => Alert.alert('Follow Up', 'Send reminder to seller?')}
                variant="ghost"
                size="sm"
              />
            )}
          </View>
        </View>
      </GlassCard>
    );
  };

  const renderOperation = (operation: TradeOperation) => {
    const isExpanded = expandedOperations.has(operation.id);
    const summary = operation.negotiationSummary;
    const hasUrgentItems = operation.negotiations?.some(
      (n) => n.isExpiringSoon || n.status === 'COUNTERED'
    );

    return (
      <GlassCard
        key={operation.id}
        tier="medium"
        animate={false}
        style={[styles.opCard, styles.darkCard]}
      >
        {/* Header row */}
        <TouchableOpacity onPress={() => toggleExpanded(operation.id)} activeOpacity={0.8}>
          <View style={styles.opHeader}>
            {/* Product visual + title row */}
            <View style={styles.productRow}>
              <View style={styles.emojiCircle}>
                <Text style={styles.emojiText}>
                  {getProductEmoji(operation.buyListing?.product)}
                </Text>
              </View>
              <View style={styles.opHeaderLeft}>
                <View style={styles.opTitleRow}>
                  <Text style={styles.opProductName}>
                    {formatProductName(operation.buyListing?.product?.name)}
                  </Text>
                  {hasUrgentItems && (
                    <GlassBadge
                      label="Action Required"
                      variant="warning"
                      size="sm"
                      style={styles.urgentBadge}
                    />
                  )}
                </View>
                <Text style={styles.opMeta}>
                  {operation.buyListing?.quantity || 0} units ·{' '}
                  {formatOpRef(operation.operationNumber)}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onSelectOperation(operation);
              }}
              style={styles.eyeBtn}
            >
              <Eye size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Negotiation summary chips */}
          {summary && (
            <View style={styles.summaryRow}>
              {summary.pending > 0 && (
                <View style={styles.summaryChip}>
                  <Clock size={12} color={COLORS.textMuted} />
                  <Text style={styles.summaryChipText}> {summary.pending} Pending</Text>
                </View>
              )}
              {summary.countered > 0 && (
                <View style={styles.summaryChip}>
                  <MessageSquare size={12} color={COLORS.textMuted} />
                  <Text style={styles.summaryChipText}> {summary.countered} Countered</Text>
                </View>
              )}
              {summary.accepted > 0 && (
                <View style={styles.summaryChip}>
                  <CheckCircle size={12} color={COLORS.accentGreen} />
                  <Text style={[styles.summaryChipText, styles.summaryChipGreen]}>
                    {' '}
                    {summary.accepted} Accepted
                  </Text>
                </View>
              )}
              {summary.rejected > 0 && (
                <View style={styles.summaryChip}>
                  <XCircle size={12} color={COLORS.danger} />
                  <Text style={[styles.summaryChipText, styles.summaryChipDanger]}>
                    {' '}
                    {summary.rejected} Rejected
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Profit metrics */}
          <View style={styles.profitRow}>
            <View style={styles.profitLeft}>
              <TrendingUp size={14} color={COLORS.textMuted} />
              <Text style={styles.profitLabel}> Target Margin: {operation.profitMargin || 0}%</Text>
            </View>
            {operation.estimatedProfit != null && (
              <Text
                style={[
                  styles.profitValue,
                  { color: operation.estimatedProfit > 0 ? COLORS.accentGreen : COLORS.danger },
                ]}
              >
                €{operation.estimatedProfit.toFixed(0)}
              </Text>
            )}
          </View>

          {/* Sellers verified */}
          {operation.sellers && operation.sellers.length > 0 && (
            <View style={styles.verifiedRow}>
              <CheckCircle size={13} color={COLORS.accentGreen} />
              <Text style={styles.verifiedText}>
                {' '}
                {operation.sellers.filter((s) => s.isVerified).length}/{operation.sellers.length}{' '}
                sellers verified
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Sellers awaiting offers */}
        {(operation.sellers || []).filter(
          (s) => !operation.negotiations?.find((n) => n.tradeSellerId === s.id)
        ).length > 0 && (
          <GlassCard
            tier="subtle"
            animate={false}
            style={[styles.awaitingCard, styles.awaitingDarkCard]}
          >
            <Text style={styles.awaitingText}>
              {
                (operation.sellers || []).filter(
                  (s) => !operation.negotiations?.find((n) => n.tradeSellerId === s.id)
                ).length
              }{' '}
              sellers awaiting offers
            </Text>
            <TouchableOpacity
              onPress={() => {
                const sellersWithoutOffers =
                  operation.sellers?.filter(
                    (s) => !operation.negotiations?.find((n) => n.tradeSellerId === s.id)
                  ) || [];
                if (sellersWithoutOffers.length > 0) {
                  onSendOffer(operation.id, sellersWithoutOffers[0].id);
                }
              }}
              style={styles.sendOffersBtn}
              activeOpacity={0.75}
            >
              <Send size={14} color={COLORS.accentGreen} />
              <Text style={styles.sendOffersText}> Send Offers</Text>
            </TouchableOpacity>
          </GlassCard>
        )}

        {/* Expanded negotiations */}
        {isExpanded && operation.negotiations && operation.negotiations.length > 0 && (
          <View style={styles.negoList}>
            <View style={styles.divider} />
            <Text style={styles.negoListTitle}>Active Negotiations</Text>
            {operation.negotiations.map((negotiation) =>
              renderNegotiationItem(negotiation, operation)
            )}
          </View>
        )}
      </GlassCard>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.accentGreen} />
        <Text style={styles.loadingText}>Loading active operations...</Text>
      </View>
    );
  }

  if (operations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Package size={56} color={COLORS.textMuted} />
        <Text style={styles.emptyTitle}>No Active Operations</Text>
        <Text style={styles.emptySubtitle}>
          Create a new trade operation to start managing negotiations
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={COLORS.accentGreen}
          onRefresh={() => {
            setRefreshing(true);
            loadOperations();
          }}
        />
      }
    >
      <View style={styles.inner}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Active Trade Operations</Text>
          <GlassBadge label={`${operations.length} Active`} variant="muted" size="sm" />
        </View>

        {operations.map(renderOperation)}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  awaitingCard: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  awaitingDarkCard: {
    backgroundColor: 'rgba(8,22,12,0.60)',
    borderColor: 'rgba(74,222,128,0.18)',
  },
  awaitingText: { color: COLORS.textSecondary, flex: 1, fontSize: 12, fontWeight: '600' },

  centerContainer: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flex: 1,
    justifyContent: 'center',
  },
  container: { backgroundColor: 'transparent', flex: 1 },

  counterPrice: { fontSize: 12, fontWeight: '600' },
  counterRow: { alignItems: 'center', flexDirection: 'row' },
  darkCard: {
    backgroundColor: 'rgba(8,22,12,0.82)',
    borderColor: 'rgba(74,222,128,0.22)',
    shadowColor: '#00ff6a',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  divider: { backgroundColor: 'rgba(255,255,255,0.08)', height: 1, marginVertical: 12 },

  emojiCircle: {
    alignItems: 'center',
    backgroundColor: 'rgba(74,222,128,0.10)',
    borderColor: 'rgba(74,222,128,0.22)',
    borderRadius: 24,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  emojiText: {
    fontSize: 24,
  },

  emptyContainer: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flex: 1,
    justifyContent: 'center',
    padding: 32,
  },
  emptySubtitle: { color: COLORS.textSecondary, fontSize: 13, marginTop: 8, textAlign: 'center' },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '700', marginTop: 16 },
  expiryRow: { alignItems: 'center', flexDirection: 'row', marginBottom: 3 },
  expiryText: { color: '#F59E0B', fontSize: 12 },
  eyeBtn: { marginLeft: 8, padding: 6 },
  goldText: { color: COLORS.accentGold, fontFamily: 'monospace', fontWeight: '700' },
  inner: { padding: 16, paddingBottom: 32 },
  listHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  listTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '800' },

  loadingText: { color: COLORS.textSecondary, fontSize: 14, marginTop: 12 },
  marginRow: { alignItems: 'center', flexDirection: 'row' },
  marginText: { fontSize: 12, fontWeight: '600' },

  negoActions: { gap: 6, marginLeft: 8 },
  negoBadge: {},
  negoCard: { marginBottom: 8 },
  negoHeader: { alignItems: 'flex-start', flexDirection: 'row' },

  negoLeft: { flex: 1 },
  negoList: {},

  negoListTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  negoName: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '700' },
  negoOfferRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 3,
  },
  negoPrice: { fontSize: 13 },

  negoTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  negoUnit: { color: COLORS.textSecondary, fontSize: 12 },
  opCard: { marginBottom: 12 },

  opHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  opHeaderLeft: { flex: 1 },
  opMeta: {
    color: COLORS.textMuted,
    fontFamily: 'monospace',
    fontSize: 11,
    marginTop: 2,
  },
  opProductName: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  opTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 3,
  },
  productRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  profitLabel: { color: COLORS.textSecondary, fontSize: 13 },
  profitLeft: { alignItems: 'center', flexDirection: 'row' },
  profitRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  profitValue: { fontFamily: 'monospace', fontSize: 14, fontWeight: '700' },
  sendOffersBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(74,222,128,0.16)',
    borderColor: 'rgba(74,222,128,0.45)',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  sendOffersText: { color: COLORS.accentGreen, fontSize: 13, fontWeight: '700' },
  summaryChip: { alignItems: 'center', flexDirection: 'row' },
  summaryChipDanger: { color: COLORS.danger },
  summaryChipGreen: { color: COLORS.accentGreen },
  summaryChipText: { color: COLORS.textMuted, fontSize: 12 },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  urgentBadge: {},
  verifiedRow: { alignItems: 'center', flexDirection: 'row', marginTop: 2 },
  verifiedText: { color: COLORS.textMuted, fontSize: 12 },
});
