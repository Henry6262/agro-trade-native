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
  PRICE_RANGES,
} from '../../../constants/mockData';
import type { OnboardingStackParamList, ProductSelection, PriceRange } from '../../../types';

type Props = StackScreenProps<OnboardingStackParamList, 'SellerProductDetails'>;

interface ProductDetailFormProps {
  product: ProductSelection;
  onUpdate: (updates: Partial<ProductSelection>) => void;
}

const ProductDetailForm: React.FC<ProductDetailFormProps> = ({
  product,
  onUpdate,
}) => {
  const [showVarietiesModal, setShowVarietiesModal] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [customPriceRange, setCustomPriceRange] = useState<PriceRange>(
    product.priceRange || { min: 0, max: 0, currency: 'USD' }
  );

  const mockProduct = MOCK_PRODUCTS.find(p => p.id === product.productId);
  const availableVarieties = mockProduct?.varieties || [];
  const averagePrice = mockProduct?.averagePrice || 0;
  const categoryPriceRange = PRICE_RANGES[product.category as keyof typeof PRICE_RANGES];

  const animation = useSharedValue(0);

  React.useEffect(() => {
    animation.value = withSpring(1, { damping: 15, stiffness: 150 });
  }, [animation]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: animation.value,
    transform: [{ translateY: interpolate(animation.value, [0, 1], [20, 0]) }],
  }));

  const handleVarietyToggle = (variety: string) => {
    const newVarieties = product.varieties.includes(variety)
      ? product.varieties.filter(v => v !== variety)
      : [...product.varieties, variety];
    
    onUpdate({ varieties: newVarieties });
  };

  const handlePriceRangeUpdate = (field: 'min' | 'max', value: number) => {
    const newRange = { ...customPriceRange, [field]: value };
    setCustomPriceRange(newRange);
    onUpdate({ priceRange: newRange });
  };

  const getQuickQuantityPresets = () => {
    switch (product.quantity.unit) {
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
          <View className="w-12 h-12 bg-green-100 rounded-xl items-center justify-center mr-4">
            <Text className="text-2xl">🌾</Text>
          </View>
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900">
              {product.productName}
            </Text>
            <Text className="text-gray-600 capitalize">
              {product.category}
            </Text>
          </View>
        </View>

        {/* Varieties Selection */}
        <View className="mb-6">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            Available Varieties
          </Text>
          <TouchableOpacity
            onPress={() => setShowVarietiesModal(true)}
            className="bg-gray-50 rounded-xl p-4 border border-gray-200"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                {product.varieties.length > 0 ? (
                  <Text className="text-gray-900 font-medium">
                    {product.varieties.join(', ')}
                  </Text>
                ) : (
                  <Text className="text-gray-500">
                    Select varieties you grow
                  </Text>
                )}
              </View>
              <Text className="text-gray-400 ml-2">▼</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Quantity Input */}
        <View className="mb-6">
          <QuantitySelector
            value={product.quantity}
            onChange={(quantity) => onUpdate({ quantity })}
            label="Available Quantity"
            placeholder="Enter quantity"
            showEstimate
            estimatedValue={averagePrice}
          />
          
          {/* Quick quantity presets */}
          <QuickQuantitySelector
            presets={getQuickQuantityPresets()}
            unit={product.quantity.unit}
            onSelect={(amount) => onUpdate({ 
              quantity: { ...product.quantity, amount } 
            })}
            className="mt-3"
          />
        </View>

        {/* Price Range (Optional) */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            Price Range (Optional)
          </Text>
          
          {categoryPriceRange && (
            <View className="bg-blue-50 p-3 rounded-lg mb-3">
              <Text className="text-sm text-blue-800">
                💡 Market average: ${categoryPriceRange.min} - ${categoryPriceRange.max} per ton
              </Text>
            </View>
          )}

          <View className="flex-row space-x-3">
            <View className="flex-1">
              <Text className="text-sm text-gray-600 mb-2">Min Price</Text>
              <View className="bg-gray-50 rounded-xl border border-gray-200">
                <TextInput
                  className="p-4 text-gray-900"
                  placeholder="0"
                  value={customPriceRange.min > 0 ? customPriceRange.min.toString() : ''}
                  onChangeText={(text) => handlePriceRangeUpdate('min', parseFloat(text) || 0)}
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <View className="flex-1">
              <Text className="text-sm text-gray-600 mb-2">Max Price</Text>
              <View className="bg-gray-50 rounded-xl border border-gray-200">
                <TextInput
                  className="p-4 text-gray-900"
                  placeholder="0"
                  value={customPriceRange.max > 0 ? customPriceRange.max.toString() : ''}
                  onChangeText={(text) => handlePriceRangeUpdate('max', parseFloat(text) || 0)}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Varieties Modal */}
        <Modal
          visible={showVarietiesModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowVarietiesModal(false)}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl max-h-96">
              <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
                <Text className="text-lg font-semibold text-gray-900">
                  Select Varieties
                </Text>
                <TouchableOpacity
                  onPress={() => setShowVarietiesModal(false)}
                  className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
                >
                  <Text className="text-gray-600 font-bold">×</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView className="p-4">
                {availableVarieties.map((variety) => (
                  <TouchableOpacity
                    key={variety}
                    onPress={() => handleVarietyToggle(variety)}
                    className={`flex-row items-center justify-between p-4 rounded-xl mb-2 ${
                      product.varieties.includes(variety)
                        ? 'bg-green-50 border-green-200 border-2'
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <Text className={`text-base ${
                      product.varieties.includes(variety)
                        ? 'text-green-900 font-semibold'
                        : 'text-gray-900'
                    }`}>
                      {variety}
                    </Text>
                    {product.varieties.includes(variety) && (
                      <View className="w-6 h-6 bg-green-500 rounded-full items-center justify-center">
                        <Text className="text-white text-xs font-bold">✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </Animated.View>
  );
};

export const SellerProductDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { sellerData, updateSellerProduct, nextStep } = useOnboardingStore();
  const selectedProducts = sellerData?.selectedProducts || [];

  const [completedProducts, setCompletedProducts] = useState<Set<string>>(new Set());

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

  const handleProductUpdate = (productId: string, updates: Partial<ProductSelection>) => {
    updateSellerProduct(productId, updates);
    
    // Check if this product is now complete
    const updatedProduct = { ...selectedProducts.find(p => p.productId === productId), ...updates };
    if (isProductComplete(updatedProduct)) {
      setCompletedProducts(prev => new Set(prev).add(productId));
    } else {
      setCompletedProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const isProductComplete = (product: ProductSelection): boolean => {
    return (
      product.varieties.length > 0 &&
      product.quantity.amount > 0
    );
  };

  const canContinue = selectedProducts.length > 0 && 
    selectedProducts.every(product => isProductComplete(product));

  const handleContinue = () => {
    if (canContinue) {
      nextStep();
      navigation.navigate('SellerMarketInsights');
    }
  };

  const completionProgress = selectedProducts.length > 0 
    ? (completedProducts.size / selectedProducts.length) * 100 
    : 0;

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
            Product Details
          </Text>
          <Text className="text-base text-gray-600 leading-6 mb-4">
            Help buyers find you by providing details about your products
          </Text>
          
          {/* Progress Indicator */}
          <View className="bg-white rounded-xl p-4 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-medium text-gray-700">
                Completion Progress
              </Text>
              <Text className="text-sm font-bold text-green-600">
                {completedProducts.size} of {selectedProducts.length}
              </Text>
            </View>
            <View className="w-full h-2 bg-gray-200 rounded-full">
              <View 
                className="h-full bg-green-500 rounded-full transition-all duration-300"
                style={{ width: `${completionProgress}%` }}
              />
            </View>
          </View>
        </Animated.View>

        {/* Product Forms */}
        <Animated.View style={contentStyle} className="flex-1">
          <ScrollView 
            className="px-6" 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            {selectedProducts.map((product, index) => (
              <ProductDetailForm
                key={product.productId}
                product={product}
                onUpdate={(updates) => handleProductUpdate(product.productId, updates)}
              />
            ))}
          </ScrollView>
        </Animated.View>

        {/* Continue Button */}
        <View className="px-6 pb-6 bg-white border-t border-gray-200">
          <Button
            title={canContinue ? "Continue to Market Insights" : "Complete all products to continue"}
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