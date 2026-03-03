import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { X, MapPin, Search, Check } from 'lucide-react-native';
import * as Location from 'expo-location';

interface LocationData {
  address: string;
  city: string;
  region: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

interface LocationConfirmationDrawerProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (location: LocationData) => void;
  initialLocation?: LocationData;
}

export const LocationConfirmationDrawer: React.FC<LocationConfirmationDrawerProps> = ({
  visible,
  onClose,
  onConfirm,
  initialLocation,
}) => {
  const [location, setLocation] = useState<LocationData>(
    initialLocation || {
      address: '',
      city: '',
      region: '',
      country: '',
    }
  );
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible && !initialLocation) {
      // Try to get current location when drawer opens
      getCurrentLocation();
    }
  }, [visible]);

  const getCurrentLocation = async () => {
    try {
      setIsLoadingLocation(true);

      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable location services to use this feature.');
        return;
      }

      // Get current position
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Reverse geocode to get address
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const result = reverseGeocode[0];
        setLocation({
          address:
            `${result.streetNumber || ''} ${result.street || ''}`.trim() || result.name || '',
          city: result.city || '',
          region: result.region || '',
          country: result.country || '',
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please enter it manually.'
      );
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const searchLocation = async () => {
    if (!searchQuery.trim()) return;

    try {
      setIsLoadingLocation(true);

      // Geocode the search query
      const geocodeResults = await Location.geocodeAsync(searchQuery);

      if (geocodeResults.length > 0) {
        const result = geocodeResults[0];

        // Reverse geocode to get full address details
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: result.latitude,
          longitude: result.longitude,
        });

        if (reverseGeocode.length > 0) {
          const addressResult = reverseGeocode[0];
          setLocation({
            address:
              `${addressResult.streetNumber || ''} ${addressResult.street || ''}`.trim() ||
              addressResult.name ||
              '',
            city: addressResult.city || '',
            region: addressResult.region || '',
            country: addressResult.country || '',
            latitude: result.latitude,
            longitude: result.longitude,
          });
        }
      } else {
        Alert.alert('Not Found', 'Could not find the specified location.');
      }
    } catch (error) {
      console.error('Error searching location:', error);
      Alert.alert('Search Error', 'Unable to search for location.');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!location.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!location.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!location.country.trim()) {
      newErrors.country = 'Country is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = () => {
    if (!validateForm()) {
      return;
    }

    onConfirm(location);
  };

  const updateLocationField = (field: keyof LocationData, value: string) => {
    setLocation((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View className="flex-1 bg-white/50">
        <View className="bg-white rounded-t-3xl mt-20" style={{ flex: 1 }}>
          {/* Header */}
          <View className="flex-row justify-between items-center p-6 border-b border-gray-200">
            <View>
              <Text className="text-xl font-bold text-gray-900">Confirm Location</Text>
              <Text className="text-sm text-gray-500 mt-1">Where is this product located?</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X color="#ffffff" size={24} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            className="flex-1 px-6"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            {/* Location Search */}
            <View className="mt-6">
              <Text className="text-lg font-semibold text-green-400 mb-4">Search Location</Text>

              <View className="flex-row gap-2">
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search for address, city, or landmark"
                  placeholderTextColor="#6B7280"
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900"
                  onSubmitEditing={searchLocation}
                />
                <TouchableOpacity
                  onPress={searchLocation}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-3"
                  disabled={isLoadingLocation}
                >
                  {isLoadingLocation ? (
                    <ActivityIndicator size="small" color="#10B981" />
                  ) : (
                    <Search color="#10B981" size={20} />
                  )}
                </TouchableOpacity>
              </View>

              {/* Current Location Button */}
              <TouchableOpacity
                onPress={getCurrentLocation}
                disabled={isLoadingLocation}
                className="mt-3 flex-row items-center justify-center bg-gray-50 border border-gray-200 rounded-lg py-3"
              >
                <MapPin color="#10B981" size={20} />
                <Text className="text-green-400 ml-2">Use Current Location</Text>
              </TouchableOpacity>
            </View>

            {/* Location Details */}
            <View className="mt-6">
              <Text className="text-lg font-semibold text-green-400 mb-4">Location Details</Text>

              {/* Address */}
              <View className="mb-4">
                <Text className="text-gray-600 mb-2">
                  Address <Text className="text-red-400">*</Text>
                </Text>
                <TextInput
                  value={location.address}
                  onChangeText={(text) => updateLocationField('address', text)}
                  placeholder="Street address"
                  placeholderTextColor="#6B7280"
                  className={`bg-gray-50 border ${
                    errors.address ? 'border-red-500' : 'border-gray-200'
                  } rounded-lg px-3 py-2 text-gray-900`}
                />
                {errors.address && (
                  <Text className="text-red-400 text-xs mt-1">{errors.address}</Text>
                )}
              </View>

              {/* City */}
              <View className="mb-4">
                <Text className="text-gray-600 mb-2">
                  City <Text className="text-red-400">*</Text>
                </Text>
                <TextInput
                  value={location.city}
                  onChangeText={(text) => updateLocationField('city', text)}
                  placeholder="City"
                  placeholderTextColor="#6B7280"
                  className={`bg-gray-50 border ${
                    errors.city ? 'border-red-500' : 'border-gray-200'
                  } rounded-lg px-3 py-2 text-gray-900`}
                />
                {errors.city && <Text className="text-red-400 text-xs mt-1">{errors.city}</Text>}
              </View>

              {/* Region/State */}
              <View className="mb-4">
                <Text className="text-gray-600 mb-2">Region/State</Text>
                <TextInput
                  value={location.region}
                  onChangeText={(text) => updateLocationField('region', text)}
                  placeholder="Region or State"
                  placeholderTextColor="#6B7280"
                  className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900"
                />
              </View>

              {/* Country */}
              <View className="mb-4">
                <Text className="text-gray-600 mb-2">
                  Country <Text className="text-red-400">*</Text>
                </Text>
                <TextInput
                  value={location.country}
                  onChangeText={(text) => updateLocationField('country', text)}
                  placeholder="Country"
                  placeholderTextColor="#6B7280"
                  className={`bg-gray-50 border ${
                    errors.country ? 'border-red-500' : 'border-gray-200'
                  } rounded-lg px-3 py-2 text-gray-900`}
                />
                {errors.country && (
                  <Text className="text-red-400 text-xs mt-1">{errors.country}</Text>
                )}
              </View>

              {/* Coordinates (read-only) */}
              {location.latitude && location.longitude && (
                <View className="p-3 bg-gray-50 rounded-lg">
                  <Text className="text-xs text-gray-500">
                    Coordinates: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer */}
          <View className="absolute bottom-0 left-0 right-0 bg-gray-50 border-t border-gray-200 p-4">
            <TouchableOpacity
              onPress={handleConfirm}
              disabled={isLoadingLocation}
              className={`bg-green-500 py-3 px-6 rounded-lg flex-row items-center justify-center ${
                isLoadingLocation ? 'opacity-50' : ''
              }`}
            >
              {isLoadingLocation ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Check color="#ffffff" size={20} />
                  <Text className="text-gray-900 text-center font-semibold ml-2">
                    Confirm Location
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
