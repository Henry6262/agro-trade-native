import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useOnboardingStore } from '@stores/onboarding.store';
import { useProductStore } from '@stores/product.store';
import { productSelectionService } from './service';
import type { ProductSelectionRole } from './types';

export const ProductSelectionUnified: React.FC = () => {
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  const {
    selectedRole: role,
    setSelectedProducts: updateSelectedProducts,
    setSelectedProductsMetadata,
    nextStep,
    selectedProducts: storeSelectedProducts,
  } = useOnboardingStore();

  const { products, isLoadingProducts, fetchAllData } = useProductStore();

  useEffect(() => {
    // Initialize with stored selections
    if (storeSelectedProducts && storeSelectedProducts.length > 0) {
      setSelectedProductIds(storeSelectedProducts);
    }

    // Fetch products if not already loaded
    if (products.length === 0) {
      fetchAllData().catch((error) => {
        console.error('Error fetching products:', error);
        Alert.alert('Error', 'Failed to load products. Please try again.');
      });
    }
  }, []);

  const toggleProduct = (productId: string) => {
    console.log('Toggle product:', productId, 'Role:', role);
    if (role === 'seller' || role === 'buyer') {
      // For both sellers and buyers: directly select and move to next step
      console.log('Selecting product and moving to next step:', productId);

      // Update selected products
      setSelectedProductIds([productId]);
      updateSelectedProducts([productId]);

      // Update metadata with product specifications
      const metadata = productSelectionService.buildMetadata(products, [productId]);
      setSelectedProductsMetadata(metadata);

      // Move to next step
      setTimeout(() => {
        nextStep();
      }, 100);
    } else {
      // Multi-selection for other roles (if any)
      const newSelection = selectedProductIds.includes(productId)
        ? selectedProductIds.filter((id) => id !== productId)
        : [...selectedProductIds, productId];

      setSelectedProductIds(newSelection);
      updateSelectedProducts(newSelection);

      // Update metadata with product specifications
      setSelectedProductsMetadata(productSelectionService.buildMetadata(products, newSelection));
    }
  };

  if (isLoadingProducts) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#10B981" />
        <Text className="mt-4 text-gray-400">Loading products...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Header */}
      <View className="mb-6">
        <Text className="text-3xl font-bold text-primary-500 mb-2">
          {role === 'buyer' ? 'What do you need?' : 'What do you offer?'}
        </Text>
        <Text className="text-gray-400">
          {role === 'buyer'
            ? 'Select one agricultural product you want to purchase'
            : 'Select one agricultural product you want to sell'}
        </Text>
      </View>

      {/* Product Grid - Fixed 2 columns */}
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {products && products.length > 0 ? (
          <View>
            {/* Create rows of 2 items each */}
            {Array.from({ length: Math.ceil(products.length / 2) }, (_, rowIndex) => (
              <View key={rowIndex} className="flex-row mb-3">
                {products.slice(rowIndex * 2, rowIndex * 2 + 2).map((product, colIndex) => {
                  const isSelected =
                    selectedProductIds.includes(product.id) ||
                    selectedProductIds.includes(product.category);

                  return (
                    <TouchableOpacity
                      key={product.id}
                      onPress={() => toggleProduct(product.id)}
                      className={`flex-1 rounded-xl overflow-hidden border ${
                        colIndex === 0 ? 'mr-1.5' : 'ml-1.5'
                      } ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500'
                          : 'bg-gray-800/50 border-gray-700'
                      }`}
                      style={{
                        backgroundColor: isSelected
                          ? 'rgba(16, 185, 129, 0.1)'
                          : 'rgba(31, 41, 55, 0.5)',
                      }}
                    >
                      {/* Product Image */}
                      {product.image && (
                        <View className="relative w-full h-32">
                          <Image
                            source={{
                              uri:
                                productSelectionService.resolveImageUri(product.image || null) ??
                                undefined,
                            }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                          />
                          {isSelected && (
                            <View className="absolute top-2 right-2 bg-emerald-500 rounded-full p-1">
                              <Ionicons name="checkmark" size={16} color="white" />
                            </View>
                          )}
                        </View>
                      )}

                      {/* Product Info */}
                      <View className="p-3">
                        <Text
                          className={`text-sm font-medium text-center ${isSelected ? 'text-white' : 'text-gray-300'}`}
                          numberOfLines={2}
                        >
                          {product.displayName || product.name}
                        </Text>
                        {(role === 'seller' || role === 'buyer') && (
                          <Text className="text-xs text-gray-400 text-center mt-1">
                            Tap to select
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
                {/* Add empty space if odd number of products in last row */}
                {rowIndex === Math.ceil(products.length / 2) - 1 && products.length % 2 === 1 && (
                  <View className="flex-1 ml-1.5" />
                )}
              </View>
            ))}
          </View>
        ) : (
          <View className="flex-1 justify-center items-center">
            <Text className="text-gray-500">No products available</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};
