import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
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
  MOCK_MARKET_INSIGHTS,
  MOCK_PRODUCTS,
  SAMPLE_LOCATIONS,
} from '../../../constants/mockData';
import type { OnboardingStackParamList } from '../../../types';

type Props = StackScreenProps<OnboardingStackParamList, 'BuyerMarketOverview'>;

interface SupplierCardProps {
  productId: string;
  productName: string;
  availableSuppliers: number;
  averagePrice: number;
  nearestSupplier: string;
  delay: number;
}

const SupplierCard: React.FC<SupplierCardProps> = ({
  productId,
  productName,
  availableSuppliers,
  averagePrice,
  nearestSupplier,
  delay,
}) => {
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

  const mockProduct = MOCK_PRODUCTS.find(p => p.id === productId);

  return (
    <Animated.View style={cardStyle} className="bg-white rounded-xl shadow-sm mb-4">
      <View className="flex-row p-4">
        <Image
          source={{ uri: mockProduct?.image }}
          className="w-16 h-16 rounded-lg mr-4"
          resizeMode="cover"
        />
        
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900 mb-1">
            {productName}
          </Text>
          
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-blue-600 font-medium">
              {availableSuppliers} suppliers
            </Text>
            <Text className="text-green-600 font-bold">
              ${averagePrice}/ton
            </Text>
          </View>
          
          <Text className="text-sm text-gray-600">
            📍 Nearest: {nearestSupplier}
          </Text>
        </View>
        
        <View className="items-center justify-center">
          <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center">
            <Text className="text-green-600 font-bold text-lg">✓</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

interface MarketStatCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: string;
  color: string;
  delay: number;
  formatValue?: (value: number) => string;
}

const MarketStatCard: React.FC<MarketStatCardProps> = ({
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

interface DeliveryOptionProps {
  title: string;
  description: string;
  price: string;
  duration: string;
  icon: string;
  color: string;
  delay: number;
}

const DeliveryOption: React.FC<DeliveryOptionProps> = ({
  title,
  description,
  price,
  duration,
  icon,
  color,
  delay,
}) => {
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
    <Animated.View style={cardStyle} className="bg-white rounded-xl p-4 shadow-sm mr-4">
      <View className="w-64">
        <View className="flex-row items-center mb-3">
          <View 
            className="w-10 h-10 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: `${color}20` }}
          >
            <Text className="text-lg">{icon}</Text>
          </View>
          <Text className="text-base font-semibold text-gray-900">
            {title}
          </Text>
        </View>
        
        <Text className="text-gray-600 text-sm mb-3">
          {description}
        </Text>
        
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-bold" style={{ color }}>
            {price}
          </Text>
          <Text className="text-sm text-gray-500">
            {duration}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

export const BuyerMarketOverviewScreen: React.FC<Props> = ({ navigation }) => {
  const { buyerData, nextStep } = useOnboardingStore();
  const requirements = buyerData?.requiredProducts || [];

  const headerOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    // Entry animations
    headerOpacity.value = withTiming(1, { duration: 600 });
    contentOpacity.value = withDelay(200, withTiming(1, { duration: 800 }));
    buttonOpacity.value = withDelay(1000, withTiming(1, { duration: 600 }));
  }, [headerOpacity, contentOpacity, buttonOpacity]);

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

  // Calculate market stats
  const totalSuppliers = 1247; // Mock data
  const availableProducts = requirements.length;
  const averageDeliveryTime = 7; // days
  
  // Calculate estimated total cost
  const estimatedTotalCost = requirements.reduce((total, req) => {
    const mockProduct = MOCK_PRODUCTS.find(p => p.id === req.productId);
    const price = req.maxPrice || mockProduct?.averagePrice || 0;
    return total + (price * req.quantity.amount);
  }, 0);

  const deliveryOptions = [
    {
      title: "Standard Delivery",
      description: "Regular shipping with our partner carriers",
      price: "$45/ton",
      duration: "7-10 days",
      icon: "🚛",
      color: "#3b82f6",
    },
    {
      title: "Express Delivery",
      description: "Faster shipping for urgent orders",
      price: "$75/ton",
      duration: "3-5 days",
      icon: "⚡",
      color: "#f59e0b",
    },
    {
      title: "Direct Pickup",
      description: "Arrange pickup directly from farm",
      price: "Negotiable",
      duration: "2-3 days",
      icon: "🚚",
      color: "#10b981",
    },
  ];

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
            Market Overview
          </Text>
          <Text className="text-base text-gray-600 leading-6">
            See what's available for your requirements
          </Text>
        </Animated.View>

        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Market Stats */}
          <Animated.View style={contentStyle} className="px-6 mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">
              Market Statistics
            </Text>

            <View className="flex-row space-x-3">
              <View className="flex-1">
                <MarketStatCard
                  title="Active Sellers"
                  value={totalSuppliers}
                  subtitle="in your region"
                  icon="🏪"
                  color="#3b82f6"
                  delay={0}
                  formatValue={formatNumber}
                />
              </View>
              
              <View className="flex-1">
                <MarketStatCard
                  title="Available Now"
                  value={availableProducts}
                  subtitle="of your products"
                  icon="✅"
                  color="#10b981"
                  delay={200}
                />
              </View>
            </View>
          </Animated.View>

          {/* Available Suppliers */}
          <Animated.View style={contentStyle} className="px-6 mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">
              Available for Your Requirements
            </Text>
            
            {requirements.map((requirement, index) => (
              <SupplierCard
                key={requirement.productId}
                productId={requirement.productId}
                productName={requirement.productName}
                availableSuppliers={Math.floor(Math.random() * 50) + 10}
                averagePrice={MOCK_PRODUCTS.find(p => p.id === requirement.productId)?.averagePrice || 0}
                nearestSupplier={SAMPLE_LOCATIONS[index % SAMPLE_LOCATIONS.length].city}
                delay={400 + (index * 100)}
              />
            ))}
          </Animated.View>

          {/* Delivery Options */}
          <Animated.View style={contentStyle} className="mb-6">
            <View className="px-6 mb-4">
              <Text className="text-lg font-bold text-gray-900">
                Delivery Options
              </Text>
              <Text className="text-gray-600">
                Choose how you'd like to receive your products
              </Text>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24 }}
            >
              {deliveryOptions.map((option, index) => (
                <DeliveryOption
                  key={option.title}
                  {...option}
                  delay={600 + (index * 100)}
                />
              ))}
            </ScrollView>
          </Animated.View>

          {/* Cost Summary */}
          <Animated.View style={contentStyle} className="px-6 mb-6">
            <LinearGradient
              colors={['#3b82f6', '#1d4ed8']}
              className="rounded-2xl p-6 shadow-lg"
            >
              <View className="flex-row items-center mb-4">
                <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center mr-4">
                  <Text className="text-2xl">💰</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white text-lg font-bold">
                    Cost Estimate
                  </Text>
                  <Text className="text-white/90">
                    Based on your requirements
                  </Text>
                </View>
              </View>
              
              <View className="bg-white/20 rounded-xl p-4 mb-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-white font-semibold">
                    Estimated Total Cost
                  </Text>
                  <AnimatedCounter
                    value={estimatedTotalCost}
                    className="text-2xl font-bold text-white"
                    formatValue={formatCurrency}
                    duration={2500}
                  />
                </View>
              </View>
              
              <Text className="text-white/90 text-sm">
                💡 Final prices may vary based on quality, quantity, and delivery options. 
                Connect with sellers to get exact quotes.
              </Text>
            </LinearGradient>
          </Animated.View>

          {/* Benefits */}
          <Animated.View style={contentStyle} className="px-6 mb-6">
            <View className="bg-green-50 rounded-2xl p-6 border border-green-200">
              <Text className="text-lg font-bold text-green-900 mb-4">
                🎉 Great News!
              </Text>
              
              <View className="space-y-3">
                <View className="flex-row items-start">
                  <Text className="text-green-600 mr-3">✓</Text>
                  <Text className="text-green-800 flex-1">
                    All your required products are available from verified sellers
                  </Text>
                </View>
                
                <View className="flex-row items-start">
                  <Text className="text-green-600 mr-3">✓</Text>
                  <Text className="text-green-800 flex-1">
                    Competitive pricing within your budget range
                  </Text>
                </View>
                
                <View className="flex-row items-start">
                  <Text className="text-green-600 mr-3">✓</Text>
                  <Text className="text-green-800 flex-1">
                    Multiple delivery options to meet your timeline
                  </Text>
                </View>
              </View>
            </View>
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