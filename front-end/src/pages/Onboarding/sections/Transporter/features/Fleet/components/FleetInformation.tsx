import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Plus, Truck, Trash2, ChevronDown, Minus, CheckCircle } from 'lucide-react-native';
import { useOnboardingStore } from '@stores/onboarding.store';
import type { VehicleType } from '@shared/types';

type TruckInfo = VehicleType;

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

const GREEN = '#4ADE80';
const GREEN_BG = 'rgba(74,222,128,0.12)';
const GREEN_BORDER = 'rgba(74,222,128,0.4)';
const GLASS_BG = 'rgba(255,255,255,0.05)';
const GLASS_BORDER = 'rgba(255,255,255,0.09)';

export function FleetInformation() {
  const { transportData, setFleetInfo } = useOnboardingStore();
  const [newTruck, setNewTruck] = useState({
    capacity: '',
    unit: 'tons' as 'tons' | 'kg',
    type: 'Standard',
  });
  const [batchMode] = useState(true);
  const [batchCount, setBatchCount] = useState('1');
  const [showTruckTypeModal, setShowTruckTypeModal] = useState(false);
  const [showCustomCapacity, setShowCustomCapacity] = useState(false);

  const currentFleet = transportData?.fleetInfo?.vehicleTypes || [];
  const totalCapacity = transportData?.fleetInfo?.capacity?.total || 0;

  const handleAddTruck = () => {
    if (newTruck.capacity && Number.parseFloat(newTruck.capacity) > 0) {
      const count = batchMode && batchCount ? Math.max(1, Number.parseInt(batchCount)) : 1;

      const existingTruckIndex = currentFleet.findIndex(
        (truck) =>
          truck.capacity === Number.parseFloat(newTruck.capacity) &&
          truck.unit === newTruck.unit &&
          truck.type === newTruck.type
      );

      let updatedFleet: TruckInfo[];

      if (existingTruckIndex !== -1 && batchMode) {
        updatedFleet = [...currentFleet];
        const existingCount = updatedFleet[existingTruckIndex].count || 1;
        updatedFleet[existingTruckIndex] = {
          ...updatedFleet[existingTruckIndex],
          count: existingCount + count,
        };
      } else {
        const newTruckInfo: TruckInfo = {
          id: `truck-${Date.now()}`,
          name: newTruck.type,
          capacity: Number.parseFloat(newTruck.capacity),
          suitable_for: [],
          unit: newTruck.unit,
          type: newTruck.type,
          count: count > 1 ? count : undefined,
        };
        updatedFleet = [...currentFleet, newTruckInfo];
      }

      const newTotalCapacity = updatedFleet.reduce((sum, t) => {
        const truckCount = t.count || 1;
        return sum + t.capacity * truckCount;
      }, 0);

      const totalVehicleCount = updatedFleet.reduce((sum, truck) => sum + (truck.count || 1), 0);

      setFleetInfo({
        ...transportData?.fleetInfo,
        vehicleCount: totalVehicleCount,
        vehicleTypes: updatedFleet,
        capacity: { total: newTotalCapacity, unit: 'tons' },
        baseLocation: transportData?.fleetInfo?.baseLocation || {
          id: '',
          address: '',
          city: '',
          state: '',
          country: '',
          zipCode: '',
        },
      });

      setNewTruck({ capacity: '', unit: 'tons', type: 'Standard' });
      setBatchCount('1');
      setShowCustomCapacity(false);
    }
  };

  const handleRemoveTruck = (truckId: string) => {
    const updatedFleet = currentFleet.filter((truck) => truck.id !== truckId);
    const newTotalCapacity = updatedFleet.reduce((sum, t) => {
      const truckCount = t.count || 1;
      return sum + t.capacity * truckCount;
    }, 0);
    const totalVehicleCount = updatedFleet.reduce((sum, truck) => sum + (truck.count || 1), 0);

    setFleetInfo({
      ...transportData?.fleetInfo,
      vehicleCount: totalVehicleCount,
      vehicleTypes: updatedFleet,
      capacity: { total: newTotalCapacity, unit: 'tons' },
      baseLocation: transportData?.fleetInfo?.baseLocation || {
        id: '',
        address: '',
        city: '',
        state: '',
        country: '',
        zipCode: '',
      },
    });
  };

  const selectedCapacityNum = Number.parseFloat(newTruck.capacity) || 0;
  const batchNum = Number.parseInt(batchCount) || 1;
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
              placeholder="Enter capacity in tons"
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
            onPress={() => setBatchCount((batchNum + 1).toString())}
            style={styles.counterBtn}
            activeOpacity={0.75}
          >
            <Plus size={18} color={GREEN} />
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
          disabled={!newTruck.capacity || selectedCapacityNum <= 0}
          style={[
            styles.addBtn,
            (!newTruck.capacity || selectedCapacityNum <= 0) && styles.addBtnDisabled,
          ]}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.addBtnText,
              (!newTruck.capacity || selectedCapacityNum <= 0) && styles.addBtnTextDisabled,
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
                          <Text style={styles.countBadgeText}>×{truckCount}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.truckCapacity}>
                      {truckCount === 1
                        ? `${truck.capacity} ${truck.unit}`
                        : `${truck.capacity} ${truck.unit} each · ${truckTotalCap}t total`}
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

