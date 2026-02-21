import React, { useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { LocationMapPicker, SelectedLocation } from '@shared/components/LocationMapPicker';
import { Button } from '@shared/components/Button';

export const LocationPickerDemoScreen: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [confirmedLocation, setConfirmedLocation] = useState<SelectedLocation | null>(null);

  const handleLocationSelect = (location: SelectedLocation) => {
    setSelectedLocation(location);
  };

  const handleLocationConfirm = (location: SelectedLocation) => {
    setConfirmedLocation(location);
    Alert.alert(
      'Location Confirmed',
      `Selected: ${location.formattedAddress || `${location.latitude}, ${location.longitude}`}`,
      [{ text: 'OK' }]
    );
  };

  const resetDemo = () => {
    setSelectedLocation(null);
    setConfirmedLocation(null);
  };

  return (
    <ScrollView className="flex-1 bg-gray-900">
      <View className="p-4">
        <Text className="text-white text-2xl font-bold mb-2">Location Map Picker Demo</Text>
        <Text className="text-gray-400 mb-6">
          Tap on the map to select a location. The component will automatically reverse geocode the
          coordinates to get the address.
        </Text>

        {/* Map Picker Component */}
        <LocationMapPicker
          title="Select Delivery Location"
          confirmButtonText="Confirm This Location"
          onLocationSelect={handleLocationSelect}
          onLocationConfirm={handleLocationConfirm}
          showUserLocation={true}
          showSearchBar={true}
          height={400}
        />

        {/* Selected Location Info */}
        {selectedLocation && (
          <View className="mt-6 bg-gray-800 rounded-lg p-4">
            <Text className="text-white text-lg font-semibold mb-2">Selected Location</Text>
            <View className="space-y-2">
              <Text className="text-gray-300">
                <Text className="font-medium">Coordinates:</Text>{' '}
                {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
              </Text>
              {selectedLocation.formattedAddress && (
                <Text className="text-gray-300">
                  <Text className="font-medium">Address:</Text> {selectedLocation.formattedAddress}
                </Text>
              )}
              {selectedLocation.city && (
                <Text className="text-gray-300">
                  <Text className="font-medium">City:</Text> {selectedLocation.city}
                </Text>
              )}
              {selectedLocation.region && (
                <Text className="text-gray-300">
                  <Text className="font-medium">Region:</Text> {selectedLocation.region}
                </Text>
              )}
              {selectedLocation.country && (
                <Text className="text-gray-300">
                  <Text className="font-medium">Country:</Text> {selectedLocation.country}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Confirmed Location Info */}
        {confirmedLocation && (
          <View className="mt-4 bg-green-900/30 border border-green-600 rounded-lg p-4">
            <Text className="text-green-400 text-lg font-semibold mb-2">✓ Confirmed Location</Text>
            <Text className="text-green-300">
              {confirmedLocation.formattedAddress ||
                `${confirmedLocation.latitude}, ${confirmedLocation.longitude}`}
            </Text>
          </View>
        )}

        {/* Reset Button */}
        <View className="mt-6">
          <Button title="Reset Demo" onPress={resetDemo} variant="outline" fullWidth />
        </View>

        {/* Usage Instructions */}
        <View className="mt-6 bg-blue-900/30 border border-blue-600 rounded-lg p-4">
          <Text className="text-blue-400 text-lg font-semibold mb-2">How to Use</Text>
          <View className="space-y-1">
            <Text className="text-blue-300 text-sm">
              • Tap the navigation button (top-right) to center on your location
            </Text>
            <Text className="text-blue-300 text-sm">• Tap anywhere on the map to place a pin</Text>
            <Text className="text-blue-300 text-sm">
              • The address will be automatically resolved
            </Text>
            <Text className="text-blue-300 text-sm">
              • Use the "Confirm Location" button to finalize your selection
            </Text>
            <Text className="text-blue-300 text-sm">
              • The search bar is for UI demonstration (functionality coming soon)
            </Text>
          </View>
        </View>

        {/* Component Features */}
        <View className="mt-4 bg-gray-800 rounded-lg p-4">
          <Text className="text-white text-lg font-semibold mb-2">Component Features</Text>
          <View className="space-y-1">
            <Text className="text-gray-300 text-sm">
              ✓ Google Maps integration with react-native-maps
            </Text>
            <Text className="text-gray-300 text-sm">
              ✓ User location detection and permission handling
            </Text>
            <Text className="text-gray-300 text-sm">
              ✓ Tap-to-select location with custom marker
            </Text>
            <Text className="text-gray-300 text-sm">
              ✓ Automatic reverse geocoding for addresses
            </Text>
            <Text className="text-gray-300 text-sm">✓ Customizable UI with confirmation flow</Text>
            <Text className="text-gray-300 text-sm">
              ✓ Search bar UI (implementation ready for backend)
            </Text>
            <Text className="text-gray-300 text-sm">✓ Error handling and loading states</Text>
            <Text className="text-gray-300 text-sm">✓ Platform-specific optimizations</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};
