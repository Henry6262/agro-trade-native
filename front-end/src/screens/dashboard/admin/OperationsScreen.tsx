import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { NavigationProp, ParamListBase, useNavigation } from '@react-navigation/native';
import {
  Package,
  Truck,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
  Users,
  Shield,
  XCircle,
} from 'lucide-react-native';
import { GlassCard, COLORS } from '@design-system';
import { tradeOperationService, TradeOperation } from '../../../services/tradeOperationService';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { EmptyState } from '../../../shared/components/EmptyState';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'pending', label: 'Pending' },
  { id: 'complete', label: 'Complete' },
  { id: 'disputed', label: 'Disputed' },
] as const;

type FilterId = (typeof FILTERS)[number]['id'];
type StatusConfig = { icon: React.ReactNode; color: string; label: string };
type PhaseConfig = { label: string; color: string };

const STATUS_CONFIG: Record<string, StatusConfig> = {
  active: { icon: <Shield size={14} color="#4ADE80" />, color: '#4ADE80', label: 'ACTIVE' },
  pending: { icon: <Clock size={14} color="#FCD34D" />, color: '#FCD34D', label: 'PENDING' },
  complete: {
    icon: <CheckCircle size={14} color="#4ADE80" />,
    color: '#4ADE80',
    label: 'COMPLETE',
  },
  disputed: {
    icon: <AlertCircle size={14} color="#F87171" />,
    color: '#F87171',
    label: 'DISPUTED',
  },
  cancelled: {
    icon: <XCircle size={14} color="rgba(255,255,255,0.35)" />,
    color: 'rgba(255,255,255,0.35)',
    label: 'CANCELLED',
  },
};

