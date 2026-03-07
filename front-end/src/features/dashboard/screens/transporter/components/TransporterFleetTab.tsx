import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Truck, CheckCircle, Shield, Route, User, MapPin, Users } from 'lucide-react-native';
import { GlassCard, GlassBadge, GlassButton } from '../../../../../design-system';
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

  const loadFleet = useCallback(async () => {
    try {
      setLoading(true);
      const fleet = await transportService.getMyFleet();
      setTrucks(fleet.trucks ?? []);
      setDrivers(fleet.drivers ?? []);
      setSummary(fleet.summary ?? null);
    } catch (error) {
      console.warn('Failed to load fleet data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFleet();
  }, [loadFleet]);

  const filteredTrucks = trucks.filter((truck) =>
    truckTab === 'available' ? truck.status === 'available' : truck.status === 'assigned'
  );

  const filteredDrivers = drivers.filter((driver) =>
    driverTab === 'available' ? driver.status === 'available' : driver.status === 'assigned'
  );

  const availableTrucksCount =
    summary?.availableTrucks ?? trucks.filter((t) => t.status === 'available').length;
  const inTransitTrucksCount =
    summary?.inTransitTrucks ?? trucks.filter((t) => t.status === 'assigned').length;
  const availableDriversCount =
    summary?.availableDrivers ?? drivers.filter((d) => d.status === 'available').length;
  const assignedDriversCount =
    summary?.assignedDrivers ?? drivers.filter((d) => d.status === 'assigned').length;
  const totalCapacity = trucks.reduce((sum, t) => sum + (t.capacityTons ?? 0), 0);

  const TabPill: React.FC<{
    label: string;
    count: number;
    active: boolean;
    onPress: () => void;
    activeVariant?: BadgeVariant;
  }> = ({ label, count, active, onPress }) => (
    <TouchableOpacity onPress={onPress} style={[styles.tabPill, active && styles.tabPillActive]}>
      <Text style={[styles.tabPillText, active && styles.tabPillTextActive]}>
        {label} ({count})
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.scroll}
      showsVerticalScrollIndicator={false}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
    >
      <View style={styles.content}>
        {loading && trucks.length === 0 ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#4ADE80" />
            <Text style={styles.loadingText}>Loading fleet data...</Text>
          </View>
        ) : null}

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <GlassCard tier="subtle" style={styles.statCard}>
            <Truck size={16} color="#60A5FA" />
            <Text style={[styles.statValue, { color: '#60A5FA' }]}>
              {summary?.totalTrucks ?? trucks.length}
            </Text>
            <Text style={styles.statLabel}>TOTAL</Text>
          </GlassCard>
          <GlassCard tier="subtle" style={styles.statCard}>
            <CheckCircle size={16} color="#4ADE80" />
            <Text style={[styles.statValue, { color: '#4ADE80' }]}>{availableTrucksCount}</Text>
            <Text style={styles.statLabel}>AVAILABLE</Text>
          </GlassCard>
          <GlassCard tier="subtle" style={styles.statCard}>
            <Route size={16} color="#FCD34D" />
            <Text style={[styles.statValue, { color: '#FCD34D' }]}>{inTransitTrucksCount}</Text>
            <Text style={styles.statLabel}>IN TRANSIT</Text>
          </GlassCard>
          <GlassCard tier="subtle" style={styles.statCard}>
            <Shield size={16} color="#A78BFA" />
            <Text style={[styles.statValue, { color: '#A78BFA' }]}>
              {summary?.verifiedTrucks ?? trucks.filter((t) => t.verified).length}
            </Text>
            <Text style={styles.statLabel}>VERIFIED</Text>
          </GlassCard>
        </View>

        {/* Capacity Summary */}
        {totalCapacity > 0 && (
          <GlassCard tier="subtle" style={styles.capacitySummary}>
            <Text style={styles.capacityLabel}>Total Fleet Capacity</Text>
            <Text style={styles.capacityValue}>{totalCapacity} tons</Text>
          </GlassCard>
        )}

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
            activeVariant="success"
          />
          <TabPill
            label="In Transit"
            count={inTransitTrucksCount}
            active={truckTab === 'in_transit'}
            onPress={() => setTruckTab('in_transit')}
            activeVariant="warning"
          />
        </View>

        {filteredTrucks.length > 0 ? (
          filteredTrucks.map((truck) => {
            const statusVariant: BadgeVariant =
              truck.status === 'available' ? 'success' : 'warning';
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
                  <GlassBadge label={truck.status.toUpperCase()} variant={statusVariant} />
                </View>

                <View style={styles.separator} />

                <View style={styles.fleetDetails}>
                  <View style={styles.detailRow}>
                    <MapPin size={13} color="#60A5FA" />
                    <Text style={styles.detailText}>{truck.location}</Text>
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
                          <Text style={styles.detailText}>{truck.assignment}</Text>
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
          <GlassCard tier="subtle" style={styles.emptyCard}>
            <Truck size={44} color="rgba(255,255,255,0.25)" />
            <Text style={styles.emptyText}>
              No {truckTab === 'available' ? 'available' : 'in transit'} trucks
            </Text>
          </GlassCard>
        )}

        {/* Drivers Section */}
        <View style={[styles.sectionHeader, { marginTop: 8 }]}>
          <User size={18} color="#60A5FA" />
          <Text style={[styles.sectionTitle, { color: '#60A5FA' }]}>DRIVERS</Text>
        </View>

        {/* Driver Tabs */}
        <View style={styles.tabRow}>
          <TabPill
            label="Available"
            count={availableDriversCount}
            active={driverTab === 'available'}
            onPress={() => setDriverTab('available')}
            activeVariant="info"
          />
          <TabPill
            label="Assigned"
            count={assignedDriversCount}
            active={driverTab === 'assigned'}
            onPress={() => setDriverTab('assigned')}
            activeVariant="warning"
          />
        </View>

        {filteredDrivers.length > 0 ? (
          filteredDrivers.map((driver) => {
            const statusVariant: BadgeVariant =
              driver.status === 'available' ? 'success' : 'warning';
            return (
              <GlassCard key={driver.id} tier="subtle" style={styles.fleetCard}>
                <View style={styles.fleetCardHeader}>
                  <View style={[styles.truckIconWrap, styles.driverIconWrap]}>
                    <User size={18} color="#60A5FA" />
                  </View>
                  <View style={styles.fleetCardInfo}>
                    <Text style={styles.fleetCardTitle}>{driver.name}</Text>
                    <Text style={styles.fleetCardSub}>{driver.experienceYears} yrs experience</Text>
                    {driver.assignment && (
                      <Text style={styles.assignmentText}>Assigned to: {driver.assignment}</Text>
                    )}
                  </View>
                  <View style={styles.driverActions}>
                    <GlassBadge label={driver.status.toUpperCase()} variant={statusVariant} />
                    <GlassButton label="EDIT" onPress={() => {}} variant="ghost" size="sm" />
                  </View>
                </View>
              </GlassCard>
            );
          })
        ) : (
          <GlassCard tier="subtle" style={styles.emptyCard}>
            <User size={44} color="rgba(255,255,255,0.25)" />
            <Text style={styles.emptyText}>
              No {driverTab === 'available' ? 'available' : 'assigned'} drivers
            </Text>
          </GlassCard>
        )}
      </View>

      {/* Fleet Creation Flow */}
      <FleetCreationFlow
        visible={showFleetCreation}
        onClose={() => setShowFleetCreation(false)}
        onSuccess={() => {
          setShowFleetCreation(false);
          loadFleet();
        }}
        onError={(error) => {
          console.warn('Fleet creation error:', error);
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
  capacityLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  capacitySummary: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  capacityValue: {
    color: '#4ADE80',
    fontSize: 18,
    fontWeight: '800',
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
  driverActions: {
    alignItems: 'flex-end',
    gap: 6,
  },
  driverIconWrap: {
    backgroundColor: 'rgba(96,165,250,0.12)',
    borderColor: 'rgba(96,165,250,0.2)',
  },
  emptyCard: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 32,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    textAlign: 'center',
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
  loadingText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
  loadingWrap: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 40,
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
    fontSize: 20,
    fontWeight: '800',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
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
