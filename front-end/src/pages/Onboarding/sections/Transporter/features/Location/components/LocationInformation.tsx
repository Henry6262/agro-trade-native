import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MapPin, X, Truck, Edit2 } from 'lucide-react-native';
import { useOnboardingStore } from '@stores/onboarding.store';
import * as Location from 'expo-location';

interface BaseLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  assignedTrucks: string[];
  isMainBase: boolean;
}

export function LocationInformation() {
  const { transportData, setFleetInfo } = useOnboardingStore();

  // Local state for managing bases
  const [bases, setBases] = useState<BaseLocation[]>(() => {
    const existingBase = transportData?.fleetInfo?.baseLocation;
    if (existingBase && (existingBase.city || existingBase.address)) {
      return [
        {
          id: 'base-1',
          name: 'Main Base',
          address: existingBase.address || '',
          city: existingBase.city || '',
          state: existingBase.state || '',
          country: existingBase.country || '',
          zipCode: existingBase.zipCode || '',
          assignedTrucks: [],
          isMainBase: true,
        },
      ];
    }
    return [];
  });

  const [loadingLocation, setLoadingLocation] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<{
    city: string;
    state: string;
    country: string;
    address: string;
  } | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCity, setManualCity] = useState('');
  const [showAddBaseModal, setShowAddBaseModal] = useState(false);
  const [showTruckAssignmentModal, setShowTruckAssignmentModal] = useState(false);
  const [selectedBaseForAssignment] = useState<string | null>(null);
  const [newBase, setNewBase] = useState<
    Omit<BaseLocation, 'id' | 'assignedTrucks' | 'isMainBase'>
  >({
    name: '',
    address: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
  });

  // Get available trucks from fleet
  const availableFleet = transportData?.fleetInfo?.vehicleTypes || [];

  // Auto-detect location on mount
  useEffect(() => {
    if (bases.length === 0 && !detectedLocation) {
      requestLocationPermission();
    }
  }, []);

  const requestLocationPermission = async () => {
    try {
      setLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({});
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });

        if (reverseGeocode && reverseGeocode[0]) {
          const locationData = reverseGeocode[0];
          const detected = {
            city: locationData.city || '',
            state: locationData.region || '',
            country: locationData.country || '',
            address:
              `${locationData.street || ''} ${locationData.city || ''} ${locationData.region || ''} ${locationData.country || ''}`.trim(),
          };
          setDetectedLocation(detected);

          // Automatically create main base from detected location
          if (detected.city && detected.country) {
            const mainBase: BaseLocation = {
              id: 'base-1',
              name: 'Main Base',
              address: detected.address,
              city: detected.city,
              state: detected.state,
              country: detected.country,
              zipCode: '',
              assignedTrucks: [],
              isMainBase: true,
            };

            setBases([mainBase]);
            setFleetInfo({
              ...transportData?.fleetInfo,
              baseLocation: {
                id: mainBase.id,
                address: mainBase.address,
                city: mainBase.city,
                state: mainBase.state,
                country: mainBase.country,
                zipCode: mainBase.zipCode,
              },
              vehicleCount: transportData?.fleetInfo?.vehicleCount || 0,
              vehicleTypes: transportData?.fleetInfo?.vehicleTypes || [],
              capacity: transportData?.fleetInfo?.capacity || { total: 0, unit: 'tons' },
            });
          }
        }
      }
    } catch (error) {
      console.error('Error getting location:', error);
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleManualLocation = () => {
    if (!manualCity.trim()) {
      Alert.alert('Error', 'Please enter a city');
      return;
    }

    const mainBase: BaseLocation = {
      id: 'base-1',
      name: 'Main Base',
      address: manualCity,
      city: manualCity.split(',')[0]?.trim() || manualCity,
      state: '',
      country: '',
      zipCode: '',
      assignedTrucks: [],
      isMainBase: true,
    };

    setBases([mainBase]);
    setFleetInfo({
      ...transportData?.fleetInfo,
      baseLocation: {
        id: mainBase.id,
        address: mainBase.address,
        city: mainBase.city,
        state: mainBase.state,
        country: mainBase.country,
        zipCode: mainBase.zipCode,
      },
      vehicleCount: transportData?.fleetInfo?.vehicleCount || 0,
      vehicleTypes: transportData?.fleetInfo?.vehicleTypes || [],
      capacity: transportData?.fleetInfo?.capacity || { total: 0, unit: 'tons' },
    });
    setShowManualInput(false);
  };

  const addBase = () => {
    if (newBase.name && newBase.city && newBase.country) {
      const base: BaseLocation = {
        id: `base-${Date.now()}`,
        ...newBase,
        assignedTrucks: [],
        isMainBase: bases.length === 0,
      };

      const updatedBases = [...bases, base];
      setBases(updatedBases);

      // Update store
      const mainBaseLocation = base.isMainBase
        ? {
            id: base.id,
            address: base.address,
            city: base.city,
            state: base.state,
            country: base.country,
            zipCode: base.zipCode,
          }
        : transportData?.fleetInfo?.baseLocation;

      if (mainBaseLocation) {
        setFleetInfo({
          ...transportData?.fleetInfo,
          baseLocation: mainBaseLocation,
          vehicleCount: transportData?.fleetInfo?.vehicleCount || 0,
          vehicleTypes: transportData?.fleetInfo?.vehicleTypes || [],
          capacity: transportData?.fleetInfo?.capacity || { total: 0, unit: 'tons' },
        });
      }

      setNewBase({ name: '', address: '', city: '', state: '', country: '', zipCode: '' });
      setShowAddBaseModal(false);
    }
  };

  const assignTrucksToBase = (baseId: string, truckIds: string[]) => {
    const updatedBases = bases.map((base) => {
      if (base.id === baseId) {
        return { ...base, assignedTrucks: truckIds };
      }
      // Remove trucks from other bases
      return {
        ...base,
        assignedTrucks: base.assignedTrucks.filter((id) => !truckIds.includes(id)),
      };
    });

    setBases(updatedBases);
    // No need to update store with bases field
  };

  const TruckAssignmentModal = () => {
    const selectedBase = bases.find((b) => b.id === selectedBaseForAssignment);
    const [selectedTrucks, setSelectedTrucks] = useState<string[]>(
      selectedBase?.assignedTrucks || []
    );

    return (
      <Modal visible={showTruckAssignmentModal} transparent animationType="fade">
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.75)',
            justifyContent: 'center',
            padding: 16,
          }}
          onPress={() => setShowTruckAssignmentModal(false)}
          activeOpacity={1}
        >
          <TouchableOpacity
            style={{
              backgroundColor: 'rgba(3,15,9,0.97)',
              borderRadius: 16,
              padding: 24,
              maxHeight: '80%',
              borderWidth: 1,
              borderColor: 'rgba(74,222,128,0.18)',
            }}
            onPress={(e) => e.stopPropagation()}
            activeOpacity={1}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#FFFFFF' }}>
                Assign Trucks to {selectedBase?.name}
              </Text>
              <TouchableOpacity onPress={() => setShowTruckAssignmentModal(false)}>
                <X size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 300 }}>
              {availableFleet.map((truck, index) => (
                <TouchableOpacity
                  key={truck.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 12,
                    borderRadius: 8,
                    backgroundColor: selectedTrucks.includes(truck.id)
                      ? 'rgba(37, 99, 235, 0.1)'
                      : '#374151',
                    borderWidth: 1,
                    borderColor: selectedTrucks.includes(truck.id) ? '#2563eb' : '#374151',
                    marginBottom: 8,
                  }}
                  onPress={() => {
                    setSelectedTrucks((prev) =>
                      prev.includes(truck.id)
                        ? prev.filter((id) => id !== truck.id)
                        : [...prev, truck.id]
                    );
                  }}
                >
                  <Truck
                    size={20}
                    color={selectedTrucks.includes(truck.id) ? '#2563eb' : '#9CA3AF'}
                  />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={{ color: '#FFFFFF', fontWeight: '500' }}>Truck {index + 1}</Text>
                    <Text style={{ color: '#9CA3AF', fontSize: 12 }}>
                      {truck.capacity} {truck.unit} - {truck.type}
                    </Text>
                  </View>
                  {selectedTrucks.includes(truck.id) && (
                    <Text style={{ color: '#2563eb', fontWeight: 'bold' }}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={{
                backgroundColor: '#4ADE80',
                borderRadius: 8,
                paddingVertical: 12,
                marginTop: 16,
              }}
              onPress={() => {
                if (selectedBaseForAssignment) {
                  assignTrucksToBase(selectedBaseForAssignment, selectedTrucks);
                }
                setShowTruckAssignmentModal(false);
              }}
            >
              <Text style={{ color: '#052e16', textAlign: 'center', fontWeight: '700' }}>
                Assign {selectedTrucks.length} Trucks
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <View style={{ alignItems: 'center', marginBottom: 32 }}>
        <View
          style={{
            width: 64,
            height: 64,
            backgroundColor: 'rgba(37, 99, 235, 0.2)',
            borderRadius: 32,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <MapPin size={32} color="#2563eb" />
        </View>
        <Text
          style={{
            fontSize: 28,
            fontWeight: 'bold',
            color: '#FFFFFF',
            textAlign: 'center',
            marginBottom: 12,
          }}
        >
          Business Location
        </Text>
        <Text style={{ color: '#9CA3AF', maxWidth: 600, textAlign: 'center', fontSize: 16 }}>
          Confirm your main base location
        </Text>
      </View>

      {/* Location Display */}
      <View
        style={{
          backgroundColor: 'rgba(3,15,9,0.95)',
          borderRadius: 16,
          padding: 20,
          borderWidth: 1,
          borderColor: 'rgba(74,222,128,0.18)',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <MapPin size={22} color="#ea580c" />
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#FFFFFF', marginLeft: 8 }}>
            Main Base Location
          </Text>
        </View>

        {loadingLocation ? (
          <View style={{ paddingVertical: 32, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#ea580c" />
            <Text style={{ color: '#9CA3AF', marginTop: 12 }}>Detecting your location...</Text>
          </View>
        ) : !showManualInput && bases.length > 0 ? (
          <TouchableOpacity
            onPress={() => setShowManualInput(true)}
            style={{
              backgroundColor: 'rgba(255,255,255,0.06)',
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '500', marginBottom: 4 }}
                >
                  {bases[0].city || bases[0].address}
                </Text>
                {bases[0].state && bases[0].country && (
                  <Text style={{ color: '#9CA3AF', fontSize: 14 }}>
                    {bases[0].state}, {bases[0].country}
                  </Text>
                )}
              </View>
              <Edit2 size={18} color="#ea580c" />
            </View>
          </TouchableOpacity>
        ) : (
          <View>
            <TextInput
              value={manualCity}
              onChangeText={setManualCity}
              placeholder="Enter your city or region..."
              placeholderTextColor="#9CA3AF"
              style={{
                backgroundColor: '#111827',
                borderRadius: 12,
                padding: 16,
                color: '#FFFFFF',
                fontSize: 16,
                borderWidth: 2,
                borderColor: '#ea580c',
                marginBottom: 12,
              }}
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  setShowManualInput(false);
                  setManualCity('');
                }}
                style={{
                  flex: 1,
                  backgroundColor: '#374151',
                  borderRadius: 8,
                  paddingVertical: 12,
                }}
              >
                <Text style={{ color: '#9CA3AF', textAlign: 'center', fontWeight: '500' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleManualLocation}
                style={{
                  flex: 1,
                  backgroundColor: '#ea580c',
                  borderRadius: 8,
                  paddingVertical: 12,
                }}
              >
                <Text style={{ color: '#FFFFFF', textAlign: 'center', fontWeight: '600' }}>
                  Set Location
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Add Base Modal */}
      <Modal visible={showAddBaseModal} transparent animationType="fade">
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.75)',
            justifyContent: 'center',
            padding: 16,
          }}
          onPress={() => setShowAddBaseModal(false)}
          activeOpacity={1}
        >
          <TouchableOpacity
            style={{
              backgroundColor: 'rgba(3,15,9,0.97)',
              borderRadius: 16,
              padding: 24,
              maxHeight: '80%',
              borderWidth: 1,
              borderColor: 'rgba(74,222,128,0.18)',
            }}
            onPress={(e) => e.stopPropagation()}
            activeOpacity={1}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#FFFFFF' }}>
                Add New Base
              </Text>
              <TouchableOpacity onPress={() => setShowAddBaseModal(false)}>
                <X size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{ fontSize: 14, fontWeight: '500', color: '#9CA3AF', marginBottom: 8 }}
                >
                  Base Name *
                </Text>
                <TextInput
                  placeholder="e.g., Downtown Office, Warehouse 2"
                  value={newBase.name}
                  onChangeText={(text) => setNewBase({ ...newBase, name: text })}
                  style={{
                    borderWidth: 1,
                    borderColor: 'rgba(74,222,128,0.15)',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    color: '#FFFFFF',
                  }}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{ fontSize: 14, fontWeight: '500', color: '#9CA3AF', marginBottom: 8 }}
                >
                  City *
                </Text>
                <TextInput
                  placeholder="Enter city"
                  value={newBase.city}
                  onChangeText={(text) => setNewBase({ ...newBase, city: text })}
                  style={{
                    borderWidth: 1,
                    borderColor: 'rgba(74,222,128,0.15)',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    color: '#FFFFFF',
                  }}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text
                    style={{ fontSize: 14, fontWeight: '500', color: '#9CA3AF', marginBottom: 8 }}
                  >
                    State
                  </Text>
                  <TextInput
                    placeholder="State/Province"
                    value={newBase.state}
                    onChangeText={(text) => setNewBase({ ...newBase, state: text })}
                    style={{
                      borderWidth: 1,
                      borderColor: '#374151',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      backgroundColor: '#111827',
                      color: '#FFFFFF',
                    }}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text
                    style={{ fontSize: 14, fontWeight: '500', color: '#9CA3AF', marginBottom: 8 }}
                  >
                    Country *
                  </Text>
                  <TextInput
                    placeholder="Country"
                    value={newBase.country}
                    onChangeText={(text) => setNewBase({ ...newBase, country: text })}
                    style={{
                      borderWidth: 1,
                      borderColor: '#374151',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      backgroundColor: '#111827',
                      color: '#FFFFFF',
                    }}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{ fontSize: 14, fontWeight: '500', color: '#9CA3AF', marginBottom: 8 }}
                >
                  Address
                </Text>
                <TextInput
                  placeholder="Full address (optional)"
                  value={newBase.address}
                  onChangeText={(text) => setNewBase({ ...newBase, address: text })}
                  multiline
                  numberOfLines={2}
                  style={{
                    borderWidth: 1,
                    borderColor: 'rgba(74,222,128,0.15)',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    color: '#FFFFFF',
                    textAlignVertical: 'top',
                  }}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{ fontSize: 14, fontWeight: '500', color: '#9CA3AF', marginBottom: 8 }}
                >
                  ZIP Code
                </Text>
                <TextInput
                  placeholder="Postal/ZIP code"
                  value={newBase.zipCode}
                  onChangeText={(text) => setNewBase({ ...newBase, zipCode: text })}
                  style={{
                    borderWidth: 1,
                    borderColor: 'rgba(74,222,128,0.15)',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    color: '#FFFFFF',
                  }}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              style={{
                backgroundColor:
                  newBase.name && newBase.city && newBase.country
                    ? '#4ADE80'
                    : 'rgba(255,255,255,0.1)',
                borderRadius: 8,
                paddingVertical: 12,
                marginTop: 8,
              }}
              onPress={addBase}
              disabled={!newBase.name || !newBase.city || !newBase.country}
            >
              <Text style={{ color: '#FFFFFF', textAlign: 'center', fontWeight: '600' }}>
                Add Base
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <TruckAssignmentModal />
    </SafeAreaView>
  );
}
