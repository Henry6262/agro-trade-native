import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { MapPin, ShoppingCart, Info } from 'lucide-react-native';
import type { ProductSpecification } from '@shared/types/onboarding';
import { useOnboardingStore } from '@stores/onboarding.store';
import { useProductStore } from '@stores/product.store';
import { getApiUrl } from '@shared/utils/environment';
import { BuyerSubmitDrawer } from './BuyerSubmitDrawer';

interface BuyerMarketRequestProps {
  selectedProducts: string[];
  specifications: ProductSpecification[];
  onSpecificationsChange: (specifications: ProductSpecification[]) => void;
  onComplete?: () => void;
}

export function BuyerMarketRequest({
  selectedProducts,
  specifications,
  onComplete,
}: BuyerMarketRequestProps) {
  const {
    selectedProductsMetadata,
    location: userLocation,
    buyerSpecifications,
  } = useOnboardingStore();

  const { products, getProductSpecifications } = useProductStore();
  const [showSubmitDrawer, setShowSubmitDrawer] = useState(false);

  const handleComplete = () => {
    setShowSubmitDrawer(true);
  };

  const handleDrawerComplete = () => {
    setShowSubmitDrawer(false);
    onComplete?.();
  };

  // Get the selected product
  const selectedProductId = selectedProducts[0];
  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const productMetadata = selectedProductsMetadata.find((m) => m.id === selectedProductId);
  const spec = specifications[0] || buyerSpecifications[selectedProductId];

  // Get product specifications from backend
  const productSpecs = selectedProductId ? getProductSpecifications(selectedProductId) : [];

  // Calculate totals for single product
  const quantity = parseFloat(spec?.quantity) || 0;
  const pricePerKilo = parseFloat(spec?.pricePerKilo) || 0;
  const quantityInKg = quantity * 1000; // Convert tons to kg
  const totalBudget = quantityInKg * pricePerKilo;

  // Format currency with K, M suffixes
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `€${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `€${(value / 1000).toFixed(1)}K`;
    }
    return `€${value.toFixed(0)}`;
  };

  // Get product image URL
  const productImage = selectedProduct?.image || productMetadata?.image;
  const imageUrl = productImage
    ? productImage.startsWith('http')
      ? productImage
      : `${getApiUrl().replace('/api', '')}/static/${productImage}`
    : null;

  const productName =
    selectedProduct?.displayName ||
    selectedProduct?.name ||
    productMetadata?.name ||
    'Unknown Product';

  return (
    <>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        {/* Header Section */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-primary-500 text-center mb-2">
            Purchase Request Overview
          </Text>
          <Text className="text-gray-400 text-center">
            Review your complete request before submitting
          </Text>
        </View>

        {/* ===== SECTION 1: DELIVERY LOCATION ===== */}
        {userLocation && (
          <View className="bg-white/30 rounded-2xl p-5 mb-6 border border-gray-200/50">
            <View className="flex-row items-center mb-4">
              <MapPin size={22} color="#3B82F6" />
              <Text className="text-gray-900 text-xl font-bold ml-2">Delivery Location</Text>
            </View>
            <View className="flex-row items-center">
              <MapPin size={20} color="#3b82f6" />
              <View className="ml-3 flex-1">
                <Text className="text-gray-400 text-sm">Delivery To</Text>
                <Text className="text-gray-900 font-semibold">
                  {userLocation.city}
                  {userLocation.country && `, ${userLocation.country}`}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ===== SECTION 2: PURCHASE REQUEST DETAILS ===== */}
        <View className="bg-white/30 rounded-2xl overflow-hidden border border-gray-200/50 mb-6">
          <View className="p-5 pb-0">
            <View className="flex-row items-center mb-4">
              <ShoppingCart size={22} color="#3B82F6" />
              <Text className="text-gray-900 text-xl font-bold ml-2">Purchase Request</Text>
            </View>
          </View>
          {/* Product Image */}
          {imageUrl && (
            <View className="relative">
              <Image
                source={{ uri: imageUrl }}
                style={{ width: '100%', height: 180 }}
                resizeMode="cover"
              />
              <View className="absolute top-3 right-3 bg-blue-500/90 px-3 py-1.5 rounded-lg">
                <Text className="text-white text-xs font-semibold">Purchase Request</Text>
              </View>
            </View>
          )}

          {/* Product Details */}
          <View className="p-5">
            <Text className="text-gray-900 font-bold text-xl mb-3">{productName}</Text>

            {/* Main Requirements */}
            <View className="bg-gray-50/50 rounded-lg p-4 mb-4">
              <Text className="text-gray-400 text-sm font-semibold mb-3">Requirements</Text>

              {/* Quantity */}
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-400">Quantity Required:</Text>
                <Text className="text-gray-900 font-semibold">{spec?.quantity || '0'} tons</Text>
              </View>

              {/* Max Price */}
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-400">Maximum Price:</Text>
                <Text className="text-gray-900 font-semibold">€{pricePerKilo}/kg</Text>
              </View>

              {/* Total Budget */}
              <View className="flex-row justify-between pt-2 border-t border-gray-200">
                <Text className="text-gray-400">Total Budget:</Text>
                <Text className="text-emerald-400 font-bold text-lg">
                  {formatCurrency(totalBudget)}
                </Text>
              </View>
            </View>

            {/* Product Specifications if any */}
            {productSpecs && productSpecs.length > 0 && spec && (
              <View className="bg-gray-50/50 rounded-lg p-4 mb-4">
                <Text className="text-gray-400 text-sm font-semibold mb-3">Specifications</Text>
                {productSpecs.map((prodSpec: any) => {
                  const specKey = prodSpec.code || prodSpec.id;
                  const specValue = spec[specKey];
                  if (specValue) {
                    return (
                      <View key={specKey} className="flex-row justify-between mb-2">
                        <Text className="text-gray-400">{prodSpec.name || specKey}:</Text>
                        <Text className="text-gray-900">
                          {specValue} {prodSpec.unit || ''}
                        </Text>
                      </View>
                    );
                  }
                  return null;
                })}
              </View>
            )}

            {/* Additional Notes */}
            {spec?.notes && (
              <View className="bg-gray-50/50 rounded-lg p-4">
                <Text className="text-gray-400 text-sm font-semibold mb-2">
                  Additional Requirements
                </Text>
                <Text className="text-gray-600 text-sm">{spec.notes}</Text>
              </View>
            )}

            {/* Quality Requirements if any */}
            {spec?.qualityRequirements && spec.qualityRequirements.length > 0 && (
              <View className="bg-gray-50/50 rounded-lg p-4 mt-4">
                <Text className="text-gray-400 text-sm font-semibold mb-2">
                  Quality Requirements
                </Text>
                {spec.qualityRequirements.map((req: string, idx: number) => (
                  <View key={idx} className="flex-row items-center mb-1">
                    <Text className="text-gray-600 text-sm">• {req}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* ===== SECTION 3: INFORMATION ===== */}
        <View className="bg-white/30 rounded-2xl p-5 mb-6 border border-gray-200/50">
          <View className="flex-row items-center mb-4">
            <Info size={22} color="#3B82F6" />
            <Text className="text-gray-900 text-xl font-bold ml-2">How it Works</Text>
          </View>
          <Text className="text-gray-600 text-sm">
            Once submitted, your purchase request will be sent to verified sellers. You&apos;ll
            receive quotes within 24-48 hours and can choose the best offer.
          </Text>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          onPress={handleComplete}
          className="bg-blue-500 rounded-xl py-4 px-6 flex-row justify-center items-center"
        >
          <ShoppingCart size={20} color="white" />
          <Text className="text-white font-bold text-lg ml-2">Submit Purchase Request</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Submit Drawer with Authentication */}
      {selectedProductId && (
        <BuyerSubmitDrawer
          visible={showSubmitDrawer}
          onClose={() => setShowSubmitDrawer(false)}
          productId={selectedProductId}
          specifications={spec}
          onComplete={handleDrawerComplete}
        />
      )}
    </>
  );
}
