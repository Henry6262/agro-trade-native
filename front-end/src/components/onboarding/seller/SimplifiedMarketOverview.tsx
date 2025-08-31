import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Package, MapPin, TrendingUp, Info, Check } from 'lucide-react-native';
import type { ProductSpecification } from '../../../types/onboarding';
import { useOnboardingStore } from '../../../store/onboardingStore';
import { OnboardingLayout } from '../shared/OnboardingLayout';
import { DynamicGrid } from '../shared/DynamicGrid';

interface SimplifiedMarketOverviewProps {
  selectedProducts: string[];
  specifications: ProductSpecification[];
  onComplete?: () => void;
}

export function SimplifiedMarketOverview({ 
  selectedProducts, 
  specifications,
  onComplete 
}: SimplifiedMarketOverviewProps) {
  const { width } = Dimensions.get('window');
  const isLargeScreen = width >= 768;
  
  const { 
    selectedProductsMetadata, 
    userLocation,
    sellerSpecifications 
  } = useOnboardingStore();

  const handleCompleteListing = () => {
    console.log('Completing sale listing with:', { selectedProducts, specifications });
    onComplete?.();
  };

  // Calculate total quantity and estimated value
  const calculateTotals = () => {
    let totalQuantity = 0;
    let totalMinValue = 0;
    let totalMaxValue = 0;

    specifications.forEach(spec => {
      const quantity = parseFloat(spec.quantity) || 0;
      const multiplier = spec.unit === 'tons' || spec.unit === 'ton' ? 1 : 
                        spec.unit === 'quintal' ? 0.1 : 0.001;
      const quantityInTons = quantity * multiplier;
      totalQuantity += quantityInTons;

      // Get price data from sellerSpecifications
      const specData = sellerSpecifications[spec.productId];
      if (specData?.priceRange) {
        totalMinValue += quantityInTons * (specData.priceRange.min || 0);
        totalMaxValue += quantityInTons * (specData.priceRange.max || 0);
      }
    });

    return { totalQuantity, totalMinValue, totalMaxValue };
  };

  const { totalQuantity, totalMinValue, totalMaxValue } = calculateTotals();

  // Format currency with K, M suffixes
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `€${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `€${(value / 1000).toFixed(1)}K`
    }
    return `€${value.toFixed(0)}`
  }

  const renderProductCard = (spec: ProductSpecification, index: number) => {
    const metadata = selectedProductsMetadata.find(m => m.category === spec.productId);
    const productName = metadata?.name || spec.productId;
    const specData = sellerSpecifications[spec.productId];
    const priceRange = specData?.priceRange;
    
    const quantity = parseFloat(spec.quantity) || 0;
    const multiplier = spec.unit === 'tons' || spec.unit === 'ton' ? 1 : 
                      spec.unit === 'quintal' ? 0.1 : 0.001;
    const quantityInTons = quantity * multiplier;
    
    const estimatedMin = priceRange ? quantityInTons * priceRange.min : 0;
    const estimatedMax = priceRange ? quantityInTons * priceRange.max : 0;

    return (
        <View className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
          {/* Product Image */}
          {metadata?.image && (
            <View className="relative">
              <Image
                source={{ uri: metadata.image }}
                style={{ width: '100%', height: 140 }}
                resizeMode="cover"
              />
              <View className="absolute top-2 right-2 bg-gray-900/80 px-2 py-1 rounded-lg">
                <Text className="text-white text-xs font-semibold">For Sale</Text>
              </View>
            </View>
          )}
          
          {/* Product Details */}
          <View className="p-4">
            <Text className="text-white font-bold text-lg mb-2">
              {productName}
            </Text>
            
            {/* Quantity & Unit */}
            <View className="flex-row items-center mb-3">
              <Package size={16} color="#9ca3af" />
              <Text className="text-gray-300 ml-2">
                {spec.quantity} {spec.unit}
              </Text>
              <Text className="text-gray-500 ml-1">
                ({quantityInTons.toFixed(2)} tons)
              </Text>
            </View>

            {/* Price and Value Info */}
            <View className="flex-row justify-between">
              {priceRange && (
                <View className="flex-1 mr-2">
                  <Text className="text-gray-500 text-xs mb-1">Market Price</Text>
                  <Text className="text-gray-300 font-semibold">
                    €{priceRange.min.toFixed(0)}-{priceRange.max.toFixed(0)}/t
                  </Text>
                </View>
              )}
              {estimatedMin > 0 && (
                <View className="flex-1">
                  <Text className="text-gray-500 text-xs mb-1">Est. Value</Text>
                  <Text className="text-white font-bold text-lg">
                    {formatCurrency(estimatedMin)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
    );
  };

  return (
    <OnboardingLayout>
        {/* Header Section */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-primary-500 text-center mb-2">
            Listing Overview
          </Text>
          <Text className="text-gray-400 text-center">
            Review your complete listing before publishing
          </Text>
        </View>

        {/* Location Card */}
        {userLocation && (
          <View className="bg-gray-800 rounded-xl p-4 mb-4 border border-gray-700">
            <View className="flex-row items-center">
              <MapPin size={20} color="#10b981" />
              <View className="ml-3 flex-1">
                <Text className="text-gray-400 text-sm">Pickup Location</Text>
                <Text className="text-white font-semibold">
                  {userLocation.city}{userLocation.country && `, ${userLocation.country}`}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Summary Stats - All in one row */}
        <View className="flex-row mb-6 -mx-1">
          <View className="flex-1 px-1">
            <View className="bg-gray-800 rounded-lg p-3 border border-gray-700">
              <Text className="text-gray-400 text-xs">Products</Text>
              <Text className="text-lg font-bold text-white">
                {selectedProducts.length}
              </Text>
            </View>
          </View>
          
          <View className="flex-1 px-1">
            <View className="bg-gray-800 rounded-lg p-3 border border-gray-700">
              <Text className="text-gray-400 text-xs">Volume</Text>
              <Text className="text-lg font-bold text-white">
                {totalQuantity.toFixed(1)}t
              </Text>
            </View>
          </View>
          
          {totalMinValue > 0 && (
            <View className="flex-1 px-1">
              <View className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                <Text className="text-gray-400 text-xs">Est. Value</Text>
                <Text className="text-lg font-bold text-white">
                  {formatCurrency(totalMinValue)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Products Grid */}
        <View className="mb-4">
          <Text className="text-lg font-semibold text-white mb-3">
            Your Products ({selectedProducts.length})
          </Text>
          <DynamicGrid minItemWidth={200} maxItemWidth={350} spacing={12}>
            {specifications.map((spec, index) => renderProductCard(spec, index))}
          </DynamicGrid>
        </View>

        {/* Information Notice */}
        <View className="bg-blue-900/20 rounded-xl p-4 mb-6 border border-blue-700/30">
          <View className="flex-row">
            <Info size={20} color="#60a5fa" />
            <View className="ml-3 flex-1">
              <Text className="text-blue-400 font-semibold mb-1">Ready to Publish</Text>
              <Text className="text-blue-300 text-sm">
                Your listing will be visible to verified buyers in your region. 
                You'll receive notifications when buyers show interest.
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          onPress={handleCompleteListing}
          className="bg-emerald-500 rounded-xl py-4 px-6 flex-row justify-center items-center mb-3"
        >
          <Check size={20} color="white" />
          <Text className="text-white font-bold text-lg ml-2">
            Publish Listing
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-gray-800 rounded-xl py-3 px-6 flex-row justify-center items-center border border-gray-700"
        >
          <Text className="text-gray-400 font-medium">
            Save as Draft
          </Text>
        </TouchableOpacity>
    </OnboardingLayout>
  );
}