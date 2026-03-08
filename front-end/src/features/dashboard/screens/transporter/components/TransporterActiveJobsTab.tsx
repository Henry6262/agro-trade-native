import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert, StyleSheet } from 'react-native';
import {
  Truck,
  MapPin,
  Package,
  Clock,
  CheckCircle,
  Navigation,
  Camera,
} from 'lucide-react-native';
import * as Location from 'expo-location';
import { GlassCard, GlassBadge, GlassButton } from '../../../../../design-system';
import { BaseComponentProps } from '@shared/types';
import { EmptyState } from '@shared/components/EmptyState';
import { SkeletonCard } from '@shared/components/SkeletonCard';
import transportService, { TransportJob } from '@services/transportService';
import { format } from 'date-fns';

interface TransporterActiveJobsTabProps extends BaseComponentProps {
  id?: string;
}

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'gold';

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  ASSIGNED: 'info',
  IN_TRANSIT: 'warning',
  DELIVERING: 'gold',
  COMPLETED: 'success',
};

const STATUS_LABEL: Record<string, string> = {
  ASSIGNED: 'Assigned',
  IN_TRANSIT: 'In Transit',
  DELIVERING: 'Delivering',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const TransporterActiveJobsTab: React.FC<TransporterActiveJobsTabProps> = ({
  testID,
  accessibilityLabel,
}) => {
  const [activeJobs, setActiveJobs] = useState<TransportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingJob, setUpdatingJob] = useState<string | null>(null);
  const [updatingLocation, setUpdatingLocation] = useState<string | null>(null);

  useEffect(() => {
    loadActiveJobs();
  }, []);

  const loadActiveJobs = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const jobs = await transportService.getMyJobs();
      setActiveJobs(jobs);
    } catch (_error) {
      Alert.alert('Error', 'Failed to load active jobs');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadActiveJobs({ silent: true });
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleStartJob = async (jobId: string) => {
    try {
      setUpdatingJob(jobId);
      await transportService.startJob(jobId, {
        actualPickupTime: new Date().toISOString(),
      });
      Alert.alert('Success', 'Transport job started');
      await loadActiveJobs({ silent: true });
    } catch (_error) {
      Alert.alert('Error', 'Failed to start job');
    } finally {
      setUpdatingJob(null);
    }
  };

  const handleCompletePickup = async (jobId: string) => {
    try {
      setUpdatingJob(jobId);
      const pickupData = {
        pickupPhotos: [] as string[],
      };
      await transportService.completePickup(jobId, pickupData);
      Alert.alert('Success', 'Pickup completed');
      await loadActiveJobs({ silent: true });
    } catch (_error) {
      Alert.alert('Error', 'Failed to complete pickup');
    } finally {
      setUpdatingJob(null);
    }
  };

  const handleCompleteDelivery = async (jobId: string) => {
    try {
      setUpdatingJob(jobId);
      const deliveryData = {
        deliveryPhotos: [] as string[],
      };
      await transportService.completeDelivery(jobId, deliveryData);
      Alert.alert('Success', 'Delivery completed');
      await loadActiveJobs({ silent: true });
    } catch (_error) {
      Alert.alert('Error', 'Failed to complete delivery');
    } finally {
      setUpdatingJob(null);
    }
  };

  const handleUpdateLocation = useCallback(async (jobId: string) => {
    try {
      setUpdatingLocation(jobId);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to update your position.'
        );
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      await transportService.updateJobLocation(jobId, loc.coords.latitude, loc.coords.longitude);
      Alert.alert('Location Updated', 'Your GPS position has been sent.');
    } catch (_err) {
      Alert.alert('Error', 'Failed to update location. Please try again.');
    } finally {
      setUpdatingLocation(null);
    }
  }, []);

  const { activeCount, inTransitCount, completedToday } = useMemo(() => {
    let active = 0;
    let inTransit = 0;
    let today = 0;
    const todayStr = new Date().toDateString();
    for (const j of activeJobs) {
      if (j.status !== 'COMPLETED') active++;
      if (j.status === 'IN_TRANSIT') inTransit++;
      // completedAt is the correct field; falls back gracefully if undefined
      if (
        j.status === 'COMPLETED' &&
        j.completedAt != null &&
        new Date(j.completedAt).toDateString() === todayStr
      ) {
        today++;
      }
    }
    return { activeCount: active, inTransitCount: inTransit, completedToday: today };
  }, [activeJobs]);

  return (
    <ScrollView
      style={styles.scroll}
      showsVerticalScrollIndicator={false}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#60A5FA" />
      }
    >
      <View style={styles.content}>
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <GlassCard tier="subtle" style={styles.statCard}>
            <Truck size={18} color="#60A5FA" />
            <Text style={styles.statValue}>{activeCount}</Text>
            <Text style={styles.statLabel}>ACTIVE</Text>
          </GlassCard>
          <GlassCard tier="subtle" style={styles.statCard}>
            <Navigation size={18} color="#FCD34D" />
            <Text style={[styles.statValue, { color: '#FCD34D' }]}>{inTransitCount}</Text>
            <Text style={styles.statLabel}>IN TRANSIT</Text>
          </GlassCard>
          <GlassCard tier="subtle" style={styles.statCard}>
            <CheckCircle size={18} color="#4ADE80" />
            <Text style={[styles.statValue, { color: '#4ADE80' }]}>{completedToday}</Text>
            <Text style={styles.statLabel}>TODAY</Text>
          </GlassCard>
        </View>

        {/* Active Jobs Section */}
        <View style={styles.sectionHeader}>
          <Truck size={18} color="#60A5FA" />
          <Text style={styles.sectionTitle}>ACTIVE TRANSPORT JOBS</Text>
        </View>

        {loading && activeJobs.length === 0 && (
          <>
            <SkeletonCard lines={3} height={120} />
            <SkeletonCard lines={3} height={120} />
            <SkeletonCard lines={3} height={120} />
          </>
        )}

        {!loading && activeJobs.length === 0 && (
          <EmptyState
            icon={<Package size={32} color="rgba(96,165,250,0.5)" />}
            title="No active transport jobs"
            subtitle="Submit bids to get transport jobs"
          />
        )}

        {activeJobs.map((job) => {
          const badgeVariant: BadgeVariant = STATUS_VARIANT[job.status.toUpperCase()] ?? 'muted';
          const pickupsCompleted = job.pickupsCompleted ?? [];
          const pickupPointsTotal = job.transportRequest?.pickupPoints?.length ?? 1;
          const totalWeight = job.transportRequest?.totalWeight ?? 'N/A';
          const isInTransit = job.status === 'IN_TRANSIT';

          return (
            <GlassCard key={job.id} tier="medium" style={styles.jobCard}>
              {/* Header */}
              <View style={styles.jobHeader}>
                <View style={styles.jobHeaderLeft}>
                  <Text style={styles.jobNumber}>Job #{job.jobNumber}</Text>
                  <View style={styles.jobMeta}>
                    <Package size={14} color="rgba(255,255,255,0.4)" />
                    <Text style={styles.jobMetaText}>{totalWeight} tons</Text>
                    {job.estimatedArrival && (
                      <>
                        <Clock size={14} color="rgba(255,255,255,0.4)" />
                        <Text style={styles.jobMetaText}>
                          ETA: {format(new Date(job.estimatedArrival), 'MMM dd, HH:mm')}
                        </Text>
                      </>
                    )}
                  </View>
                </View>
                <GlassBadge label={STATUS_LABEL[job.status] ?? job.status} variant={badgeVariant} />
              </View>

              {/* Separator */}
              <View style={styles.separator} />

              {/* Progress Info */}
              <GlassCard tier="subtle" style={styles.progressCard} animate={false}>
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Pickups Completed</Text>
                  <Text style={styles.progressValue}>
                    {pickupsCompleted.length} / {pickupPointsTotal}
                  </Text>
                </View>
                {/* Progress bar */}
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${
                          pickupPointsTotal > 0
                            ? (pickupsCompleted.length / pickupPointsTotal) * 100
                            : 0
                        }%`,
                      },
                    ]}
                  />
                </View>
                {job.currentLocation && (
                  <View style={styles.locationRow}>
                    <MapPin size={13} color="#60A5FA" />
                    <Text style={styles.locationText}>
                      {job.currentLocation.address || 'Location updating...'}
                    </Text>
                  </View>
                )}
              </GlassCard>

              {/* Action Buttons */}
              <View style={styles.actionCol}>
                {job.status === 'ASSIGNED' && (
                  <GlassButton
                    label="START JOB"
                    onPress={() => handleStartJob(job.id)}
                    variant="primary"
                    size="sm"
                    fullWidth
                    loading={updatingJob === job.id}
                    leftIcon={<Truck size={14} color="#FFFFFF" />}
                  />
                )}

                {isInTransit && !job.allPickupsComplete && (
                  <GlassButton
                    label="COMPLETE PICKUP"
                    onPress={() => handleCompletePickup(job.id)}
                    variant="secondary"
                    size="sm"
                    fullWidth
                    loading={updatingJob === job.id}
                    leftIcon={<Camera size={14} color="#FCD34D" />}
                  />
                )}

                {isInTransit && job.allPickupsComplete && (
                  <GlassButton
                    label="COMPLETE DELIVERY"
                    onPress={() => handleCompleteDelivery(job.id)}
                    variant="primary"
                    size="sm"
                    fullWidth
                    loading={updatingJob === job.id}
                    leftIcon={<CheckCircle size={14} color="#FFFFFF" />}
                  />
                )}

                {isInTransit && (
                  <GlassButton
                    label="UPDATE LOCATION"
                    onPress={() => handleUpdateLocation(job.id)}
                    variant="secondary"
                    size="sm"
                    fullWidth
                    loading={updatingLocation === job.id}
                    leftIcon={<MapPin size={14} color="#60A5FA" />}
                  />
                )}

                {job.status === 'COMPLETED' && (
                  <View style={styles.completedBadge}>
                    <Text style={styles.completedText}>Job Completed</Text>
                  </View>
                )}
              </View>
            </GlassCard>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  actionCol: {
    gap: 10,
    marginTop: 4,
  },
  completedBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(74,222,128,0.1)',
    borderColor: 'rgba(74,222,128,0.2)',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
  },
  completedText: {
    color: '#4ADE80',
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    gap: 14,
    padding: 16,
  },
  jobCard: {
    gap: 12,
  },
  jobHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  jobHeaderLeft: {
    flex: 1,
    gap: 4,
    marginRight: 12,
  },
  jobMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  jobMetaText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
  },
  jobNumber: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  locationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  locationText: {
    color: '#60A5FA',
    flex: 1,
    fontSize: 12,
  },
  progressBarBg: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    height: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    backgroundColor: '#4ADE80',
    borderRadius: 2,
    height: '100%',
  },
  progressCard: {
    gap: 8,
  },
  progressLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  progressRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
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
    color: '#60A5FA',
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
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  statValue: {
    color: '#60A5FA',
    fontSize: 22,
    fontWeight: '800',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
});
