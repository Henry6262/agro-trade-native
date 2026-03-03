import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Truck, CheckCircle, Shield, Route, User, MapPin, Users } from 'lucide-react-native';
import { GlassCard, GlassBadge, GlassButton } from '../../../../../design-system';
import { BaseComponentProps } from '@shared/types';
import { FleetCreationFlow } from '../fleet-creation';

interface TransporterFleetTabProps extends BaseComponentProps {
  id?: string;
}

interface FleetTruck {
  id: string;
  licensePlate: string;
  model: string;
  capacity: string;
  status: 'available' | 'assigned';
  location: string;
  verified: boolean;
  driver?: string;
  assignment?: string;
}

interface FleetDriver {
  id: string;
  name: string;
  license: string;
  phone: string;
  status: 'available' | 'assigned';
  experience: string;
  assignment?: string;
}

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'gold';

export const TransporterFleetTab: React.FC<TransporterFleetTabProps> = ({
  testID,
  accessibilityLabel,
}) => {
  const [showFleetCreation, setShowFleetCreation] = useState(false);
  const [truckTab, setTruckTab] = useState<'available' | 'in_transit'>('available');
  const [driverTab, setDriverTab] = useState<'available' | 'assigned'>('available');

  const mockTrucks: FleetTruck[] = [
    {
      id: 'T001',
      licensePlate: 'ABC-1234',
      model: 'Volvo FH16',
      capacity: '40 tons',
      status: 'available',
      location: 'Chicago, IL 🇺🇸',
      verified: true,
    },
    {
      id: 'T002',
      licensePlate: 'DEF-5678',
      model: 'Mercedes Actros',
      capacity: '35 tons',
      status: 'assigned',
      location: 'En route to Kansas 🇺🇸',
      verified: true,
      driver: 'Mike Johnson',
      assignment: 'Wheat Transport - Iowa to Chicago',
    },
    {
      id: 'T003',
      licensePlate: 'GHI-9012',
      model: 'Scania R500',
      capacity: '45 tons',
      status: 'assigned',
      location: 'Milwaukee, WI 🇺🇸',
      verified: true,
      driver: 'Sarah Davis',
      assignment: 'Corn Transport - Wisconsin to Kansas',
    },
    {
      id: 'T004',
      licensePlate: 'JKL-3456',
      model: 'Peterbilt 579',
      capacity: '38 tons',
      status: 'available',
      location: 'Des Moines, IA 🇺🇸',
      verified: false,
    },
  ];

  const mockDrivers: FleetDriver[] = [
    {
      id: 'D001',
      name: 'John Smith',
      license: 'CDL123456789',
      phone: '+1 (555) 123-4567',
      status: 'available',
      experience: '8 years',
    },
    {
      id: 'D002',
      name: 'Mike Johnson',
      license: 'CDL987654321',
      phone: '+1 (555) 987-6543',
      status: 'assigned',
      experience: '12 years',
      assignment: 'Truck DEF-5678',
    },
    {
      id: 'D003',
      name: 'Sarah Davis',
      license: 'CDL456789123',
      phone: '+1 (555) 456-7890',
      status: 'assigned',
      experience: '6 years',
      assignment: 'Truck GHI-9012',
    },
  ];

  const filteredTrucks = mockTrucks.filter((truck) =>
    truckTab === 'available' ? truck.status === 'available' : truck.status === 'assigned'
  );

  const filteredDrivers = mockDrivers.filter((driver) =>
    driverTab === 'available' ? driver.status === 'available' : driver.status === 'assigned'
  );

  const availableTrucksCount = mockTrucks.filter((t) => t.status === 'available').length;
  const inTransitTrucksCount = mockTrucks.filter((t) => t.status === 'assigned').length;
  const availableDriversCount = mockDrivers.filter((d) => d.status === 'available').length;
  const assignedDriversCount = mockDrivers.filter((d) => d.status === 'assigned').length;

  const TabPill: React.FC<{
    label: string;
    count: number;
    active: boolean;
    onPress: () => void;
    activeVariant?: BadgeVariant;
  }> = ({ label, count, active, onPress, activeVariant = 'success' }) => (
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
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <GlassCard tier="subtle" style={styles.statCard}>
            <Truck size={16} color="#60A5FA" />
            <Text style={[styles.statValue, { color: '#60A5FA' }]}>12</Text>
            <Text style={styles.statLabel}>TOTAL</Text>
          </GlassCard>
          <GlassCard tier="subtle" style={styles.statCard}>
            <CheckCircle size={16} color="#4ADE80" />
            <Text style={[styles.statValue, { color: '#4ADE80' }]}>8</Text>
            <Text style={styles.statLabel}>AVAILABLE</Text>
          </GlassCard>
          <GlassCard tier="subtle" style={styles.statCard}>
            <Route size={16} color="#FCD34D" />
            <Text style={[styles.statValue, { color: '#FCD34D' }]}>4</Text>
            <Text style={styles.statLabel}>IN TRANSIT</Text>
          </GlassCard>
          <GlassCard tier="subtle" style={styles.statCard}>
            <Shield size={16} color="#A78BFA" />
            <Text style={[styles.statValue, { color: '#A78BFA' }]}>10</Text>
            <Text style={styles.statLabel}>VERIFIED</Text>
          </GlassCard>
        </View>

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
                      {truck.model} • {truck.capacity}
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
                    <Text style={styles.fleetCardSub}>{driver.experience} experience</Text>
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
          // TODO: Refresh fleet data
        }}
        onError={(error) => {
          console.error('Fleet creation error:', error);
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
