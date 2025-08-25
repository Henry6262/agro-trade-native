import React, { useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import type { StackScreenProps } from '@react-navigation/stack';

import { RoleSelectionCard } from '../../components/onboarding/RoleSelectionCard';
import { OnboardingProgress } from '../../components/onboarding/OnboardingProgress';
import { Button } from '../../components/common/Button';
import { useOnboardingStore } from '../../store/onboardingStore';
import { ROLE_CARDS } from '../../constants/mockData';
import type { OnboardingStackParamList, UserRole } from '../../types';

type Props = StackScreenProps<OnboardingStackParamList, 'RoleSelection'>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const RoleSelectionScreen: React.FC<Props> = ({ navigation }) => {
  const { selectedRole, setRole, nextStep } = useOnboardingStore();
  const [localSelectedRole, setLocalSelectedRole] = useState<UserRole | undefined>(selectedRole);
  
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(30);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(20);

  React.useEffect(() => {
    // Entry animations
    titleOpacity.value = withTiming(1, { duration: 800 });
    titleTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });

    if (localSelectedRole) {
      buttonOpacity.value = withTiming(1, { duration: 500 });
      buttonTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
    }
  }, [titleOpacity, titleTranslateY, buttonOpacity, buttonTranslateY, localSelectedRole]);

  React.useEffect(() => {
    if (localSelectedRole) {
      buttonOpacity.value = withTiming(1, { duration: 500 });
      buttonTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
    } else {
      buttonOpacity.value = withTiming(0, { duration: 300 });
      buttonTranslateY.value = withSpring(20, { damping: 15, stiffness: 100 });
    }
  }, [localSelectedRole, buttonOpacity, buttonTranslateY]);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonTranslateY.value }],
  }));

  const handleRoleSelect = (roleId: string) => {
    const role = roleId as UserRole;
    setLocalSelectedRole(role);
    setRole(role);
  };

  const handleContinue = () => {
    if (!localSelectedRole) return;

    nextStep();
    
    // Navigate based on selected role - using new complete flows
    switch (localSelectedRole) {
      case 'seller':
        navigation.navigate('SellerOnboardingFlow');
        break;
      case 'buyer':
        navigation.navigate('BuyerOnboardingFlow');
        break;
      case 'transport':
        navigation.navigate('TransporterOnboardingFlow');
        break;
      default:
        break;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <LinearGradient
        colors={['#f8fafc', '#e2e8f0']}
        className="flex-1"
      >
        <ScrollView 
          className="flex-1" 
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="px-6 pt-4 pb-2">
            <OnboardingProgress />
          </View>

          {/* Title Section */}
          <View className="px-6 py-8">
            <Animated.View style={titleStyle}>
              <Text className="text-3xl font-bold text-gray-900 text-center mb-4">
                Welcome to AgroTrade
              </Text>
              <Text className="text-lg text-gray-600 text-center leading-6">
                Choose your role to get started with a personalized experience
              </Text>
            </Animated.View>
          </View>

          {/* Role Cards */}
          <View className="flex-1 px-6">
            {/* Desktop/Tablet Layout */}
            <View className="hidden md:flex flex-row flex-wrap justify-center">
              <View className="w-full max-w-md mb-4">
                <RoleSelectionCard
                  card={ROLE_CARDS[0]} // Seller
                  isSelected={localSelectedRole === 'seller'}
                  onPress={() => handleRoleSelect('seller')}
                  delay={200}
                  style={{ height: 200 }}
                />
              </View>
              
              <View className="flex-row w-full max-w-2xl">
                <View className="flex-1 mr-2">
                  <RoleSelectionCard
                    card={ROLE_CARDS[1]} // Buyer
                    isSelected={localSelectedRole === 'buyer'}
                    onPress={() => handleRoleSelect('buyer')}
                    delay={400}
                    style={{ height: 200 }}
                  />
                </View>
                
                <View className="flex-1 ml-2">
                  <RoleSelectionCard
                    card={ROLE_CARDS[2]} // Transport
                    isSelected={localSelectedRole === 'transport'}
                    onPress={() => handleRoleSelect('transport')}
                    delay={600}
                    style={{ height: 200 }}
                  />
                </View>
              </View>
            </View>

            {/* Mobile Layout */}
            <View className="flex md:hidden">
              {ROLE_CARDS.map((card, index) => (
                <View key={card.id} className="mb-4">
                  <RoleSelectionCard
                    card={card}
                    isSelected={localSelectedRole === card.id}
                    onPress={() => handleRoleSelect(card.id)}
                    delay={200 + (index * 200)}
                    style={{ height: screenHeight * 0.2 }}
                  />
                </View>
              ))}
            </View>

            {/* Selected Role Info */}
            {localSelectedRole && (
              <Animated.View 
                style={buttonStyle}
                className="bg-white rounded-xl p-4 mx-2 mb-6 shadow-sm"
              >
                <View className="items-center">
                  <Text className="text-lg font-semibold text-gray-900 mb-2">
                    Perfect! You selected:{' '}
                    <Text style={{ color: ROLE_CARDS.find(c => c.id === localSelectedRole)?.color }}>
                      {ROLE_CARDS.find(c => c.id === localSelectedRole)?.title}
                    </Text>
                  </Text>
                  <Text className="text-gray-600 text-center">
                    {ROLE_CARDS.find(c => c.id === localSelectedRole)?.description}
                  </Text>
                </View>
              </Animated.View>
            )}
          </View>

          {/* Continue Button */}
          <View className="px-6 pb-8">
            <Animated.View style={buttonStyle}>
              <Button
                title="Continue"
                onPress={handleContinue}
                disabled={!localSelectedRole}
                className={`w-full ${localSelectedRole ? 'opacity-100' : 'opacity-50'}`}
                variant="primary"
                size="large"
              />
            </Animated.View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

// Alternative layout for larger screens
export const RoleSelectionScreenLarge: React.FC<Props> = ({ navigation }) => {
  const { selectedRole, setRole, nextStep } = useOnboardingStore();
  const [localSelectedRole, setLocalSelectedRole] = useState<UserRole | undefined>(selectedRole);
  
  const handleRoleSelect = (roleId: string) => {
    const role = roleId as UserRole;
    setLocalSelectedRole(role);
    setRole(role);
  };

  const handleContinue = () => {
    if (!localSelectedRole) return;
    nextStep();
    
    // Navigate to complete flows for all roles
    switch (localSelectedRole) {
      case 'seller':
        navigation.navigate('SellerOnboardingFlow');
        break;
      case 'buyer':
        navigation.navigate('BuyerOnboardingFlow');
        break;
      case 'transport':
        navigation.navigate('TransporterOnboardingFlow');
        break;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <LinearGradient
        colors={['#f8fafc', '#e2e8f0']}
        className="flex-1"
      >
        <View className="flex-1 max-w-6xl mx-auto w-full px-8 py-8">
          {/* Progress */}
          <OnboardingProgress className="mb-8" />

          {/* Title */}
          <View className="text-center mb-12">
            <Text className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to AgroTrade
            </Text>
            <Text className="text-xl text-gray-600">
              Choose your role to get started with a personalized experience
            </Text>
          </View>

          {/* Cards Grid */}
          <View className="flex-1 grid grid-cols-3 gap-6 mb-8">
            {ROLE_CARDS.map((card, index) => (
              <RoleSelectionCard
                key={card.id}
                card={card}
                isSelected={localSelectedRole === card.id}
                onPress={() => handleRoleSelect(card.id)}
                delay={200 + (index * 200)}
                style={{ minHeight: 300 }}
              />
            ))}
          </View>

          {/* Continue Button */}
          <View className="flex items-center">
            <Button
              title="Continue"
              onPress={handleContinue}
              disabled={!localSelectedRole}
              variant="primary"
              size="large"
              className="w-64"
            />
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};