import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region, LatLng, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { MapPin, Search, Navigation, Check, X } from 'lucide-react-native';
import { Input } from './Input';
// Configuration Constants
const DEFAULT_LATITUDE_DELTA = 0.01;
const DEFAULT_LONGITUDE_DELTA = 0.01;
const MAP_ANIMATION_DURATION = 1000;
const LOCATION_ACCURACY_RADIUS = 30;
const INITIAL_REGION = {
  latitude: 42.6977, // Sofia, Bulgaria (default for agro-trade)
  longitude: 23.3219,
  latitudeDelta: DEFAULT_LATITUDE_DELTA,
  longitudeDelta: DEFAULT_LONGITUDE_DELTA,
};

// Types
export interface SelectedLocation {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  region?: string;
  country?: string;
  formattedAddress?: string;
}

export interface LocationMapPickerProps {
  onLocationSelect?: (location: SelectedLocation) => void;
  onLocationConfirm?: (location: SelectedLocation) => void;
  initialLocation?: LatLng;
  showUserLocation?: boolean;
  showSearchBar?: boolean;
  height?: number;
  title?: string;
  confirmButtonText?: string;
  style?: any;
}

export const LocationMapPicker: React.FC<LocationMapPickerProps> = ({
  onLocationSelect,
  onLocationConfirm,
  initialLocation,
  showUserLocation = true,
  showSearchBar = true,
  _height = 400,
  title = 'Select Location',
  confirmButtonText = 'Confirm Location',
  style,
}) => {
  // State
  const [currentRegion, setCurrentRegion] = useState<Region>(
    initialLocation
      ? {
          ...initialLocation,
          latitudeDelta: DEFAULT_LATITUDE_DELTA,
          longitudeDelta: DEFAULT_LONGITUDE_DELTA,
        }
      : INITIAL_REGION
  );
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(
    initialLocation
      ? { latitude: initialLocation.latitude, longitude: initialLocation.longitude }
      : null
  );
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);

  // Refs
  const mapRef = useRef<MapView>(null);

  // Effects
  useEffect(() => {
    if (showUserLocation) {
      initializeUserLocation();
    }
  }, [showUserLocation]);

  // Location Permission and Initialization
  const initializeUserLocation = async () => {
    try {
      setIsLoadingLocation(true);

      // Check permissions
      const { status } = await Location.getForegroundPermissionsAsync();

      if (status !== 'granted') {
        const permissionResponse = await Location.requestForegroundPermissionsAsync();
        if (permissionResponse.status !== 'granted') {
          setLocationPermissionGranted(false);
          return;
        }
      }

      setLocationPermissionGranted(true);

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const userCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setUserLocation(userCoords);

      // Center map on user location if no initial location provided
      if (!initialLocation && mapRef.current) {
        const region = {
          ...userCoords,
          latitudeDelta: DEFAULT_LATITUDE_DELTA,
          longitudeDelta: DEFAULT_LONGITUDE_DELTA,
        };

        setCurrentRegion(region);
        mapRef.current.animateToRegion(region, MAP_ANIMATION_DURATION);
      }
    } catch (error) {
      console.error('Failed to get user location:', error);
      Alert.alert(
        'Location Error',
        'Unable to access your location. You can still select a location manually on the map.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Center map on user location
  const centerOnUserLocation = useCallback(() => {
    if (userLocation && mapRef.current) {
      const region = {
        ...userLocation,
        latitudeDelta: currentRegion.latitudeDelta,
        longitudeDelta: currentRegion.longitudeDelta,
      };

      mapRef.current.animateToRegion(region, MAP_ANIMATION_DURATION);
    }
  }, [userLocation, currentRegion]);

  // Handle map press to select location
  const handleMapPress = async (event: any) => {
    const coordinate = event.nativeEvent.coordinate;

    setSelectedLocation({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    });

    onLocationSelect?.({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    });

    // Start reverse geocoding
    await reverseGeocodeLocation(coordinate.latitude, coordinate.longitude);
  };

  // Reverse geocode selected location
  const reverseGeocodeLocation = async (latitude: number, longitude: number) => {
    try {
      setIsLoadingAddress(true);

      // Use expo-location reverse geocoding directly
      // (Backend endpoint doesn't exist yet, skip the API call)
      const [address] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      const streetAddress = address
        ? `${address.streetNumber || ''} ${address.street || ''}`.trim() || address.name || ''
        : '';

      const formattedAddress = address
        ? `${streetAddress} ${address.city || ''} ${address.region || ''} ${address.country || ''}`.trim()
        : `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

      const updatedLocation: SelectedLocation = {
        latitude,
        longitude,
        address: streetAddress || formattedAddress,
        city: address?.city || 'Unknown City',
        region: address?.region || '',
        country: address?.country || 'Unknown Country',
        formattedAddress,
      };

      setSelectedLocation(updatedLocation);
      onLocationSelect?.(updatedLocation);
    } catch (error) {
      console.error('Reverse geocoding failed:', error);

      // Fallback to coordinates
      const updatedLocation: SelectedLocation = {
        latitude,
        longitude,
        formattedAddress: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      };

      setSelectedLocation(updatedLocation);
      onLocationSelect?.(updatedLocation);
    } finally {
      setIsLoadingAddress(false);
    }
  };

  // Handle location confirmation
  const handleConfirmLocation = () => {
    if (selectedLocation) {
      onLocationConfirm?.(selectedLocation);
    } else {
      Alert.alert(
        'No Location Selected',
        'Please tap on the map to select a location before confirming.',
        [{ text: 'OK' }]
      );
    }
  };

  // Clear selected location
  const handleClearLocation = () => {
    setSelectedLocation(null);
    onLocationSelect?.(null as any);
  };

  // Custom map style for better visibility (optional)
  const customMapStyle = [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
  ];

  return (
    <View
      style={[
        { flex: 1, backgroundColor: '#1F2937' }, // Always use flex: 1 for full height
        style,
      ]}
    >
      {/* Header - Only show if title is provided */}
      {title ? (
        <View className="p-4 bg-gray-700 border-b border-gray-600">
          <Text className="text-gray-900 text-lg font-semibold">{title}</Text>
          {selectedLocation?.formattedAddress && (
            <Text className="text-gray-600 text-sm mt-1" numberOfLines={2}>
              {isLoadingAddress ? 'Getting address...' : selectedLocation.formattedAddress}
            </Text>
          )}
        </View>
      ) : selectedLocation?.formattedAddress ? (
        // Compact header when no title
        <View className="p-3 bg-gray-700 border-b border-gray-600">
          <Text className="text-gray-600 text-sm" numberOfLines={2}>
            {isLoadingAddress ? 'Getting address...' : selectedLocation.formattedAddress}
          </Text>
        </View>
      ) : null}

      {/* Search Bar (UI only) */}
      {showSearchBar && (
        <View className="p-4 bg-gray-700 border-b border-gray-600">
          <Input
            placeholder="Search for a location..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon={<Search size={20} color="#9CA3AF" />}
            variant="outline"
            size="small"
          />
          <Text className="text-gray-400 text-xs mt-1">
            Search functionality coming soon. Tap on the map to select a location.
          </Text>
        </View>
      )}

      {/* Map Container */}
      <View className="flex-1 relative">
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFillObject}
          initialRegion={currentRegion}
          showsUserLocation={showUserLocation && locationPermissionGranted}
          showsMyLocationButton={false}
          onMapReady={() => setMapReady(true)}
          onPress={handleMapPress}
          onRegionChangeComplete={setCurrentRegion}
          customMapStyle={customMapStyle}
        >
          {/* User location circle */}
          {userLocation && showUserLocation && (
            <Circle
              center={userLocation}
              radius={LOCATION_ACCURACY_RADIUS}
              strokeColor="rgba(59, 130, 246, 0.5)"
              fillColor="rgba(59, 130, 246, 0.1)"
              strokeWidth={1}
            />
          )}

          {/* Selected location marker */}
          {selectedLocation && (
            <Marker
              coordinate={{
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
              }}
              anchor={{ x: 0.5, y: 1 }}
            >
              <View className="items-center">
                <View className="bg-red-500 p-2 rounded-full shadow-lg">
                  <MapPin size={24} color="white" />
                </View>
              </View>
            </Marker>
          )}
        </MapView>

        {/* Loading indicator */}
        {(isLoadingLocation || !mapReady) && (
          <View className="absolute inset-0 bg-white/50 justify-center items-center">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="text-gray-900 mt-2">
              {isLoadingLocation ? 'Getting your location...' : 'Loading map...'}
            </Text>
          </View>
        )}

        {/* User location button */}
        {userLocation && showUserLocation && locationPermissionGranted && (
          <TouchableOpacity
            onPress={centerOnUserLocation}
            className="absolute top-4 right-4 bg-white rounded-full p-3 shadow-lg"
            style={styles.locationButton}
          >
            <Navigation size={20} color="#374151" />
          </TouchableOpacity>
        )}

        {/* Selected location info panel - Compact version */}
        {selectedLocation && (
          <View className="absolute bottom-2 left-2 right-2">
            <View className="bg-white rounded-lg p-3 shadow-lg">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-gray-900 font-medium text-sm">Selected Location</Text>
                  <Text className="text-gray-600 text-xs mt-0.5" numberOfLines={2}>
                    {isLoadingAddress
                      ? 'Getting address...'
                      : selectedLocation.formattedAddress ||
                        `${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}`}
                  </Text>
                </View>
                <TouchableOpacity onPress={handleClearLocation} className="ml-2 p-1">
                  <X size={18} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {onLocationConfirm && (
                <View className="flex-row mt-2">
                  <TouchableOpacity
                    onPress={handleConfirmLocation}
                    className="flex-1 bg-green-500 rounded-lg py-2 px-3 flex-row items-center justify-center"
                  >
                    <Check size={16} color="white" />
                    <Text className="text-white font-medium text-sm ml-1">{confirmButtonText}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Help text when no location selected - Compact */}
        {!selectedLocation && mapReady && (
          <View className="absolute bottom-2 left-2 right-2">
            <View className="bg-blue-500/90 rounded-lg py-2 px-3">
              <Text className="text-white text-xs text-center">
                Tap anywhere on the map to select a location
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  locationButton: {
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
