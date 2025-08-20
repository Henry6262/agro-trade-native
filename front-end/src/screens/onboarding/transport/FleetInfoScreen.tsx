import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import type { StackScreenProps } from '@react-navigation/stack';

import { OnboardingProgress } from '../../../components/onboarding/OnboardingProgress';
import { Button } from '../../../components/common/Button';
import { useOnboardingStore } from '../../../store/onboardingStore';
import {
  VEHICLE_TYPES,
  SAMPLE_LOCATIONS,
} from '../../../constants/mockData';
import type { OnboardingStackParamList, VehicleType, Location } from '../../../types';

type Props = StackScreenProps<OnboardingStackParamList, 'TransportFleetInfo'>;

interface VehicleSelectionProps {
  vehicles: VehicleType[];
  selectedVehicles: string[];
  onSelectionChange: (vehicleIds: string[]) => void;
}

const VehicleSelection: React.FC<VehicleSelectionProps> = ({
  vehicles,
  selectedVehicles,
  onSelectionChange,
}) => {
  const handleVehicleToggle = (vehicleId: string) => {
    const newSelection = selectedVehicles.includes(vehicleId)
      ? selectedVehicles.filter(id => id !== vehicleId)
      : [...selectedVehicles, vehicleId];
    
    onSelectionChange(newSelection);
  };

  return (
    <View>
      <Text className="text-base font-semibold text-gray-900 mb-3">
        Vehicle Types
      </Text>
      <Text className="text-sm text-gray-600 mb-4">
        Select all vehicle types in your fleet
      </Text>
      
      {vehicles.map((vehicle, index) => (
        <VehicleCard
          key={vehicle.id}
          vehicle={vehicle}
          isSelected={selectedVehicles.includes(vehicle.id)}
          onPress={() => handleVehicleToggle(vehicle.id)}
          delay={index * 100}
        />
      ))}
    </View>
  );
};

interface VehicleCardProps {
  vehicle: VehicleType;
  isSelected: boolean;
  onPress: () => void;
  delay: number;
}

