import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import type { StackScreenProps } from '@react-navigation/stack';

import { OnboardingProgress } from '../../../components/onboarding/OnboardingProgress';
import { AnimatedCounter, formatNumber, formatCurrency } from '../../../components/onboarding/AnimatedCounter';
import { Button } from '../../../components/common/Button';
import { useOnboardingStore } from '../../../store/onboardingStore';
import { MOCK_MARKET_INSIGHTS } from '../../../constants/mockData';
import type { OnboardingStackParamList, DemandData } from '../../../types';

type Props = StackScreenProps<OnboardingStackParamList, 'SellerMarketInsights'>;

const { width: screenWidth } = Dimensions.get('window');

interface MarketInsightCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: string;
  color: string;
  delay: number;
  formatValue?: (value: number) => string;
}

const MarketInsightCard: React.FC<MarketInsightCardProps> = ({
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
    <Animated.View style={cardStyle} className="bg-white rounded-2xl p-6 shadow-sm mb-4">
      <View className="flex-row items-center mb-4">
        <View 
          className="w-12 h-12 rounded-full items-center justify-center mr-4"
          style={{ backgroundColor: `${color}20` }}
        >
          <Text className="text-2xl">{icon}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-900">
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
        <Text className="text-gray-600 text-center">
          {subtitle}
        </Text>
      </View>
    </Animated.View>
  );
};

interface DemandCardProps {
  demand: DemandData;
  delay: number;
}