const styles = StyleSheet.create({
  addBtn: {
    alignItems: 'center',
    backgroundColor: GREEN_BG,
    borderColor: GREEN_BORDER,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 16,
    paddingVertical: 15,
  },
  addBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  addBtnText: {
    color: GREEN,
    fontSize: 15,
    fontWeight: '700',
  },
  addBtnTextDisabled: {
    color: 'rgba(255,255,255,0.25)',
  },
  cancelText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  capacityBtn: {
    alignItems: 'center',
    backgroundColor: GLASS_BG,
    borderColor: GLASS_BORDER,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    paddingVertical: 14,
    width: '31%',
  },
  capacityBtnActive: {
    backgroundColor: GREEN_BG,
    borderColor: GREEN_BORDER,
  },
  capacityBtnNum: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 18,
    fontWeight: '800',
  },
  capacityBtnNumActive: {
    color: GREEN,
  },
  capacityBtnUnit: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  capacityBtnUnitActive: {
    color: 'rgba(74,222,128,0.6)',
  },
  capacityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  card: {
    backgroundColor: GLASS_BG,
    borderColor: GLASS_BORDER,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
    padding: 18,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 16,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
  checkIcon: {
    marginLeft: 'auto',
  },
  countBadge: {
    backgroundColor: GREEN_BG,
    borderColor: GREEN_BORDER,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  countBadgeText: {
    color: GREEN,
    fontSize: 11,
    fontWeight: '800',
  },
  counterBtn: {
    alignItems: 'center',
    backgroundColor: GREEN_BG,
    borderColor: GREEN_BORDER,
    borderRadius: 12,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  counterBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.07)',
  },
  counterRow: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: GLASS_BORDER,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  counterValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginHorizontal: 32,
    minWidth: 40,
    textAlign: 'center',
  },
  customBtn: {
    alignItems: 'center',
    backgroundColor: GLASS_BG,
    borderColor: GLASS_BORDER,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 13,
  },
  customBtnText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    fontWeight: '600',
  },
  customInputWrap: {
    gap: 0,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 14,
    marginTop: 12,
  },
  fieldLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  fieldLabelSpaced: {
    marginTop: 16,
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: GREEN_BG,
    borderColor: GREEN_BORDER,
    borderRadius: 10,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  modalBox: {
    backgroundColor: 'rgba(3,15,9,0.97)',
    borderColor: 'rgba(74,222,128,0.2)',
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: 400,
    padding: 20,
    width: '85%',
  },
  modalOption: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    marginBottom: 6,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  modalOptionActive: {
    backgroundColor: GREEN_BG,
    borderColor: GREEN_BORDER,
    borderWidth: 1,
  },
  modalOptionText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    fontWeight: '500',
  },
  modalOptionTextActive: {
    color: GREEN,
    fontWeight: '700',
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    flex: 1,
    justifyContent: 'center',
  },
  modalTitle: {
    borderBottomColor: 'rgba(74,222,128,0.12)',
    borderBottomWidth: 1,
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 14,
    paddingBottom: 12,
  },
  removeBtn: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140,
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  summaryCapacity: {
    color: GREEN,
    fontSize: 22,
    fontWeight: '800',
  },
  summaryCapacityBlock: {
    alignItems: 'flex-end',
  },
  summaryCapacityLabel: {
    color: 'rgba(74,222,128,0.6)',
    fontSize: 11,
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: GREEN_BG,
    borderColor: GREEN_BORDER,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  summaryCount: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  summaryLabel: {
    color: 'rgba(74,222,128,0.7)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  summaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: GLASS_BORDER,
    borderRadius: 14,
    borderWidth: 1,
    color: '#FFFFFF',
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  truckCapacity: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginTop: 2,
  },
  truckCard: {
    backgroundColor: GLASS_BG,
    borderColor: GLASS_BORDER,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    padding: 14,
  },
  truckCardRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  truckIconCircle: {
    alignItems: 'center',
    backgroundColor: GREEN_BG,
    borderColor: GREEN_BORDER,
    borderRadius: 10,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    marginRight: 12,
    width: 36,
  },
  truckInfo: {
    flex: 1,
  },
  truckNameRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  truckType: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  typeSelector: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: GLASS_BORDER,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  typeSelectorText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
});
