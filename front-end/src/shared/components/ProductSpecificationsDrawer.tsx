import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { ChevronLeft, Check, Info } from 'lucide-react-native';
import { useProductStore } from '@stores/product.store';
import { useOnboardingStore } from '@stores/onboarding.store';

interface ProductSpecificationsDrawerProps {
  visible: boolean;
  onClose: () => void;
  onBack: () => void;
  onNext: (specifications: any) => void;
  productId: string;
  productName: string;
  existingSpecs?: any;
}

export const ProductSpecificationsDrawer: React.FC<ProductSpecificationsDrawerProps> = ({
  visible,
  onClose,
  onBack,
  onNext,
  productId,
  productName,
  existingSpecs = {},
}) => {
  const [loading, setLoading] = useState(false);
  const [productSpecs, setProductSpecs] = useState<any[]>([]);
  const [specValues, setSpecValues] = useState<Record<string, string>>(existingSpecs);
  const { getProductSpecifications } = useProductStore();

  useEffect(() => {
    if (visible && productId) {
      loadProductSpecifications();
    }
  }, [visible, productId]);

  const loadProductSpecifications = async () => {
    setLoading(true);
    try {
      // Get specifications for the selected product
      const specs = getProductSpecifications(productId);
      setProductSpecs(specs || []);

      // Initialize with existing values if any
      if (existingSpecs && Object.keys(existingSpecs).length > 0) {
        setSpecValues(existingSpecs);
      }
    } catch (error) {
      console.error('Error loading product specifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSpecChange = (specKey: string, value: string) => {
    setSpecValues((prev) => ({
      ...prev,
      [specKey]: value,
    }));
  };

  const handleNext = () => {
    onNext(specValues);
  };

  const renderSpecInput = (spec: any) => {
    const specKey = spec.code || spec.id || spec.name;
    const value = specValues[specKey] || '';

    // Different input types based on spec type
    if (spec.type === 'select' && spec.options) {
      return (
        <View key={specKey} className="mb-6">
          <Text className="text-gray-900 font-semibold mb-2">{spec.name || specKey}</Text>
          {spec.description && (
            <Text className="text-gray-400 text-sm mb-2">{spec.description}</Text>
          )}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {spec.options.map((option: string) => (
                <TouchableOpacity
                  key={option}
                  onPress={() => handleSpecChange(specKey, option)}
                  className={`px-4 py-2 rounded-lg border ${
                    value === option
                      ? 'bg-blue-500/20 border-blue-500'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <Text className={value === option ? 'text-blue-400' : 'text-gray-600'}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      );
    }

    // Default text input
    return (
      <View key={specKey} className="mb-6">
        <Text className="text-gray-900 font-semibold mb-2">{spec.name || specKey}</Text>
        {spec.description && <Text className="text-gray-400 text-sm mb-2">{spec.description}</Text>}
        <View className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <View className="flex-row items-center">
            <TextInput
              value={value}
              onChangeText={(text) => handleSpecChange(specKey, text)}
              placeholder={spec.placeholder || `Enter ${spec.name || specKey}`}
              placeholderTextColor="#6B7280"
              keyboardType={spec.type === 'number' ? 'numeric' : 'default'}
              className="flex-1 text-gray-900 text-lg"
            />
            {spec.unit && <Text className="text-gray-400 ml-2">{spec.unit}</Text>}
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 bg-white/50">
          <View className="bg-white rounded-t-3xl mt-20" style={{ flex: 1 }}>
            {/* Header */}
            <View className="flex-row justify-between items-center p-6 border-b border-gray-200">
              <TouchableOpacity onPress={onBack} className="flex-row items-center">
                <ChevronLeft color="#60a5fa" size={20} />
                <Text className="text-blue-400 font-semibold ml-1">Back</Text>
              </TouchableOpacity>
              <Text className="text-xl font-bold text-gray-900">Specifications</Text>
              <TouchableOpacity onPress={handleNext}>
                <Text className="text-blue-400 font-semibold">Next</Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            {loading ? (
              <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#10B981" />
                <Text className="mt-4 text-gray-400">Loading specifications...</Text>
              </View>
            ) : (
              <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
                <Text className="text-lg text-gray-900 mb-1">{productName}</Text>
                <Text className="text-gray-400 mb-6">
                  Specify your quality requirements (optional)
                </Text>

                {/* Info Box */}
                <View className="bg-blue-900/20 rounded-xl p-4 mb-6 border border-blue-700/30">
                  <View className="flex-row">
                    <Info size={20} color="#60a5fa" />
                    <View className="ml-3 flex-1">
                      <Text className="text-blue-400 font-semibold mb-1">Optional Step</Text>
                      <Text className="text-blue-300 text-sm">
                        These specifications help sellers match your exact requirements. You can
                        skip this step if you don&apos;t have specific quality needs.
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Product Specifications */}
                {productSpecs && productSpecs.length > 0 ? (
                  <View>{productSpecs.map((spec) => renderSpecInput(spec))}</View>
                ) : (
                  <View className="bg-gray-50/50 rounded-xl p-6 items-center">
                    <Text className="text-gray-400 text-center">
                      No specific quality parameters available for this product.
                    </Text>
                    <TouchableOpacity
                      onPress={handleNext}
                      className="mt-4 bg-blue-500 px-6 py-2 rounded-lg"
                    >
                      <Text className="text-white font-semibold">Continue</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            )}

            {/* Footer Buttons */}
            {!loading && productSpecs && productSpecs.length > 0 && (
              <View className="p-6 border-t border-gray-200">
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={handleNext}
                    className="flex-1 bg-gray-100 rounded-xl py-4"
                  >
                    <Text className="text-gray-900 text-center font-semibold text-lg">Skip</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleNext}
                    className="flex-1 bg-blue-500 rounded-xl py-4"
                  >
                    <Text className="text-white text-center font-semibold text-lg">Continue</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