const DemandCard: React.FC<DemandCardProps> = ({ demand, delay }) => {
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

  const getDemandColor = () => {
    switch (demand.demandLevel) {
      case 'very_high':
        return '#dc2626';
      case 'high':
        return '#f59e0b';
      case 'medium':
        return '#3b82f6';
      case 'low':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const getDemandText = () => {
    switch (demand.demandLevel) {
      case 'very_high':
        return 'Very High';
      case 'high':
        return 'High';
      case 'medium':
        return 'Medium';
      case 'low':
        return 'Low';
      default:
        return 'Unknown';
    }
  };

  return (
    <Animated.View style={cardStyle} className="bg-white rounded-xl p-4 shadow-sm mr-4">
      <View className="w-48">
        <Text className="text-base font-semibold text-gray-900 mb-2">
          {demand.productName}
        </Text>
        
        <View className="flex-row items-center justify-between mb-2">
          <View 
            className="px-2 py-1 rounded-full"
            style={{ backgroundColor: `${getDemandColor()}20` }}
          >
            <Text 
              className="text-xs font-bold"
              style={{ color: getDemandColor() }}
            >
              {getDemandText()} Demand
            </Text>
          </View>
          <Text className="text-sm text-gray-600">
            {demand.buyersCount} buyers
          </Text>
        </View>
        
        <Text className="text-sm text-gray-600">
          Total needed: {formatNumber(demand.totalQuantityDemanded)} tons
        </Text>
      </View>
    </Animated.View>
  );
};

interface PriceTrendProps {
  product: any;
  delay: number;
}

const PriceTrendCard: React.FC<PriceTrendProps> = ({ product, delay }) => {
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

  const isPositive = product.priceChange > 0;

  return (
    <Animated.View style={cardStyle} className="bg-white rounded-xl p-4 shadow-sm mb-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-900 mb-1">
            {product.productName}
          </Text>
          <Text className="text-2xl font-bold text-green-600">
            {formatCurrency(product.averagePrice)}
          </Text>
          <Text className="text-sm text-gray-500">per ton</Text>
        </View>
        
        <View className="items-end">
          <View 
            className={`px-2 py-1 rounded-full ${
              isPositive ? 'bg-green-100' : 'bg-red-100'
            }`}
          >
            <Text 
              className={`text-sm font-bold ${
                isPositive ? 'text-green-700' : 'text-red-700'
              }`}
            >
              {isPositive ? '↗' : '↘'} {Math.abs(product.priceChange)}%
            </Text>
          </View>
          <Text className="text-xs text-gray-500 mt-1">
            vs last month
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

export const SellerMarketInsightsScreen: React.FC<Props> = ({ navigation }) => {
  const { sellerData, setMarketInsights, nextStep } = useOnboardingStore();
  const selectedProducts = sellerData?.selectedProducts || [];

  const headerOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    // Set market insights data
    setMarketInsights(MOCK_MARKET_INSIGHTS);

    // Entry animations
    headerOpacity.value = withTiming(1, { duration: 600 });
    contentOpacity.value = withDelay(200, withTiming(1, { duration: 800 }));
    buttonOpacity.value = withDelay(1000, withTiming(1, { duration: 600 }));
  }, [headerOpacity, contentOpacity, buttonOpacity, setMarketInsights]);

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

  // Filter relevant demand data based on selected products
  const relevantDemand = MOCK_MARKET_INSIGHTS.currentDemand.filter(demand =>
    selectedProducts.some(product => product.productId === demand.productId)
  );

  // Filter relevant price data
  const relevantPrices = MOCK_MARKET_INSIGHTS.averagePrices.filter(price =>
    selectedProducts.some(product => product.productId === price.productId)
  );

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
            Market Insights
          </Text>
          <Text className="text-base text-gray-600 leading-6">
            See how your products are performing in the market
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
              Market Overview
            </Text>

            <View className="flex-row">
              <View className="flex-1 mr-2">
                <MarketInsightCard
                  title="Active Buyers"
                  value={MOCK_MARKET_INSIGHTS.activeBuyers}
                  subtitle="looking for products"
                  icon="👥"
                  color="#3b82f6"
                  delay={0}
                  formatValue={formatNumber}
                />
              </View>
              
              <View className="flex-1 ml-2">
                <MarketInsightCard
                  title="Your Products"
                  value={relevantDemand.reduce((sum, d) => sum + d.buyersCount, 0)}
                  subtitle="buyers interested"
                  icon="🎯"
                  color="#10b981"
                  delay={200}
                  formatValue={formatNumber}
                />
              </View>
            </View>
          </Animated.View>

          {/* Current Demand */}
          {relevantDemand.length > 0 && (
            <Animated.View style={contentStyle} className="mb-6">
              <View className="px-6 mb-4">
                <Text className="text-lg font-bold text-gray-900">
                  Demand for Your Products
                </Text>
                <Text className="text-gray-600">
                  Current market demand levels
                </Text>
              </View>
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24 }}
              >
                {relevantDemand.map((demand, index) => (
                  <DemandCard
                    key={demand.productId}
                    demand={demand}
                    delay={400 + (index * 100)}
                  />
                ))}
              </ScrollView>
            </Animated.View>
          )}

          {/* Price Trends */}
          {relevantPrices.length > 0 && (
            <Animated.View style={contentStyle} className="px-6 mb-6">
              <Text className="text-lg font-bold text-gray-900 mb-4">
                Price Trends
              </Text>
              
              {relevantPrices.map((price, index) => (
                <PriceTrendCard
                  key={price.productId}
                  product={price}
                  delay={600 + (index * 100)}
                />
              ))}
            </Animated.View>
          )}

          {/* Opportunity Highlight */}
          <Animated.View style={contentStyle} className="px-6 mb-6">
            <LinearGradient
              colors={['#10b981', '#059669']}
              className="rounded-2xl p-6 shadow-lg"
            >
              <View className="flex-row items-center mb-4">
                <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center mr-4">
                  <Text className="text-2xl">🚀</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white text-lg font-bold">
                    Great Opportunity!
                  </Text>
                  <Text className="text-white/90">
                    High demand for your products
                  </Text>
                </View>
              </View>
              
              <Text className="text-white/90 mb-4">
                Based on current market data, there's strong demand for the products you grow. 
                Start connecting with buyers who are actively looking for what you offer.
              </Text>
              
              <View className="bg-white/20 rounded-xl p-4">
                <Text className="text-white font-semibold mb-2">
                  Potential Monthly Revenue
                </Text>
                <AnimatedCounter
                  value={selectedProducts.reduce((total, product) => {
                    const demand = relevantDemand.find(d => d.productId === product.productId);
                    const price = relevantPrices.find(p => p.productId === product.productId);
                    return total + (price ? price.averagePrice * product.quantity.amount : 0);
                  }, 0)}
                  className="text-2xl font-bold text-white"
                  formatValue={formatCurrency}
                  prefix=""
                  duration={2500}
                />
              </View>
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