import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import {
  Truck,
  MapPin,
  Package,
  Clock,
  CheckCircle,
  Navigation,
  Camera,
} from 'lucide-react-native';
import { GlassCard, GlassBadge, GlassButton } from '../../../../../design-system';
import { BaseComponentProps } from '@shared/types';
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

export const TransporterActiveJobsTab: React.FC<TransporterActiveJobsTabProps> = ({
  testID,
  accessibilityLabel,
}) => {
  const [activeJobs, setActiveJobs] = useState<TransportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingJob, setUpdatingJob] = useState<string | null>(null);

  useEffect(() => {
    loadActiveJobs();
  }, []);

  const loadActiveJobs = async () => {
    try {
      setLoading(true);
      const jobs = await transportService.getMyJobs();
      setActiveJobs(jobs);
    } catch (error) {
      console.error('Failed to load active jobs:', error);
      Alert.alert('Error', 'Failed to load active jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadActiveJobs();
    setRefreshing(false);
  };

  const handleStartJob = async (jobId: string) => {
    try {
      setUpdatingJob(jobId);
      await transportService.startJob(jobId, {
        actualPickupTime: new Date().toISOString(),
      });
      Alert.alert('Success', 'Transport job started');
      await loadActiveJobs();
    } catch (error) {
      console.error('Failed to start job:', error);
      Alert.alert('Error', 'Failed to start job');
    } finally {
      setUpdatingJob(null);
    }
  };

  const handleCompletePickup = async (jobId: string) => {
    try {
      setUpdatingJob(jobId);
      const pickupData = {
        pickupNotes: 'Pickup completed successfully',
        actualWeight: 100,
        pickupPhotos: [],
      };
      await transportService.completePickup(jobId, pickupData);
      Alert.alert('Success', 'Pickup completed');
      await loadActiveJobs();
    } catch (error) {
      console.error('Failed to complete pickup:', error);
      Alert.alert('Error', 'Failed to complete pickup');
    } finally {
      setUpdatingJob(null);
    }
  };

  const handleCompleteDelivery = async (jobId: string) => {
    try {
      setUpdatingJob(jobId);
      const deliveryData = {
        deliveryNotes: 'Delivery completed successfully',
        deliveryPhotos: [],
        recipientSignature: 'Signed digitally',
      };
      await transportService.completeDelivery(jobId, deliveryData);
      Alert.alert('Success', 'Delivery completed');
      await loadActiveJobs();
    } catch (error) {
      console.error('Failed to complete delivery:', error);
      Alert.alert('Error', 'Failed to complete delivery');
    } finally {
      setUpdatingJob(null);
    }
  };

  const activeCount = activeJobs.filter((j) => j.status !== 'COMPLETED').length;
  const inTransitCount = activeJobs.filter((j) => j.status === 'IN_TRANSIT').length;
  const completedToday = activeJobs.filter(
    (j) =>
      j.status === 'COMPLETED' &&
      new Date(j.estimatedArrival || '').toDateString() === new Date().toDateString()
  ).length;

  return (
    <ScrollView
      style={styles.scroll}
      showsVerticalScrollIndicator={false}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
    >
      <View style={styles.content}>
        {/* Refresh Button */}
        <GlassButton
          label={refreshing ? 'Refreshing...' : 'Refresh Jobs'}
          onPress={handleRefresh}
          variant="secondary"
          size="sm"
          fullWidth
          loading={refreshing}
          leftIcon={<Navigation size={16} color="#60A5FA" />}
        />

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

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#60A5FA" />
            <Text style={styles.loadingText}>Loading active jobs...</Text>
          </View>
        ) : activeJobs.length === 0 ? (
          <GlassCard tier="subtle" style={styles.emptyCard}>
            <Package size={44} color="rgba(255,255,255,0.25)" style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>No active transport jobs</Text>
            <Text style={styles.emptySubtitle}>Submit bids to get transport jobs</Text>
          </GlassCard>
        ) : (
          activeJobs.map((job) => {
            const badgeVariant: BadgeVariant = STATUS_VARIANT[job.status?.toUpperCase()] ?? 'muted';
            const pickupsCompleted = job.pickupsCompleted ?? [];
            const pickupPointsTotal = job.transportRequest?.pickupPoints?.length ?? 1;
            const totalWeight = job.transportRequest?.totalWeight ?? 'N/A';

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
                  <GlassBadge label={job.status} variant={badgeVariant} />
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
                <View style={styles.actionRow}>
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

                  {job.status === 'IN_TRANSIT' && !job.allPickupsComplete && (
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

                  {job.status === 'IN_TRANSIT' && job.allPickupsComplete && (
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

                  {job.status === 'COMPLETED' && (
                    <View style={styles.completedBadge}>
                      <Text style={styles.completedText}>Job Completed</Text>
                    </View>
                  )}
                </View>
              </GlassCard>
            );
          })
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  actionRow: {
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
  loadingText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
  loadingWrap: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 40,
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
