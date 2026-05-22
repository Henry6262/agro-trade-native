import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StyleSheet,
} from 'react-native';
import {
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  DollarSign,
  Package,
  Navigation,
  AlertCircle,
  TrendingUp,
  Shield,
  Zap,
  Calendar,
  Route,
  Users,
  RefreshCw,
  Weight,
  ChevronRight,
} from 'lucide-react-native';
import { MotiView } from 'moti';

import { GlassCard, GlassBadge, GlassButton, COLORS, GLASS } from '../../../design-system';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';

/* ─── Types ─── */

interface TransportJob {
  id: string;
  origin: string;
  destination: string;
  product: string;
  quantity: number;
  unit: string;
  distanceKm: number;
  payment: number;
  status: 'available' | 'assigned' | 'in_transit' | 'delivered';
  pickupDate?: string;
  deliveryDate?: string;
  buyerName: string;
  sellerName: string;
}

interface TransporterStats {
  activeDeliveries: number;
  completedThisMonth: number;
  totalEarnings: number;
  availableJobs: number;
}

/* ─── Mock data ─── */

const MOCK_JOBS: TransportJob[] = [
  {
    id: 'job-001',
    origin: 'Kardzhali, BG',
    destination: 'Thessaloniki, GR',
    product: 'Hard Red Winter Wheat',
    quantity: 120,
    unit: 'tons',
    distanceKm: 280,
    payment: 3400,
    status: 'assigned',
    pickupDate: '2026-05-22',
    deliveryDate: '2026-05-23',
    buyerName: 'Hellenic Grain Co.',
    sellerName: 'Agro Trading Bulgaria Ltd.',
  },
  {
    id: 'job-002',
    origin: 'Plovdiv, BG',
    destination: 'Sofia, BG',
    product: 'Sunflower Seeds',
    quantity: 45,
    unit: 'tons',
    distanceKm: 145,
    payment: 1200,
    status: 'in_transit',
    pickupDate: '2026-05-20',
    deliveryDate: '2026-05-20',
    buyerName: 'BioOil Refinery',
    sellerName: 'Green Valley Farms',
  },
];

const MOCK_AVAILABLE: TransportJob[] = [
  {
    id: 'job-003',
    origin: 'Blagoevgrad, BG',
    destination: 'Skopje, MK',
    product: 'Corn Feed Grade',
    quantity: 200,
    unit: 'tons',
    distanceKm: 180,
    payment: 5200,
    status: 'available',
    buyerName: 'Macedonia Feed Mills',
    sellerName: 'Stara Zagora Collective',
  },
  {
    id: 'job-004',
    origin: 'Varna, BG',
    destination: 'Bucharest, RO',
    product: 'Barley Malt',
    quantity: 80,
    unit: 'tons',
    distanceKm: 320,
    payment: 4100,
    status: 'available',
    buyerName: 'Romanian Brewery Group',
    sellerName: 'Black Sea Agritech',
  },
];

const MOCK_STATS: TransporterStats = {
  activeDeliveries: 2,
  completedThisMonth: 14,
  totalEarnings: 28450,
  availableJobs: 2,
};

/* ─── Helpers ─── */

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'gold';

const getStatusConfig = (status: string) => {
  const s = status.toLowerCase();
  if (s === 'delivered')
    return { variant: 'success' as BadgeVariant, label: 'DELIVERED', color: COLORS.success };
  if (s === 'in_transit')
    return { variant: 'info' as BadgeVariant, label: 'IN TRANSIT', color: COLORS.info };
  if (s === 'assigned')
    return { variant: 'warning' as BadgeVariant, label: 'ASSIGNED', color: COLORS.warning };
  return { variant: 'success' as BadgeVariant, label: 'AVAILABLE', color: COLORS.success };
};

/* ─── Components ─── */

const Separator = () => <View style={styles.separator} />;

const StatBox: React.FC<{
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: string;
  delay?: number;
}> = ({ icon, value, label, color, delay = 0 }) => (
  <MotiView
    from={{ opacity: 0, translateY: 12 }}
    animate={{ opacity: 1, translateY: 0 }}
    transition={{ type: 'spring', damping: 18, stiffness: 200, delay }}
    style={styles.statBox}
  >
    <GlassCard tier="subtle" style={styles.statCard} animate={false}>
      <View style={[styles.statIconWrap, { backgroundColor: `${color}18` }]}>{icon}</View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </GlassCard>
  </MotiView>
);

