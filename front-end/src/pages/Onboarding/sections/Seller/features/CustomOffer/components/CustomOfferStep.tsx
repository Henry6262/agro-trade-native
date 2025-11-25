import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Package, Info, ChevronRight } from 'lucide-react-native';
import { useOnboardingStore } from '@stores/onboarding.store';
import { useProductStore } from '@stores/product.store';
import { getApiUrl } from '@shared/utils/environment';

export function CustomOfferStep() {
  const {
    selectedProducts,
    selectedProductsMetadata,
    sellerSpecifications,
    updateSellerSpecification,
    nextStep,
  } = useOnboardingStore();

  const { products } = useProductStore();

  const [specifications, setSpecifications] = useState<Record<string, string>>({});

  const productId = selectedProducts[0];
  const product = products.find((p) => p.id === productId);
  const currentSpecs = sellerSpecifications[productId] || {};

  useEffect(() => {
    // Initialize specifications with empty values
    if (product?.specifications) {
      const initialSpecs: Record<string, string> = {};
      product.specifications.forEach((spec) => {
        const specKey = spec.code || spec.id;
        // Load existing values if any
        initialSpecs[specKey] = currentSpecs.specifications?.[specKey] || '';
      });
      setSpecifications(initialSpecs);
    }
  }, [product]);

  const handleSpecificationChange = (specKey: string, value: string, dataType?: string) => {
    let processedValue = value;

    // Validate numeric inputs
    if (dataType === 'NUMBER') {
      processedValue = value.replace(/[^0-9.]/g, '');
    }

    setSpecifications((prev) => ({
      ...prev,
      [specKey]: processedValue,
    }));
  };

  const handleSubmit = () => {
    if (!product) return;

    // Validate required specifications
    if (product.specifications && product.specifications.length > 0) {
      const missingRequired = product.specifications
        .filter((spec) => spec.importance === 'CRITICAL' || spec.importance === 'IMPORTANT')
        .filter((spec) => {
          const specKey = spec.code || spec.id;
          return !specifications[specKey]?.trim();
        });

      if (missingRequired.length > 0) {
        Alert.alert(
          'Missing Information',
          `Please fill in all required specifications: ${missingRequired.map((s) => s.name || s.code).join(', ')}`,
          [{ text: 'OK' }]
        );
        return;
      }

      // Validate numeric ranges
      for (const spec of product.specifications) {
        const specKey = spec.code || spec.id;
        const value = specifications[specKey];

        if (value && spec.dataType === 'NUMBER') {
          const numValue = parseFloat(value);

          if (isNaN(numValue)) {
            Alert.alert('Invalid Input', `${spec.name || spec.code} must be a valid number`);
            return;
          }

          if (spec.minValue && numValue < spec.minValue) {
            Alert.alert(
              'Invalid Input',
              `${spec.name || spec.code} must be at least ${spec.minValue}`
            );
            return;
          }

          if (spec.maxValue && numValue > spec.maxValue) {
            Alert.alert(
              'Invalid Input',
              `${spec.name || spec.code} must not exceed ${spec.maxValue}`
            );
            return;
          }
        }
      }
    }

    // Save specifications to store
    updateSellerSpecification(productId, {
      ...currentSpecs,
      specifications: specifications,
    });

    // Move to next step
    nextStep();
  };

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-white mb-2">Product Specifications</Text>
          <Text className="text-gray-400">
            Provide details about your {product?.displayName || product?.name}
          </Text>
        </View>

        {/* Product Info Card */}
        {product && (
          <View className="bg-gray-800/50 rounded-xl p-4 mb-6 flex-row items-center">
            {product.image && (
              <Image
                source={{
                  uri: product.image.startsWith('http')
                    ? product.image
                    : `${getApiUrl().replace('/api', '')}/static/${product.image}`,
                }}
                style={{ width: 60, height: 60 }}
                className="rounded-xl mr-4"
                resizeMode="cover"
              />
            )}
            <View className="flex-1">
              <Text className="text-white text-lg font-semibold">
                {product.displayName || product.name}
              </Text>
              <View className="flex-row items-center mt-1">
                <Package size={14} color="#10B981" />
                <Text className="text-emerald-400 text-sm ml-2">
                  {currentSpecs.quantity} {currentSpecs.unit || product.defaultUnit || 'TON'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Specifications Form */}
        {product?.specifications && product.specifications.length > 0 ? (
          <View className="space-y-3">
            {product.specifications
              .sort((a, b) => a.displayOrder - b.displayOrder)
              .map((spec) => {
                const specKey = spec.code || spec.id;
                const isRequired =
                  spec.importance === 'CRITICAL' || spec.importance === 'IMPORTANT';

                return (
                  <View
                    key={specKey}
                    className="bg-gray-800/50 rounded-2xl p-4 mb-3 border border-gray-700/50"
                  >
                    {/* Label Row */}
                    <View className="mb-3">
                      <Text className="text-white text-sm font-semibold">
                        {spec.name || spec.code}
                        {isRequired && <Text className="text-red-400"> *</Text>}
                      </Text>
                    </View>

                    {/* Input Field with Unit Square */}
                    <View className="flex-row items-center">
                      <TextInput
                        value={specifications[specKey] || ''}
                        onChangeText={(value) =>
                          handleSpecificationChange(specKey, value, spec.dataType)
                        }
                        placeholder={`Enter ${spec.name?.toLowerCase() || spec.code}`}
                        placeholderTextColor="#4B5563"
                        className="flex-1 bg-gray-900/50 rounded-l-xl px-4 py-3 text-white"
                        keyboardType={spec.dataType === 'NUMBER' ? 'numeric' : 'default'}
                      />
                      {/* Unit/Type Square on the right */}
                      <View className="bg-gray-900/50 rounded-r-xl border-l border-gray-700 px-4 py-3 min-w-[60px] items-center justify-center">
                        <Text className="text-emerald-400 font-medium text-sm">
                          {spec.unit || (spec.dataType === 'NUMBER' ? '#' : 'TXT')}
                        </Text>
                      </View>
                    </View>

                    {/* Valid Range Display */}
                    {spec.dataType === 'NUMBER' && (spec.minValue || spec.maxValue) && (
                      <View className="flex-row items-center justify-end mt-2">
                        <View className="bg-blue-600/10 px-3 py-1 rounded-lg">
                          <Text className="text-blue-400 text-xs">
                            Valid range: {spec.minValue || '0'} - {spec.maxValue || '∞'}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
          </View>
        ) : (
          <View className="bg-gray-800/50 rounded-xl p-6 mb-4">
            <View className="items-center">
              <Info size={48} color="#6B7280" />
              <Text className="text-gray-400 text-center mt-3">
                No specifications required for this product
              </Text>
              <Text className="text-gray-500 text-xs text-center mt-2">
                You can proceed to the next step
              </Text>
            </View>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          className="bg-emerald-600 rounded-xl py-4 mt-6 mb-4"
        >
          <View className="flex-row items-center justify-center">
            <Text className="text-white font-semibold text-base mr-2">Continue to Overview</Text>
            <ChevronRight size={20} color="white" />
          </View>
        </TouchableOpacity>
      </ScrollView>
  );
}
