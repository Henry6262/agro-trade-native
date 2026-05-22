import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView, RefreshControl } from 'react-native';
import {
  ClipboardCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  MapPin,
  Wheat,
  FileText,
  TrendingUp,
  ShieldCheck,
  Droplets,
  Thermometer,
  DollarSign,
} from 'lucide-react-native';
import { MotiView } from 'moti';

import { GlassCard, GlassBadge, COLORS, GLASS } from '../../../design-system';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';

/* ─── Types ─── */

interface InspectionJob {
  id: string;
  product: string;
  quantity: number;
  unit: string;
  location: string;
  sellerName: string;
  buyerName: string;
  inspectionType: 'quality' | 'quantity' | 'both';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  scheduledDate?: string;
  completedDate?: string;
  notes?: string;
  gpsLat?: number;
  gpsLng?: number;
}

interface InspectorStats {
  completedToday: number;
  pending: number;
  totalEarnings: number;
}

/* ─── Mock data ─── */

const MOCK_AVAILABLE: InspectionJob[] = [
  {
    id: 'insp-001',
    product: 'Hard Red Winter Wheat',
    quantity: 120,
    unit: 'tons',
    location: 'Kardzhali Storage Base, BG',
    sellerName: 'Agro Trading Bulgaria Ltd.',
    buyerName: 'Hellenic Grain Co.',
    inspectionType: 'both',
    status: 'pending',
    scheduledDate: '2026-05-22',
    gpsLat: 41.65,
    gpsLng: 25.37,
  },
  {
    id: 'insp-002',
    product: 'Sunflower Seeds',
    quantity: 45,
    unit: 'tons',
    location: 'Plovdiv Depot, BG',
    sellerName: 'Green Valley Farms',
    buyerName: 'BioOil Refinery',
    inspectionType: 'quality',
    status: 'pending',
    scheduledDate: '2026-05-23',
    gpsLat: 42.14,
    gpsLng: 24.75,
  },
];

const MOCK_ACTIVE: InspectionJob[] = [
  {
    id: 'insp-003',
    product: 'Corn Feed Grade',
    quantity: 200,
    unit: 'tons',
    location: 'Blagoevgrad Silo, BG',
    sellerName: 'Stara Zagora Collective',
    buyerName: 'Macedonia Feed Mills',
    inspectionType: 'quantity',
    status: 'in_progress',
    scheduledDate: '2026-05-20',
    notes: 'Moisture check pending — 14.2% measured, SGS tolerance ±0.5%',
    gpsLat: 42.02,
    gpsLng: 23.1,
  },
  {
    id: 'insp-004',
    product: 'Barley Malt',
    quantity: 80,
    unit: 'tons',
    location: 'Varna Port Terminal, BG',
    sellerName: 'Black Sea Agritech',
    buyerName: 'Romanian Brewery Group',
    inspectionType: 'both',
    status: 'completed',
    scheduledDate: '2026-05-18',
    completedDate: '2026-05-18',
    notes: 'Protein 11.8%, moisture 12.1% — within contract specs. NIR calibrated to SGS standard.',
    gpsLat: 43.21,
    gpsLng: 27.91,
  },
];

const MOCK_STATS: InspectorStats = {
  completedToday: 1,
  pending: 2,
  totalEarnings: 1850,
};

/* ─── Helpers ─── */

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'gold';

const getStatusConfig = (status: string) => {
  const s = status.toLowerCase();
  if (s === 'completed') return { variant: 'success' as BadgeVariant, label: 'COMPLETED' };
  if (s === 'rejected') return { variant: 'danger' as BadgeVariant, label: 'REJECTED' };
  if (s === 'in_progress') return { variant: 'warning' as BadgeVariant, label: 'IN PROGRESS' };
  return { variant: 'info' as BadgeVariant, label: 'PENDING' };
};

const getInspectionIcon = (type: string) => {
  if (type === 'quality') return <ClipboardCheck size={14} color={COLORS.info} />;
  if (type === 'quantity') return <Wheat size={14} color={COLORS.warning} />;
  return <ShieldCheck size={14} color={COLORS.success} />;
};

/* ─── Components ─── */

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

