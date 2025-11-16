import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import axios from 'axios';
import { API_URL } from '../../../config/api';
import { useAuthStore } from '../../../stores/auth.store';

interface MapZone {
  id: string;
  name: string;
  color: string;
  cities: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    country: string;
    countryCode: string;
    flagEmoji: string;
    isDefault: boolean;
  }>;
  samplePrices: Array<{
    productName: string;
    range: string;
    unit: string;
  }>;
}

export function AdminMapView() {
  const navigation = useNavigation();
  const { token } = useAuthStore();
  const [zones, setZones] = useState<MapZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState<MapZone | null>(null);
  const { width, height } = Dimensions.get('window');

  useEffect(() => {
    fetchMapData();
  }, []);

  const fetchMapData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/admin/analytics/map-data`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setZones(response.data.data);
    } catch (error) {
      console.error('Failed to fetch map data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitialRegion = () => {
    // Center on Bulgaria and Greece
    return {
      latitude: 41.5,
      longitude: 23.5,
      latitudeDelta: 8,
      longitudeDelta: 8,
    };
  };

  const handleMarkerPress = (zone: MapZone) => {
    setSelectedZone(zone);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-white mt-4">Loading map data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      {/* Header */}
      <View className="px-6 pt-4 pb-2 border-b border-gray-800">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-white flex-1">Pricing Zones Map</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('AdminPricingZones' as any)}
            className="bg-blue-600 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-medium">Manage Zones</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Map Container */}
      <View className="flex-1">
        <MapView
          provider={PROVIDER_GOOGLE}
          style={{ width, height: height - 120 }}
          initialRegion={getInitialRegion()}
          showsUserLocation={false}
          showsMyLocationButton={false}
        >
          {zones.map((zone) => (
            <React.Fragment key={zone.id}>
              {zone.cities.map((city) => (
                <React.Fragment key={city.id}>
                  <Marker
                    coordinate={{
                      latitude: city.latitude,
                      longitude: city.longitude,
                    }}
                    onPress={() => handleMarkerPress(zone)}
                  >
                    <View className="items-center">
                      <View
                        className="px-2 py-1 rounded-lg border-2"
                        style={{
                          backgroundColor: zone.color || '#3B82F6',
                          borderColor: 'white',
                        }}
                      >
                        <Text className="text-white text-xs font-bold">
                          {city.flagEmoji} {city.name}
                        </Text>
                      </View>
                      <View
                        className="w-0 h-0 border-l-8 border-r-8 border-t-8"
                        style={{
                          borderLeftColor: 'transparent',
                          borderRightColor: 'transparent',
                          borderTopColor: zone.color || '#3B82F6',
                        }}
                      />
                    </View>
                  </Marker>
                  <Circle
                    center={{
                      latitude: city.latitude,
                      longitude: city.longitude,
                    }}
                    radius={50000} // 50km radius
                    fillColor={`${zone.color || '#3B82F6'}20`}
                    strokeColor={zone.color || '#3B82F6'}
                    strokeWidth={1}
                  />
                </React.Fragment>
              ))}
            </React.Fragment>
          ))}
        </MapView>

        {/* Zone Info Overlay */}
        {selectedZone && (
          <View className="absolute bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 p-4">
            <View className="flex-row justify-between items-start mb-2">
              <View className="flex-1">
                <Text className="text-white text-lg font-bold">{selectedZone.name}</Text>
                <Text className="text-gray-400 text-sm">
                  {selectedZone.cities.length} cities in zone
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedZone(null)} className="p-2">
                <Ionicons name="close" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Cities List */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
              {selectedZone.cities.map((city) => (
                <View key={city.id} className="bg-gray-800 rounded-lg px-3 py-2 mr-2">
                  <Text className="text-white text-sm">
                    {city.flagEmoji} {city.name}
                  </Text>
                </View>
              ))}
            </ScrollView>

            {/* Sample Prices */}
            {selectedZone.samplePrices.length > 0 && (
              <View>
                <Text className="text-gray-400 text-sm mb-2">Sample Prices:</Text>
                <View className="flex-row flex-wrap">
                  {selectedZone.samplePrices.map((price, index) => (
                    <View key={index} className="bg-gray-800 rounded-lg px-3 py-2 mr-2 mb-2">
                      <Text className="text-white text-sm font-medium">{price.productName}</Text>
                      <Text className="text-green-400 text-xs">
                        {price.range}/{price.unit}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <TouchableOpacity
              onPress={() =>
                navigation.navigate('AdminZoneDetails' as any, { zoneId: selectedZone.id })
              }
              className="bg-blue-600 rounded-lg py-3 mt-3"
            >
              <Text className="text-white text-center font-medium">Edit Zone Details</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Legend */}
      <View className="absolute top-20 right-4 bg-gray-900 rounded-lg p-3 border border-gray-700">
        <Text className="text-white text-xs font-bold mb-2">Pricing Zones</Text>
        {zones.slice(0, 5).map((zone) => (
          <View key={zone.id} className="flex-row items-center mb-1">
            <View
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: zone.color || '#3B82F6' }}
            />
            <Text className="text-gray-300 text-xs">{zone.name}</Text>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}
