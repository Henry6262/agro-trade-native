import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  interpolate,
} from 'react-native-reanimated';
import type { StackScreenProps } from '@react-navigation/stack';

import { OnboardingProgress } from '../../../components/onboarding/OnboardingProgress';
import { AnimatedCounter, formatNumber, formatCurrency } from '../../../components/onboarding/AnimatedCounter';
import { Button } from '../../../components/common/Button';
import { useOnboardingStore } from '../../../store/onboardingStore';
import {
  MOCK_TRANSPORT_OPPORTUNITIES,
} from '../../../constants/mockData';
import type { OnboardingStackParamList, RouteInfo } from '../../../types';

type Props = StackScreenProps<OnboardingStackParamList, 'TransportOpportunities'>;

const { width: screenWidth } = Dimensions.get('window');

interface OpportunityStatCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: string;
  color: string;
  delay: number;
  formatValue?: (value: number) => string;
}

const OpportunityStatCard: React.FC<OpportunityStatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color,
  delay,
  formatValue,
}) => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const [startAnimation, setStartAnimation] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
      opacity.value = withTiming(1, { duration: 600 });
      setStartAnimation(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, scale, opacity]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={cardStyle} className="bg-white rounded-2xl p-6 shadow-sm">
      <View className="flex-row items-center mb-4">
        <View 
          className="w-12 h-12 rounded-full items-center justify-center mr-4"
          style={{ backgroundColor: `${color}20` }}
        >
          <Text className="text-2xl">{icon}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-gray-900">
            {title}
          </Text>
        </View>
      </View>

      <View className="items-center">
        {startAnimation && (
          <AnimatedCounter
            value={value}
            duration={2000}
            className="text-3xl font-bold mb-2"
            style={{ color }}
            formatValue={formatValue}
          />
        )}
        <Text className="text-gray-600 text-center text-sm">
          {subtitle}
        </Text>
      </View>
    </Animated.View>
  );
};

interface RouteCardProps {
  route: RouteInfo;
  delay: number;
}

