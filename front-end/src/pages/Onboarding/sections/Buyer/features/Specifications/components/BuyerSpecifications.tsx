import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Image, ActivityIndicator } from 'react-native';
import { Package } from 'lucide-react-native';
import type { ProductSpecification } from '@shared/types/onboarding';
import { useOnboardingStore } from '@stores/onboarding.store';
import { useProductStore } from '@stores/product.store';
import { ProductSpecificationInput } from '@pages/Onboarding/components/shared/ProductSpecificationInput';
import { getApiUrl } from '@shared/utils/environment';

interface BuyerSpecificationsProps {
  selectedProducts: string[];
  specifications: ProductSpecification[];
  onSpecificationsChange: (specifications: ProductSpecification[]) => void;
}

export function BuyerSpecifications({
  selectedProducts,
  specifications,
  onSpecificationsChange,
}: BuyerSpecificationsProps) {
  const { selectedProductsMetadata, updateBuyerSpecification, buyerSpecifications } =
    useOnboardingStore();
  const { products, getProductSpecifications } = useProductStore();

  const [loading, setLoading] = useState(false);
  const [productSpecs, setProductSpecs] = useState<any[]>([]);
  const [specValues, setSpecValues] = useState<Record<string, string>>({});
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Get the selected product
  const selectedProductId = selectedProducts[0];
  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const productMetadata = selectedProductsMetadata.find((m) => m.id === selectedProductId);
  const currentSpecs = buyerSpecifications[selectedProductId] || {};

  // Load product specifications and existing data
  useEffect(() => {
    if (selectedProductId) {
      setLoading(true);
      try {
        // Get specifications for the selected product
        const specs = getProductSpecifications(selectedProductId);
        setProductSpecs(specs);

        // Initialize specification values from existing data
        const existingSpec =
          specifications.find((s) => s.productId === selectedProductId) || currentSpecs;
        if (existingSpec) {
          // Load existing values
          const values: Record<string, string> = {};
          specs.forEach((spec: any) => {
            const key = spec.code || spec.id;
            if (existingSpec[key]) {
              values[key] = existingSpec[key].toString();
            }
          });
          setSpecValues(values);
          setAdditionalNotes(existingSpec.notes || '');
        }
      } catch (error) {
        console.error('Error loading specifications:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [selectedProductId]);

  // Update specification value
  const handleSpecChange = (specKey: string, value: string) => {
    setSpecValues((prev) => ({
      ...prev,
      [specKey]: value,
    }));
    updateSpec(specKey, value);
  };

  // Update additional notes
  const handleNotesChange = (text: string) => {
    setAdditionalNotes(text);
    updateSpec('notes', text);
  };

  // Update specification in store
  const updateSpec = (key: string, value: string) => {
    const updatedSpec = {
      ...currentSpecs,
      productId: selectedProductId,
      ...specValues,
      [key]: value,
      notes: additionalNotes,
      // Preserve quantity and price from previous step
      quantity: currentSpecs.quantity || '',
      unit: currentSpecs.unit || 'tons',
      pricePerKilo: currentSpecs.pricePerKilo || '',
    };

    onSpecificationsChange([updatedSpec]);
    updateBuyerSpecification(selectedProductId, updatedSpec);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#10B981" />
        <Text className="text-gray-400 mt-4">Loading product specifications...</Text>
      </View>
    );
  }

  if (!selectedProduct) {
    return (
      <View className="bg-gray-800 border border-gray-700 rounded-lg p-8 items-center">
        <View className="w-16 h-16 bg-gray-700 rounded-full items-center justify-center mb-4">
          <Package size={32} color="#6B7280" />
        </View>
        <Text className="text-lg font-semibold text-white mb-2">No Product Selected</Text>
        <Text className="text-sm text-gray-400 text-center">
          Please go back and select a product first
        </Text>
      </View>
    );
  }

  // Get product image URL
  const productImage = selectedProduct.image || productMetadata?.image;
  const imageUrl = productImage
    ? productImage.startsWith('http')
      ? productImage
      : `${getApiUrl().replace('/api', '')}/static/${productImage}`
    : null;

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-blue-500 mb-3">Product Specifications</Text>
          <Text className="text-gray-400 text-base">
            Specify your requirements for {selectedProduct.displayName || selectedProduct.name}
          </Text>
        </View>

        {/* ===== SECTION 1: PRODUCT INFO ===== */}
        <View className="bg-gray-800/30 rounded-2xl p-5 mb-6 border border-gray-700/50">
          <View className="flex-row items-center mb-4">
            <Package size={22} color="#3B82F6" />
            <Text className="text-white text-xl font-bold ml-2">Selected Product</Text>
          </View>
          <View className="flex-row items-center">
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                className="w-20 h-20 rounded-xl mr-4"
                resizeMode="cover"
              />
            ) : (
              <View className="w-20 h-20 rounded-xl bg-gray-700 items-center justify-center mr-4">
                <Package size={32} color="#9CA3AF" />
              </View>
            )}
            <View className="flex-1">
              <Text className="text-xl font-bold text-white">
                {selectedProduct.displayName || selectedProduct.name}
              </Text>
              <Text className="text-sm text-gray-400 mt-1">{selectedProduct.category}</Text>
            </View>
          </View>
        </View>

        {/* ===== SECTION 2: PRODUCT SPECIFICATIONS ===== */}
        {productSpecs && productSpecs.length > 0 ? (
          <View className="bg-gray-800/30 rounded-2xl p-5 mb-6 border border-gray-700/50">
            <View className="flex-row items-center mb-4">
              <Package size={22} color="#3B82F6" />
              <Text className="text-white text-xl font-bold ml-2">Product Requirements</Text>
            </View>
            <Text className="text-sm text-gray-400 mb-4">
              Specify your requirements for each specification
            </Text>

            {productSpecs.map((spec: any) => {
              const specKey = spec.code || spec.id || '';
              return (
                <ProductSpecificationInput
                  key={specKey}
                  spec={spec}
                  value={specValues[specKey] || ''}
                  onChange={(value) => handleSpecChange(specKey, value)}
                />
              );
            })}
          </View>
        ) : (
          <View className="bg-gray-800/30 rounded-2xl p-5 mb-6 border border-gray-700/50">
            <View className="flex-row items-center mb-4">
              <Package size={22} color="#3B82F6" />
              <Text className="text-white text-xl font-bold ml-2">Product Requirements</Text>
            </View>
            <Text className="text-gray-400 text-center">
              No specifications available for this product
            </Text>
          </View>
        )}

        {/* ===== SECTION 3: ADDITIONAL REQUIREMENTS ===== */}
        <View className="bg-gray-800/30 rounded-2xl p-5 mb-6 border border-gray-700/50">
          <View className="flex-row items-center mb-4">
            <Package size={22} color="#3B82F6" />
            <Text className="text-white text-xl font-bold ml-2">Additional Requirements</Text>
          </View>
          <Text className="text-white text-sm font-semibold mb-3">
            Additional Notes or Special Requirements
          </Text>
          <TextInput
            value={additionalNotes}
            onChangeText={handleNotesChange}
            placeholder="Enter any additional requirements, quality standards, certification needs, etc."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            className="bg-white rounded-xl px-4 py-3 text-gray-900 min-h-[100px]"
            textAlignVertical="top"
          />
        </View>
      </ScrollView>
  );
}
