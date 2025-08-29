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
import * as Location from 'expo-location';
import axios from 'axios';
import { API_URL } from '../../../config/api';
import { useOnboardingStore } from '../../../store/onboardingStore';
import { Input } from '../../common';

interface ProductSpec {
  productId: string;
  productName: string;
  quantity: string;
  unit: string;
  priceRange?: {
    min: number;
    max: number;
    currency: string;
  };
}

export function DetailsWithLocation() {
  const {
    selectedProducts,
    selectedProductsMetadata,
    userLocation,
    updateLocation,
    sellerSpecifications,
    updateSellerSpecification,
    nextStep,
    previousStep,
  } = useOnboardingStore();

  const [specifications, setSpecifications] = useState<ProductSpec[]>([]);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);
  const [cityName, setCityName] = useState<string>('');
  const [manualCityInput, setManualCityInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Debug log to check what we're getting from store
    console.log('DetailsWithLocation - selectedProducts:', selectedProducts);
    console.log('DetailsWithLocation - metadata:', selectedProductsMetadata);
    
    // Initialize specifications from store
    if (selectedProducts && selectedProducts.length > 0) {
      const specs = selectedProducts.map(productId => {
        const metadata = selectedProductsMetadata.find(m => m.category === productId);
        const existing = sellerSpecifications[productId];
        
        return {
          productId,
          productName: metadata?.name || productId || 'Unknown Product',
          quantity: existing?.quantity || '',
          unit: existing?.unit || 'tons',
          priceRange: existing?.priceRange || null,
        };
      });
      
      setSpecifications(specs);
    }
    
    // Check if location already exists
    if (userLocation?.city) {
      setCityName(userLocation.city);
      setLocationDetected(true);
      // Delay to ensure state is set
      setTimeout(() => fetchPricesForLocation(), 100);
    }
  }, [selectedProducts, selectedProductsMetadata]);

  const detectLocation = async () => {
    setDetectingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setShowManualInput(true);
        Alert.alert('Permission Denied', 'Please enter your city manually');
        setDetectingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      
      // Get city name from coordinates
      const response = await axios.post(`${API_URL}/location/reverse-geocode`, {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      setCityName(response.data.city || 'Unknown');
      setLocationDetected(true);
      setShowManualInput(false);
      
      updateLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        city: response.data.city,
        country: response.data.country,
      });
      
      // Fetch prices after location is detected
      await fetchPricesForLocation(location.coords.latitude, location.coords.longitude);
    } catch (error) {
      console.error('Location detection error:', error);
      setShowManualInput(true);
      Alert.alert('Location Error', 'Could not detect location. Please enter manually.');
    } finally {
      setDetectingLocation(false);
    }
  };

  const searchCityManually = async () => {
    if (!manualCityInput.trim()) return;
    
    setDetectingLocation(true);
    try {
      const searchResponse = await axios.get(`${API_URL}/location/cities/search`, {
        params: { q: manualCityInput },
      });
      
      if (searchResponse.data.length > 0) {
        const city = searchResponse.data[0];
        setCityName(city.name);
        setLocationDetected(true);
        setShowManualInput(false);
        
        updateLocation({
          latitude: city.latitude,
          longitude: city.longitude,
          city: city.name,
          country: city.country,
        });
        
        await fetchPricesForLocation(city.latitude, city.longitude);
      } else {
        Alert.alert('Not Found', 'City not found. Please try another name.');
      }
    } catch (error) {
      console.error('City search error:', error);
      Alert.alert('Error', 'Failed to search for city');
    } finally {
      setDetectingLocation(false);
    }
  };

  const fetchPricesForLocation = async (lat?: number, lng?: number) => {
    const latitude = lat || userLocation?.latitude;
    const longitude = lng || userLocation?.longitude;
    
    if (!latitude || !longitude) return;
    
    setLoadingPrices(true);
    try {
      const response = await axios.post(`${API_URL}/location/pricing`, {
        latitude,
        longitude,
        productIds: selectedProducts,
      });
      
      // Update specifications with price ranges
      const pricesArray = response.data.prices || response.data || [];
      const pricesByProductId: Record<string, any> = {};
      
      pricesArray.forEach((price: any) => {
        const id = price.productId || price.category;
        const name = price.productName || price.name;
        
        const priceData = {
          min: parseFloat(price.minPrice),
          max: parseFloat(price.maxPrice),
          currency: price.currency || 'EUR',
        };
        
        if (id) pricesByProductId[id] = priceData;
        if (name) {
          const categoryKey = name.toUpperCase().replace(/[\s_-]/g, '_');
          pricesByProductId[categoryKey] = priceData;
        }
      });
      
      setSpecifications(prevSpecs => 
        prevSpecs.map(spec => ({
          ...spec,
          priceRange: pricesByProductId[spec.productId] || 
                      pricesByProductId[spec.productId.toUpperCase()] ||
                      null,
        }))
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
          return { ...spec, [field]: value };
        }
        return spec;
      });
      return updated;
    });
    
    // Update store
    updateSellerSpecification(productId, { [field]: value });
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

  const formatPrice = (priceRange?: { min: number; max: number; currency: string }) => {
    if (!priceRange) return 'Price pending...';
    const symbol = priceRange.currency === 'EUR' ? '€' : priceRange.currency === 'BGN' ? 'лв' : '';
    return `${symbol}${priceRange.min.toFixed(0)} - ${symbol}${priceRange.max.toFixed(0)}/ton`;
  };

  const canProceed = () => {
    return locationDetected && specifications.every(spec => 
      spec.quantity && parseFloat(spec.quantity) > 0
    );
  };

  const handleNext = () => {
    if (!canProceed()) {
      if (!locationDetected) {
        Alert.alert('Location Required', 'Please detect or enter your location');
      } else {
        Alert.alert('Missing Information', 'Please enter quantities for all products');
      }
      return;
    }
    
    // Save all specifications to store
    specifications.forEach(spec => {
      updateSellerSpecification(spec.productId, spec);
    });
    
    nextStep();
  };

  // Show error if no products selected
  if (!selectedProducts || selectedProducts.length === 0) {
    return (
      <View className="flex-1 bg-gray-50 p-4 justify-center items-center">
        <Text className="text-xl font-semibold text-gray-900 mb-2">No Products Selected</Text>
        <Text className="text-gray-600 text-center mb-4">
          Please go back and select products to continue
        </Text>
        <TouchableOpacity
          onPress={previousStep}
          className="px-6 py-3 bg-emerald-500 rounded-lg"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Product Details & Pricing
          </Text>
          <Text className="text-gray-600">
            Add quantities and get location-based pricing
          </Text>
          {selectedProducts && selectedProducts.length > 0 && (
            <Text className="text-sm text-emerald-600 mt-1">
              {selectedProducts.length} product{selectedProducts.length > 1 ? 's' : ''} selected
            </Text>
          )}
        </View>

        {/* Location Section */}
        <View className="bg-white rounded-xl p-4 mb-6 shadow-sm">
          <View className="flex-row items-center mb-4">
            <Ionicons name="location" size={24} color="#10B981" />
            <Text className="text-lg font-bold ml-2">Your Location</Text>
            <Text className="text-red-500 ml-1">*</Text>
          </View>
          
          {!locationDetected && !showManualInput && (
            <TouchableOpacity
              onPress={detectLocation}
              disabled={detectingLocation}
              className="bg-emerald-500 py-3 px-4 rounded-lg flex-row justify-center items-center"
            >
              {detectingLocation ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="navigate" size={20} color="white" />
                  <Text className="text-white font-semibold ml-2">
                    Detect My Location
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
          
          {showManualInput && !locationDetected && (
            <View>
              <Input
                placeholder="Enter your city name"
                value={manualCityInput}
                onChangeText={setManualCityInput}
                className="mb-3"
              />
              <View className="flex-row space-x-2">
                <TouchableOpacity
                  onPress={searchCityManually}
                  disabled={detectingLocation}
                  className="flex-1 bg-emerald-500 py-3 rounded-lg"
                >
                  {detectingLocation ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white text-center font-semibold">
                      Search City
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={detectLocation}
                  className="px-4 py-3 bg-gray-200 rounded-lg"
                >
                  <Ionicons name="navigate" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {locationDetected && (
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                <Text className="ml-2 text-gray-700">
                  <Text className="font-semibold">{cityName}</Text>
                  {userLocation?.country && `, ${userLocation.country}`}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setLocationDetected(false);
                  setShowManualInput(true);
                  setCityName('');
                }}
                className="p-2"
              >
                <Text className="text-emerald-600 text-sm">Change</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {loadingPrices && (
          <View className="bg-blue-50 p-3 rounded-lg mb-4 flex-row items-center">
            <ActivityIndicator size="small" color="#3B82F6" />
            <Text className="ml-2 text-blue-700">Loading regional prices...</Text>
          </View>
        )}

        {/* Product Details */}
        <View className="mb-4">
          <Text className="text-lg font-bold mb-2">Product Specifications</Text>
        </View>

        {specifications.map((spec, index) => {
          const isExpanded = expandedCards.has(spec.productId);
          
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
                      {locationDetected && spec.priceRange && (
                        <Text className="text-sm text-emerald-600 mt-1">
                          Market Price: {formatPrice(spec.priceRange)}
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
                        Quantity (tons) *
                      </Text>
                      <TextInput
                        value={spec.quantity}
                        onChangeText={(value) => updateSpecification(spec.productId, 'quantity', value)}
                        placeholder="Enter quantity"
                        keyboardType="numeric"
                        className="border border-gray-300 rounded-lg px-3 py-2 text-base"
                      />
                    </View>
                    
                    {/* Price Display */}
                    {spec.priceRange && spec.quantity && parseFloat(spec.quantity) > 0 && (
                      <View className="bg-emerald-50 p-3 rounded-lg">
                        <Text className="text-sm font-medium text-emerald-900 mb-1">
                          Estimated Value
                        </Text>
                        <Text className="text-lg font-bold text-emerald-600">
                          {(() => {
                            const qty = parseFloat(spec.quantity);
                            const symbol = spec.priceRange.currency === 'EUR' ? '€' : 'лв';
                            const min = (spec.priceRange.min * qty).toFixed(0);
                            const max = (spec.priceRange.max * qty).toFixed(0);
                            return `${symbol}${min} - ${symbol}${max}`;
                          })()}
                        </Text>
                        <Text className="text-xs text-emerald-700 mt-1">
                          Based on {spec.quantity} tons at market price
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>

              {/* Quick Summary (when collapsed) */}
              {!isExpanded && spec.quantity && (
                <View className="mt-2 px-4">
                  <Text className="text-sm text-gray-600">
                    {spec.quantity} tons
                    {spec.priceRange && parseFloat(spec.quantity) > 0 && (
                      <Text className="text-emerald-600 font-semibold">
                        {' • '}
                        {(() => {
                          const qty = parseFloat(spec.quantity);
                          const symbol = spec.priceRange.currency === 'EUR' ? '€' : 'лв';
                          const total = (spec.priceRange.min * qty + spec.priceRange.max * qty) / 2;
                          return `~${symbol}${total.toFixed(0)}`;
                        })()}
                      </Text>
                    )}
                  </Text>
                </View>
              )}
            </View>
          );
        })}

        {/* Total Value Summary */}
        {specifications.some(s => s.priceRange && s.quantity && parseFloat(s.quantity) > 0) && (
          <View className="bg-gray-900 rounded-lg p-4 mt-4">
            <Text className="text-white font-semibold mb-2">Total Estimated Value</Text>
            <Text className="text-2xl font-bold text-emerald-400">
              {(() => {
                const totals = specifications.reduce((acc, spec) => {
                  if (spec.priceRange && spec.quantity && parseFloat(spec.quantity) > 0) {
                    const qty = parseFloat(spec.quantity);
                    acc.min += spec.priceRange.min * qty;
                    acc.max += spec.priceRange.max * qty;
                    acc.currency = spec.priceRange.currency;
                  }
                  return acc;
                }, { min: 0, max: 0, currency: 'EUR' });
                
                const symbol = totals.currency === 'EUR' ? '€' : 'лв';
                return `${symbol}${totals.min.toFixed(0)} - ${symbol}${totals.max.toFixed(0)}`;
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