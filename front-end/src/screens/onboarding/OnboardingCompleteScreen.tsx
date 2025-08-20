import React, { useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import type { StackScreenProps } from '@react-navigation/stack';

import { Button } from '../../components/common/Button';
import { useOnboardingStore } from '../../store/onboardingStore';
import type { OnboardingStackParamList } from '../../types';

type Props = StackScreenProps<OnboardingStackParamList, 'OnboardingComplete'>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface SuccessAnimationProps {
  delay: number;
}

const SuccessAnimation: React.FC<SuccessAnimationProps> = ({ delay }) => {
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      scale.value = withSequence(
        withSpring(1.2, { damping: 10, stiffness: 100 }),
        withSpring(1, { damping: 15, stiffness: 150 })
      );
      rotation.value = withSpring(360, { damping: 15, stiffness: 100 });
      opacity.value = withTiming(1, { duration: 800 });
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, scale, rotation, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle} className="items-center justify-center">
      <View className="w-32 h-32 bg-green-500 rounded-full items-center justify-center shadow-lg">
        <Text className="text-6xl">✓</Text>
      </View>
    </Animated.View>
  );
};

interface FeatureHighlightProps {
  icon: string;
  title: string;
  description: string;
  delay: number;
}

const FeatureHighlight: React.FC<FeatureHighlightProps> = ({
  icon,
  title,
  description,
  delay,
}) => {
  const translateX = useSharedValue(50);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
      opacity.value = withTiming(1, { duration: 600 });
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, translateX, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle} className="flex-row items-center p-4 bg-white rounded-xl shadow-sm mb-3">
      <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mr-4">
        <Text className="text-2xl">{icon}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-gray-900 mb-1">
          {title}
        </Text>
        <Text className="text-gray-600 text-sm">
          {description}
        </Text>
      </View>
    </Animated.View>
  );
};

export const OnboardingCompleteScreen: React.FC<Props> = ({ navigation }) => {
  const { selectedRole, resetOnboarding } = useOnboardingStore();

  const titleOpacity = useSharedValue(0);
  const titleScale = useSharedValue(0.8);
  const subtitleOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(30);

  useEffect(() => {
    // Title animation
    titleOpacity.value = withDelay(400, withTiming(1, { duration: 800 }));
    titleScale.value = withDelay(400, withSpring(1, { damping: 15, stiffness: 150 }));

    // Subtitle animation
    subtitleOpacity.value = withDelay(800, withTiming(1, { duration: 600 }));

    // Button animation
    buttonOpacity.value = withDelay(2000, withTiming(1, { duration: 600 }));
    buttonTranslateY.value = withDelay(2000, withSpring(0, { damping: 15, stiffness: 150 }));
  }, [titleOpacity, titleScale, subtitleOpacity, buttonOpacity, buttonTranslateY]);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ scale: titleScale.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonTranslateY.value }],
  }));

  const handleGetStarted = () => {
    resetOnboarding();
    // Navigate to main app
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' as any }],
    });
  };

  const getRoleSpecificContent = () => {
    switch (selectedRole) {
      case 'seller':
        return {
          title: 'Welcome to AgroTrade, Seller!',
          subtitle: 'Your farm is now connected to buyers worldwide',
          features: [
            {
              icon: '🌾',
              title: 'List Your Products',
              description: 'Showcase your crops with detailed descriptions and pricing',
            },
            {
              icon: '💰',
              title: 'Receive Orders',
              description: 'Get purchase requests from verified buyers',
            },
            {
              icon: '📊',
              title: 'Track Performance',
              description: 'Monitor your sales and market insights',
            },
            {
              icon: '🚚',
              title: 'Coordinate Delivery',
              description: 'Connect with transport providers for efficient shipping',
            },
          ],
        };

      case 'buyer':
        return {
          title: 'Welcome to AgroTrade, Buyer!',
          subtitle: 'Find quality agricultural products from trusted sellers',
          features: [
            {
              icon: '🔍',
              title: 'Browse Products',
              description: 'Search and filter through thousands of agricultural products',
            },
            {
              icon: '📋',
              title: 'Place Orders',
              description: 'Submit purchase requests with your specific requirements',
            },
            {
              icon: '💳',
              title: 'Secure Payments',
              description: 'Pay safely with multiple payment options',
            },
            {
              icon: '📦',
              title: 'Track Deliveries',
              description: 'Monitor your orders from farm to your location',
            },
          ],
        };

      case 'transport':
        return {
          title: 'Welcome to AgroTrade, Transporter!',
          subtitle: 'Connect your fleet with profitable delivery opportunities',
          features: [
            {
              icon: '📦',
              title: 'Find Jobs',
              description: 'Browse available transport jobs in your area',
            },
            {
              icon: '🗺️',
              title: 'Optimize Routes',
              description: 'Plan efficient routes to maximize earnings',
            },
            {
              icon: '💰',
              title: 'Earn More',
              description: 'Access premium delivery contracts',
            },
            {
              icon: '📱',
              title: 'Manage Fleet',
              description: 'Track your vehicles and driver assignments',
            },
          ],
        };

      default:
        return {
          title: 'Welcome to AgroTrade!',
          subtitle: 'Your agricultural marketplace journey begins now',
          features: [],
        };
    }
  };

  const content = getRoleSpecificContent();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <LinearGradient
        colors={['#10b981', '#059669']}
        className="flex-1"
      >
        <View className="flex-1 justify-center items-center px-6">
          {/* Success Animation */}
          <View className="mb-8">
            <SuccessAnimation delay={0} />
          </View>

          {/* Title */}
          <Animated.View style={titleStyle} className="items-center mb-6">
            <Text className="text-3xl font-bold text-white text-center mb-2">
              {content.title}
            </Text>
            <Animated.Text style={subtitleStyle} className="text-lg text-white/90 text-center">
              {content.subtitle}
            </Animated.Text>
          </Animated.View>

          {/* Features */}
          <View className="w-full max-w-md mb-8">
            {content.features.map((feature, index) => (
              <FeatureHighlight
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={1000 + (index * 200)}
              />
            ))}
          </View>

          {/* Call to Action */}
          <Animated.View style={buttonStyle} className="w-full max-w-md">
            <Button
              title="Get Started"
              onPress={handleGetStarted}
              variant="secondary"
              size="large"
              className="w-full bg-white"
            />
          </Animated.View>

          {/* Additional Info */}
          <Animated.View style={buttonStyle} className="mt-6">
            <Text className="text-white/80 text-center text-sm">
              🎉 Congratulations on completing your onboarding!
            </Text>
          </Animated.View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};