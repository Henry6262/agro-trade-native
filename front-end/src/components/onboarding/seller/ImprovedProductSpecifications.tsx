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

export function ImprovedProductSpecifications() {
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
    
    // Auto-expand first card
    if (specs.length > 0) {
      setExpandedCards(new Set([specs[0].productId]));
    }
    
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
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const formatPrice = (value: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const canProceed = () => {
    return specifications.every(spec => spec.quantity && spec.quantity.toString().trim() !== '');
  };

  const handleNext = () => {
    if (!canProceed()) {
      Alert.alert('Missing Information', 'Please enter quantities for all products');
      return;
    }
    nextStep();
  };

  return (
    <View className="flex-1 bg-gray-900">
      {/* Header */}
      <View className="px-6 pt-6 pb-4">
        <Text className="text-3xl font-bold text-white mb-2">
          Product Details
        </Text>
        <Text className="text-gray-400">
          Specify quantities and delivery terms for your products
        </Text>
        
        {userLocation?.city && (
          <View className="mt-3 flex-row items-center bg-emerald-900/20 px-3 py-2 rounded-lg self-start">
            <Ionicons name="location" size={14} color="#10B981" />
            <Text className="text-xs text-emerald-400 ml-1">
              Prices for {userLocation.city}, {userLocation.country}
            </Text>
          </View>
        )}
      </View>

      {loadingPrices && (
        <View className="mx-6 mb-4 bg-blue-900/20 p-3 rounded-lg flex-row items-center">
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text className="ml-2 text-blue-400 text-sm">Loading regional prices...</Text>
        </View>
      )}

      {/* Product Cards */}
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View className="px-6">
          {specifications.map((spec, index) => {
            const isExpanded = expandedCards.has(spec.productId);
            const isComplete = spec.quantity && spec.quantity.toString().trim() !== '';
            
            return (
              <View key={spec.productId} className="mb-4">
                <TouchableOpacity
                  onPress={() => toggleCard(spec.productId)}
                  className={`bg-gray-800 rounded-xl overflow-hidden border ${
                    isComplete ? 'border-emerald-800' : 'border-gray-700'
                  }`}
                  activeOpacity={0.7}
                >
                  {/* Card Header */}
                  <View className="px-4 py-3 flex-row justify-between items-center">
                    <View className="flex-1 mr-3">
                      <View className="flex-row items-center">
                        <Text className="text-lg font-semibold text-white">
                          {spec.productName}
                        </Text>
                        {isComplete && (
                          <View className="ml-2 bg-emerald-500 rounded-full px-2 py-0.5">
                            <Text className="text-xs text-white font-medium">
                              {spec.quantity} tons
                            </Text>
                          </View>
                        )}
                      </View>
                      {spec.priceRange && (
                        <Text className="text-xs text-gray-400 mt-1">
                          €{spec.priceRange.min}-{spec.priceRange.max}/ton
                        </Text>
                      )}
                    </View>
                    <View className={`rounded-full p-1.5 ${
                      isExpanded ? 'bg-emerald-900/30' : 'bg-gray-700'
                    }`}>
                      <Ionicons 
                        name={isExpanded ? "chevron-up" : "chevron-down"} 
                        size={18} 
                        color={isExpanded ? "#10B981" : "#9CA3AF"}
                      />
                    </View>
                  </View>

                  {/* Card Content (Expanded) */}
                  {isExpanded && (
                    <View className="px-4 pb-4 pt-2 border-t border-gray-700">
                      {/* Quantity Input */}
                      <View className="mb-4">
                        <Text className="text-sm font-medium text-gray-300 mb-2">
                          Quantity (tons)
                        </Text>
                        <TextInput
                          value={spec.quantity}
                          onChangeText={(value) => updateSpecification(spec.productId, 'quantity', value)}
                          placeholder="Enter quantity"
                          placeholderTextColor="#4B5563"
                          keyboardType="numeric"
                          className="bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white"
                        />
                      </View>

                      {/* Estimated Value */}
                      {spec.estimatedValue && (
                        <View className="bg-gradient-to-r from-emerald-900/20 to-emerald-800/10 border border-emerald-800/30 p-3 rounded-lg mb-4">
                          <View className="flex-row justify-between items-center">
                            <Text className="text-xs font-medium text-emerald-400">
                              Estimated Value
                            </Text>
                            <Text className="text-lg font-bold text-emerald-300">
                              {formatPrice(spec.estimatedValue.min, spec.estimatedValue.currency)}
                            </Text>
                          </View>
                          <Text className="text-xs text-emerald-500/80 mt-1">
                            Based on current market prices
                          </Text>
                        </View>
                      )}

                      {/* Delivery Options */}
                      <View className="mb-4">
                        <Text className="text-sm font-medium text-gray-300 mb-2">
                          Delivery Terms
                        </Text>
                        <View className="flex-row flex-wrap">
                          {['EXW', 'FOB', 'CIF', 'DAP'].map(option => (
                            <TouchableOpacity
                              key={option}
                              onPress={() => updateSpecification(spec.productId, 'deliveryOption', option)}
                              className={`mr-2 mb-2 px-4 py-2 rounded-full border ${
                                spec.deliveryOption === option
                                  ? 'bg-emerald-500 border-emerald-500'
                                  : 'bg-gray-700/50 border-gray-600'
                              }`}
                            >
                              <Text className={`text-sm font-medium ${
                                spec.deliveryOption === option
                                  ? 'text-white'
                                  : 'text-gray-400'
                              }`}>
                                {option}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>

                      {/* Notes */}
                      <View>
                        <Text className="text-sm font-medium text-gray-300 mb-2">
                          Additional Notes
                        </Text>
                        <TextInput
                          value={spec.notes}
                          onChangeText={(value) => updateSpecification(spec.productId, 'notes', value)}
                          placeholder="Quality specs, harvest date, etc."
                          placeholderTextColor="#4B5563"
                          multiline
                          numberOfLines={2}
                          className="bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white text-sm"
                        />
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}