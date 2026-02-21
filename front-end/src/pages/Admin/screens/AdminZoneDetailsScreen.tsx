import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import type { AdminStackParamList } from '../../../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner } from '../../../shared/components';
import { apiClient } from '@services/api';
import { Picker } from '@react-native-picker/picker';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminZoneDetails'>;
type AdminNavigationProp = NativeStackNavigationProp<AdminStackParamList>;

interface City {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  region: {
    name: string;
    country: {
      name: string;
      code: string;
      flagEmoji: string;
    };
  };
  pricingZones?: {
    id: string;
    pricingZone: {
      id: string;
      name: string;
    };
    isDefault: boolean;
    priority: number;
  }[];
}

interface PricingZone {
  id: string;
  name: string;
  description?: string;
  color?: string;
  marketSize?: string;
  transportAccess?: string;
  storageCapacity?: string;
  isActive: boolean;
  cities: {
    id: string;
    city: City;
    isDefault: boolean;
    priority: number;
  }[];
  productPrices: {
    id: string;
    product: {
      id: string;
      displayName: string;
      category: string;
    };
    minPrice: number;
    maxPrice: number;
    currency: string;
    unit: string;
    qualityGrade?: string;
    effectiveDate: string;
    expiresDate?: string;
  }[];
}

export function AdminZoneDetailsScreen({ route }: Props) {
  const navigation = useNavigation<AdminNavigationProp>();
  const { zoneId } = route.params;

  const [zone, setZone] = useState<PricingZone | null>(null);
  const [availableCities, setAvailableCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddCityModal, setShowAddCityModal] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');
  const [cityPriority, setCityPriority] = useState('1');
  const [isDefaultCity, setIsDefaultCity] = useState(false);
  const [isAssigningCity, setIsAssigningCity] = useState(false);

  const [editingZone, setEditingZone] = useState(false);
  const [zoneForm, setZoneForm] = useState({
    name: '',
    description: '',
    marketSize: '',
    transportAccess: '',
    storageCapacity: '',
  });

  useEffect(() => {
    fetchZoneDetails();
    fetchAvailableCities();
  }, [zoneId]);

  const fetchZoneDetails = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(`/admin/pricing-zones`);
      const zones = response.data.data;
      const currentZone = zones.find((z: PricingZone) => z.id === zoneId);

      if (currentZone) {
        setZone(currentZone);
        setZoneForm({
          name: currentZone.name,
          description: currentZone.description || '',
          marketSize: currentZone.marketSize || '',
          transportAccess: currentZone.transportAccess || '',
          storageCapacity: currentZone.storageCapacity || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch zone details:', error);
      Alert.alert('Error', 'Failed to load zone details');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableCities = async () => {
    try {
      const response = await apiClient.get('/admin/cities');
      setAvailableCities(response.data.data);
    } catch (error) {
      console.error('Failed to fetch cities:', error);
    }
  };

  const updateZoneInfo = async () => {
    try {
      const response = await apiClient.put(`/admin/pricing-zones/${zoneId}`, zoneForm);
      setZone(response.data.data);
      setEditingZone(false);
      Alert.alert('Success', 'Zone information updated successfully');
    } catch (error: any) {
      console.error('Failed to update zone:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update zone');
    }
  };

  const assignCityToZone = async () => {
    if (!selectedCity) {
      Alert.alert('Error', 'Please select a city');
      return;
    }

    try {
      setIsAssigningCity(true);
      await apiClient.post('/admin/cities/assign-pricing-zone', {
        cityId: selectedCity,
        pricingZoneId: zoneId,
        priority: parseInt(cityPriority),
        isDefault: isDefaultCity,
      });

      await fetchZoneDetails(); // Refresh zone data
      setSelectedCity('');
      setCityPriority('1');
      setIsDefaultCity(false);
      setShowAddCityModal(false);
      Alert.alert('Success', 'City assigned to zone successfully');
    } catch (error: any) {
      console.error('Failed to assign city:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to assign city to zone');
    } finally {
      setIsAssigningCity(false);
    }
  };

  const removeCityFromZone = async (cityId: string, cityName: string) => {
    Alert.alert(
      'Remove City',
      `Are you sure you want to remove "${cityName}" from this pricing zone?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/admin/cities/${cityId}/pricing-zones/${zoneId}`);
              await fetchZoneDetails(); // Refresh zone data
              Alert.alert('Success', 'City removed from zone successfully');
            } catch (error: any) {
              console.error('Failed to remove city:', error);
              Alert.alert(
                'Error',
                error.response?.data?.message || 'Failed to remove city from zone'
              );
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center">
        <LoadingSpinner />
        <Text className="text-white mt-4">Loading zone details...</Text>
      </SafeAreaView>
    );
  }

  if (!zone) {
    return (
      <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center">
        <Ionicons name="location-outline" size={64} color="#4B5563" />
        <Text className="text-gray-400 text-lg mt-4">Zone not found</Text>
      </SafeAreaView>
    );
  }

  // Filter out cities that are already assigned to this zone
  const unassignedCities = availableCities.filter(
    (city) => !zone.cities.some((zoneCity) => zoneCity.city.id === city.id)
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between p-6 border-b border-gray-700">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <View className="flex-1 mx-4">
            <View className="flex-row items-center">
              <View
                className="w-4 h-4 rounded-full mr-3"
                style={{ backgroundColor: zone.color || '#3B82F6' }}
              />
              <Text className="text-white text-xl font-semibold">{zone.name}</Text>
            </View>
            <Text className="text-gray-400 text-sm">Zone Details & Management</Text>
          </View>

          <TouchableOpacity
            onPress={() => setEditingZone(true)}
            className="bg-blue-600 p-2 rounded-lg"
          >
            <Ionicons name="create-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1">
          {/* Zone Information */}
          <View className="p-6">
            <View className="bg-gray-800 rounded-xl p-4 border border-gray-700 mb-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-white font-semibold text-lg">Zone Information</Text>
                <View
                  className={`px-3 py-1 rounded-full ${
                    zone.isActive ? 'bg-green-900' : 'bg-red-900'
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      zone.isActive ? 'text-green-300' : 'text-red-300'
                    }`}
                  >
                    {zone.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>

              {zone.description && (
                <View className="mb-4">
                  <Text className="text-gray-400 text-sm mb-1">Description</Text>
                  <Text className="text-white">{zone.description}</Text>
                </View>
              )}

              <View className="flex-row flex-wrap -mx-2">
                <View className="w-1/2 px-2 mb-3">
                  <Text className="text-gray-400 text-sm mb-1">Market Size</Text>
                  <Text className="text-white">{zone.marketSize || 'Not set'}</Text>
                </View>
                <View className="w-1/2 px-2 mb-3">
                  <Text className="text-gray-400 text-sm mb-1">Transport Access</Text>
                  <Text className="text-white">{zone.transportAccess || 'Not set'}</Text>
                </View>
                <View className="w-1/2 px-2 mb-3">
                  <Text className="text-gray-400 text-sm mb-1">Storage Capacity</Text>
                  <Text className="text-white">{zone.storageCapacity || 'Not set'}</Text>
                </View>
                <View className="w-1/2 px-2 mb-3">
                  <Text className="text-gray-400 text-sm mb-1">Cities Assigned</Text>
                  <Text className="text-white">{zone.cities.length}</Text>
                </View>
              </View>
            </View>

            {/* Cities Section */}
            <View className="bg-gray-800 rounded-xl p-4 border border-gray-700 mb-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-white font-semibold text-lg">
                  Assigned Cities ({zone.cities.length})
                </Text>
                <TouchableOpacity
                  onPress={() => setShowAddCityModal(true)}
                  className="bg-green-600 px-3 py-1 rounded-lg flex-row items-center"
                >
                  <Ionicons name="add" size={16} color="white" />
                  <Text className="text-white font-medium ml-1">Add City</Text>
                </TouchableOpacity>
              </View>

              {zone.cities.length > 0 ? (
                <View className="space-y-2">
                  {zone.cities
                    .sort((a, b) => a.priority - b.priority)
                    .map((cityZone) => (
                      <View
                        key={cityZone.id}
                        className="bg-gray-700 rounded-lg p-3 flex-row items-center justify-between"
                      >
                        <View className="flex-1">
                          <View className="flex-row items-center mb-1">
                            <Text className="mr-2">{cityZone.city.region.country.flagEmoji}</Text>
                            <Text className="text-white font-medium">{cityZone.city.name}</Text>
                            {cityZone.isDefault && (
                              <View className="bg-blue-600 rounded-full px-2 py-0.5 ml-2">
                                <Text className="text-white text-xs">Default</Text>
                              </View>
                            )}
                          </View>
                          <Text className="text-gray-400 text-sm">
                            {cityZone.city.region.name}, {cityZone.city.region.country.name} •
                            Priority: {cityZone.priority}
                          </Text>
                        </View>

                        <TouchableOpacity
                          onPress={() => removeCityFromZone(cityZone.city.id, cityZone.city.name)}
                          className="p-2"
                        >
                          <Ionicons name="remove-circle-outline" size={20} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                </View>
              ) : (
                <View className="items-center py-8">
                  <Ionicons name="location-outline" size={48} color="#4B5563" />
                  <Text className="text-gray-400 mt-2">No cities assigned</Text>
                  <Text className="text-gray-500 text-sm">Add cities to this pricing zone</Text>
                </View>
              )}
            </View>

            {/* Product Prices Section */}
            <View className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-white font-semibold text-lg">
                  Product Prices ({zone.productPrices.length})
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('AdminProductPrices')}
                  className="bg-blue-600 px-3 py-1 rounded-lg"
                >
                  <Text className="text-white font-medium">Manage Prices</Text>
                </TouchableOpacity>
              </View>

              {zone.productPrices.length > 0 ? (
                <View className="space-y-2">
                  {zone.productPrices.slice(0, 5).map((price) => (
                    <View key={price.id} className="bg-gray-700 rounded-lg p-3">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-white font-medium">{price.product.displayName}</Text>
                        <View className="bg-gray-600 rounded-full px-2 py-0.5">
                          <Text className="text-gray-300 text-xs">{price.product.category}</Text>
                        </View>
                      </View>
                      <View className="flex-row items-center justify-between">
                        <Text className="text-blue-300">
                          {price.currency} {price.minPrice} - {price.maxPrice} per {price.unit}
                        </Text>
                        <Text className="text-gray-400 text-xs">
                          {price.qualityGrade || 'Standard'}
                        </Text>
                      </View>
                    </View>
                  ))}
                  {zone.productPrices.length > 5 && (
                    <Text className="text-gray-500 text-center mt-2">
                      +{zone.productPrices.length - 5} more prices
                    </Text>
                  )}
                </View>
              ) : (
                <View className="items-center py-8">
                  <Ionicons name="pricetag-outline" size={48} color="#4B5563" />
                  <Text className="text-gray-400 mt-2">No product prices set</Text>
                  <Text className="text-gray-500 text-sm">
                    Add prices for products in this zone
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Edit Zone Modal */}
      <Modal
        visible={editingZone}
        animationType="slide"
        transparent
        onRequestClose={() => setEditingZone(false)}
      >
        <View className="flex-1 bg-black/50 justify-center p-4">
          <View className="bg-gray-800 rounded-xl p-6">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-white font-semibold text-xl">Edit Zone</Text>
              <TouchableOpacity onPress={() => setEditingZone(false)}>
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <View className="space-y-4">
              <View>
                <Text className="text-gray-300 text-sm mb-2">Zone Name</Text>
                <TextInput
                  value={zoneForm.name}
                  onChangeText={(text) => setZoneForm({ ...zoneForm, name: text })}
                  className="bg-gray-700 rounded-lg px-3 py-3 text-white"
                />
              </View>

              <View>
                <Text className="text-gray-300 text-sm mb-2">Description</Text>
                <TextInput
                  value={zoneForm.description}
                  onChangeText={(text) => setZoneForm({ ...zoneForm, description: text })}
                  className="bg-gray-700 rounded-lg px-3 py-3 text-white"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View className="flex-row space-x-3">
                <View className="flex-1">
                  <Text className="text-gray-300 text-sm mb-2">Market Size</Text>
                  <TextInput
                    value={zoneForm.marketSize}
                    onChangeText={(text) => setZoneForm({ ...zoneForm, marketSize: text })}
                    className="bg-gray-700 rounded-lg px-3 py-3 text-white"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-300 text-sm mb-2">Transport Access</Text>
                  <TextInput
                    value={zoneForm.transportAccess}
                    onChangeText={(text) => setZoneForm({ ...zoneForm, transportAccess: text })}
                    className="bg-gray-700 rounded-lg px-3 py-3 text-white"
                  />
                </View>
              </View>

              <View>
                <Text className="text-gray-300 text-sm mb-2">Storage Capacity</Text>
                <TextInput
                  value={zoneForm.storageCapacity}
                  onChangeText={(text) => setZoneForm({ ...zoneForm, storageCapacity: text })}
                  className="bg-gray-700 rounded-lg px-3 py-3 text-white"
                />
              </View>
            </View>

            <View className="flex-row space-x-3 mt-6">
              <TouchableOpacity
                onPress={() => setEditingZone(false)}
                className="flex-1 bg-gray-700 rounded-lg py-3 items-center"
              >
                <Text className="text-gray-300 font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={updateZoneInfo}
                className="flex-1 bg-blue-600 rounded-lg py-3 items-center"
              >
                <Text className="text-white font-medium">Update Zone</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add City Modal */}
      <Modal
        visible={showAddCityModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddCityModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-gray-800 rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-white font-semibold text-xl">Add City to Zone</Text>
              <TouchableOpacity onPress={() => setShowAddCityModal(false)}>
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <View className="space-y-4">
              <View>
                <Text className="text-gray-300 text-sm mb-2">Select City</Text>
                <View className="bg-gray-700 rounded-lg">
                  <Picker
                    selectedValue={selectedCity}
                    onValueChange={setSelectedCity}
                    style={{ color: 'white' }}
                    dropdownIconColor="white"
                  >
                    <Picker.Item label="Choose a city..." value="" />
                    {unassignedCities.map((city) => (
                      <Picker.Item
                        key={city.id}
                        label={`${city.region.country.flagEmoji} ${city.name}, ${city.region.country.name}`}
                        value={city.id}
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              <View className="flex-row space-x-3">
                <View className="flex-1">
                  <Text className="text-gray-300 text-sm mb-2">Priority</Text>
                  <TextInput
                    value={cityPriority}
                    onChangeText={setCityPriority}
                    className="bg-gray-700 rounded-lg px-3 py-3 text-white"
                    keyboardType="numeric"
                    placeholder="1"
                  />
                </View>
                <View className="items-center justify-center">
                  <TouchableOpacity
                    onPress={() => setIsDefaultCity(!isDefaultCity)}
                    className={`flex-row items-center rounded-lg px-4 py-3 ${
                      isDefaultCity ? 'bg-blue-600' : 'bg-gray-700'
                    }`}
                  >
                    <Ionicons
                      name={isDefaultCity ? 'checkbox' : 'checkbox-outline'}
                      size={20}
                      color={isDefaultCity ? 'white' : '#9CA3AF'}
                    />
                    <Text className={`ml-2 ${isDefaultCity ? 'text-white' : 'text-gray-300'}`}>
                      Default City
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View className="flex-row space-x-3 mt-6">
              <TouchableOpacity
                onPress={() => setShowAddCityModal(false)}
                className="flex-1 bg-gray-700 rounded-lg py-3 items-center"
              >
                <Text className="text-gray-300 font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={assignCityToZone}
                disabled={isAssigningCity}
                className="flex-1 bg-green-600 rounded-lg py-3 items-center"
              >
                <Text className="text-white font-medium">
                  {isAssigningCity ? 'Adding...' : 'Add City'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
