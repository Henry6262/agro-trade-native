import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Switch,
  Alert,
} from 'react-native';
import { Star, Calendar, Truck, Shield, Package } from 'lucide-react-native';
import { useOnboardingStore } from '../../../store/onboardingStore';

interface CustomOfferData {
  organicCertified: boolean;
  harvestDate?: string;
  qualityGrade: 'premium' | 'standard' | 'economy' | '';
  storageType: 'cold' | 'ambient' | 'controlled' | '';
  packaging: 'bulk' | 'bags' | 'crates' | 'custom' | '';
  customPackagingDetails?: string;
  deliveryFlexible: boolean;
  minOrderQuantity?: string;
  specialRequests: string;
  contactPreference: 'email' | 'phone' | 'both';
  urgency: 'immediate' | 'within_week' | 'within_month' | 'flexible';
}

export function CustomOfferStep() {
  const {
    selectedProducts,
    selectedProductsMetadata,
    sellerSpecifications,
    updateSellerSpecification,
    nextStep,
  } = useOnboardingStore();

  const [customData, setCustomData] = useState<CustomOfferData>({
    organicCertified: false,
    qualityGrade: '',
    storageType: '',
    packaging: '',
    deliveryFlexible: true,
    specialRequests: '',
    contactPreference: 'both',
    urgency: 'flexible',
  });

  const productId = selectedProducts[0];
  const productMetadata = selectedProductsMetadata[0];
  const currentSpecs = sellerSpecifications[productId] || {};

  // Load existing data
  useEffect(() => {
    if (currentSpecs.customOfferData) {
      setCustomData({ ...customData, ...currentSpecs.customOfferData });
    }
  }, []);

  const updateCustomData = (field: keyof CustomOfferData, value: any) => {
    const updated = { ...customData, [field]: value };
    setCustomData(updated);
    
    // Save to store
    updateSellerSpecification(productId, {
      customOfferData: updated,
    });
  };

  const handleSubmit = () => {
    // Validate required fields
    if (!customData.qualityGrade) {
      Alert.alert('Quality Grade Required', 'Please select a quality grade for your product.');
      return;
    }
    
    if (!customData.storageType) {
      Alert.alert('Storage Type Required', 'Please select your storage type.');
      return;
    }
    
    if (!customData.packaging) {
      Alert.alert('Packaging Required', 'Please select your preferred packaging method.');
      return;
    }

    // Save final data and proceed to account creation
    updateSellerSpecification(productId, {
      customOfferData: customData,
      customOfferRequested: true,
    });

    nextStep(); // Proceed to account creation
  };

  const handleSkip = () => {
    // Mark as skipped and proceed
    updateSellerSpecification(productId, {
      customOfferRequested: false,
    });
    
    nextStep(); // Proceed to account creation
  };

  const getQuantityDisplay = () => {
    const quantity = currentSpecs.quantity || '0';
    return `${quantity} tons`;
  };

  return (
    <ScrollView className="flex-1 bg-gray-900">
      <View className="p-4">
        {/* Header */}
        <View className="items-center mb-6">
          <Text className="text-3xl font-bold text-green-500 text-center mb-3">
            Custom Offer Request
          </Text>
          <Text className="text-gray-400 text-base text-center max-w-lg">
            Provide additional details to receive a personalized offer for your products
          </Text>
        </View>

        {/* Product Summary Card */}
        {productMetadata && (
          <View className="bg-gray-800 rounded-xl p-4 mb-6 border border-gray-700">
            <View className="flex-row items-center mb-3">
              {productMetadata.image ? (
                <Image 
                  source={{ uri: productMetadata.image }}
                  className="w-12 h-12 rounded-lg mr-3"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-12 h-12 rounded-lg bg-gray-700 items-center justify-center mr-3">
                  <Package size={24} color="#9CA3AF" />
                </View>
              )}
              <View className="flex-1">
                <Text className="text-white text-lg font-bold">{productMetadata.name}</Text>
                <Text className="text-gray-400">{getQuantityDisplay()}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Quality & Certification */}
        <View className="bg-gray-800 rounded-xl p-4 mb-4 border border-gray-700">
          <Text className="text-white text-lg font-semibold mb-4">Quality & Certification</Text>
          
          {/* Organic Certified */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center flex-1">
              <Shield size={20} color="#10B981" />
              <Text className="text-white ml-2">Organic Certified</Text>
            </View>
            <Switch
              value={customData.organicCertified}
              onValueChange={(value) => updateCustomData('organicCertified', value)}
              trackColor={{ false: '#374151', true: '#10B981' }}
              thumbColor={customData.organicCertified ? '#ffffff' : '#9CA3AF'}
            />
          </View>

          {/* Quality Grade */}
          <View className="mb-4">
            <Text className="text-gray-400 mb-2">Quality Grade *</Text>
            <View className="flex-row flex-wrap gap-2">
              {[
                { key: 'premium', label: 'Premium', icon: Star },
                { key: 'standard', label: 'Standard', icon: null },
                { key: 'economy', label: 'Economy', icon: null },
              ].map((grade) => (
                <TouchableOpacity
                  key={grade.key}
                  onPress={() => updateCustomData('qualityGrade', grade.key)}
                  className={`flex-row items-center px-4 py-2 rounded-lg border ${
                    customData.qualityGrade === grade.key
                      ? 'bg-green-500/20 border-green-500'
                      : 'bg-gray-700 border-gray-600'
                  }`}
                >
                  {grade.icon && <grade.icon size={16} color="#F59E0B" />}
                  <Text className={`ml-1 ${
                    customData.qualityGrade === grade.key ? 'text-green-400' : 'text-white'
                  }`}>
                    {grade.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Harvest Date */}
          <View className="mb-4">
            <Text className="text-gray-400 mb-2">Harvest Date (optional)</Text>
            <View className="flex-row items-center">
              <Calendar size={20} color="#6B7280" />
              <TextInput
                value={customData.harvestDate || ''}
                onChangeText={(value) => updateCustomData('harvestDate', value)}
                placeholder="DD/MM/YYYY"
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 ml-2 text-white"
                placeholderTextColor="#6B7280"
              />
            </View>
          </View>
        </View>

        {/* Storage & Packaging */}
        <View className="bg-gray-800 rounded-xl p-4 mb-4 border border-gray-700">
          <Text className="text-white text-lg font-semibold mb-4">Storage & Packaging</Text>
          
          {/* Storage Type */}
          <View className="mb-4">
            <Text className="text-gray-400 mb-2">Storage Type *</Text>
            <View className="flex-row flex-wrap gap-2">
              {[
                { key: 'cold', label: 'Cold Storage' },
                { key: 'ambient', label: 'Ambient' },
                { key: 'controlled', label: 'Climate Controlled' },
              ].map((storage) => (
                <TouchableOpacity
                  key={storage.key}
                  onPress={() => updateCustomData('storageType', storage.key)}
                  className={`px-4 py-2 rounded-lg border ${
                    customData.storageType === storage.key
                      ? 'bg-green-500/20 border-green-500'
                      : 'bg-gray-700 border-gray-600'
                  }`}
                >
                  <Text className={customData.storageType === storage.key ? 'text-green-400' : 'text-white'}>
                    {storage.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Packaging */}
          <View className="mb-4">
            <Text className="text-gray-400 mb-2">Preferred Packaging *</Text>
            <View className="flex-row flex-wrap gap-2">
              {[
                { key: 'bulk', label: 'Bulk' },
                { key: 'bags', label: 'Bags' },
                { key: 'crates', label: 'Crates' },
                { key: 'custom', label: 'Custom' },
              ].map((pkg) => (
                <TouchableOpacity
                  key={pkg.key}
                  onPress={() => updateCustomData('packaging', pkg.key)}
                  className={`px-4 py-2 rounded-lg border ${
                    customData.packaging === pkg.key
                      ? 'bg-green-500/20 border-green-500'
                      : 'bg-gray-700 border-gray-600'
                  }`}
                >
                  <Text className={customData.packaging === pkg.key ? 'text-green-400' : 'text-white'}>
                    {pkg.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Custom Packaging Details */}
          {customData.packaging === 'custom' && (
            <View className="mb-4">
              <Text className="text-gray-400 mb-2">Custom Packaging Details</Text>
              <TextInput
                value={customData.customPackagingDetails || ''}
                onChangeText={(value) => updateCustomData('customPackagingDetails', value)}
                placeholder="Describe your custom packaging requirements..."
                multiline
                numberOfLines={3}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                placeholderTextColor="#6B7280"
              />
            </View>
          )}
        </View>

        {/* Delivery & Timing */}
        <View className="bg-gray-800 rounded-xl p-4 mb-4 border border-gray-700">
          <Text className="text-white text-lg font-semibold mb-4">Delivery & Timing</Text>
          
          {/* Delivery Flexible */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center flex-1">
              <Truck size={20} color="#10B981" />
              <Text className="text-white ml-2">Flexible Delivery Schedule</Text>
            </View>
            <Switch
              value={customData.deliveryFlexible}
              onValueChange={(value) => updateCustomData('deliveryFlexible', value)}
              trackColor={{ false: '#374151', true: '#10B981' }}
              thumbColor={customData.deliveryFlexible ? '#ffffff' : '#9CA3AF'}
            />
          </View>

          {/* Urgency */}
          <View className="mb-4">
            <Text className="text-gray-400 mb-2">Timeline</Text>
            <View className="flex-row flex-wrap gap-2">
              {[
                { key: 'immediate', label: 'Immediate' },
                { key: 'within_week', label: 'Within Week' },
                { key: 'within_month', label: 'Within Month' },
                { key: 'flexible', label: 'Flexible' },
              ].map((timing) => (
                <TouchableOpacity
                  key={timing.key}
                  onPress={() => updateCustomData('urgency', timing.key)}
                  className={`px-4 py-2 rounded-lg border ${
                    customData.urgency === timing.key
                      ? 'bg-green-500/20 border-green-500'
                      : 'bg-gray-700 border-gray-600'
                  }`}
                >
                  <Text className={customData.urgency === timing.key ? 'text-green-400' : 'text-white'}>
                    {timing.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Minimum Order Quantity */}
          <View className="mb-4">
            <Text className="text-gray-400 mb-2">Minimum Order Quantity (optional)</Text>
            <TextInput
              value={customData.minOrderQuantity || ''}
              onChangeText={(value) => updateCustomData('minOrderQuantity', value)}
              placeholder="e.g., 50 tons"
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              placeholderTextColor="#6B7280"
            />
          </View>
        </View>

        {/* Special Requests */}
        <View className="bg-gray-800 rounded-xl p-4 mb-6 border border-gray-700">
          <Text className="text-white text-lg font-semibold mb-4">Additional Information</Text>
          
          {/* Special Requests */}
          <View className="mb-4">
            <Text className="text-gray-400 mb-2">Special Requests or Notes</Text>
            <TextInput
              value={customData.specialRequests}
              onChangeText={(value) => updateCustomData('specialRequests', value)}
              placeholder="Any specific requirements, certifications, or notes for buyers..."
              multiline
              numberOfLines={4}
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-3 text-white"
              placeholderTextColor="#6B7280"
            />
          </View>

          {/* Contact Preference */}
          <View className="mb-4">
            <Text className="text-gray-400 mb-2">Preferred Contact Method</Text>
            <View className="flex-row gap-2">
              {[
                { key: 'email', label: 'Email' },
                { key: 'phone', label: 'Phone' },
                { key: 'both', label: 'Both' },
              ].map((method) => (
                <TouchableOpacity
                  key={method.key}
                  onPress={() => updateCustomData('contactPreference', method.key)}
                  className={`flex-1 px-4 py-2 rounded-lg border ${
                    customData.contactPreference === method.key
                      ? 'bg-green-500/20 border-green-500'
                      : 'bg-gray-700 border-gray-600'
                  }`}
                >
                  <Text className={`text-center ${customData.contactPreference === method.key ? 'text-green-400' : 'text-white'}`}>
                    {method.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-4 mb-6">
          <TouchableOpacity
            onPress={handleSkip}
            className="flex-1 bg-gray-700 py-4 px-6 rounded-xl border border-gray-600"
          >
            <Text className="text-white font-bold text-center">Skip for Now</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSubmit}
            className="flex-1 bg-green-500 py-4 px-6 rounded-xl"
          >
            <Text className="text-white font-bold text-center">Request Custom Offer</Text>
          </TouchableOpacity>
        </View>

        {/* Info Note */}
        <View className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
          <Text className="text-blue-400 text-sm text-center">
            Custom offers are typically prepared within 24-48 hours and sent via your preferred contact method.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}