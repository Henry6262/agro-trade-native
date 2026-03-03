import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import * as Location from 'expo-location';
import { MapPin, Shield, AlertCircle } from 'lucide-react-native';
import { useOnboardingStore } from '@stores/onboarding.store';

interface PermissionGuardProps {
  children: React.ReactNode;
  requireLocation?: boolean;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  requireLocation = true,
}) => {
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const { setLocation } = useOnboardingStore();

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    if (requireLocation) {
      await checkLocationPermission();
    }
    setIsChecking(false);
  };

  const checkLocationPermission = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();

      if (status === 'granted') {
        setLocationPermission(true);
        await getCurrentLocation();
      } else {
        setLocationPermission(false);
      }
    } catch (error) {
      console.error('Error checking location permission:', error);
      setLocationPermission(false);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === 'granted') {
        setLocationPermission(true);
        await getCurrentLocation();
      } else {
        setLocationPermission(false);
        Alert.alert(
          'Location Permission Required',
          'We need location access to provide accurate pricing and connect you with nearby traders. You can enable it in your device settings.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      Alert.alert('Error', 'Failed to request location permission');
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Get address from coordinates
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const formattedAddress = address
        ? `${address.street || ''} ${address.city || ''} ${address.region || ''} ${address.country || ''}`.trim()
        : 'Location detected';

      // Store location in the onboarding store
      setLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: formattedAddress,
        city: address?.city || '',
        region: address?.region || '',
        country: address?.country || '',
      });
    } catch (error) {
      console.error('Error getting current location:', error);
    }
  };

  if (isChecking) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <Shield size={48} color="#10B981" />
        <Text className="text-gray-900 mt-4">Checking permissions...</Text>
      </View>
    );
  }

  if (requireLocation && locationPermission === false) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center px-8">
        <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
          <View className="items-center mb-4">
            <View className="bg-emerald-500/20 p-4 rounded-full mb-4">
              <MapPin size={48} color="#10B981" />
            </View>
            <Text className="text-white text-xl font-bold mb-2">Enable Location Access</Text>
            <Text className="text-gray-400 text-center text-sm">
              We need your location to show accurate prices and connect you with nearby traders
            </Text>
          </View>

          <View className="bg-blue-500/10 p-3 rounded-lg mb-4">
            <View className="flex-row items-start">
              <AlertCircle size={16} color="#3B82F6" />
              <View className="flex-1 ml-2">
                <Text className="text-blue-400 text-xs">
                  Your location data is only used to provide relevant market information and is
                  never shared without your consent.
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={requestLocationPermission}
            className="bg-emerald-500 py-3 rounded-lg"
          >
            <Text className="text-white text-center font-semibold">Enable Location</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setLocationPermission(true)} className="mt-3 py-3">
            <Text className="text-gray-400 text-center text-sm">Continue without location</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return <>{children}</>;
};
