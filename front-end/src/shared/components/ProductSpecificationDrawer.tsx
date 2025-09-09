import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { X, ChevronRight, Info } from 'lucide-react-native';

interface ProductSpecification {
  id: string;
  code: string;
  name: string;
  value: any;
  unit?: string;
  dataType: 'NUMBER' | 'TEXT' | 'BOOLEAN' | 'ENUM';
  importance?: 'CRITICAL' | 'IMPORTANT' | 'OPTIONAL';
  minValue?: number;
  maxValue?: number;
}

interface ProductSpecificationDrawerProps {
  visible: boolean;
  productData: any;
  onClose: () => void;
  onSave: (specs: any) => void;
  onSkip?: () => void;
}

export const ProductSpecificationDrawer: React.FC<ProductSpecificationDrawerProps> = ({
  visible,
  productData,
  onClose,
  onSave,
  onSkip,
}) => {
  const [quantity, setQuantity] = useState('');
  const [specifications, setSpecifications] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible && productData?.specifications) {
      // Initialize specifications with default values
      const initialSpecs: Record<string, any> = {};
      productData.specifications.forEach((spec: ProductSpecification) => {
        if (spec.dataType === 'BOOLEAN') {
          initialSpecs[spec.code] = false;
        } else if (spec.dataType === 'NUMBER') {
          initialSpecs[spec.code] = '';
        } else {
          initialSpecs[spec.code] = '';
        }
      });
      setSpecifications(initialSpecs);
    }
  }, [visible, productData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!quantity || parseFloat(quantity) <= 0) {
      newErrors.quantity = 'Please enter a valid quantity';
    }
    
    // Validate critical specifications
    productData?.specifications?.forEach((spec: ProductSpecification) => {
      if (spec.importance === 'CRITICAL' && !specifications[spec.code]) {
        newErrors[spec.code] = `${spec.name} is required`;
      }
      
      if (spec.dataType === 'NUMBER' && specifications[spec.code]) {
        const value = parseFloat(specifications[spec.code]);
        if (spec.minValue !== undefined && value < spec.minValue) {
          newErrors[spec.code] = `Minimum value is ${spec.minValue}`;
        }
        if (spec.maxValue !== undefined && value > spec.maxValue) {
          newErrors[spec.code] = `Maximum value is ${spec.maxValue}`;
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }
    
    const data = {
      quantity: parseFloat(quantity),
      unit: productData?.defaultUnit || 'ton',
      specifications: specifications,
      productId: productData?.id,
      productName: productData?.name,
    };
    
    onSave(data);
  };

  const handleSkip = () => {
    // Save with minimal data
    const data = {
      quantity: parseFloat(quantity) || 0,
      unit: productData?.defaultUnit || 'ton',
      specifications: {},
      productId: productData?.id,
      productName: productData?.name,
    };
    
    if (onSkip) {
      onSkip();
    } else {
      onSave(data);
    }
  };

  const updateSpecification = (code: string, value: any) => {
    setSpecifications(prev => ({
      ...prev,
      [code]: value,
    }));
    
    // Clear error for this field
    if (errors[code]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[code];
        return newErrors;
      });
    }
  };

  const renderSpecificationInput = (spec: ProductSpecification) => {
    switch (spec.dataType) {
      case 'BOOLEAN':
        return (
          <View className="flex-row items-center justify-between">
            <Text className="text-neutral-300 flex-1">{spec.name}</Text>
            <Switch
              value={specifications[spec.code] || false}
              onValueChange={(value) => updateSpecification(spec.code, value)}
              trackColor={{ false: '#374151', true: '#10B981' }}
              thumbColor={specifications[spec.code] ? '#ffffff' : '#9CA3AF'}
            />
          </View>
        );
      
      case 'NUMBER':
        return (
          <View>
            <Text className="text-neutral-300 mb-2">{spec.name}</Text>
            <View className="flex-row items-center">
              <TextInput
                value={specifications[spec.code]?.toString() || ''}
                onChangeText={(text) => updateSpecification(spec.code, text)}
                keyboardType="numeric"
                placeholder={`Enter ${spec.name.toLowerCase()}`}
                placeholderTextColor="#6B7280"
                className="flex-1 bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-2 text-white"
              />
              {spec.unit && (
                <Text className="ml-2 text-neutral-400">{spec.unit}</Text>
              )}
            </View>
            {spec.minValue !== undefined && spec.maxValue !== undefined && (
              <Text className="text-xs text-neutral-500 mt-1">
                Range: {spec.minValue} - {spec.maxValue} {spec.unit || ''}
              </Text>
            )}
          </View>
        );
      
      default:
        return (
          <View>
            <Text className="text-neutral-300 mb-2">{spec.name}</Text>
            <TextInput
              value={specifications[spec.code] || ''}
              onChangeText={(text) => updateSpecification(spec.code, text)}
              placeholder={`Enter ${spec.name.toLowerCase()}`}
              placeholderTextColor="#6B7280"
              className="bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-2 text-white"
            />
          </View>
        );
    }
  };

  const getImportanceColor = (importance?: string) => {
    switch (importance) {
      case 'CRITICAL':
        return 'text-red-400';
      case 'IMPORTANT':
        return 'text-yellow-400';
      default:
        return 'text-neutral-400';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50">
        <View 
          className="bg-neutral-900 rounded-t-3xl mt-20"
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center p-6 border-b border-neutral-700">
            <View>
              <Text className="text-xl font-bold text-white">Product Details</Text>
              <Text className="text-sm text-neutral-400 mt-1">
                {productData?.name || 'Product'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X color="#ffffff" size={24} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView 
            className="flex-1 px-6"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            {/* Basic Information */}
            <View className="mt-6">
              <Text className="text-lg font-semibold text-green-400 mb-4">
                Basic Information
              </Text>
              
              {/* Quantity */}
              <View className="mb-4">
                <Text className="text-neutral-300 mb-2">
                  Quantity <Text className="text-red-400">*</Text>
                </Text>
                <View className="flex-row items-center">
                  <TextInput
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                    placeholder="Enter quantity"
                    placeholderTextColor="#6B7280"
                    className={`flex-1 bg-neutral-800 border ${
                      errors.quantity ? 'border-red-500' : 'border-neutral-600'
                    } rounded-lg px-3 py-2 text-white`}
                  />
                  <Text className="ml-2 text-neutral-400">
                    {productData?.defaultUnit || 'tons'}
                  </Text>
                </View>
                {errors.quantity && (
                  <Text className="text-red-400 text-xs mt-1">{errors.quantity}</Text>
                )}
              </View>
              
              {/* Market Price Range Reference */}
              {productData?.priceRangeMin && productData?.priceRangeMax && (
                <View className="mb-4 p-3 bg-neutral-800 rounded-lg flex-row items-center">
                  <Info size={14} color="#60A5FA" />
                  <Text className="text-sm text-blue-400 ml-2">
                    Market price: €{productData.priceRangeMin} - €{productData.priceRangeMax}/ton
                  </Text>
                </View>
              )}
            </View>

            {/* Specifications */}
            {productData?.specifications && productData.specifications.length > 0 && (
              <View className="mt-6">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-lg font-semibold text-green-400">
                    Product Specifications
                  </Text>
                  {onSkip && (
                    <TouchableOpacity onPress={handleSkip}>
                      <Text className="text-neutral-400 text-sm">Skip</Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                {productData.specifications.map((spec: ProductSpecification) => (
                  <View key={spec.id} className="mb-4">
                    {spec.importance && (
                      <Text className={`text-xs mb-1 ${getImportanceColor(spec.importance)}`}>
                        {spec.importance}
                      </Text>
                    )}
                    {renderSpecificationInput(spec)}
                    {errors[spec.code] && (
                      <Text className="text-red-400 text-xs mt-1">{errors[spec.code]}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View className="absolute bottom-0 left-0 right-0 bg-neutral-800 border-t border-neutral-700 p-4">
            <View className="flex-row gap-2">
              {onSkip && (
                <TouchableOpacity
                  onPress={handleSkip}
                  className="flex-1 border border-neutral-600 py-3 px-6 rounded-lg"
                >
                  <Text className="text-neutral-300 text-center font-semibold">
                    Skip Specifications
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleSave}
                disabled={isLoading}
                className={`flex-1 bg-green-500 py-3 px-6 rounded-lg ${
                  isLoading ? 'opacity-50' : ''
                }`}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-white text-center font-semibold">
                    Continue
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};