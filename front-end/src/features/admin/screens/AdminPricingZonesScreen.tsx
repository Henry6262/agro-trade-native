import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdminStackParamList } from '../../../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner } from '../../../shared/components';
import { apiClient } from '@services/api';

type AdminNavigationProp = NativeStackNavigationProp<AdminStackParamList>;

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
    city: {
      id: string;
      name: string;
      region: {
        name: string;
        country: {
          name: string;
          code: string;
          flagEmoji: string;
        };
      };
    };
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
  }[];
  _count: {
    cities: number;
    productPrices: number;
  };
}

export function AdminPricingZonesScreen() {
  const navigation = useNavigation<AdminNavigationProp>();
  const [zones, setZones] = useState<PricingZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newZone, setNewZone] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    marketSize: '',
    transportAccess: '',
    storageCapacity: '',
  });

  const zoneColors = [
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316', // Orange
    '#EC4899', // Pink
  ];

  useEffect(() => {
    fetchPricingZones();
  }, []);

  const fetchPricingZones = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/admin/pricing-zones');
      setZones(response.data.data);
    } catch (error: any) {
      // 404 means endpoint not yet available — show empty state silently
      if (error?.response?.status !== 404) {
        console.error('Failed to fetch pricing zones:', error);
        Alert.alert('Error', 'Failed to load pricing zones');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const createPricingZone = async () => {
    if (!newZone.name.trim()) {
      Alert.alert('Error', 'Zone name is required');
      return;
    }

    try {
      setIsCreating(true);
      const response = await apiClient.post('/admin/pricing-zones', newZone);
      setZones([...zones, response.data.data]);
      setNewZone({
        name: '',
        description: '',
        color: '#3B82F6',
        marketSize: '',
        transportAccess: '',
        storageCapacity: '',
      });
      setShowCreateForm(false);
      Alert.alert('Success', 'Pricing zone created successfully');
    } catch (error: any) {
      console.error('Failed to create pricing zone:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create pricing zone');
    } finally {
      setIsCreating(false);
    }
  };

  const toggleZoneStatus = async (zoneId: string, currentStatus: boolean) => {
    try {
      await apiClient.put(`/admin/pricing-zones/${zoneId}`, {
        isActive: !currentStatus,
      });
      setZones(
        zones.map((zone) => (zone.id === zoneId ? { ...zone, isActive: !currentStatus } : zone))
      );
    } catch (error) {
      console.error('Failed to update zone status:', error);
      Alert.alert('Error', 'Failed to update zone status');
    }
  };

  const deleteZone = async (zoneId: string) => {
    Alert.alert(
      'Delete Zone',
      'Are you sure you want to delete this pricing zone? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/admin/pricing-zones/${zoneId}`);
              setZones(zones.filter((zone) => zone.id !== zoneId));
              Alert.alert('Success', 'Pricing zone deleted successfully');
            } catch (error: any) {
              console.error('Failed to delete zone:', error);
              Alert.alert(
                'Error',
                error.response?.data?.message || 'Failed to delete pricing zone'
              );
            }
          },
        },
      ]
    );
  };

  const filteredZones = zones.filter(
    (zone) =>
      zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      zone.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <LoadingSpinner />
        <Text className="text-gray-900 mt-4">Loading pricing zones...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between p-6 border-b border-gray-200">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full bg-white items-center justify-center"
          >
            <Ionicons name="chevron-back" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <View className="flex-1 mx-4">
            <Text className="text-gray-900 text-xl font-semibold">Pricing Zones</Text>
            <Text className="text-gray-400 text-sm">Manage regional pricing zones</Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowCreateForm(true)}
            className="bg-blue-600 px-4 py-2 rounded-lg flex-row items-center"
          >
            <Ionicons name="add" size={20} color="white" />
            <Text className="text-white font-medium ml-1">Add Zone</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="px-6 py-4">
          <View className="bg-white rounded-lg flex-row items-center px-4 py-3">
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Search zones..."
              placeholderTextColor="#6B7280"
              className="flex-1 ml-3 text-gray-900"
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity onPress={() => setSearchTerm('')}>
                <Ionicons name="close-circle" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Create Form */}
        {showCreateForm && (
          <View className="mx-6 mb-4 bg-white rounded-xl p-4 border border-gray-200">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-gray-900 font-semibold text-lg">Create New Zone</Text>
              <TouchableOpacity onPress={() => setShowCreateForm(false)}>
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <View className="space-y-3">
              <View>
                <Text className="text-gray-600 text-sm mb-2">Zone Name *</Text>
                <TextInput
                  value={newZone.name}
                  onChangeText={(text) => setNewZone({ ...newZone, name: text })}
                  placeholder="e.g., Sofia Metro Area"
                  placeholderTextColor="#6B7280"
                  className="bg-gray-700 rounded-lg px-3 py-3 text-gray-900"
                />
              </View>

              <View>
                <Text className="text-gray-600 text-sm mb-2">Description</Text>
                <TextInput
                  value={newZone.description}
                  onChangeText={(text) => setNewZone({ ...newZone, description: text })}
                  placeholder="Zone description..."
                  placeholderTextColor="#6B7280"
                  className="bg-gray-700 rounded-lg px-3 py-3 text-gray-900"
                  multiline
                  numberOfLines={2}
                />
              </View>

              <View className="flex-row space-x-3">
                <View className="flex-1">
                  <Text className="text-gray-600 text-sm mb-2">Market Size</Text>
                  <TextInput
                    value={newZone.marketSize}
                    onChangeText={(text) => setNewZone({ ...newZone, marketSize: text })}
                    placeholder="Large/Medium/Small"
                    placeholderTextColor="#6B7280"
                    className="bg-gray-700 rounded-lg px-3 py-3 text-gray-900"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-600 text-sm mb-2">Transport Access</Text>
                  <TextInput
                    value={newZone.transportAccess}
                    onChangeText={(text) => setNewZone({ ...newZone, transportAccess: text })}
                    placeholder="Good/Limited/Poor"
                    placeholderTextColor="#6B7280"
                    className="bg-gray-700 rounded-lg px-3 py-3 text-gray-900"
                  />
                </View>
              </View>

              <View>
                <Text className="text-gray-600 text-sm mb-2">Zone Color</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="flex-row space-x-2"
                >
                  {zoneColors.map((color) => (
                    <TouchableOpacity
                      key={color}
                      onPress={() => setNewZone({ ...newZone, color })}
                      className="w-8 h-8 rounded-full border-2"
                      style={{
                        backgroundColor: color,
                        borderColor: newZone.color === color ? '#FFF' : 'transparent',
                      }}
                    />
                  ))}
                </ScrollView>
              </View>

              <View className="flex-row space-x-3 mt-4">
                <TouchableOpacity
                  onPress={() => setShowCreateForm(false)}
                  className="flex-1 bg-gray-700 rounded-lg py-3 items-center"
                >
                  <Text className="text-gray-600 font-medium">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={createPricingZone}
                  disabled={isCreating}
                  className="flex-1 bg-blue-600 rounded-lg py-3 items-center"
                >
                  <Text className="text-white font-medium">
                    {isCreating ? 'Creating...' : 'Create Zone'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Zones List */}
        <ScrollView className="flex-1 px-6">
          {filteredZones.map((zone) => (
            <View key={zone.id} className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
              {/* Zone Header */}
              <View className="flex-row items-start justify-between mb-3">
                <View className="flex-1">
                  <View className="flex-row items-center mb-2">
                    <View
                      className="w-4 h-4 rounded-full mr-3"
                      style={{ backgroundColor: zone.color || '#3B82F6' }}
                    />
                    <Text className="text-gray-900 font-semibold text-lg flex-1">{zone.name}</Text>
                    <View
                      className={`px-2 py-1 rounded-full ${
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
                    <Text className="text-gray-400 text-sm mb-2">{zone.description}</Text>
                  )}
                </View>
              </View>

              {/* Zone Stats */}
              <View className="flex-row space-x-4 mb-3">
                <View className="bg-gray-700 rounded-lg px-3 py-2 flex-1">
                  <Text className="text-gray-600 text-xs">Cities</Text>
                  <Text className="text-gray-900 font-semibold">{zone._count.cities}</Text>
                </View>
                <View className="bg-gray-700 rounded-lg px-3 py-2 flex-1">
                  <Text className="text-gray-600 text-xs">Price Points</Text>
                  <Text className="text-gray-900 font-semibold">{zone._count.productPrices}</Text>
                </View>
                <View className="bg-gray-700 rounded-lg px-3 py-2 flex-1">
                  <Text className="text-gray-600 text-xs">Market Size</Text>
                  <Text className="text-gray-900 font-semibold">{zone.marketSize || 'N/A'}</Text>
                </View>
              </View>

              {/* Sample Cities */}
              {zone.cities.length > 0 && (
                <View className="mb-3">
                  <Text className="text-gray-400 text-xs mb-2">Sample Cities:</Text>
                  <View className="flex-row flex-wrap">
                    {zone.cities.slice(0, 3).map((cityZone) => (
                      <View
                        key={cityZone.id}
                        className="bg-gray-700 rounded-full px-2 py-1 mr-2 mb-1 flex-row items-center"
                      >
                        <Text className="text-xs mr-1">
                          {cityZone.city.region.country.flagEmoji}
                        </Text>
                        <Text className="text-gray-600 text-xs">{cityZone.city.name}</Text>
                        {cityZone.isDefault && (
                          <View className="w-2 h-2 bg-blue-400 rounded-full ml-1" />
                        )}
                      </View>
                    ))}
                    {zone.cities.length > 3 && (
                      <Text className="text-gray-500 text-xs">+{zone.cities.length - 3} more</Text>
                    )}
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View className="flex-row space-x-2 pt-3 border-t border-gray-200">
                <TouchableOpacity
                  onPress={() => navigation.navigate('AdminZoneDetails', { zoneId: zone.id })}
                  className="flex-1 bg-blue-600 rounded-lg py-2 flex-row items-center justify-center"
                >
                  <Ionicons name="eye-outline" size={16} color="white" />
                  <Text className="text-white font-medium ml-2">View Details</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => toggleZoneStatus(zone.id, zone.isActive)}
                  className={`px-4 py-2 rounded-lg ${
                    zone.isActive ? 'bg-orange-600' : 'bg-green-600'
                  }`}
                >
                  <Text className="text-white font-medium">
                    {zone.isActive ? 'Disable' : 'Enable'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => deleteZone(zone.id)}
                  className="px-4 py-2 bg-red-600 rounded-lg"
                >
                  <Ionicons name="trash-outline" size={16} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {filteredZones.length === 0 && (
            <View className="items-center py-12">
              <Ionicons name="location-outline" size={64} color="#4B5563" />
              <Text className="text-gray-400 text-lg mt-4">
                {searchTerm ? 'No zones found' : 'No pricing zones yet'}
              </Text>
              <Text className="text-gray-500 text-center mt-2 px-8">
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : 'Create your first pricing zone to get started'}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
