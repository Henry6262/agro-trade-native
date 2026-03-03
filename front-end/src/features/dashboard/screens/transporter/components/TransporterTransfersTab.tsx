import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import {
  Truck,
  DollarSign,
  CheckCircle,
  Weight,
  MapPin,
  Route,
  Clock,
  User,
  Calendar,
  Navigation,
} from 'lucide-react-native';
import { GlassCard, GlassBadge, GlassButton } from '../../../../../design-system';
import { TransferStageIndicator } from '../../components/TransferStageIndicator';
import { MapDrawer } from '../maps/components/MapDrawer';
import { MapOffer } from '../maps/types';
import { BaseComponentProps } from '@shared/types';
import transportService, {
  TransportJob,
  TransportPickupPoint,
  TransportDeliveryPoint,
  TransporterPerformance,
} from '@services/transportService';
import { format } from 'date-fns';
import { useAuthStore } from '@stores/auth.store';

interface TransporterTransfersTabProps extends BaseComponentProps {
  id?: string;
}

const DEFAULT_COORDS = { lat: 42.6977, lng: 23.3219 };

const stageIndexFromStatus = (status?: string) => {
  switch ((status || '').toUpperCase()) {
    case 'ASSIGNED':
      return 0;
    case 'STARTED':
      return 1;
    case 'IN_TRANSIT':
      return 2;
    case 'COMPLETED':
      return 3;
    default:
      return 0;
  }
};

const stageDefinitions = [
  { name: 'Assigned', description: 'Job assigned & awaiting pickup', icon: User },
  { name: 'Started', description: 'Driver en route to pickup', icon: Truck },
  { name: 'In Transit', description: 'Cargo picked up, en route to delivery', icon: Route },
  { name: 'Completed', description: 'Delivery confirmed', icon: CheckCircle },
];

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'gold';

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  ASSIGNED: 'info',
  STARTED: 'warning',
  IN_TRANSIT: 'gold',
  COMPLETED: 'success',
};