const DEFAULT_STATUS_CONFIG: StatusConfig = {
  icon: <Clock size={14} color="#FCD34D" />,
  color: '#FCD34D',
  label: 'PENDING',
};
const PHASE_CONFIG: Record<string, PhaseConfig> = {
  INITIATION: { label: 'Initiation', color: '#FCD34D' },
  NEGOTIATION: { label: 'Negotiation', color: '#FCD34D' },
  INSPECTION: { label: 'Inspection', color: '#60A5FA' },
  IN_TRANSIT: { label: 'In Transit', color: '#60A5FA' },
  DELIVERED: { label: 'Delivered', color: '#4ADE80' },
  SETTLEMENT: { label: 'Settlement', color: '#4ADE80' },
  COMPLETION: { label: 'Complete', color: '#4ADE80' },
  DISPUTED: { label: 'Disputed', color: '#F87171' },
};
const DEFAULT_PHASE_CONFIG: PhaseConfig = {
  label: 'Initiation',
  color: '#FCD34D',
};

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatCurrency(amount?: number | null): string {
  if (amount == null) return '—';
  return `€${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function OperationsScreen() {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const [operations, setOperations] = useState<TradeOperation[]>([]);
  const [filtered, setFiltered] = useState<TradeOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterId>('all');
  const [error, setError] = useState<string | null>(null);

  const loadOperations = useCallback(
    async (showLoading = true) => {
      if (showLoading) setLoading(true);
      setError(null);
      try {
        const data = await tradeOperationService.getAll();
        setOperations(data);
        applyFilter(data, activeFilter);
      } catch (err: unknown) {
        const message =
          typeof err === 'object' &&
          err !== null &&
          'response' in err &&
          typeof (err as { response?: { data?: { message?: unknown } } }).response?.data
            ?.message === 'string'
            ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message ??
              'Failed to load trade operations')
            : 'Failed to load trade operations';
        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeFilter]
  );

  const applyFilter = (data: TradeOperation[], filter: FilterId) => {
    if (filter === 'all') {
      setFiltered(data);
      return;
    }
    const statusMap: Record<string, string[]> = {
      active: ['active', 'processing'],
      pending: ['pending'],
      complete: ['complete', 'completed'],
      disputed: ['disputed'],
    };
    const statuses = statusMap[filter] || [filter];
    setFiltered(data.filter((op) => statuses.includes((op.status || '').toLowerCase())));
  };

  useEffect(() => {
    loadOperations();
  }, [loadOperations]);

  useEffect(() => {
    applyFilter(operations, activeFilter);
  }, [activeFilter, operations]);

  const onRefresh = () => {
    setRefreshing(true);
    loadOperations(false);
  };

  const handleTradePress = (tradeId: string) => {
    navigation.navigate('TradeDetail', { tradeId });
  };

  const renderFilterTabs = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterRow}
      keyboardShouldPersistTaps="handled"
    >
      {FILTERS.map((f) => {
        const isActive = f.id === activeFilter;
        const count =
          f.id === 'all'
            ? operations.length
            : operations.filter((op) => {
                const statusMap: Record<string, string[]> = {
                  active: ['active', 'processing'],
                  pending: ['pending'],
                  complete: ['complete', 'completed'],
                  disputed: ['disputed'],
                };
                const statuses = statusMap[f.id] || [f.id];
                return statuses.includes((op.status || '').toLowerCase());
              }).length;
        return (
          <TouchableOpacity
            key={f.id}
            onPress={() => setActiveFilter(f.id)}
            activeOpacity={0.8}
            style={[styles.filterBtn, isActive && styles.filterBtnActive]}
          >
            <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{f.label}</Text>
            <View style={[styles.filterBadge, isActive && styles.filterBadgeActive]}>
              <Text style={[styles.filterBadgeText, isActive && styles.filterBadgeTextActive]}>
                {count}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderTradeCard = (op: TradeOperation) => {
    const statusKey = (op.status || 'pending').toLowerCase();
    const status = STATUS_CONFIG[statusKey] ?? DEFAULT_STATUS_CONFIG;
    const phase = PHASE_CONFIG[op.phase || 'INITIATION'] ?? DEFAULT_PHASE_CONFIG;
    const productName = op.buyListing?.product?.name || 'Unknown Product';
    const buyerName = op.buyListing?.buyer?.name || 'Unknown Buyer';
    const location = op.buyListing?.deliveryAddress
      ? `${op.buyListing.deliveryAddress.city || ''}, ${op.buyListing.deliveryAddress.country || ''}`
          .replace(/^,\s*/, '')
          .trim()
      : 'No location';
    const sellerCount = op._count?.sellers || 0;

    return (
      <TouchableOpacity key={op.id} onPress={() => handleTradePress(op.id)} activeOpacity={0.85}>
        <GlassCard tier="medium" style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Package size={18} color={COLORS.accentGreen} />
              <Text style={styles.productName}>{productName}</Text>
            </View>
            <View style={[styles.statusBadge, { borderColor: status.color }]}>
              {status.icon}
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.infoRow}>
              <Users size={14} color="rgba(255,255,255,0.4)" />
              <Text style={styles.infoText}>{buyerName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Truck size={14} color="rgba(255,255,255,0.4)" />
              <Text style={styles.infoText}>{location}</Text>
            </View>
            <View style={styles.infoRow}>
              <Shield size={14} color="rgba(255,255,255,0.4)" />
              <Text style={styles.infoText}>
                {sellerCount} seller{sellerCount !== 1 ? 's' : ''} matched
              </Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.phaseBadge}>
              <View style={[styles.phaseDot, { backgroundColor: phase.color }]} />
              <Text style={styles.phaseText}>{phase.label}</Text>
            </View>
            <Text style={styles.timeText}>{timeAgo(op.updatedAt)}</Text>
            <ArrowRight size={16} color="rgba(255,255,255,0.3)" />
          </View>

          {(op.profitMargin != null || op.estimatedProfit != null) && (
            <View style={styles.profitRow}>
              {op.profitMargin != null && (
                <Text style={styles.profitText}>Margin: {op.profitMargin}%</Text>
              )}
              {op.estimatedProfit != null && (
                <Text style={styles.profitText}>
                  Est. Profit: {formatCurrency(op.estimatedProfit)}
                </Text>
              )}
            </View>
          )}
        </GlassCard>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return <LoadingSpinner overlay message="Loading operations..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Operations</Text>
        <Text style={styles.headerSubtitle}>{operations.length} total trades</Text>
      </View>

      {renderFilterTabs()}

      {error && (
        <View style={styles.errorBanner}>
          <AlertCircle size={16} color="#F87171" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4ADE80" />
        }
        keyboardShouldPersistTaps="handled"
      >
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Package size={40} color="rgba(255,255,255,0.15)" />}
            title="No trades found"
            subtitle={
              activeFilter === 'all'
                ? 'Trade operations will appear here once created.'
                : `No ${activeFilter} trades found.`
            }
          />
        ) : (
          <View style={styles.list}>{filtered.map(renderTradeCard)}</View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16 },
  cardBody: { gap: 8, marginBottom: 12 },
  cardFooter: {
    alignItems: 'center',
    borderTopColor: 'rgba(255,255,255,0.06)',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  cardHeaderLeft: { alignItems: 'center', flexDirection: 'row', flex: 1, gap: 10 },
  container: { backgroundColor: '#0a0a0f', flex: 1, paddingTop: 60 },
  errorBanner: {
    alignItems: 'center',
    backgroundColor: 'rgba(248,113,113,0.08)',
    borderColor: 'rgba(248,113,113,0.2)',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    marginHorizontal: 16,
    padding: 12,
  },
  errorText: { color: '#F87171', flex: 1, fontSize: 13 },
  filterBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  filterBadgeActive: { backgroundColor: 'rgba(74,222,128,0.2)' },
  filterBadgeText: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700' },
  filterBadgeTextActive: { color: '#4ADE80' },
  filterBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  filterBtnActive: {
    backgroundColor: 'rgba(74,222,128,0.12)',
    borderColor: 'rgba(74,222,128,0.3)',
  },
  filterRow: { flexDirection: 'row', gap: 8, paddingBottom: 12, paddingHorizontal: 16 },
  filterText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '600' },

  filterTextActive: { color: '#4ADE80' },
  header: { paddingBottom: 12, paddingHorizontal: 16 },
  headerSubtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 4 },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: '800' },
  infoRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  infoText: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },

  list: { gap: 12 },
  phaseBadge: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  phaseDot: { borderRadius: 4, height: 8, width: 8 },

  phaseText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600' },
  productName: { color: '#fff', flex: 1, fontSize: 16, fontWeight: '700' },
  profitRow: {
    borderTopColor: 'rgba(255,255,255,0.06)',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
    paddingTop: 10,
  },
  profitText: { color: '#4ADE80', fontSize: 12, fontWeight: '600' },
  scroll: { flex: 1 },

  scrollContent: { padding: 16, paddingBottom: 32 },
  statusBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  statusText: { fontSize: 11, fontWeight: '700' },
  timeText: { color: 'rgba(255,255,255,0.3)', fontSize: 12 },
});