const RichInspectionCard: React.FC<{
  job: InspectionJob;
  index: number;
}> = ({ job, index }) => {
  const status = getStatusConfig(job.status);
  const isCompleted = job.status === 'completed';
  const isInProgress = job.status === 'in_progress';

  return (
    <MotiView
      from={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 18, stiffness: 200, delay: index * 60 }}
    >
      <GlassCard tier="medium" style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            {getInspectionIcon(job.inspectionType)}
            <Text style={styles.cardTitle} numberOfLines={1}>
              {job.product}
            </Text>
          </View>
          <GlassBadge label={status.label} variant={status.variant} size="sm" />
        </View>

        {/* Location with GPS hint */}
        <View style={styles.locationRow}>
          <MapPin size={13} color={COLORS.info} />
          <Text style={styles.locationText} numberOfLines={1}>
            {job.location}
          </Text>
          {job.gpsLat && (
            <View style={styles.gpsBadge}>
              <Text style={styles.gpsText}>GPS ✓</Text>
            </View>
          )}
        </View>

        {/* Meta */}
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            {job.quantity} {job.unit}
          </Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaText} numberOfLines={1}>
            {job.sellerName}
          </Text>
        </View>

        {/* Dates */}
        <View style={styles.dateRow}>
          <Clock size={12} color={COLORS.textMuted} />
          <Text style={styles.dateText}>
            {job.scheduledDate && `Scheduled: ${new Date(job.scheduledDate).toLocaleDateString()}`}
            {job.completedDate &&
              ` → Completed: ${new Date(job.completedDate).toLocaleDateString()}`}
          </Text>
        </View>

        {/* Quality metrics for in-progress/completed */}
        {(isInProgress || isCompleted) && (
          <View style={styles.metricsRow}>
            <View style={[styles.metricPill, { backgroundColor: `${COLORS.info}15` }]}>
              <Droplets size={11} color={COLORS.info} />
              <Text style={[styles.metricPillText, { color: COLORS.info }]}>Moisture 14.2%</Text>
            </View>
            <View style={[styles.metricPill, { backgroundColor: `${COLORS.success}15` }]}>
              <TrendingUp size={11} color={COLORS.success} />
              <Text style={[styles.metricPillText, { color: COLORS.success }]}>Protein 11.8%</Text>
            </View>
            <View style={[styles.metricPill, { backgroundColor: `${COLORS.warning}15` }]}>
              <Thermometer size={11} color={COLORS.warning} />
              <Text style={[styles.metricPillText, { color: COLORS.warning }]}>Temp 22°C</Text>
            </View>
          </View>
        )}

        {/* Notes */}
        {job.notes && (
          <View
            style={[styles.notesBox, isCompleted ? styles.notesBoxDone : styles.notesBoxPending]}
          >
            <FileText size={12} color={isCompleted ? COLORS.success : COLORS.warning} />
            <Text
              style={[
                styles.notesText,
                { color: isCompleted ? COLORS.success : COLORS.textSecondary },
              ]}
              numberOfLines={2}
            >
              {job.notes}
            </Text>
          </View>
        )}
      </GlassCard>
    </MotiView>
  );
};

/* ─── Main Screen ─── */

const TABS = [
  { id: 'available' as const, label: 'Available Jobs' },
  { id: 'active' as const, label: 'My Assignments' },
] as const;

type TabId = (typeof TABS)[number]['id'];

interface InspectorDashboardSectionProps {
  activeTab?: string;
}