const RichJobCard: React.FC<{
  job: TransportJob;
  index: number;
  showActions?: boolean;
}> = ({ job, index, showActions }) => {
  const status = getStatusConfig(job.status);
  return (
    <MotiView
      from={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 18, stiffness: 200, delay: index * 60 }}
    >
      <GlassCard tier="medium" style={styles.jobCard}>
        {/* Header */}
        <View style={styles.jobHeader}>
          <View style={styles.jobHeaderLeft}>
            <Text style={styles.jobProduct}>{job.product}</Text>
            <View style={styles.jobMetaRow}>
              <Weight size={12} color={COLORS.textMuted} />
              <Text style={styles.jobMetaText}>
                {job.quantity} {job.unit}
              </Text>
              <MapPin size={12} color={COLORS.textMuted} />
              <Text style={styles.jobMetaText}>{job.distanceKm} km</Text>
            </View>
          </View>
          <GlassBadge label={status.label} variant={status.variant} size="sm" />
        </View>

        <Separator />

        {/* Route */}
        <View style={styles.routeRow}>
          <View style={styles.routePoint}>
            <View
              style={[
                styles.routeDot,
                { backgroundColor: `${COLORS.info}25`, borderColor: `${COLORS.info}50` },
              ]}
            >
              <MapPin size={12} color={COLORS.info} />
            </View>
            <Text style={styles.routeText} numberOfLines={1}>
              {job.origin}
            </Text>
          </View>
          <View style={styles.routeLineWrap}>
            <View style={styles.routeLine} />
            <Navigation size={14} color={COLORS.textMuted} />
          </View>
          <View style={styles.routePoint}>
            <View
              style={[
                styles.routeDot,
                {
                  backgroundColor: `${COLORS.accentGold}25`,
                  borderColor: `${COLORS.accentGold}50`,
                },
              ]}
            >
              <MapPin size={12} color={COLORS.accentGold} />
            </View>
            <Text style={styles.routeText} numberOfLines={1}>
              {job.destination}
            </Text>
          </View>
        </View>

        {/* Financials */}
        <View style={styles.financeRow}>
          <View style={styles.financeItem}>
            <Text style={styles.financeLabel}>PAYMENT</Text>
            <Text style={[styles.financeValue, { color: COLORS.accentGold }]}>
              ${job.payment.toLocaleString()}
            </Text>
          </View>
          <View style={styles.financeDivider} />
          <View style={styles.financeItem}>
            <Text style={styles.financeLabel}>BUYER</Text>
            <Text style={styles.financeValueSmall} numberOfLines={1}>
              {job.buyerName}
            </Text>
          </View>
          <View style={styles.financeDivider} />
          <View style={styles.financeItem}>
            <Text style={styles.financeLabel}>SELLER</Text>
            <Text style={styles.financeValueSmall} numberOfLines={1}>
              {job.sellerName}
            </Text>
          </View>
        </View>

        {job.pickupDate && (
          <View style={styles.dateRow}>
            <Calendar size={12} color={COLORS.textMuted} />
            <Text style={styles.dateText}>
              Pickup {new Date(job.pickupDate).toLocaleDateString()}
              {job.deliveryDate && ` → Delivery ${new Date(job.deliveryDate).toLocaleDateString()}`}
            </Text>
          </View>
        )}

        {showActions && (
          <View style={styles.actionsRow}>
            <GlassButton
              label="View Route"
              onPress={() =>
                Alert.alert('Route', `${job.origin} → ${job.destination}\n${job.distanceKm} km`)
              }
              variant="secondary"
              size="sm"
              style={styles.actionBtnHalf}
              leftIcon={<Route size={14} color={COLORS.info} />}
            />
            <GlassButton
              label="Accept Job"
              onPress={() => Alert.alert('Accepted', `You accepted ${job.product} transport`)}
              variant="primary"
              size="sm"
              style={styles.actionBtnHalf}
              leftIcon={<CheckCircle2 size={14} color="#FFFFFF" />}
            />
          </View>
        )}
      </GlassCard>
    </MotiView>
  );
};

/* ─── Main Screen ─── */

interface TransporterDashboardSectionProps {
  activeTab?: string;
}