const RouteCard: React.FC<RouteCardProps> = ({ route, delay }) => {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
      opacity.value = withTiming(1, { duration: 500 });
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, scale, opacity]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={cardStyle} className="bg-white rounded-xl shadow-sm mr-4 p-4">
      <View className="w-72">
        {/* Route Header */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <View className="w-3 h-3 bg-green-500 rounded-full mr-2" />
            <Text className="text-base font-semibold text-gray-900">
              {route.origin}
            </Text>
          </View>
          <Text className="text-gray-400 text-lg">→</Text>
          <View className="flex-row items-center">
            <Text className="text-base font-semibold text-gray-900 mr-2">
              {route.destination}
            </Text>
            <View className="w-3 h-3 bg-orange-500 rounded-full" />
          </View>
        </View>

        {/* Route Details */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <Text className="text-gray-600 text-sm">📏 {route.distance} km</Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-gray-600 text-sm">🔄 {route.frequency}/month</Text>
          </View>
        </View>

        {/* Earnings */}
        <View className="bg-orange-50 rounded-lg p-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-orange-800 font-medium">
              Estimated Earnings
            </Text>
            <Text className="text-2xl font-bold text-orange-600">
              ${route.estimatedEarnings}
            </Text>
          </View>
          <Text className="text-orange-700 text-xs mt-1">
            per trip
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

interface HotspotCardProps {
  location: any;
  jobCount: number;
  delay: number;
}

const HotspotCard: React.FC<HotspotCardProps> = ({ location, jobCount, delay }) => {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
      opacity.value = withTiming(1, { duration: 500 });
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, scale, opacity]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={cardStyle} className="bg-white rounded-xl p-4 shadow-sm mb-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <View className="flex-row items-center mb-2">
            <Text className="text-lg mr-2">📍</Text>
            <Text className="text-base font-semibold text-gray-900">
              {location.city}, {location.state}
            </Text>
          </View>
          <Text className="text-gray-600 text-sm">
            {location.address}
          </Text>
        </View>
        
        <View className="items-end">
          <View className="bg-orange-100 px-3 py-1 rounded-full">
            <Text className="text-orange-700 font-bold">
              {jobCount} jobs
            </Text>
          </View>
          <Text className="text-xs text-gray-500 mt-1">
            available
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

export const TransportOpportunitiesScreen: React.FC<Props> = ({ navigation }) => {
  const { transportData, setTransportOpportunities, nextStep } = useOnboardingStore();

  const headerOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    // Set transport opportunities data
    setTransportOpportunities(MOCK_TRANSPORT_OPPORTUNITIES);

    // Entry animations
    headerOpacity.value = withTiming(1, { duration: 600 });
    contentOpacity.value = withDelay(200, withTiming(1, { duration: 800 }));
    buttonOpacity.value = withDelay(1000, withTiming(1, { duration: 600 }));
  }, [headerOpacity, contentOpacity, buttonOpacity, setTransportOpportunities]);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: interpolate(headerOpacity.value, [0, 1], [-20, 0]) }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: interpolate(buttonOpacity.value, [0, 1], [20, 0]) }],
  }));

  const handleContinue = () => {
    nextStep();
    navigation.navigate('AccountCreation');
  };

  const fleetInfo = transportData?.fleetInfo;
  const jobPreferences = transportData?.jobPreferences;

  // Calculate estimated monthly earnings based on fleet capacity and routes
  const estimatedMonthlyEarnings = fleetInfo 
    ? Math.floor((fleetInfo.capacity.total * 2.5 * MOCK_TRANSPORT_OPPORTUNITIES.popularRoutes[0].estimatedEarnings) / 100) * 100
    : MOCK_TRANSPORT_OPPORTUNITIES.potentialEarnings;

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
            Transport Opportunities
          </Text>
          <Text className="text-base text-gray-600 leading-6">
            See the jobs and earning potential waiting for you
          </Text>
        </Animated.View>

        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Key Metrics */}
          <Animated.View style={contentStyle} className="px-6 mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">
              Available Opportunities
            </Text>

            <View className="flex-row space-x-3">
              <View className="flex-1">
                <OpportunityStatCard
                  title="Available Jobs"
                  value={MOCK_TRANSPORT_OPPORTUNITIES.availableJobs}
                  subtitle="matching your preferences"
                  icon="📦"
                  color="#3b82f6"
                  delay={0}
                  formatValue={formatNumber}
                />
              </View>
              
              <View className="flex-1">
                <OpportunityStatCard
                  title="Monthly Potential"
                  value={estimatedMonthlyEarnings}
                  subtitle="estimated earnings"
                  icon="💰"
                  color="#10b981"
                  delay={200}
                  formatValue={formatCurrency}
                />
              </View>
            </View>
          </Animated.View>

          {/* Popular Routes */}
          <Animated.View style={contentStyle} className="mb-6">
            <View className="px-6 mb-4">
              <Text className="text-lg font-bold text-gray-900">
                Popular Routes
              </Text>
              <Text className="text-gray-600">
                High-demand routes in your area
              </Text>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24 }}
            >
              {MOCK_TRANSPORT_OPPORTUNITIES.popularRoutes.map((route, index) => (
                <RouteCard
                  key={route.id}
                  route={route}
                  delay={400 + (index * 100)}
                />
              ))}
            </ScrollView>
          </Animated.View>

          {/* Demand Hotspots */}
          <Animated.View style={contentStyle} className="px-6 mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">
              Demand Hotspots
            </Text>
            <Text className="text-gray-600 mb-4">
              Areas with high transport demand
            </Text>
            
            {MOCK_TRANSPORT_OPPORTUNITIES.demandHotspots.map((location, index) => (
              <HotspotCard
                key={location.id}
                location={location}
                jobCount={Math.floor(Math.random() * 50) + 20}
                delay={600 + (index * 100)}
              />
            ))}
          </Animated.View>

          {/* Fleet Compatibility */}
          {fleetInfo && jobPreferences && (
            <Animated.View style={contentStyle} className="px-6 mb-6">
              <View className="bg-orange-50 rounded-2xl p-6 border border-orange-200">
                <View className="flex-row items-center mb-4">
                  <View className="w-12 h-12 bg-orange-100 rounded-full items-center justify-center mr-4">
                    <Text className="text-2xl">🎯</Text>
                  </View>
                  <Text className="text-lg font-bold text-orange-900">
                    Perfect Match!
                  </Text>
                </View>
                
                <Text className="text-orange-800 mb-4">
                  Your fleet and preferences are well-suited for the current market demand:
                </Text>
                
                <View className="space-y-3">
                  <View className="flex-row items-start">
                    <Text className="text-orange-600 mr-3">✓</Text>
                    <Text className="text-orange-800 flex-1">
                      Your {fleetInfo.capacity.total} ton capacity matches high-demand routes
                    </Text>
                  </View>
                  
                  <View className="flex-row items-start">
                    <Text className="text-orange-600 mr-3">✓</Text>
                    <Text className="text-orange-800 flex-1">
                      {jobPreferences.cargoTypes.length} cargo types you transport are in high demand
                    </Text>
                  </View>
                  
                  <View className="flex-row items-start">
                    <Text className="text-orange-600 mr-3">✓</Text>
                    <Text className="text-orange-800 flex-1">
                      Multiple routes within your {jobPreferences.maxDistance}km range
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Earnings Breakdown */}
          <Animated.View style={contentStyle} className="px-6 mb-6">
            <LinearGradient
              colors={['#f59e0b', '#d97706']}
              className="rounded-2xl p-6 shadow-lg"
            >
              <View className="flex-row items-center mb-4">
                <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center mr-4">
                  <Text className="text-2xl">📊</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white text-lg font-bold">
                    Earnings Breakdown
                  </Text>
                  <Text className="text-white/90">
                    Based on your fleet capacity
                  </Text>
                </View>
              </View>
              
              <View className="bg-white/20 rounded-xl p-4 mb-4">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-white font-semibold">
                    Estimated Monthly Earnings
                  </Text>
                  <AnimatedCounter
                    value={estimatedMonthlyEarnings}
                    className="text-2xl font-bold text-white"
                    formatValue={formatCurrency}
                    duration={2500}
                  />
                </View>
                
                <View className="space-y-2">
                  <View className="flex-row justify-between">
                    <Text className="text-white/90 text-sm">Per trip average:</Text>
                    <Text className="text-white text-sm font-medium">
                      ${Math.floor(estimatedMonthlyEarnings / 15)}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-white/90 text-sm">Estimated trips/month:</Text>
                    <Text className="text-white text-sm font-medium">15-20</Text>
                  </View>
                </View>
              </View>
              
              <Text className="text-white/90 text-sm">
                💡 Earnings vary based on distance, cargo type, and seasonal demand. 
                Connect with shippers to get exact rates.
              </Text>
            </LinearGradient>
          </Animated.View>
        </ScrollView>

        {/* Continue Button */}
        <View className="px-6 pb-6">
          <Animated.View style={buttonStyle}>
            <Button
              title="Continue to Account Setup"
              onPress={handleContinue}
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