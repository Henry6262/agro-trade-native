import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StyleSheet,
} from 'react-native';
import { Truck, Shield, Route, User, MapPin, Users } from 'lucide-react-native';
import { GlassCard, GlassBadge, GlassButton } from '@design-system';
import { EmptyState } from '@shared/components/EmptyState';
import { SkeletonCard } from '@shared/components/SkeletonCard';
import { BaseComponentProps } from '@shared/types';
import transportService, {
  TransportFleetTruck,
  TransportFleetDriver,
  TransportFleetSummary,
} from '@services/transportService';
import { FleetCreationFlow } from '../fleet-creation';

interface TransporterFleetTabProps extends BaseComponentProps {
  id?: string;
}

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'gold';

const TRUCK_STATUS_VARIANT: Record<string, BadgeVariant> = {
  available: 'success',
  assigned: 'warning',
  maintenance: 'danger',
};

const TRUCK_STATUS_LABEL: Record<string, string> = {
  available: 'AVAILABLE',
  assigned: 'ON JOB',
  maintenance: 'MAINTENANCE',
};

const DRIVER_STATUS_VARIANT: Record<string, BadgeVariant> = {
  available: 'success',
  assigned: 'warning',
  offline: 'muted',
  on_break: 'info',
};

const DRIVER_STATUS_LABEL: Record<string, string> = {
  available: 'AVAILABLE',
  assigned: 'ASSIGNED',
  offline: 'OFFLINE',
  on_break: 'ON BREAK',
};

// ---------------------------------------------------------------------------
// TabPill — module-level so the component type is stable across renders
// ---------------------------------------------------------------------------
interface TabPillProps {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
}

const TabPill: React.FC<TabPillProps> = ({ label, count, active, onPress }) => (
  <TouchableOpacity onPress={onPress} style={[styles.tabPill, active && styles.tabPillActive]}>
    <Text style={[styles.tabPillText, active && styles.tabPillTextActive]}>
      {label} ({count})
    </Text>
  </TouchableOpacity>
);

// ---------------------------------------------------------------------------

