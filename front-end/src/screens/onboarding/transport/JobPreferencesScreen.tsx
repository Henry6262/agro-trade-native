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
  interpolateColor,
} from 'react-native-reanimated';
import type { StackScreenProps } from '@react-navigation/stack';

import { OnboardingProgress } from '../../../components/onboarding/OnboardingProgress';
import { Button } from '../../../components/common/Button';
import { useOnboardingStore } from '../../../store/onboardingStore';
import { CARGO_TYPES } from '../../../constants/mockData';
import type { OnboardingStackParamList, JobPreferences, WeeklyAvailability, TimeSlot } from '../../../types';

type Props = StackScreenProps<OnboardingStackParamList, 'TransportJobPreferences'>;

interface CargoTypeSelectionProps {
  selectedTypes: string[];
  onSelectionChange: (types: string[]) => void;
}

const CargoTypeSelection: React.FC<CargoTypeSelectionProps> = ({
  selectedTypes,
  onSelectionChange,
}) => {
  const handleTypeToggle = (typeId: string) => {
    const newSelection = selectedTypes.includes(typeId)
      ? selectedTypes.filter(id => id !== typeId)
      : [...selectedTypes, typeId];
    
    onSelectionChange(newSelection);
  };

  return (
    <View>
      <Text className="text-base font-semibold text-gray-900 mb-3">
        Preferred Cargo Types
      </Text>
      <Text className="text-sm text-gray-600 mb-4">
        What types of cargo do you prefer to transport?
      </Text>
      
      <View className="flex-row flex-wrap">
        {CARGO_TYPES.map((type, index) => (
          <CargoTypeChip
            key={type.id}
            type={type}
            isSelected={selectedTypes.includes(type.id)}
            onPress={() => handleTypeToggle(type.id)}
            delay={index * 50}
          />
        ))}
      </View>
    </View>
  );
};

interface CargoTypeChipProps {
  type: { id: string; name: string; icon: string };
  isSelected: boolean;
  onPress: () => void;
  delay: number;
}

