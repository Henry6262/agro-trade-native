import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { X, Save, Trash2, MapPin } from 'lucide-react-native';

interface ProductEditDrawerProps {
  visible: boolean;
  productData: any;
  onClose: () => void;
  onSave: (updatedData: any) => void;
  onDelete: () => void;
}

export const ProductEditDrawer: React.FC<ProductEditDrawerProps> = ({
  visible,
  productData,
  onClose,
  onSave,
  onDelete,
}) => {
  const [editedProduct, setEditedProduct] = useState<any>(productData);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (productData) {
      setEditedProduct(productData);
    }
  }, [productData]);

  const handleFieldChange = (field: string, value: any) => {
    setEditedProduct((prev: any) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleLocationFieldChange = (field: string, value: string) => {
    setEditedProduct((prev: any) => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value,
      },
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!editedProduct?.quantity || editedProduct.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    if (!editedProduct?.location?.city) {
      newErrors.city = 'City is required';
    }

    if (!editedProduct?.location?.country) {
      newErrors.country = 'Country is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await onSave(editedProduct);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to update product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Product', 'Are you sure you want to delete this product listing?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          onDelete();
          onClose();
        },
      },
    ]);
  };

  if (!editedProduct) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View className="flex-1 bg-white/50">
        <View className="bg-white rounded-t-3xl mt-20" style={{ flex: 1 }}>
          {/* Header */}
          <View className="flex-row justify-between items-center p-6 border-b border-gray-200">
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900">Edit Product</Text>
              <Text className="text-sm text-gray-500 mt-1">
                Update your product listing details
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
            {/* Product Image and Name */}
            <View className="mt-6 mb-4">
              {editedProduct.image && (
                <View className="w-full h-48 bg-gray-50 rounded-lg mb-4 overflow-hidden">
                  <Image
                    source={{ uri: editedProduct.image }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                </View>
              )}
              <Text className="text-2xl font-bold text-gray-900">{editedProduct.name}</Text>
              <Text className="text-gray-500 text-sm mt-1">{editedProduct.category}</Text>
            </View>

            {/* Quantity */}
            <View className="mb-4">
              <Text className="text-gray-600 mb-2">
                Quantity <Text className="text-red-400">*</Text>
              </Text>
              <View className="flex-row gap-2">
                <TextInput
                  value={String(editedProduct.quantity || '')}
                  onChangeText={(text) => handleFieldChange('quantity', parseFloat(text) || 0)}
                  placeholder="Enter quantity"
                  placeholderTextColor="#6B7280"
                  keyboardType="numeric"
                  className={`flex-1 bg-gray-50 border ${
                    errors.quantity ? 'border-red-500' : 'border-gray-200'
                  } rounded-lg px-3 py-2 text-gray-900`}
                />
                <View className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
                  <Text className="text-gray-900">{editedProduct.unit || 'ton'}</Text>
                </View>
              </View>
              {errors.quantity && (
                <Text className="text-red-400 text-xs mt-1">{errors.quantity}</Text>
              )}
            </View>

            {/* Location Section */}
            <View className="mb-4">
              <Text className="text-lg font-semibold text-green-400 mb-3 flex-row items-center">
                <MapPin size={20} /> Location Details
              </Text>

              {/* Address */}
              <View className="mb-3">
                <Text className="text-gray-600 mb-2">Address</Text>
                <TextInput
                  value={editedProduct.location?.address || ''}
                  onChangeText={(text) => handleLocationFieldChange('address', text)}
                  placeholder="Street address"
                  placeholderTextColor="#6B7280"
                  className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900"
                />
              </View>

              {/* City */}
              <View className="mb-3">
                <Text className="text-gray-600 mb-2">
                  City <Text className="text-red-400">*</Text>
                </Text>
                <TextInput
                  value={editedProduct.location?.city || ''}
                  onChangeText={(text) => handleLocationFieldChange('city', text)}
                  placeholder="City"
                  placeholderTextColor="#6B7280"
                  className={`bg-gray-50 border ${
                    errors.city ? 'border-red-500' : 'border-gray-200'
                  } rounded-lg px-3 py-2 text-gray-900`}
                />
                {errors.city && <Text className="text-red-400 text-xs mt-1">{errors.city}</Text>}
              </View>

              {/* Region/State */}
              <View className="mb-3">
                <Text className="text-gray-600 mb-2">Region/State</Text>
                <TextInput
                  value={editedProduct.location?.region || editedProduct.location?.state || ''}
                  onChangeText={(text) => handleLocationFieldChange('region', text)}
                  placeholder="Region or State"
                  placeholderTextColor="#6B7280"
                  className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900"
                />
              </View>

              {/* Country */}
              <View className="mb-3">
                <Text className="text-gray-600 mb-2">
                  Country <Text className="text-red-400">*</Text>
                </Text>
                <TextInput
                  value={editedProduct.location?.country || ''}
                  onChangeText={(text) => handleLocationFieldChange('country', text)}
                  placeholder="Country"
                  placeholderTextColor="#6B7280"
                  className={`bg-gray-50 border ${
                    errors.country ? 'border-red-500' : 'border-gray-200'
                  } rounded-lg px-3 py-2 text-gray-900`}
                />
                {errors.country && (
                  <Text className="text-red-400 text-xs mt-1">{errors.country}</Text>
                )}
              </View>
            </View>

            {/* Specifications (if any) */}
            {editedProduct.specifications &&
              Object.keys(editedProduct.specifications).length > 0 && (
                <View className="mb-4">
                  <Text className="text-lg font-semibold text-green-400 mb-3">Specifications</Text>
                  {Object.entries(editedProduct.specifications).map(([key, value]) => (
                    <View key={key} className="mb-3">
                      <Text className="text-gray-600 mb-2 capitalize">
                        {key.replace(/_/g, ' ')}
                      </Text>
                      <TextInput
                        value={String(value || '')}
                        onChangeText={(text) => {
                          setEditedProduct((prev: any) => ({
                            ...prev,
                            specifications: {
                              ...prev.specifications,
                              [key]: text,
                            },
                          }));
                        }}
                        placeholder={`Enter ${key}`}
                        placeholderTextColor="#6B7280"
                        className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900"
                      />
                    </View>
                  ))}
                </View>
              )}

            {/* Delete Button */}
            <TouchableOpacity
              onPress={handleDelete}
              className="bg-red-500/10 border border-red-500 py-3 px-6 rounded-lg flex-row items-center justify-center mt-6"
            >
              <Trash2 color="#ef4444" size={20} />
              <Text className="text-red-500 font-semibold ml-2">Delete Product Listing</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Footer */}
          <View className="absolute bottom-0 left-0 right-0 bg-gray-50 border-t border-gray-200 p-4">
            <TouchableOpacity
              onPress={handleSave}
              disabled={isLoading}
              className={`bg-green-500 py-3 px-6 rounded-lg flex-row items-center justify-center ${
                isLoading ? 'opacity-50' : ''
              }`}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Save color="#ffffff" size={20} />
                  <Text className="text-gray-900 text-center font-semibold ml-2">Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
