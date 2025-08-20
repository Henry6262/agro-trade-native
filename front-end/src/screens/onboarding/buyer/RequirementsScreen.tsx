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
import { QuantitySelector, QuickQuantitySelector } from '../../../components/onboarding/QuantitySelector';
import { Button } from '../../../components/common/Button';
import { useOnboardingStore } from '../../../store/onboardingStore';
import {
  MOCK_PRODUCTS,
  QUALITY_GRADES,
} from '../../../constants/mockData';
import type { OnboardingStackParamList, ProductRequirement } from '../../../types';

type Props = StackScreenProps<OnboardingStackParamList, 'BuyerRequirements'>;

interface RequirementFormProps {
  requirement: ProductRequirement;
  onUpdate: (updates: Partial<ProductRequirement>) => void;
}

const RequirementForm: React.FC<RequirementFormProps> = ({
  requirement,
  onUpdate,
}) => {
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [showUrgencyModal, setShowUrgencyModal] = useState(false);
  const [customMaxPrice, setCustomMaxPrice] = useState(requirement.maxPrice?.toString() || '');

  const mockProduct = MOCK_PRODUCTS.find(p => p.id === requirement.productId);
  const averagePrice = mockProduct?.averagePrice || 0;

  const animation = useSharedValue(0);

  React.useEffect(() => {
    animation.value = withSpring(1, { damping: 15, stiffness: 150 });
  }, [animation]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: animation.value,
    transform: [{ translateY: interpolate(animation.value, [0, 1], [20, 0]) }],
  }));

  const urgencyLevels = [
    { value: 'low', label: 'Low - Within 3 months', color: '#6b7280' },
    { value: 'medium', label: 'Medium - Within 1 month', color: '#f59e0b' },
    { value: 'high', label: 'High - Within 2 weeks', color: '#f97316' },
    { value: 'urgent', label: 'Urgent - Within 1 week', color: '#dc2626' },
  ];

  const handleMaxPriceChange = (text: string) => {
    setCustomMaxPrice(text);
    const numericValue = parseFloat(text);
    onUpdate({ maxPrice: isNaN(numericValue) ? undefined : numericValue });
  };

  const handleQualityRequirementToggle = (quality: string) => {
    const current = requirement.qualityRequirements || [];
    const updated = current.includes(quality)
      ? current.filter(q => q !== quality)
      : [...current, quality];
    
    onUpdate({ qualityRequirements: updated });
  };

  const getQuickQuantityPresets = () => {
    switch (requirement.quantity.unit) {
      case 'tons':
        return [1, 5, 10, 25, 50, 100];
      case 'kg':
        return [100, 500, 1000, 2000, 5000];
      case 'bags':
        return [10, 25, 50, 100, 200];
      default:
        return [1, 10, 50, 100];
    }
  };

  return (
    <Animated.View style={containerStyle} className="mb-6">
      <View className="bg-white rounded-2xl p-6 shadow-sm">
        {/* Product Header */}
        <View className="flex-row items-center mb-6">
          <View className="w-12 h-12 bg-blue-100 rounded-xl items-center justify-center mr-4">
            <Text className="text-2xl">📦</Text>
          </View>
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900">
              {requirement.productName}
            </Text>
            <Text className="text-gray-600 capitalize">
              {requirement.category}
            </Text>
          </View>
        </View>

        {/* Quantity Requirements */}
        <View className="mb-6">
          <QuantitySelector
            value={requirement.quantity}
            onChange={(quantity) => onUpdate({ quantity })}
            label="Required Quantity"
            placeholder="Enter required quantity"
            showEstimate
            estimatedValue={averagePrice}
          />
          
          <QuickQuantitySelector
            presets={getQuickQuantityPresets()}
            unit={requirement.quantity.unit}
            onSelect={(amount) => onUpdate({ 
              quantity: { ...requirement.quantity, amount } 
            })}
            className="mt-3"
          />
        </View>

        {/* Maximum Price */}
        <View className="mb-6">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            Maximum Price per Ton (Optional)
          </Text>
          
          {averagePrice > 0 && (
            <View className="bg-blue-50 p-3 rounded-lg mb-3">
              <Text className="text-sm text-blue-800">
                💰 Market average: ${averagePrice} per ton
              </Text>
            </View>
          )}

          <View className="bg-gray-50 rounded-xl border border-gray-200">
            <TextInput
              className="p-4 text-lg font-semibold text-gray-900"
              placeholder="Enter max price"
              value={customMaxPrice}
              onChangeText={handleMaxPriceChange}
              keyboardType="numeric"
            />
          </View>
          
          {requirement.maxPrice && (
            <Text className="text-sm text-gray-600 mt-2">
              Total budget: ${(requirement.maxPrice * requirement.quantity.amount).toLocaleString()}
            </Text>
          )}
        </View>

        {/* Quality Requirements */}
        <View className="mb-6">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            Quality Requirements
          </Text>
          <TouchableOpacity
            onPress={() => setShowQualityModal(true)}
            className="bg-gray-50 rounded-xl p-4 border border-gray-200"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                {requirement.qualityRequirements && requirement.qualityRequirements.length > 0 ? (
                  <Text className="text-gray-900 font-medium">
                    {requirement.qualityRequirements.join(', ')}
                  </Text>
                ) : (
                  <Text className="text-gray-500">
                    Select quality standards
                  </Text>
                )}
              </View>
              <Text className="text-gray-400 ml-2">▼</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Delivery Deadline */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            Delivery Timeline
          </Text>
          <TouchableOpacity
            onPress={() => setShowUrgencyModal(true)}
            className="bg-gray-50 rounded-xl p-4 border border-gray-200"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                {requirement.deliveryDeadline ? (
                  <Text className="text-gray-900 font-medium">
                    {urgencyLevels.find(u => u.value === requirement.deliveryDeadline)?.label}
                  </Text>
                ) : (
                  <Text className="text-gray-500">
                    Select delivery timeline
                  </Text>
                )}
              </View>
              <Text className="text-gray-400 ml-2">▼</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Quality Modal */}
        <Modal
          visible={showQualityModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowQualityModal(false)}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl max-h-96">
              <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
                <Text className="text-lg font-semibold text-gray-900">
                  Quality Standards
                </Text>
                <TouchableOpacity
                  onPress={() => setShowQualityModal(false)}
                  className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
                >
                  <Text className="text-gray-600 font-bold">×</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView className="p-4">
                {QUALITY_GRADES.map((grade) => (
                  <TouchableOpacity
                    key={grade.value}
                    onPress={() => handleQualityRequirementToggle(grade.value)}
                    className={`p-4 rounded-xl mb-2 border ${
                      requirement.qualityRequirements?.includes(grade.value)
                        ? 'bg-blue-50 border-blue-200 border-2'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className={`text-base font-semibold ${
                          requirement.qualityRequirements?.includes(grade.value)
                            ? 'text-blue-900'
                            : 'text-gray-900'
                        }`}>
                          {grade.label}
                        </Text>
                        <Text className="text-sm text-gray-600 mt-1">
                          {grade.description}
                        </Text>
                      </View>
                      {requirement.qualityRequirements?.includes(grade.value) && (
                        <View className="w-6 h-6 bg-blue-500 rounded-full items-center justify-center">
                          <Text className="text-white text-xs font-bold">✓</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Urgency Modal */}
        <Modal
          visible={showUrgencyModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowUrgencyModal(false)}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl max-h-96">
              <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
                <Text className="text-lg font-semibold text-gray-900">
                  Delivery Timeline
                </Text>
                <TouchableOpacity
                  onPress={() => setShowUrgencyModal(false)}
                  className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
                >
                  <Text className="text-gray-600 font-bold">×</Text>
                </TouchableOpacity>
              </View>
              
              <View className="p-4">
                {urgencyLevels.map((level) => (
                  <TouchableOpacity
                    key={level.value}
                    onPress={() => {
                      onUpdate({ deliveryDeadline: level.value });
                      setShowUrgencyModal(false);
                    }}
                    className={`flex-row items-center justify-between p-4 rounded-xl mb-2 border ${
                      requirement.deliveryDeadline === level.value
                        ? 'border-2'
                        : 'border'
                    }`}
                    style={{
                      backgroundColor: requirement.deliveryDeadline === level.value 
                        ? `${level.color}20` 
                        : '#f9fafb',
                      borderColor: requirement.deliveryDeadline === level.value 
                        ? level.color 
                        : '#e5e7eb'
                    }}
                  >
                    <Text className={`text-base font-medium ${
                      requirement.deliveryDeadline === level.value
                        ? 'text-gray-900'
                        : 'text-gray-700'
                    }`}>
                      {level.label}
                    </Text>
                    {requirement.deliveryDeadline === level.value && (
                      <View 
                        className="w-6 h-6 rounded-full items-center justify-center"
                        style={{ backgroundColor: level.color }}
                      >
                        <Text className="text-white text-xs font-bold">✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Animated.View>
  );
};

export const BuyerRequirementsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { buyerData, updateBuyerRequirement, nextStep } = useOnboardingStore();
  const requirements = buyerData?.requiredProducts || [];

  const [completedRequirements, setCompletedRequirements] = useState<Set<string>>(new Set());

  const headerOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  React.useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 600 });
    contentOpacity.value = withTiming(1, { duration: 800 });
  }, [headerOpacity, contentOpacity]);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: interpolate(headerOpacity.value, [0, 1], [-20, 0]) }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const handleRequirementUpdate = (productId: string, updates: Partial<ProductRequirement>) => {
    updateBuyerRequirement(productId, updates);
    
    // Check if this requirement is now complete
    const updatedRequirement = { ...requirements.find(r => r.productId === productId), ...updates };
    if (isRequirementComplete(updatedRequirement)) {
      setCompletedRequirements(prev => new Set(prev).add(productId));
    } else {
      setCompletedRequirements(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const isRequirementComplete = (requirement: ProductRequirement): boolean => {
    return requirement.quantity.amount > 0;
  };

  const canContinue = requirements.length > 0 && 
    requirements.every(requirement => isRequirementComplete(requirement));

  const handleContinue = () => {
    if (canContinue) {
      nextStep();
      navigation.navigate('BuyerMarketOverview');
    }
  };

  const completionProgress = requirements.length > 0 
    ? (completedRequirements.size / requirements.length) * 100 
    : 0;

  // Calculate total estimated budget
  const totalEstimatedBudget = requirements.reduce((total, req) => {
    if (req.maxPrice && req.quantity.amount > 0) {
      return total + (req.maxPrice * req.quantity.amount);
    }
    return total;
  }, 0);

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
            Purchase Requirements
          </Text>
          <Text className="text-base text-gray-600 leading-6 mb-4">
            Specify your requirements to help sellers provide accurate quotes
          </Text>
          
          {/* Progress Indicator */}
          <View className="bg-white rounded-xl p-4 shadow-sm mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-medium text-gray-700">
                Requirements Progress
              </Text>
              <Text className="text-sm font-bold text-blue-600">
                {completedRequirements.size} of {requirements.length}
              </Text>
            </View>
            <View className="w-full h-2 bg-gray-200 rounded-full">
              <View 
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${completionProgress}%` }}
              />
            </View>
          </View>

          {/* Budget Summary */}
          {totalEstimatedBudget > 0 && (
            <View className="bg-green-50 rounded-xl p-4 border border-green-200">
              <View className="flex-row items-center justify-between">
                <Text className="text-green-800 font-semibold">
                  Estimated Total Budget
                </Text>
                <Text className="text-2xl font-bold text-green-700">
                  ${totalEstimatedBudget.toLocaleString()}
                </Text>
              </View>
            </View>
          )}
        </Animated.View>

        {/* Requirements Forms */}
        <Animated.View style={contentStyle} className="flex-1">
          <ScrollView 
            className="px-6" 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            {requirements.map((requirement, index) => (
              <RequirementForm
                key={requirement.productId}
                requirement={requirement}
                onUpdate={(updates) => handleRequirementUpdate(requirement.productId, updates)}
              />
            ))}
          </ScrollView>
        </Animated.View>

        {/* Continue Button */}
        <View className="px-6 pb-6 bg-white border-t border-gray-200">
          <Button
            title={canContinue ? "Continue to Market Overview" : "Complete all requirements to continue"}
            onPress={handleContinue}
            disabled={!canContinue}
            variant="primary"
            size="large"
            className="w-full"
          />
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};