export default function TransporterDashboardSection({
  activeTab = 'jobs',
}: TransporterDashboardSectionProps) {
  const [jobs, setJobs] = useState<TransportJob[]>(MOCK_JOBS);
  const [available, setAvailable] = useState<TransportJob[]>(MOCK_AVAILABLE);
  const [stats] = useState<TransporterStats>(MOCK_STATS);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 600));
    setJobs(MOCK_JOBS);
    setAvailable(MOCK_AVAILABLE);
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

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <LoadingSpinner message="Loading deliveries..." />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.accentGreen}
        />
      }
    >
      {/* Stats */}
      <View style={styles.statsGrid}>
        <StatBox
          icon={<Truck size={16} color={COLORS.accentGold} />}
          value={stats.activeDeliveries}
          label="Active"
          color={COLORS.accentGold}
          delay={0}
        />
        <StatBox
          icon={<CheckCircle2 size={16} color={COLORS.success} />}
          value={stats.completedThisMonth}
          label="This Month"
          color={COLORS.success}
          delay={50}
        />
        <StatBox
          icon={<DollarSign size={16} color={COLORS.accentGold} />}
          value={`$${stats.totalEarnings.toLocaleString()}`}
          label="Earnings"
          color={COLORS.accentGold}
          delay={100}
        />
        <StatBox
          icon={<MapPin size={16} color={COLORS.info} />}
          value={stats.availableJobs}
          label="Jobs"
          color={COLORS.info}
          delay={150}
        />
      </View>

      {/* Tab Content */}
      {activeTab === 'jobs' && (
        <>
          <MotiView
            from={{ opacity: 0, translateX: -10 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 200 }}
            style={styles.sectionHeader}
          >
            <Package size={18} color={COLORS.accentGold} />
            <Text style={[styles.sectionTitle, { color: COLORS.accentGold }]}>AVAILABLE JOBS</Text>
            <Text style={styles.sectionCount}>{available.length}</Text>
          </MotiView>
          {available.map((job, i) => (
            <RichJobCard key={job.id} job={job} index={i} showActions />
          ))}
        </>
      )}

      {activeTab === 'active' && (
        <>
          <MotiView
            from={{ opacity: 0, translateX: -10 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 200 }}
            style={styles.sectionHeader}
          >
            <Truck size={18} color={COLORS.info} />
            <Text style={[styles.sectionTitle, { color: COLORS.info }]}>ACTIVE DELIVERIES</Text>
            <Text style={styles.sectionCount}>{jobs.length}</Text>
          </MotiView>
          {jobs.map((job, i) => (
            <RichJobCard key={job.id} job={job} index={i} />
          ))}
        </>
      )}

      {(activeTab === 'history' || activeTab === 'earnings') && (
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 400 }}
          style={styles.emptyWrap}
        >
          <View style={styles.emptyIconWrap}>
            <Clock size={40} color={`${COLORS.textMuted}80`} />
          </View>
          <Text style={styles.emptyTitle}>History</Text>
          <Text style={styles.emptySubtitle}>
            Your completed deliveries and earnings history will appear here.
          </Text>
        </MotiView>
      )}
    </ScrollView>
  );
}

/* ─── Styles ─── */

const styles = StyleSheet.create({
  actionBtnHalf: { flex: 1 },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  center: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 },

  container: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 32 },
  dateRow: { alignItems: 'center', flexDirection: 'row', gap: 6, marginBottom: 10 },
  dateText: { color: COLORS.textMuted, fontSize: 11 },
  emptyIconWrap: {
    alignItems: 'center',
    backgroundColor: GLASS.subtle.fill,
    borderRadius: 40,
    height: 80,
    justifyContent: 'center',
    marginBottom: 16,
    width: 80,
  },
  emptySubtitle: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20, textAlign: 'center' },

  emptyTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '800', marginBottom: 6 },
  emptyWrap: { alignItems: 'center', paddingHorizontal: 24, paddingVertical: 60 },
  financeDivider: { backgroundColor: GLASS.subtle.border, height: 28, width: 1 },

  financeItem: { alignItems: 'center', flex: 1 },
  financeLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  financeRow: {
    alignItems: 'center',
    backgroundColor: GLASS.subtle.fill,
    borderRadius: 10,
    flexDirection: 'row',
    marginBottom: 10,
    padding: 10,
  },
  financeValue: { fontSize: 15, fontWeight: '800' },
  financeValueSmall: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  jobCard: { marginBottom: 12, padding: 14 },

  jobHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  jobHeaderLeft: { flex: 1, marginRight: 8 },
  jobMetaRow: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: 4 },
  jobMetaText: { color: COLORS.textMuted, fontSize: 12 },
  jobProduct: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '700' },
  routeDot: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  routeLine: { backgroundColor: GLASS.subtle.border, height: 2, marginBottom: 4, width: 20 },

  routeLineWrap: { alignItems: 'center', justifyContent: 'center', width: 30 },
  routePoint: { alignItems: 'center', flexDirection: 'row', flex: 1, gap: 6 },
  routeRow: { alignItems: 'center', flexDirection: 'row', gap: 8, marginBottom: 12 },
  routeText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  sectionCount: { color: COLORS.accentGold, fontSize: 13, fontWeight: '800', marginLeft: 'auto' },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    marginTop: 4,
  },

  sectionTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 0.8 },
  separator: { backgroundColor: GLASS.subtle.border, height: 1, marginVertical: 10 },

  statBox: { minWidth: 140, width: '47%' },
  statCard: { alignItems: 'center', gap: 6, padding: 14 },

  statIconWrap: {
    alignItems: 'center',
    borderRadius: 10,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  statValue: { fontSize: 18, fontWeight: '800' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
});