export function InspectorDashboardSection({
  activeTab = 'available',
}: InspectorDashboardSectionProps) {
  const [tab, setTab] = useState<TabId>(activeTab as TabId);
  const [available, setAvailable] = useState<InspectionJob[]>([]);
  const [active, setActive] = useState<InspectionJob[]>([]);
  const [stats, setStats] = useState<InspectorStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      await new Promise((r) => setTimeout(r, 500));
      setStats(MOCK_STATS);
      setAvailable(MOCK_AVAILABLE);
      setActive(MOCK_ACTIVE);
    } catch (err: any) {
      setError(err?.message || 'Failed to load inspections');
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

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <LoadingSpinner message="Loading inspections..." />
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={styles.center}>
        <Text style={{ color: COLORS.danger }}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tabBtn, tab === t.id && styles.tabBtnActive]}
            onPress={() => setTab(t.id)}
          >
            <Text style={[styles.tabText, tab === t.id && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.accentGreen}
          />
        }
      >
        {/* Stats */}
        {stats && (
          <View style={styles.statsGrid}>
            <StatBox
              icon={<CheckCircle2 size={16} color={COLORS.success} />}
              value={stats.completedToday}
              label="Done Today"
              color={COLORS.success}
              delay={0}
            />
            <StatBox
              icon={<Clock size={16} color={COLORS.warning} />}
              value={stats.pending}
              label="Pending"
              color={COLORS.warning}
              delay={50}
            />
            <StatBox
              icon={<DollarSign size={16} color={COLORS.accentGold} />}
              value={`$${stats.totalEarnings}`}
              label="Earnings"
              color={COLORS.accentGold}
              delay={100}
            />
          </View>
        )}

        {/* Section header */}
        <MotiView
          from={{ opacity: 0, translateX: -10 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 200 }}
          style={styles.sectionHeader}
        >
          <ClipboardCheck size={18} color={tab === 'available' ? COLORS.info : COLORS.success} />
          <Text
            style={[
              styles.sectionTitle,
              { color: tab === 'available' ? COLORS.info : COLORS.success },
            ]}
          >
            {tab === 'available' ? 'AVAILABLE INSPECTIONS' : 'MY ASSIGNMENTS'}
          </Text>
          <Text style={styles.sectionCount}>
            {tab === 'available' ? available.length : active.length}
          </Text>
        </MotiView>

        {/* Cards */}
        {tab === 'available' &&
          available.map((job, i) => <RichInspectionCard key={job.id} job={job} index={i} />)}

        {tab === 'active' &&
          active.map((job, i) => <RichInspectionCard key={job.id} job={job} index={i} />)}

        {tab === 'available' && available.length === 0 && (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconWrap}>
              <ClipboardCheck size={40} color={`${COLORS.textMuted}80`} />
            </View>
            <Text style={styles.emptyTitle}>No available jobs</Text>
            <Text style={styles.emptySubtitle}>
              Inspection requests will appear here when buyers or sellers request quality
              verification.
            </Text>
          </View>
        )}

        {tab === 'active' && active.length === 0 && (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconWrap}>
              <Clock size={40} color={`${COLORS.textMuted}80`} />
            </View>
            <Text style={styles.emptyTitle}>No assignments</Text>
            <Text style={styles.emptySubtitle}>
              Your accepted inspection jobs will appear here.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/* ─── Styles ─── */

const styles = StyleSheet.create({
  card: { marginBottom: 12, padding: 14 },
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  cardHeaderLeft: { alignItems: 'center', flexDirection: 'row', flex: 1, gap: 8 },
  cardTitle: { color: COLORS.textPrimary, flex: 1, fontSize: 15, fontWeight: '700' },
  center: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 },
  dateRow: { alignItems: 'center', flexDirection: 'row', gap: 6, marginBottom: 8 },
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
  gpsBadge: {
    backgroundColor: `${COLORS.info}15`,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  gpsText: { color: COLORS.info, fontSize: 10, fontWeight: '700' },
  locationRow: { alignItems: 'center', flexDirection: 'row', gap: 6, marginBottom: 6 },
  locationText: { color: COLORS.textSecondary, flex: 1, fontSize: 13, fontWeight: '600' },

  metaDot: { color: COLORS.textMuted, fontSize: 12 },
  metaRow: { alignItems: 'center', flexDirection: 'row', gap: 8, marginBottom: 6 },
  metaText: { color: COLORS.textSecondary, fontSize: 12 },

  metricPill: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  metricPillText: { fontSize: 11, fontWeight: '700' },
  metricsRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  notesBox: {
    alignItems: 'flex-start',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
    padding: 10,
  },

  notesBoxDone: {
    backgroundColor: `${COLORS.success}10`,
    borderLeftColor: COLORS.success,
    borderLeftWidth: 3,
  },
  notesBoxPending: {
    backgroundColor: GLASS.subtle.fill,
    borderLeftColor: COLORS.warning,
    borderLeftWidth: 3,
  },
  notesText: { flex: 1, fontSize: 12, lineHeight: 18 },
  root: { flex: 1 },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  sectionCount: { color: COLORS.accentGold, fontSize: 13, fontWeight: '800', marginLeft: 'auto' },

  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    marginTop: 4,
  },
  sectionTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 0.8 },

  statBox: { flex: 1 },
  statCard: { alignItems: 'center', gap: 6, padding: 12 },
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
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  tabBar: {
    borderBottomColor: GLASS.subtle.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
  },

  tabBtn: { marginRight: 24, paddingBottom: 12, paddingTop: 8 },
  tabBtnActive: { borderBottomColor: COLORS.accentGreen, borderBottomWidth: 2 },
  tabText: { color: COLORS.textMuted, fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: COLORS.accentGreen },
});

export default InspectorDashboardSection;