const CargoTypeChip: React.FC<CargoTypeChipProps> = ({
  type,
  isSelected,
  onPress,
  delay,
}) => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const selectedAnimation = useSharedValue(isSelected ? 1 : 0);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
      opacity.value = withTiming(1, { duration: 400 });
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, scale, opacity]);

  React.useEffect(() => {
    selectedAnimation.value = withSpring(isSelected ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
  }, [isSelected, selectedAnimation]);

  const chipStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      selectedAnimation.value,
      [0, 1],
      ['#f3f4f6', '#f59e0b']
    );

    return {
      backgroundColor,
      transform: [
        { scale: scale.value },
        { scale: interpolate(selectedAnimation.value, [0, 1], [1, 1.02]) },
      ],
      opacity: opacity.value,
    };
  });

  const textStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      selectedAnimation.value,
      [0, 1],
      ['#374151', '#ffffff']
    );
    return { color };
  });

  return (
    <Animated.View style={chipStyle} className="mr-2 mb-2">
      <TouchableOpacity
        onPress={onPress}
        className="flex-row items-center px-4 py-3 rounded-full"
      >
        <Text className="mr-2">{type.icon}</Text>
        <Animated.Text style={textStyle} className="font-medium">
          {type.name}
        </Animated.Text>
        {isSelected && (
          <Text className="ml-2 text-white font-bold">✓</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

interface DistancePreferencesProps {
  minDistance: number;
  maxDistance: number;
  onMinDistanceChange: (distance: number) => void;
  onMaxDistanceChange: (distance: number) => void;
}

const DistancePreferences: React.FC<DistancePreferencesProps> = ({
  minDistance,
  maxDistance,
  onMinDistanceChange,
  onMaxDistanceChange,
}) => {
  const [minInput, setMinInput] = useState(minDistance.toString());
  const [maxInput, setMaxInput] = useState(maxDistance.toString());

  const handleMinChange = (text: string) => {
    setMinInput(text);
    const value = parseInt(text) || 0;
    onMinDistanceChange(value);
  };

  const handleMaxChange = (text: string) => {
    setMaxInput(text);
    const value = parseInt(text) || 0;
    onMaxDistanceChange(value);
  };

  const quickDistances = [50, 100, 250, 500, 1000];

  return (
    <View>
      <Text className="text-base font-semibold text-gray-900 mb-3">
        Distance Preferences
      </Text>
      <Text className="text-sm text-gray-600 mb-4">
        What's your preferred distance range for jobs?
      </Text>
      
      <View className="flex-row space-x-4 mb-4">
        <View className="flex-1">
          <Text className="text-sm text-gray-600 mb-2">Minimum (km)</Text>
          <View className="bg-gray-50 rounded-xl border border-gray-200">
            <TextInput
              className="p-3 text-gray-900"
              placeholder="0"
              value={minInput}
              onChangeText={handleMinChange}
              keyboardType="numeric"
            />
          </View>
        </View>
        
        <View className="flex-1">
          <Text className="text-sm text-gray-600 mb-2">Maximum (km)</Text>
          <View className="bg-gray-50 rounded-xl border border-gray-200">
            <TextInput
              className="p-3 text-gray-900"
              placeholder="500"
              value={maxInput}
              onChangeText={handleMaxChange}
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>
      
      <Text className="text-xs text-gray-500 mb-3">Quick select maximum distance:</Text>
      <View className="flex-row flex-wrap">
        {quickDistances.map((distance) => (
          <TouchableOpacity
            key={distance}
            onPress={() => handleMaxChange(distance.toString())}
            className="bg-gray-100 px-3 py-2 rounded-full mr-2 mb-2"
          >
            <Text className="text-gray-700 text-sm">{distance} km</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

interface AvailabilitySchedulerProps {
  availability: WeeklyAvailability;
  onAvailabilityChange: (availability: WeeklyAvailability) => void;
}

const AvailabilityScheduler: React.FC<AvailabilitySchedulerProps> = ({
  availability,
  onAvailabilityChange,
}) => {
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  
  const daysOfWeek = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  const getAvailableDaysText = () => {
    const availableDays = Object.keys(availability).filter(
      day => availability[day] && availability[day].length > 0
    );
    
    if (availableDays.length === 0) {
      return 'No availability set';
    }
    
    if (availableDays.length === 7) {
      return 'Available all week';
    }
    
    return `Available ${availableDays.length} days/week`;
  };

  const setFullTimeAvailability = () => {
    const fullTime: WeeklyAvailability = {};
    daysOfWeek.forEach(day => {
      fullTime[day] = [{ start: '08:00', end: '18:00' }];
    });
    onAvailabilityChange(fullTime);
  };

  const setWeekdaysAvailability = () => {
    const weekdays: WeeklyAvailability = {};
    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].forEach(day => {
      weekdays[day] = [{ start: '08:00', end: '18:00' }];
    });
    onAvailabilityChange(weekdays);
  };

  return (
    <View>
      <Text className="text-base font-semibold text-gray-900 mb-3">
        Availability Schedule
      </Text>
      <Text className="text-sm text-gray-600 mb-4">
        When are you available for transport jobs?
      </Text>
      
      <TouchableOpacity
        onPress={() => setShowScheduleModal(true)}
        className="bg-gray-50 rounded-xl p-4 border border-gray-200 mb-4"
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-gray-900 font-medium">
            {getAvailableDaysText()}
          </Text>
          <Text className="text-gray-400">📅</Text>
        </View>
      </TouchableOpacity>
      
      {/* Quick availability options */}
      <Text className="text-xs text-gray-500 mb-3">Quick options:</Text>
      <View className="flex-row space-x-2">
        <TouchableOpacity
          onPress={setWeekdaysAvailability}
          className="bg-orange-100 px-3 py-2 rounded-full"
        >
          <Text className="text-orange-700 text-sm font-medium">Weekdays</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={setFullTimeAvailability}
          className="bg-orange-100 px-3 py-2 rounded-full"
        >
          <Text className="text-orange-700 text-sm font-medium">All Week</Text>
        </TouchableOpacity>
      </View>

      {/* Schedule Modal */}
      <Modal
        visible={showScheduleModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowScheduleModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl max-h-4/5">
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
              <Text className="text-lg font-semibold text-gray-900">
                Set Availability
              </Text>
              <TouchableOpacity
                onPress={() => setShowScheduleModal(false)}
                className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
              >
                <Text className="text-gray-600 font-bold">×</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView className="p-4">
              {daysOfWeek.map((day) => (
                <DayAvailabilityEditor
                  key={day}
                  day={day}
                  timeSlots={availability[day] || []}
                  onTimeSlotsChange={(slots) => {
                    const newAvailability = { ...availability };
                    if (slots.length === 0) {
                      delete newAvailability[day];
                    } else {
                      newAvailability[day] = slots;
                    }
                    onAvailabilityChange(newAvailability);
                  }}
                />
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

interface DayAvailabilityEditorProps {
  day: string;
  timeSlots: TimeSlot[];
  onTimeSlotsChange: (slots: TimeSlot[]) => void;
}

const DayAvailabilityEditor: React.FC<DayAvailabilityEditorProps> = ({
  day,
  timeSlots,
  onTimeSlotsChange,
}) => {
  const toggleDayAvailability = () => {
    if (timeSlots.length === 0) {
      onTimeSlotsChange([{ start: '08:00', end: '18:00' }]);
    } else {
      onTimeSlotsChange([]);
    }
  };

  const isAvailable = timeSlots.length > 0;

  return (
    <View className="mb-4">
      <TouchableOpacity
        onPress={toggleDayAvailability}
        className={`flex-row items-center justify-between p-4 rounded-xl border ${
          isAvailable 
            ? 'bg-orange-50 border-orange-200' 
            : 'bg-gray-50 border-gray-200'
        }`}
      >
        <Text className={`font-medium ${
          isAvailable ? 'text-orange-900' : 'text-gray-700'
        }`}>
          {day}
        </Text>
        
        <View className="flex-row items-center">
          {isAvailable && (
            <Text className="text-orange-700 text-sm mr-3">
              {timeSlots[0]?.start} - {timeSlots[0]?.end}
            </Text>
          )}
          <View className={`w-6 h-6 rounded-full items-center justify-center ${
            isAvailable ? 'bg-orange-500' : 'bg-gray-300'
          }`}>
            {isAvailable && (
              <Text className="text-white text-xs font-bold">✓</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export const TransportJobPreferencesScreen: React.FC<Props> = ({ navigation }) => {
  const { transportData, setJobPreferences, nextStep } = useOnboardingStore();
  
  const [selectedCargoTypes, setSelectedCargoTypes] = useState<string[]>(
    transportData?.jobPreferences.cargoTypes || []
  );
  const [minDistance, setMinDistance] = useState(
    transportData?.jobPreferences.minDistance || 0
  );
  const [maxDistance, setMaxDistance] = useState(
    transportData?.jobPreferences.maxDistance || 500
  );
  const [availability, setAvailability] = useState<WeeklyAvailability>(
    transportData?.jobPreferences.availability || {}
  );

  const headerOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  React.useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 600 });
    contentOpacity.value = withTiming(1, { duration: 800 });
  }, [headerOpacity, contentOpacity]);

  React.useEffect(() => {
    const isComplete = selectedCargoTypes.length > 0 && 
                     maxDistance > 0 && 
                     Object.keys(availability).length > 0;

    buttonOpacity.value = withSpring(isComplete ? 1 : 0.5, {
      damping: 15,
      stiffness: 150,
    });
  }, [selectedCargoTypes, maxDistance, availability, buttonOpacity]);

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

    const preferences: JobPreferences = {
      cargoTypes: selectedCargoTypes,
      minDistance,
      maxDistance,
      availability,
      preferredRoutes: [], // This could be expanded later
    };

    setJobPreferences(preferences);
    nextStep();
    navigation.navigate('TransportOpportunities');
  };

  const canContinue = () => {
    return selectedCargoTypes.length > 0 && 
           maxDistance > 0 && 
           Object.keys(availability).length > 0;
  };

  const availableDaysCount = Object.keys(availability).length;

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
            Job Preferences
          </Text>
          <Text className="text-base text-gray-600 leading-6">
            Set your preferences to get matched with suitable transport jobs
          </Text>
        </Animated.View>

        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <Animated.View style={contentStyle} className="px-6">
            {/* Cargo Types */}
            <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
              <CargoTypeSelection
                selectedTypes={selectedCargoTypes}
                onSelectionChange={setSelectedCargoTypes}
              />
            </View>

            {/* Distance Preferences */}
            <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
              <DistancePreferences
                minDistance={minDistance}
                maxDistance={maxDistance}
                onMinDistanceChange={setMinDistance}
                onMaxDistanceChange={setMaxDistance}
              />
            </View>

            {/* Availability */}
            <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
              <AvailabilityScheduler
                availability={availability}
                onAvailabilityChange={setAvailability}
              />
            </View>

            {/* Preferences Summary */}
            {canContinue() && (
              <View className="bg-orange-50 rounded-2xl p-6 border border-orange-200">
                <View className="flex-row items-center mb-4">
                  <View className="w-12 h-12 bg-orange-100 rounded-full items-center justify-center mr-4">
                    <Text className="text-2xl">⚙️</Text>
                  </View>
                  <Text className="text-lg font-bold text-orange-900">
                    Preferences Summary
                  </Text>
                </View>
                
                <View className="space-y-2">
                  <View className="flex-row justify-between">
                    <Text className="text-orange-800">Cargo Types:</Text>
                    <Text className="text-orange-900 font-semibold">{selectedCargoTypes.length}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-orange-800">Max Distance:</Text>
                    <Text className="text-orange-900 font-semibold">{maxDistance} km</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-orange-800">Available Days:</Text>
                    <Text className="text-orange-900 font-semibold">{availableDaysCount}/week</Text>
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
              title={canContinue() ? "Continue to Opportunities" : "Complete preferences to continue"}
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