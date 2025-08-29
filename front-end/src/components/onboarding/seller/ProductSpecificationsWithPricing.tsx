import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useOnboardingStore } from '../../../store/onboardingStore';
import axios from 'axios';
import { API_URL } from '../../../config/api';

interface ProductSpec {
  productId: string;
  productName: string;
  quantity: string;
  unit: string;
  deliveryOption: string;
  notes: string;
  priceRange?: {
    min: number;
    max: number;
    currency: string;
  };
  estimatedValue?: {
    min: number;
    max: number;
    currency: string;
  };
}

export function ProductSpecificationsWithPricing() {
  const {
    selectedProducts,
    selectedProductsMetadata,
    userLocation,
    nextStep,
    previousStep,
    updateSellerSpecification,
    sellerSpecifications,
  } = useOnboardingStore();

  const [specifications, setSpecifications] = useState<ProductSpec[]>([]);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Initialize specifications
    const specs = selectedProducts.map(productId => {
      const metadata = selectedProductsMetadata.find(m => m.category === productId);
      const existing = sellerSpecifications[productId];
      
      return {
        productId,
        productName: metadata?.name || 'Unknown Product',
        quantity: existing?.quantity || '',
        unit: 'tons',
        deliveryOption: existing?.deliveryOption || 'EXW',
        notes: existing?.notes || '',
      };
    });
    
    setSpecifications(specs);
    
    // Fetch prices if location is available
    if (userLocation?.latitude && userLocation?.longitude) {
      fetchPricesForProducts();
    }
  }, [selectedProducts, userLocation]);

  const fetchPricesForProducts = async () => {
    if (!userLocation?.latitude || !userLocation?.longitude) return;
    
    setLoadingPrices(true);
    try {
      const response = await axios.post(`${API_URL}/location/pricing`, {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        productIds: selectedProducts,
      });
      
      // Update specifications with price ranges
      setSpecifications(prevSpecs => 
        prevSpecs.map(spec => {
          const priceData = response.data.prices?.find(
            (p: any) => p.productId === spec.productId
          ) || response.data.find(
            (p: any) => p.productId === spec.productId
          );
          
          if (priceData) {
            const priceRange = {
              min: parseFloat(priceData.minPrice),
              max: parseFloat(priceData.maxPrice),
              currency: priceData.currency || 'EUR',
            };
            
            // Calculate estimated value based on quantity
            let estimatedValue;
            if (spec.quantity && !isNaN(parseFloat(spec.quantity))) {
              const qty = parseFloat(spec.quantity);
              estimatedValue = {
                min: priceRange.min * qty,
                max: priceRange.max * qty,
                currency: priceRange.currency,
              };
            }
            
            return {
              ...spec,
              priceRange,
              estimatedValue,
            };
          }
          return spec;
        })
      );
    } catch (error) {
      console.error('Error fetching prices:', error);
    } finally {
      setLoadingPrices(false);
    }
  };

  const updateSpecification = (productId: string, field: string, value: string) => {
    setSpecifications(prevSpecs => {
      const updated = prevSpecs.map(spec => {
        if (spec.productId === productId) {
          const updatedSpec = { ...spec, [field]: value };
          
          // Recalculate estimated value if quantity changes
          if (field === 'quantity' && updatedSpec.priceRange) {
            const qty = parseFloat(value);
            if (!isNaN(qty) && qty > 0) {
              updatedSpec.estimatedValue = {
                min: updatedSpec.priceRange.min * qty,
                max: updatedSpec.priceRange.max * qty,
                currency: updatedSpec.priceRange.currency,
              };
            } else {
              updatedSpec.estimatedValue = undefined;
            }
          }
          
          // Update store
          updateSellerSpecification(productId, updatedSpec);
          
          return updatedSpec;
        }
        return spec;
      });
      return updated;
    });
  };

  const toggleCard = (productId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedCards(newExpanded);
  };

  const formatPrice = (value: number, currency: string) => {
    const symbol = currency === 'EUR' ? '€' : currency === 'BGN' ? 'лв' : '';
    return `${symbol}${value.toFixed(0)}`;
  };

  const canProceed = () => {
    return specifications.every(spec => 
      spec.quantity && parseFloat(spec.quantity) > 0
    );
  };

  const handleNext = () => {
    if (!canProceed()) {
      Alert.alert('Missing Information', 'Please enter quantities for all products');
      return;
    }
    nextStep();
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Product Details & Pricing
          </Text>
          <Text className="text-gray-600">
            Add quantities and see estimated values based on your location
          </Text>
          
          {userLocation?.city && (
            <View className="mt-2 flex-row items-center">
              <Ionicons name="location" size={16} color="#10B981" />
              <Text className="text-sm text-emerald-600 ml-1">
                Prices for {userLocation.city}, {userLocation.country}
              </Text>
            </View>
          )}
        </View>

        {loadingPrices && (
          <View className="bg-blue-50 p-3 rounded-lg mb-4 flex-row items-center">
            <ActivityIndicator size="small" color="#3B82F6" />
            <Text className="ml-2 text-blue-700">Loading regional prices...</Text>
          </View>
        )}

        {/* Product Cards */}
        {specifications.map((spec, index) => {
          const isExpanded = expandedCards.has(spec.productId);
          const metadata = selectedProductsMetadata.find(m => m.category === spec.productId);
          
          return (
            <View key={spec.productId} className="mb-4">
              <TouchableOpacity
                onPress={() => toggleCard(spec.productId)}
                className="bg-white rounded-lg shadow-sm overflow-hidden"
              >
                {/* Card Header */}
                <View className="p-4 border-b border-gray-200">
                  <View className="flex-row justify-between items-center">
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-gray-900">
                        {spec.productName}
                      </Text>
                      {spec.priceRange && (
                        <Text className="text-sm text-gray-600 mt-1">
                          Market Price: {formatPrice(spec.priceRange.min, spec.priceRange.currency)} - {formatPrice(spec.priceRange.max, spec.priceRange.currency)}/ton
                        </Text>
                      )}
                    </View>
                    <Ionicons 
                      name={isExpanded ? "chevron-up" : "chevron-down"} 
                      size={24} 
                      color="#6B7280" 
                    />
                  </View>
                </View>

                {/* Card Content (Expanded) */}
                {isExpanded && (
                  <View className="p-4 space-y-4">
                    {/* Quantity Input */}
                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2">
                        Quantity (tons)
                      </Text>
                      <TextInput
                        value={spec.quantity}
                        onChangeText={(value) => updateSpecification(spec.productId, 'quantity', value)}
                        placeholder="Enter quantity"
                        keyboardType="numeric"
                        className="border border-gray-300 rounded-lg px-3 py-2 text-base"
                      />
                    </View>

                    {/* Estimated Value */}
                    {spec.estimatedValue && (
                      <View className="bg-emerald-50 p-3 rounded-lg">
                        <Text className="text-sm font-medium text-emerald-900 mb-1">
                          Estimated Value
                        </Text>
                        <Text className="text-lg font-bold text-emerald-600">
                          {formatPrice(spec.estimatedValue.min, spec.estimatedValue.currency)} - {formatPrice(spec.estimatedValue.max, spec.estimatedValue.currency)}
                        </Text>
                        <Text className="text-xs text-emerald-700 mt-1">
                          Based on {spec.quantity} tons at current market prices
                        </Text>
                      </View>
                    )}

                    {/* Delivery Options */}
                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2">
                        Delivery Terms
                      </Text>
                      <View className="flex-row flex-wrap">
                        {['EXW', 'FOB', 'CIF', 'DAP'].map(option => (
                          <TouchableOpacity
                            key={option}
                            onPress={() => updateSpecification(spec.productId, 'deliveryOption', option)}
                            className={`mr-2 mb-2 px-4 py-2 rounded-full ${
                              spec.deliveryOption === option
                                ? 'bg-emerald-500'
                                : 'bg-gray-200'
                            }`}
                          >
                            <Text className={`text-sm font-medium ${
                              spec.deliveryOption === option
                                ? 'text-white'
                                : 'text-gray-700'
                            }`}>
                              {option}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Notes */}
                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2">
                        Additional Notes (Optional)
                      </Text>
                      <TextInput
                        value={spec.notes}
                        onChangeText={(value) => updateSpecification(spec.productId, 'notes', value)}
                        placeholder="Quality specs, harvest date, etc."
                        multiline
                        numberOfLines={3}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-base"
                      />
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              {/* Quick Summary (when collapsed) */}
              {!isExpanded && spec.quantity && (
                <View className="mt-2 px-4">
                  <Text className="text-sm text-gray-600">
                    {spec.quantity} tons • {spec.deliveryOption}
                    {spec.estimatedValue && (
                      <Text className="text-emerald-600 font-semibold">
                        {' • '}{formatPrice(spec.estimatedValue.min, spec.estimatedValue.currency)} - {formatPrice(spec.estimatedValue.max, spec.estimatedValue.currency)}
                      </Text>
                    )}
                  </Text>
                </View>
              )}
            </View>
          );
        })}

        {/* Total Estimated Value */}
        {specifications.some(s => s.estimatedValue) && (
          <View className="bg-gray-900 rounded-lg p-4 mt-4">
            <Text className="text-white font-semibold mb-2">Total Estimated Value</Text>
            <Text className="text-2xl font-bold text-emerald-400">
              {(() => {
                const totals = specifications.reduce((acc, spec) => {
                  if (spec.estimatedValue) {
                    acc.min += spec.estimatedValue.min;
                    acc.max += spec.estimatedValue.max;
                    acc.currency = spec.estimatedValue.currency;
                  }
                  return acc;
                }, { min: 0, max: 0, currency: 'EUR' });
                
                return `${formatPrice(totals.min, totals.currency)} - ${formatPrice(totals.max, totals.currency)}`;
              })()}
            </Text>
          </View>
        )}

        {/* Navigation Buttons */}
        <View className="flex-row justify-between mt-8 mb-4">
          <TouchableOpacity
            onPress={previousStep}
            className="px-6 py-3 bg-gray-200 rounded-lg"
          >
            <Text className="text-gray-700 font-semibold">Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleNext}
            disabled={!canProceed()}
            className={`px-6 py-3 rounded-lg ${
              canProceed() ? 'bg-emerald-500' : 'bg-gray-300'
            }`}
          >
            <Text className="text-white font-semibold">Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}