export const TransporterFleetTab: React.FC<TransporterFleetTabProps> = ({
  testID,
  accessibilityLabel,
}) => {
  const [showFleetCreation, setShowFleetCreation] = useState(false);
  const [truckTab, setTruckTab] = useState<'available' | 'in_transit'>('available');
  const [driverTab, setDriverTab] = useState<'available' | 'assigned'>('available');
  const [trucks, setTrucks] = useState<TransportFleetTruck[]>([]);
  const [drivers, setDrivers] = useState<TransportFleetDriver[]>([]);
  const [summary, setSummary] = useState<TransportFleetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFleet = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const fleet = await transportService.getMyFleet();
      setTrucks(fleet.trucks ?? []);
      setDrivers(fleet.drivers ?? []);
      setSummary(fleet.summary ?? null);
    } catch (_error) {
      Alert.alert('Error', 'Failed to load fleet data');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFleet();
  }, [loadFleet]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadFleet({ silent: true });
    } finally {
      setRefreshing(false);
    }
  }, [loadFleet]);

  // Derived stats via useMemo
  const availableTrucksCount = useMemo(
    () => summary?.availableTrucks ?? trucks.filter((t) => t.status === 'available').length,
    [summary, trucks]
  );

  const inTransitTrucksCount = useMemo(
    () => summary?.inTransitTrucks ?? trucks.filter((t) => t.status === 'assigned').length,
    [summary, trucks]
  );

  const availableDriversCount = useMemo(
    () => summary?.availableDrivers ?? drivers.filter((d) => d.status === 'available').length,
    [summary, drivers]
  );

  const assignedDriversCount = useMemo(
    () => summary?.assignedDrivers ?? drivers.filter((d) => d.status === 'assigned').length,
    [summary, drivers]
  );

  const totalCapacity = useMemo(
    () => trucks.reduce((sum, t) => sum + (t.capacityTons ?? 0), 0),
    [trucks]
  );

  const filteredTrucks = useMemo(
    () =>
      trucks.filter((truck) =>
        truckTab === 'available' ? truck.status === 'available' : truck.status === 'assigned'
      ),
    [trucks, truckTab]
  );

  const filteredDrivers = useMemo(
    () =>
      drivers.filter((driver) =>
        driverTab === 'available' ? driver.status === 'available' : driver.status === 'assigned'
      ),
    [drivers, driverTab]
  );

  const hasAnyData = useMemo(() => trucks.length > 0 || drivers.length > 0, [trucks, drivers]);

  return (
    <ScrollView
      style={styles.scroll}
      showsVerticalScrollIndicator={false}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#4ADE80" />
      }
    >
      <View style={styles.content}>
        {/* Loading skeletons */}
        {loading && !hasAnyData && (
          <>
            <SkeletonCard lines={3} height={100} />
            <SkeletonCard lines={3} height={100} />
            <SkeletonCard lines={3} height={100} />
          </>
        )}

        {!loading && (
          <>
            {/* Capacity Summary Card — single GlassCard with stat pills */}
            <GlassCard style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View style={styles.statPill}>
                  <Text style={styles.statValue}>{summary?.totalTrucks ?? trucks.length}</Text>
                  <Text style={styles.statLabel}>TOTAL</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.statPill}>
                  <Text style={[styles.statValue, styles.statValueGreen]}>
                    {availableTrucksCount}
                  </Text>
                  <Text style={styles.statLabel}>AVAILABLE</Text>
                </View>
                {totalCapacity > 0 && (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.statPill}>
                      <Text style={[styles.statValue, styles.statValueAmber]}>
                        {totalCapacity}t
                      </Text>
                      <Text style={styles.statLabel}>CAPACITY</Text>
                    </View>
                  </>
                )}
              </View>
            </GlassCard>

            {/* Add to Fleet */}
            <GlassButton
              label="ADD TO FLEET"
              onPress={() => setShowFleetCreation(true)}
              variant="primary"
              size="md"
              fullWidth
              leftIcon={<Users size={18} color="#FFFFFF" />}
            />

            {/* Fleet Section */}
            <View style={styles.sectionHeader}>
              <Truck size={18} color="#4ADE80" />
              <Text style={styles.sectionTitle}>MY FLEET</Text>
            </View>

            {/* Truck Tabs */}
            <View style={styles.tabRow}>
              <TabPill
                label="Available"
                count={availableTrucksCount}
                active={truckTab === 'available'}
                onPress={() => setTruckTab('available')}
              />
              <TabPill
                label="In Transit"
                count={inTransitTrucksCount}
                active={truckTab === 'in_transit'}
                onPress={() => setTruckTab('in_transit')}
              />
            </View>

            {filteredTrucks.length > 0 ? (
              filteredTrucks.map((truck) => {
                const statusKey = truck.status;
                const statusVariant: BadgeVariant = TRUCK_STATUS_VARIANT[statusKey] ?? 'muted';
                const statusLabel = TRUCK_STATUS_LABEL[statusKey] ?? statusKey.toUpperCase();
                return (
                  <GlassCard key={truck.id} tier="subtle" style={styles.fleetCard}>
                    <View style={styles.fleetCardHeader}>
                      <View style={styles.truckIconWrap}>
                        <Truck size={18} color="#4ADE80" />
                      </View>
                      <View style={styles.fleetCardInfo}>
                        <View style={styles.fleetCardTitleRow}>
                          <Text style={styles.fleetCardTitle}>{truck.licensePlate}</Text>
                          {truck.verified && <Shield size={14} color="#4ADE80" />}
                        </View>
                        <Text style={styles.fleetCardSub}>
                          {truck.model} • {truck.capacityTons} tons
                        </Text>
                      </View>
                      <GlassBadge label={statusLabel} variant={statusVariant} />
                    </View>

                    <View style={styles.separator} />

                    <View style={styles.fleetDetails}>
                      <View style={styles.detailRow}>
                        <MapPin size={13} color="#60A5FA" />
                        <Text style={styles.detailText}>{truck.location?.address || 'Unknown location'}</Text>
                      </View>

                      {truck.status === 'assigned' && truck.driver && (
                        <>
                          <View style={styles.detailRow}>
                            <User size={13} color="#FCD34D" />
                            <Text style={styles.detailText}>Driver: {truck.driver}</Text>
                          </View>
                          {truck.assignment && (
                            <View style={styles.detailRow}>
                              <Route size={13} color="#4ADE80" />
                              <Text style={styles.detailText}>{truck.assignment?.route || 'Unknown route'}</Text>
                            </View>
                          )}
                        </>
                      )}
                    </View>

                    <View style={styles.fleetActions}>
                      <GlassButton label="EDIT" onPress={() => {}} variant="ghost" size="sm" />
                    </View>
                  </GlassCard>
                );
              })
            ) : (
              <EmptyState
                icon={<Truck size={32} color="rgba(74,222,128,0.5)" />}
                title={`No ${truckTab === 'available' ? 'available' : 'in-transit'} trucks`}
                subtitle="Add trucks to your fleet to get started"
              />
            )}

            {/* Drivers Section */}
            <View style={[styles.sectionHeader, styles.sectionHeaderDrivers]}>
              <User size={18} color="#60A5FA" />
              <Text style={styles.sectionTitleBlue}>DRIVERS</Text>
            </View>

            {/* Driver Tabs */}
            <View style={styles.tabRow}>
              <TabPill
                label="Available"
                count={availableDriversCount}
                active={driverTab === 'available'}
                onPress={() => setDriverTab('available')}
              />
              <TabPill
                label="Assigned"
                count={assignedDriversCount}
                active={driverTab === 'assigned'}
                onPress={() => setDriverTab('assigned')}
              />
            </View>

            {filteredDrivers.length > 0 ? (
              filteredDrivers.map((driver) => {
                const statusKey = driver.status;
                const statusVariant: BadgeVariant = DRIVER_STATUS_VARIANT[statusKey] ?? 'muted';
                const statusLabel = DRIVER_STATUS_LABEL[statusKey] ?? statusKey.toUpperCase();
                return (
                  <GlassCard key={driver.id} tier="subtle" style={styles.fleetCard}>
                    <View style={styles.fleetCardHeader}>
                      <View style={[styles.truckIconWrap, styles.driverIconWrap]}>
                        <User size={18} color="#60A5FA" />
                      </View>
                      <View style={styles.fleetCardInfo}>
                        <Text style={styles.fleetCardTitle}>{driver.name}</Text>
                        <Text style={styles.fleetCardSub}>
                          {driver.experienceYears} yrs experience
                        </Text>
                        {driver.assignment && (
                          <Text style={styles.assignmentText}>
                            Assigned to: {driver.assignment?.route || 'N/A'}
                          </Text>
                        )}
                      </View>
                      <View style={styles.driverActions}>
                        <GlassBadge label={statusLabel} variant={statusVariant} />
                        <GlassButton label="EDIT" onPress={() => {}} variant="ghost" size="sm" />
                      </View>
                    </View>
                  </GlassCard>
                );
              })
            ) : (
              <EmptyState
                icon={<User size={32} color="rgba(96,165,250,0.5)" />}
                title={`No ${driverTab === 'available' ? 'available' : 'assigned'} drivers`}
                subtitle="Add drivers to manage your fleet"
              />
            )}
          </>
        )}
      </View>

      {/* Fleet Creation Flow */}
      <FleetCreationFlow
        visible={showFleetCreation}
        onClose={() => setShowFleetCreation(false)}
        onSuccess={() => {
          setShowFleetCreation(false);
          void loadFleet();
        }}
        onError={(_error) => {
          Alert.alert('Error', 'Fleet creation failed. Please try again.');
        }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  assignmentText: {
    color: '#4ADE80',
    fontSize: 11,
    marginTop: 2,
  },
  content: {
    gap: 14,
    padding: 16,
  },
  detailRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  detailText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },
  divider: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    height: 32,
    width: 1,
  },
  driverActions: {
    alignItems: 'flex-end',
    gap: 6,
  },
  driverIconWrap: {
    backgroundColor: 'rgba(96,165,250,0.12)',
    borderColor: 'rgba(96,165,250,0.2)',
  },
  fleetActions: {
    alignItems: 'flex-end',
  },
  fleetCard: {
    gap: 10,
  },
  fleetCardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  fleetCardInfo: {
    flex: 1,
    gap: 2,
  },
  fleetCardSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  fleetCardTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  fleetCardTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  fleetDetails: {
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
  sectionHeaderDrivers: {
    marginTop: 12,
  },
  sectionTitle: {
    color: '#4ADE80',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sectionTitleBlue: {
    color: '#60A5FA',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  separator: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    height: 1,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  statPill: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  statValue: {
    color: '#60A5FA',
    fontSize: 20,
    fontWeight: '800',
  },
  statValueAmber: {
    color: '#FCD34D',
  },
  statValueGreen: {
    color: '#4ADE80',
  },
  summaryCard: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  summaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tabPill: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    paddingVertical: 8,
  },
  tabPillActive: {
    backgroundColor: 'rgba(74,222,128,0.15)',
    borderColor: 'rgba(74,222,128,0.3)',
    borderWidth: 1,
  },
  tabPillText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    fontWeight: '600',
  },
  tabPillTextActive: {
    color: '#4ADE80',
  },
  tabRow: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    padding: 4,
  },
  truckIconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(74,222,128,0.12)',
    borderColor: 'rgba(74,222,128,0.2)',
    borderRadius: 10,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
});
