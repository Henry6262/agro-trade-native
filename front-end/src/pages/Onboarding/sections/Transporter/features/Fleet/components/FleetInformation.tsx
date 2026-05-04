import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { Plus, Truck, Trash2, ChevronDown, Minus, CheckCircle } from 'lucide-react-native';
import { useOnboardingStore } from '@stores/onboarding.store';
import type { VehicleType } from '@shared/types';
import { styles, GREEN } from './FleetInformation.styles';

type TruckInfo = VehicleType;

const MAX_CAPACITY_TONS = 100;
const MAX_BATCH_COUNT = 50;

const truckTypes = [
  'Standard',
  'Refrigerated',
  'Flatbed',
  'Container',
  'Tanker',
  'Dump Truck',
  'Box Truck',
  'Livestock',
];

const PRESET_CAPACITIES = [5, 10, 15, 20, 25];

function computeFleetTotals(fleet: TruckInfo[]) {
  const totalCapacity = fleet.reduce((sum, t) => {
    const truckCount = t.count || 1;
    return sum + t.capacity * truckCount;
  }, 0);
  const totalVehicleCount = fleet.reduce((sum, truck) => sum + (truck.count || 1), 0);
  return { totalCapacity, totalVehicleCount };
}

export function FleetInformation() {
  const { transportData, setFleetInfo } = useOnboardingStore();

  const [newTruck, setNewTruck] = useState({
    capacity: '',
    unit: 'tons' as 'tons' | 'kg',
    type: 'Standard',
  });
  const [batchCount, setBatchCount] = useState('1');
  const [showTruckTypeModal, setShowTruckTypeModal] = useState(false);
  const [showCustomCapacity, setShowCustomCapacity] = useState(false);

  const currentFleet = transportData?.fleetInfo?.vehicleTypes || [];
  const totalCapacity = transportData?.fleetInfo?.capacity?.total || 0;
  const existingBaseLocation = transportData?.fleetInfo?.baseLocation;

  const updateFleet = (updatedFleet: TruckInfo[]) => {
    const { totalCapacity: newTotalCapacity, totalVehicleCount } = computeFleetTotals(updatedFleet);

    setFleetInfo({
      ...transportData?.fleetInfo,
      vehicleCount: totalVehicleCount,
      vehicleTypes: updatedFleet,
      capacity: { total: newTotalCapacity, unit: 'tons' },
      baseLocation: existingBaseLocation ?? {
        id: '',
        address: '',
        city: '',
        state: '',
        country: '',
        zipCode: '',
      },
    });
  };

  const handleAddTruck = () => {
    const parsedCapacity = Number.parseFloat(newTruck.capacity);
    if (!parsedCapacity || parsedCapacity <= 0 || parsedCapacity > MAX_CAPACITY_TONS) return;

    const count = Math.min(Math.max(1, Number.parseInt(batchCount) || 1), MAX_BATCH_COUNT);

    const existingTruckIndex = currentFleet.findIndex(
      (truck) =>
        truck.capacity === parsedCapacity &&
        truck.unit === newTruck.unit &&
        truck.type === newTruck.type
    );

    let updatedFleet: TruckInfo[];

    if (existingTruckIndex !== -1) {
      updatedFleet = [...currentFleet];
      const existingCount = updatedFleet[existingTruckIndex]!.count || 1;
      updatedFleet[existingTruckIndex] = {
        ...updatedFleet[existingTruckIndex]!,
        count: existingCount + count,
      };
    } else {
      const newTruckInfo: TruckInfo = {
        id: `truck-${Date.now()}`,
        name: newTruck.type,
        capacity: parsedCapacity,
        suitable_for: [],
        unit: newTruck.unit,
        type: newTruck.type,
        count: count > 1 ? count : undefined,
      };
      updatedFleet = [...currentFleet, newTruckInfo];
    }

    updateFleet(updatedFleet);
    setNewTruck({ capacity: '', unit: 'tons', type: 'Standard' });
    setBatchCount('1');
    setShowCustomCapacity(false);
  };

  const handleRemoveTruck = (truckId: string) => {
    const updatedFleet = currentFleet.filter((truck) => truck.id !== truckId);
    updateFleet(updatedFleet);
  };

  const selectedCapacityNum = Number.parseFloat(newTruck.capacity) || 0;
  const batchNum = Math.min(Number.parseInt(batchCount) || 1, MAX_BATCH_COUNT);
  const totalTruckCount = currentFleet.reduce((sum, truck) => sum + (truck.count || 1), 0);

  return (
    <ScrollView
      style={styles.scroll}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Fleet Summary */}
      {currentFleet.length > 0 && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>Fleet Total</Text>
              <Text style={styles.summaryCount}>{totalTruckCount} trucks</Text>
            </View>
            <View style={styles.summaryCapacityBlock}>
              <Text style={styles.summaryCapacity}>{totalCapacity}t</Text>
              <Text style={styles.summaryCapacityLabel}>total capacity</Text>
            </View>
          </View>
        </View>
      )}

      {/* Add Trucks Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconCircle}>
            <Plus size={16} color={GREEN} />
          </View>
          <Text style={styles.cardTitle}>Add Trucks to Fleet</Text>
          {currentFleet.length > 0 && (
            <CheckCircle size={16} color={GREEN} style={styles.checkIcon} />
          )}
        </View>

        {/* Capacity */}
        <Text style={styles.fieldLabel}>Capacity (tons)</Text>
        {!showCustomCapacity ? (
          <View>
            <View style={styles.capacityGrid}>
              {PRESET_CAPACITIES.map((capacity) => {
                const active = newTruck.capacity === capacity.toString() && !showCustomCapacity;
                return (
                  <TouchableOpacity
                    key={capacity}
                    style={[styles.capacityBtn, active && styles.capacityBtnActive]}
                    onPress={() => {
                      setNewTruck({ ...newTruck, capacity: capacity.toString() });
                      setShowCustomCapacity(false);
                    }}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.capacityBtnNum, active && styles.capacityBtnNumActive]}>
                      {capacity}
                    </Text>
                    <Text style={[styles.capacityBtnUnit, active && styles.capacityBtnUnitActive]}>
                      tons
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              style={styles.customBtn}
              onPress={() => {
                setShowCustomCapacity(true);
                setNewTruck({ ...newTruck, capacity: '' });
              }}
              activeOpacity={0.75}
            >
              <Text style={styles.customBtnText}>Custom Amount</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.customInputWrap}>
            <TextInput
              keyboardType="numeric"
              placeholder={`Enter capacity (max ${MAX_CAPACITY_TONS} tons)`}
              value={newTruck.capacity}
              onChangeText={(text) => setNewTruck({ ...newTruck, capacity: text })}
              style={styles.textInput}
              placeholderTextColor="rgba(255,255,255,0.3)"
              autoFocus
            />
            <TouchableOpacity
              onPress={() => {
                setShowCustomCapacity(false);
                setNewTruck({ ...newTruck, capacity: '' });
              }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quantity */}
        <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>Quantity</Text>
        <View style={styles.counterRow}>
          <TouchableOpacity
            onPress={() => {
              if (batchNum > 1) setBatchCount((batchNum - 1).toString());
            }}
            disabled={batchNum <= 1}
            style={[styles.counterBtn, batchNum <= 1 && styles.counterBtnDisabled]}
            activeOpacity={0.75}
          >
            <Minus size={18} color={batchNum <= 1 ? 'rgba(255,255,255,0.2)' : GREEN} />
          </TouchableOpacity>
          <Text style={styles.counterValue}>{batchCount || '1'}</Text>
          <TouchableOpacity
            onPress={() => {
              if (batchNum < MAX_BATCH_COUNT) setBatchCount((batchNum + 1).toString());
            }}
            disabled={batchNum >= MAX_BATCH_COUNT}
            style={[styles.counterBtn, batchNum >= MAX_BATCH_COUNT && styles.counterBtnDisabled]}
            activeOpacity={0.75}
          >
            <Plus size={18} color={batchNum >= MAX_BATCH_COUNT ? 'rgba(255,255,255,0.2)' : GREEN} />
          </TouchableOpacity>
        </View>

        {/* Truck Type */}
        <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>Truck Type</Text>
        <TouchableOpacity
          onPress={() => setShowTruckTypeModal(true)}
          style={styles.typeSelector}
          activeOpacity={0.75}
        >
          <Text style={styles.typeSelectorText}>{newTruck.type}</Text>
          <ChevronDown size={18} color="rgba(255,255,255,0.4)" />
        </TouchableOpacity>

        {/* Add Button */}
        <TouchableOpacity
          onPress={handleAddTruck}
          disabled={!newTruck.capacity || selectedCapacityNum <= 0 || selectedCapacityNum > MAX_CAPACITY_TONS}
          style={[
            styles.addBtn,
            (!newTruck.capacity || selectedCapacityNum <= 0 || selectedCapacityNum > MAX_CAPACITY_TONS) && styles.addBtnDisabled,
          ]}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.addBtnText,
              (!newTruck.capacity || selectedCapacityNum <= 0 || selectedCapacityNum > MAX_CAPACITY_TONS) && styles.addBtnTextDisabled,
            ]}
          >
            {batchNum > 1 ? `Add ${batchNum} Trucks` : 'Add Truck'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Fleet List */}
      {currentFleet.length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>Your Fleet ({totalTruckCount} trucks)</Text>
          {currentFleet.map((truck) => {
            const truckCount = truck.count || 1;
            const truckTotalCap = truck.capacity * truckCount;
            return (
              <View key={truck.id} style={styles.truckCard}>
                <View style={styles.truckCardRow}>
                  <View style={styles.truckIconCircle}>
                    <Truck size={16} color={GREEN} />
                  </View>
                  <View style={styles.truckInfo}>
                    <View style={styles.truckNameRow}>
                      <Text style={styles.truckType}>{truck.type}</Text>
                      {truckCount > 1 && (
                        <View style={styles.countBadge}>
                          <Text style={styles.countBadgeText}>{'\u00D7'}{truckCount}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.truckCapacity}>
                      {truckCount === 1
                        ? `${truck.capacity} ${truck.unit}`
                        : `${truck.capacity} ${truck.unit} each \u00B7 ${truckTotalCap}t total`}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveTruck(truck.id)}
                    style={styles.removeBtn}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={15} color="rgba(239,68,68,0.7)" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {currentFleet.length === 0 && (
        <View style={styles.emptyState}>
          <Truck size={40} color="rgba(255,255,255,0.15)" />
          <Text style={styles.emptyText}>No trucks added yet</Text>
        </View>
      )}

      {/* Truck Type Modal */}
      <Modal
        visible={showTruckTypeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTruckTypeModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowTruckTypeModal(false)}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Select Truck Type</Text>
            {truckTypes.map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => {
                  setNewTruck({ ...newTruck, type });
                  setShowTruckTypeModal(false);
                }}
                style={[styles.modalOption, newTruck.type === type && styles.modalOptionActive]}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    newTruck.type === type && styles.modalOptionTextActive,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}