export const TransporterTransfersTab: React.FC<TransporterTransfersTabProps> = ({
  id,
  testID,
  accessibilityLabel,
}) => {
  const transporterIdFromStore = useAuthStore((state) => state.user?.id);
  const resolvedTransporterId = id ?? transporterIdFromStore;
  const [jobs, setJobs] = useState<TransportJob[]>([]);
  const [performance, setPerformance] = useState<TransporterPerformance | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<MapOffer | null>(null);
  const [isMapDrawerOpen, setIsMapDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }),
    []
  );

  const fetchData = async (effectiveId?: string) => {
    try {
      setLoading(true);
      const jobList = await transportService.getMyJobs();
      setJobs(jobList);

      const idToUse = effectiveId ?? resolvedTransporterId;
      if (idToUse) {
        try {
          const perf = await transportService.getTransporterPerformance(idToUse);
          setPerformance(perf);
        } catch (perfError) {
          console.warn('Failed to load transporter performance', perfError);
        }
      }
    } catch (error) {
      console.error('Failed to load transfer data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData(resolvedTransporterId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedTransporterId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(resolvedTransporterId);
  };

  const activeJobs = useMemo(() => jobs.filter((job) => job.status !== 'COMPLETED'), [jobs]);
  const completedJobs = useMemo(() => jobs.filter((job) => job.status === 'COMPLETED'), [jobs]);

  const totalEarnings = useMemo(() => {
    const amounts = completedJobs
      .map((job) => job.transportRequest?.maxBudget)
      .filter((value): value is number => typeof value === 'number');
    if (!amounts.length) return '—';
    const sum = amounts.reduce((acc, value) => acc + value, 0);
    return currencyFormatter.format(sum);
  }, [completedJobs, currencyFormatter]);

  const toLocationLabel = (point?: TransportPickupPoint | TransportDeliveryPoint) =>
    point?.address?.split(',')[0] || (point as TransportPickupPoint)?.sellerName || 'Location';

  const handleViewRoute = (job: TransportJob) => {
    const pickupPoint = job.transportRequest?.pickupPoints?.[0];
    const deliveryPoint = job.transportRequest?.deliveryPoint;

    const mapOffer: MapOffer = {
      id: job.id,
      quantity: job.transportRequest?.totalWeight ?? 0,
      pickup: {
        coordinates: {
          latitude: pickupPoint?.lat ?? DEFAULT_COORDS.lat,
          longitude: pickupPoint?.lng ?? DEFAULT_COORDS.lng,
        },
        address: {
          street: pickupPoint?.address || 'Pickup Location',
          city: pickupPoint?.sellerName || '',
          state: '',
          country: '',
        },
        name: pickupPoint?.address || 'Pickup',
        type: 'pickup',
      },
      delivery: {
        coordinates: {
          latitude: deliveryPoint?.lat ?? DEFAULT_COORDS.lat,
          longitude: deliveryPoint?.lng ?? DEFAULT_COORDS.lng,
        },
        address: {
          city: deliveryPoint?.address || 'Delivery Location',
          state: '',
          country: '',
        },
        name: deliveryPoint?.address || 'Delivery',
        type: 'delivery',
      },
      deadline: job.estimatedArrival ? new Date(job.estimatedArrival) : new Date(),
      status: (job.status?.toLowerCase() ?? 'assigned') as any,
      estimatedValue: job.transportRequest?.maxBudget ?? 0,
      productType:
        job.transportRequest?.tradeOperation?.buyListing?.product?.name || 'Transport Job',
    };

    setSelectedOffer(mapOffer);
    setIsMapDrawerOpen(true);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingFull}>
        <ActivityIndicator size="large" color="#4ADE80" />
        <Text style={styles.loadingText}>Loading transfers...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        testID={testID}
        accessibilityLabel={accessibilityLabel}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4ADE80" />
        }
      >
        <View style={styles.content}>
          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <GlassCard tier="subtle" style={styles.statCard}>
              <DollarSign size={16} color="#4ADE80" />
              <Text style={[styles.statValue, { color: '#4ADE80', fontSize: 14 }]}>
                {totalEarnings}
              </Text>
              <Text style={styles.statLabel}>EARNED</Text>
            </GlassCard>
            <GlassCard tier="subtle" style={styles.statCard}>
              <Truck size={16} color="#60A5FA" />
              <Text style={[styles.statValue, { color: '#60A5FA' }]}>{activeJobs.length}</Text>
              <Text style={styles.statLabel}>ACTIVE</Text>
            </GlassCard>
            <GlassCard tier="subtle" style={styles.statCard}>
              <CheckCircle size={16} color="#A78BFA" />
              <Text style={[styles.statValue, { color: '#A78BFA' }]}>{completedJobs.length}</Text>
              <Text style={styles.statLabel}>DONE</Text>
            </GlassCard>
            <GlassCard tier="subtle" style={styles.statCard}>
              <Clock size={16} color="#FCD34D" />
              <Text style={[styles.statValue, { color: '#FCD34D' }]}>
                {performance ? `${Math.round(performance.onTimeDeliveryRate ?? 0)}%` : '--'}
              </Text>
              <Text style={styles.statLabel}>ON-TIME</Text>
            </GlassCard>
          </View>

          {/* Transfers Section */}
          <View style={styles.sectionHeader}>
            <Truck size={18} color="#4ADE80" />
            <Text style={styles.sectionTitle}>MY ACTIVE TRANSFERS</Text>
          </View>

          {jobs.length === 0 ? (
            <GlassCard tier="subtle" style={styles.emptyCard}>
              <Truck size={44} color="rgba(255,255,255,0.25)" style={styles.emptyIcon} />
              <Text style={styles.emptyTitle}>No transport jobs yet</Text>
              <Text style={styles.emptySubtitle}>
                Submit bids to secure your first transport assignment.
              </Text>
            </GlassCard>
          ) : (
            jobs.map((job) => {
              const pickupPoint = job.transportRequest?.pickupPoints?.[0];
              const deliveryPoint = job.transportRequest?.deliveryPoint;
              const pickupLabel = toLocationLabel(pickupPoint);
              const deliveryLabel = toLocationLabel(deliveryPoint);
              const product =
                job.transportRequest?.tradeOperation?.buyListing?.product?.name || 'Transport Job';
              const quantity = job.transportRequest?.totalWeight
                ? `${job.transportRequest.totalWeight} tons`
                : '—';
              const stageIndex = stageIndexFromStatus(job.status);
              const statusVariant: BadgeVariant =
                STATUS_VARIANT[(job.status || '').toUpperCase()] ?? 'muted';

              return (
                <GlassCard key={job.id} tier="subtle" style={styles.transferCard}>
                  {/* Header */}
                  <View style={styles.transferHeader}>
                    <View style={styles.transferTitleWrap}>
                      <Text style={styles.transferTitle}>{product}</Text>
                      <View style={styles.transferMeta}>
                        <Weight size={13} color="rgba(255,255,255,0.4)" />
                        <Text style={styles.transferMetaText}>{quantity}</Text>
                        <Route size={13} color="rgba(255,255,255,0.4)" />
                        <Text style={styles.transferMetaText}>
                          {job.transportRequest?.estimatedDistance
                            ? `${Math.round(job.transportRequest.estimatedDistance)} km`
                            : '—'}
                        </Text>
                        <Text style={styles.transferMetaText}>ETA:</Text>
                        <Text style={styles.etaText}>
                          {job.estimatedArrival
                            ? format(new Date(job.estimatedArrival), 'MMM dd, HH:mm')
                            : 'TBD'}
                        </Text>
                      </View>
                    </View>
                    <GlassBadge
                      label={job.status?.replace('_', ' ') || 'ASSIGNED'}
                      variant={statusVariant}
                    />
                  </View>

                  {/* Separator */}
                  <View style={styles.separator} />

                  {/* Route Row */}
                  <View style={styles.routeRow}>
                    <MapPin size={14} color="#60A5FA" />
                    <Text style={styles.routeLabel} numberOfLines={1}>
                      {pickupLabel}
                    </Text>
                    <Text style={styles.routeArrow}>→</Text>
                    <MapPin size={14} color="#FCD34D" />
                    <Text style={[styles.routeLabel, { flex: 1 }]} numberOfLines={1}>
                      {deliveryLabel}
                    </Text>
                  </View>

                  {/* Stage Indicator */}
                  <TransferStageIndicator currentStage={stageIndex} stages={stageDefinitions} />

                  {/* Actions */}
                  <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleViewRoute(job)}>
                      <Navigation size={15} color="#60A5FA" />
                      <Text style={styles.actionBtnText}>VIEW ROUTE</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDisabled]} disabled>
                      <Calendar size={15} color="rgba(255,255,255,0.3)" />
                      <Text style={styles.actionBtnTextMuted}>SCHEDULE</Text>
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              );
            })
          )}
        </View>
      </ScrollView>

      <MapDrawer
        isOpen={isMapDrawerOpen}
        offer={selectedOffer}
        onClose={() => {
          setIsMapDrawerOpen(false);
          setSelectedOffer(null);
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  actionBtn: {
    alignItems: 'center',
    borderColor: 'rgba(96,165,250,0.3)',
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  actionBtnDisabled: {
    borderColor: 'rgba(255,255,255,0.08)',
  },
  actionBtnText: {
    color: '#60A5FA',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  actionBtnTextMuted: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  content: {
    gap: 14,
    padding: 16,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyIcon: {
    marginBottom: 12,
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  emptyTitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    textAlign: 'center',
  },
  etaText: {
    color: '#4ADE80',
    fontSize: 11,
    fontWeight: '600',
  },
  loadingFull: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
  routeArrow: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    marginHorizontal: 2,
  },
  routeLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  routeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  scroll: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  sectionTitle: {
    color: '#4ADE80',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  separator: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    height: 1,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  transferCard: {
    gap: 12,
  },
  transferHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  transferMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  transferMetaText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
  },
  transferTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  transferTitleWrap: {
    flex: 1,
    gap: 5,
  },
});
