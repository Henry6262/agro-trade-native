import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import {
  Package,
  MapPin,
  DollarSign,
  Info,
  Weight,
  TrendingUp,
  FileText,
  Check,
  X,
} from 'lucide-react-native';
import { useOnboardingStore } from '@stores/onboarding.store';
import { useProductStore } from '@stores/product.store';
import { useAuthStore } from '@stores/auth.store';
import { SellOptionsDrawer } from '@pages/Onboarding/sections/Seller/features/SellOptions/components/SellOptionsDrawer';
import { APP_CONFIG } from '@shared/constants';

// DTO Structure for backend
export interface CreateListingDTO {
  productId: string;
  quantity: number;
  unit: string;
  offerType: 'listing' | 'custom-offer';
  location: {
    latitude: number;
    longitude: number;
    city?: string;
    region?: string;
    country?: string;
    address?: string;
  };
  specifications?: Record<string, any>;
  priceExpectation?: {
    min?: number;
    max?: number;
    currency: string;
  };
  sellerId?: string;
  status: 'draft' | 'active' | 'pending';
  createdAt?: Date;
}

interface SimplifiedMarketOverviewProps {
  selectedProducts: string[];
  specifications: any;
  onComplete?: () => void;
}

export function SimplifiedMarketOverview({
  selectedProducts = [],
  specifications,
  onComplete,
}: SimplifiedMarketOverviewProps) {
  const {
    selectedProductsMetadata,
    location,
    sellerSpecifications,
    selectedRole,
    selectedProducts: storeSelectedProducts,
  } = useOnboardingStore();

  const { products } = useProductStore();
  const { user } = useAuthStore();

  const [showSellDrawer, setShowSellDrawer] = useState(false);

  // Use selectedProducts from props or fall back to store
  const productList = selectedProducts.length > 0 ? selectedProducts : storeSelectedProducts;
  const productId = productList?.[0];
  const product = products.find((p) => p.id === productId);
  const productSpecs = sellerSpecifications[productId] || {};

  // Build the DTO
  const handleSellClick = () => {
    console.log('handleSellClick - productId:', productId, 'product:', product?.name);
    if (!productId) {
      console.error('No product ID available when sell button clicked');
    }
    setShowSellDrawer(true);
  };

  const buildListingDTO = (): CreateListingDTO | null => {
    if (!productId || !product) return null;

    const quantity = parseFloat(productSpecs.quantity || '0');
    const unit = productSpecs.unit || product?.defaultUnit || 'TON';
    const offerType = productSpecs.action || 'listing';

    // Get price expectation from product data
    const priceMin = parseFloat(product?.priceRangeMin || '0');
    const priceMax = parseFloat(product?.priceRangeMax || '0');

    const dto: CreateListingDTO = {
      productId,
      quantity,
      unit,
      offerType: offerType as 'listing' | 'custom-offer',
      location: {
        latitude: location?.latitude || 0,
        longitude: location?.longitude || 0,
        city: location?.city,
        region: location?.region,
        country: location?.country,
        address: location?.address,
      },
      status: 'draft',
    };

    // Add specifications if it's a custom offer
    if (offerType === 'custom-offer' && productSpecs.specifications) {
      dto.specifications = productSpecs.specifications;
    }

    // Add price expectation if available
    if (priceMin > 0 || priceMax > 0) {
      dto.priceExpectation = {
        min: priceMin,
        max: priceMax,
        currency: 'USD',
      };
    }

    // Add seller ID if authenticated
    if (user?.id) {
      dto.sellerId = user.id;
    }

    return dto;
  };

  const handleDrawerComplete = () => {
    setShowSellDrawer(false);
    onComplete?.();
  };

  // Calculate estimated value
  const calculateEstimatedValue = () => {
    const quantity = parseFloat(productSpecs.quantity || '0');
    const priceMin = parseFloat(product?.priceRangeMin || '0');
    const priceMax = parseFloat(product?.priceRangeMax || '0');

    return {
      min: quantity * priceMin,
      max: quantity * priceMax,
    };
  };

  const estimatedValue = calculateEstimatedValue();

  // Format currency
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  // Check if specification has value
  const hasSpecValue = (specKey: string) => {
    return productSpecs.specifications?.[specKey]?.trim() !== '';
  };

  // Remove the auth check here - it's now handled in the drawer

  // Handle case when no product is selected
  if (!productId || !product) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-gray-400 text-center">
          No product selected. Please go back and select a product.
        </Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-white mb-2">Listing Overview</Text>
          <Text className="text-gray-400">Review your listing details before submitting</Text>
        </View>

        {/* Product Card - Enhanced Display */}
        {product && (
          <View className="bg-gray-800/50 rounded-2xl overflow-hidden border border-gray-700 mb-6">
            {/* Product Image Header */}
            {product.image && (
              <View className="relative">
                <Image
                  source={{
                    uri: product.image.startsWith('http')
                      ? product.image
                      : `${APP_CONFIG.API_URL.replace('/api', '')}/static/${product.image}`,
                  }}
                  style={{ width: '100%', height: 180 }}
                  resizeMode="cover"
                />
                <View className="absolute top-3 right-3">
                  <View
                    className={`px-3 py-1 rounded-full ${
                      productSpecs.action === 'custom-offer' ? 'bg-emerald-600' : 'bg-blue-600'
                    }`}
                  >
                    <Text className="text-white text-xs font-semibold">
                      {productSpecs.action === 'custom-offer'
                        ? 'Custom Offer'
                        : 'Marketplace Listing'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Product Details */}
            <View className="p-4">
              <Text className="text-white text-xl font-bold mb-1">
                {product.displayName || product.name}
              </Text>
              <Text className="text-gray-400 text-sm mb-4">
                {product.category.replace(/_/g, ' ')}
              </Text>

              {/* Key Metrics Grid */}
              <View className="flex-row flex-wrap -mx-2 mb-4">
                {/* Quantity */}
                <View className="w-1/2 px-2 mb-3">
                  <View className="bg-gray-900/50 rounded-xl p-3">
                    <View className="flex-row items-center mb-1">
                      <Weight size={14} color="#10B981" />
                      <Text className="text-gray-400 text-xs ml-1">Quantity</Text>
                    </View>
                    <Text className="text-white text-lg font-semibold">
                      {productSpecs.quantity || '0'}{' '}
                      {productSpecs.unit || product.defaultUnit || 'TON'}
                    </Text>
                  </View>
                </View>

                {/* Location */}
                <View className="w-1/2 px-2 mb-3">
                  <View className="bg-gray-900/50 rounded-xl p-3">
                    <View className="flex-row items-center mb-1">
                      <MapPin size={14} color="#10B981" />
                      <Text className="text-gray-400 text-xs ml-1">Location</Text>
                    </View>
                    <Text className="text-white text-sm font-semibold" numberOfLines={1}>
                      {location?.city || location?.address || 'Not set'}
                    </Text>
                  </View>
                </View>

                {/* Estimated Value */}
                <View className="w-full px-2">
                  <View className="bg-emerald-600/10 rounded-xl p-3 border border-emerald-600/20">
                    <View className="flex-row items-center mb-1">
                      <DollarSign size={14} color="#10B981" />
                      <Text className="text-emerald-400 text-xs ml-1">Estimated Value</Text>
                    </View>
                    <Text className="text-emerald-400 text-lg font-bold">
                      {formatCurrency(estimatedValue.min)} - {formatCurrency(estimatedValue.max)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Remove specifications section - moved to drawer */}
        {false && productSpecs.action === 'custom-offer' && product?.specifications && (
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <FileText size={20} color="white" />
              <Text className="text-white text-lg font-semibold ml-2">Product Specifications</Text>
            </View>

            <View className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              {product.specifications.length > 0 ? (
                <View className="space-y-3">
                  {product.specifications.map((spec) => {
                    const specKey = spec.code || spec.id;
                    const value = productSpecs.specifications?.[specKey];
                    const hasValue = value?.trim() !== '';

                    return (
                      <View
                        key={specKey}
                        className="flex-row items-center justify-between py-2 border-b border-gray-700/50"
                      >
                        <View className="flex-row items-center flex-1">
                          {hasValue ? (
                            <Check size={16} color="#10B981" />
                          ) : (
                            <X size={16} color="#EF4444" />
                          )}
                          <Text
                            className={`ml-2 text-sm ${hasValue ? 'text-gray-300' : 'text-gray-500'}`}
                          >
                            {spec.name || spec.code}
                          </Text>
                        </View>
                        <View className="flex-row items-center">
                          {hasValue ? (
                            <>
                              <Text className="text-white font-medium mr-2">{value}</Text>
                              {spec.unit && (
                                <Text className="text-gray-400 text-xs">{spec.unit}</Text>
                              )}
                            </>
                          ) : (
                            <Text className="text-gray-500 text-xs italic">Not provided</Text>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View className="flex-row items-center">
                  <Info size={16} color="#6B7280" />
                  <Text className="text-gray-400 text-sm ml-2">
                    No specifications required for this product
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Market Info */}
        <View className="bg-blue-500/10 rounded-xl p-4 mb-6 border border-blue-500/20">
          <View className="flex-row items-start">
            <Info size={16} color="#3B82F6" />
            <View className="flex-1 ml-3">
              <Text className="text-blue-400 font-semibold mb-1">Ready to Sell</Text>
              <Text className="text-blue-400/70 text-sm leading-5">
                Choose between creating a quick marketplace listing or requesting a custom offer
                with detailed specifications.
              </Text>
            </View>
          </View>
        </View>

        {/* Sell Button */}
        <TouchableOpacity onPress={handleSellClick} className="bg-emerald-600 rounded-xl py-4 mb-4">
          <View className="flex-row items-center justify-center">
            <TrendingUp size={20} color="white" />
            <Text className="text-white font-semibold text-base ml-2">Sell</Text>
          </View>
        </TouchableOpacity>

        {/* Data Preview (Debug - Remove in production) */}
        {__DEV__ && (
          <View className="bg-gray-900 rounded-xl p-4 mb-4">
            <Text className="text-gray-400 text-xs font-mono mb-2">DTO Preview:</Text>
            <Text className="text-gray-500 text-xs font-mono">
              {JSON.stringify(buildListingDTO() || {}, null, 2)}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Sell Options Drawer - only render when product exists */}
      {productId && (
        <SellOptionsDrawer
          visible={showSellDrawer}
          onClose={() => setShowSellDrawer(false)}
          productId={productId}
          onComplete={handleDrawerComplete}
        />
      )}
    </>
  );
}