const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  isSelected,
  onPress,
  delay,
}) => {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  const selectedAnimation = useSharedValue(isSelected ? 1 : 0);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
      opacity.value = withTiming(1, { duration: 500 });
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, scale, opacity]);

  React.useEffect(() => {
    selectedAnimation.value = withSpring(isSelected ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
  }, [isSelected, selectedAnimation]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const selectionStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      selectedAnimation.value,
      [0, 1],
      ['#ffffff', '#eff6ff']
    );

    const borderColor = interpolateColor(
      selectedAnimation.value,
      [0, 1],
      ['#e5e7eb', '#3b82f6']
    );

    return {
      backgroundColor,
      borderColor,
      borderWidth: interpolate(selectedAnimation.value, [0, 1], [1, 2]),
    };
  });

  return (
    <Animated.View style={cardStyle} className="mb-3">
      <TouchableOpacity onPress={onPress}>
        <Animated.View style={selectionStyle} className="rounded-xl p-4 shadow-sm">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-lg font-semibold text-gray-900 mb-1">
                {vehicle.name}
              </Text>
              <Text className="text-gray-600 mb-2">
                Capacity: {vehicle.capacity} tons
              </Text>
              <View className="flex-row flex-wrap">
                {vehicle.suitable_for.map((type) => (
                  <View key={type} className="bg-gray-100 px-2 py-1 rounded-full mr-2 mb-1">
                    <Text className="text-xs text-gray-700">
                      {type}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
            
            {isSelected && (
              <View className="w-8 h-8 bg-blue-500 rounded-full items-center justify-center">
                <Text className="text-white text-sm font-bold">✓</Text>
              </View>
            )}
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

interface LocationSelectorProps {
  selectedLocation?: Location;
  onLocationChange: (location: Location) => void;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  selectedLocation,
  onLocationChange,
}) => {
  const [showLocationModal, setShowLocationModal] = useState(false);

  return (
    <View>
      <Text className="text-base font-semibold text-gray-900 mb-3">
        Base Location
      </Text>
      <Text className="text-sm text-gray-600 mb-4">
        Where is your fleet based?
      </Text>
      
      <TouchableOpacity
        onPress={() => setShowLocationModal(true)}
        className="bg-gray-50 rounded-xl p-4 border border-gray-200"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            {selectedLocation ? (
              <View>
                <Text className="text-gray-900 font-medium">
                  {selectedLocation.city}, {selectedLocation.state}
                </Text>
                <Text className="text-gray-600 text-sm">
                  {selectedLocation.address}
                </Text>
              </View>
            ) : (
              <Text className="text-gray-500">
                Select your base location
              </Text>
            )}
          </View>
          <Text className="text-gray-400 ml-2">📍</Text>
        </View>
      </TouchableOpacity>

      {/* Location Modal */}
      <Modal
        visible={showLocationModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl max-h-96">
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
              <Text className="text-lg font-semibold text-gray-900">
                Select Base Location
              </Text>
              <TouchableOpacity
                onPress={() => setShowLocationModal(false)}
                className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
              >
                <Text className="text-gray-600 font-bold">×</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView className="p-4">
              {SAMPLE_LOCATIONS.map((location) => (
                <TouchableOpacity
                  key={location.id}
                  onPress={() => {
                    onLocationChange(location);
                    setShowLocationModal(false);
                  }}
                  className={`p-4 rounded-xl mb-2 border ${
                    selectedLocation?.id === location.id
                      ? 'bg-blue-50 border-blue-200 border-2'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <Text className={`text-base font-semibold ${
                    selectedLocation?.id === location.id
                      ? 'text-blue-900'
                      : 'text-gray-900'
                  }`}>
                    {location.city}, {location.state}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    {location.address}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export const TransportFleetInfoScreen: React.FC<Props> = ({ navigation }) => {
  const { transportData, setFleetInfo, nextStep } = useOnboardingStore();
  
  const [vehicleCount, setVehicleCount] = useState(
    transportData?.fleetInfo.vehicleCount.toString() || '1'
  );
  const [selectedVehicleTypes, setSelectedVehicleTypes] = useState<string[]>(
    transportData?.fleetInfo.vehicleTypes.map(v => v.id) || []
  );
  const [baseLocation, setBaseLocation] = useState<Location | undefined>(
    transportData?.fleetInfo.baseLocation
  );
  const [totalCapacity, setTotalCapacity] = useState(
    transportData?.fleetInfo.capacity.total.toString() || ''
  );

  const headerOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  React.useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 600 });
    contentOpacity.value = withTiming(1, { duration: 800 });
  }, [headerOpacity, contentOpacity]);

  React.useEffect(() => {
    const isComplete = vehicleCount && 
                     parseInt(vehicleCount) > 0 && 
                     selectedVehicleTypes.length > 0 && 
                     baseLocation && 
                     totalCapacity && 
                     parseFloat(totalCapacity) > 0;

    buttonOpacity.value = withSpring(isComplete ? 1 : 0.5, {
      damping: 15,
      stiffness: 150,
    });
  }, [vehicleCount, selectedVehicleTypes, baseLocation, totalCapacity, buttonOpacity]);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: interpolate(headerOpacity.value, [0, 1], [-20, 0]) }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  const handleContinue = () => {
    if (!canContinue()) return;

    const selectedVehicles = VEHICLE_TYPES.filter(v => 
      selectedVehicleTypes.includes(v.id)
    );

    setFleetInfo({
      vehicleCount: parseInt(vehicleCount),
      vehicleTypes: selectedVehicles,
      baseLocation: baseLocation!,
      capacity: {
        total: parseFloat(totalCapacity),
        unit: 'tons',
      },
    });

    nextStep();
    navigation.navigate('TransportJobPreferences');
  };

  const canContinue = () => {
    return vehicleCount && 
           parseInt(vehicleCount) > 0 && 
           selectedVehicleTypes.length > 0 && 
           baseLocation && 
           totalCapacity && 
           parseFloat(totalCapacity) > 0;
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <LinearGradient
        colors={['#f8fafc', '#e2e8f0']}
        className="flex-1"
      >
        {/* Header */}
        <View className="px-6 pt-4 pb-2">
          <OnboardingProgress />
        </View>

        {/* Title Section */}
        <Animated.View style={headerStyle} className="px-6 py-6">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Fleet Information
          </Text>
          <Text className="text-base text-gray-600 leading-6">
            Tell us about your vehicles and base location
          </Text>
        </Animated.View>

        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <Animated.View style={contentStyle} className="px-6">
            {/* Vehicle Count */}
            <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
              <Text className="text-base font-semibold text-gray-900 mb-3">
                Number of Vehicles
              </Text>
              <Text className="text-sm text-gray-600 mb-4">
                How many vehicles do you operate?
              </Text>
              
              <View className="bg-gray-50 rounded-xl border border-gray-200">
                <TextInput
                  className="p-4 text-lg font-semibold text-gray-900"
                  placeholder="Enter number of vehicles"
                  value={vehicleCount}
                  onChangeText={setVehicleCount}
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>
            </View>

            {/* Vehicle Types */}
            <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
              <VehicleSelection
                vehicles={VEHICLE_TYPES}
                selectedVehicles={selectedVehicleTypes}
                onSelectionChange={setSelectedVehicleTypes}
              />
            </View>

            {/* Total Capacity */}
            <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
              <Text className="text-base font-semibold text-gray-900 mb-3">
                Total Fleet Capacity
              </Text>
              <Text className="text-sm text-gray-600 mb-4">
                Combined capacity of all your vehicles (in tons)
              </Text>
              
              <View className="bg-gray-50 rounded-xl border border-gray-200">
                <TextInput
                  className="p-4 text-lg font-semibold text-gray-900"
                  placeholder="Enter total capacity"
                  value={totalCapacity}
                  onChangeText={setTotalCapacity}
                  keyboardType="numeric"
                />
              </View>
              
              {totalCapacity && parseFloat(totalCapacity) > 0 && (
                <Text className="text-sm text-gray-600 mt-2">
                  Average per vehicle: {(parseFloat(totalCapacity) / parseInt(vehicleCount || '1')).toFixed(1)} tons
                </Text>
              )}
            </View>

            {/* Base Location */}
            <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
              <LocationSelector
                selectedLocation={baseLocation}
                onLocationChange={setBaseLocation}
              />
            </View>

            {/* Fleet Summary */}
            {canContinue() && (
              <View className="bg-orange-50 rounded-2xl p-6 border border-orange-200">
                <View className="flex-row items-center mb-4">
                  <View className="w-12 h-12 bg-orange-100 rounded-full items-center justify-center mr-4">
                    <Text className="text-2xl">🚛</Text>
                  </View>
                  <Text className="text-lg font-bold text-orange-900">
                    Fleet Summary
                  </Text>
                </View>
                
                <View className="space-y-2">
                  <View className="flex-row justify-between">
                    <Text className="text-orange-800">Total Vehicles:</Text>
                    <Text className="text-orange-900 font-semibold">{vehicleCount}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-orange-800">Vehicle Types:</Text>
                    <Text className="text-orange-900 font-semibold">{selectedVehicleTypes.length}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-orange-800">Total Capacity:</Text>
                    <Text className="text-orange-900 font-semibold">{totalCapacity} tons</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-orange-800">Base Location:</Text>
                    <Text className="text-orange-900 font-semibold">{baseLocation?.city}</Text>
                  </View>
                </View>
              </View>
            )}
          </Animated.View>
        </ScrollView>

        {/* Continue Button */}
        <View className="px-6 pb-6">
          <Animated.View style={buttonStyle}>
            <Button
              title={canContinue() ? "Continue to Job Preferences" : "Complete fleet info to continue"}
              onPress={handleContinue}
              disabled={!canContinue()}
              variant="primary"
              size="large"
              className="w-full"
            />
          </Animated.View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};