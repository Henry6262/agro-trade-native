import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Package, ChevronDown, ChevronUp, MapPin } from 'lucide-react-native';
import * as Location from 'expo-location';
import axios from 'axios';
import { API_URL } from '../../../config/api';
import { useOnboardingStore } from '../../../store/onboardingStore';
import { Input } from '../../common';
import { OnboardingLayout } from '../shared/OnboardingLayout';
import { ResponsiveGrid } from '../shared/ResponsiveGrid';

interface ProductSpecification {
  productId: string;
  quantity: string;
  unit: string;
  pricePerKilo: string;
}

export function ProductSpecificationsWithLocation() {
  const { width } = Dimensions.get('window');
  const isLargeScreen = width >= 768;
  
  const { 
    selectedProducts, 
    selectedProductsMetadata, 
    userLocation,
    updateLocation,
    updateSellerSpecification,
    sellerSpecifications,
  } = useOnboardingStore();
  
  const [specifications, setSpecifications] = useState<ProductSpecification[]>([]);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);
  const [cityName, setCityName] = useState<string>('');
  const [manualCityInput, setManualCityInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [prices, setPrices] = useState<Record<string, any>>({});

  useEffect(() => {
    console.log('[ProductSpecificationsWithLocation] Mounted with:', {
      selectedProducts,
      selectedProductsMetadata,
    });
    
    // Initialize specifications from selected products
    if (selectedProducts && selectedProducts.length > 0) {
      const specs = selectedProducts.map(productId => ({
        productId,
        quantity: sellerSpecifications[productId]?.quantity || '',
        unit: sellerSpecifications[productId]?.unit || 'tons',
        pricePerKilo: sellerSpecifications[productId]?.pricePerKilo || '',
      }));
      setSpecifications(specs);
    } else {
      console.log('[ProductSpecificationsWithLocation] No products selected!');
    }
    
    // Check if location already exists
    if (userLocation?.city) {
      setCityName(userLocation.city);
      setLocationDetected(true);
      fetchPrices();
    }
  }, [selectedProducts]);

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
      
      await fetchPrices(location.coords.latitude, location.coords.longitude);
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
        
        await fetchPrices(city.latitude, city.longitude);
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

  const fetchPrices = async (lat?: number, lng?: number) => {
    const latitude = lat || userLocation?.latitude;
    const longitude = lng || userLocation?.longitude;
    
    if (!latitude || !longitude) return;
    
    setLoadingPrices(true);
    console.log('[fetchPrices] Fetching prices for:', {
      latitude,
      longitude,
      productIds: selectedProducts,
    });
    
    try {
      const response = await axios.post(`${API_URL}/location/pricing`, {
        latitude,
        longitude,
        // Don't send productIds if empty - let backend return all prices
      });
      
      console.log('[fetchPrices] Response:', response.data);
      
      // Create price map
      const priceMap: Record<string, any> = {};
      const pricesArray = Array.isArray(response.data) ? response.data : response.data.prices || [];
      
      pricesArray.forEach((price: any) => {
        // Map by productName in uppercase
        const name = price.productName?.toUpperCase().replace(/[\s_-]/g, '_');
        if (name) {
          priceMap[name] = {
            min: parseFloat(price.minPrice),
            max: parseFloat(price.maxPrice),
            currency: price.currency || 'EUR',
          };
        }
      });
      
      // Also map common categories
      if (priceMap['WHEAT']) priceMap['WHEAT'] = priceMap['WHEAT'];
      if (priceMap['CORN']) priceMap['CORN'] = priceMap['CORN'];
      if (priceMap['SUNFLOWER']) priceMap['SUNFLOWER'] = priceMap['SUNFLOWER'];
      
      setPrices(priceMap);
      console.log('[fetchPrices] Price map:', priceMap);
    } catch (error) {
      console.error('Error fetching prices:', error);
    } finally {
      setLoadingPrices(false);
    }
  };

  const updateSpecification = (productId: string, field: string, value: any) => {
    const updatedSpecs = specifications.map((spec) => {
      if (spec.productId === productId) {
        const updates = { ...spec, [field]: value };
        if (field === 'quantity') {
          updates.unit = 'tons';
        }
        // Also update priceRange if available
        const priceRange = prices[productId] || prices[productId.toUpperCase().replace(/[\s_-]/g, '_')];
        if (priceRange) {
          updates.priceRange = priceRange;
        }
        return updates;
      }
      return spec;
    });
    setSpecifications(updatedSpecs);
    
    // Update store with full spec including priceRange
    const spec = updatedSpecs.find(s => s.productId === productId);
    if (spec) {
      updateSellerSpecification(productId, spec);
    }
  };

  const toggleCardExpansion = (productId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedCards(newExpanded);
  };


  // Show error if no products
  if (!selectedProducts || selectedProducts.length === 0) {
    return (
      <View className="flex-1 bg-gray-900 justify-center items-center p-4">
        <Text className="text-xl font-semibold text-white mb-2">No Products Selected</Text>
        <Text className="text-gray-400 text-center">
          Please go back and select products first
        </Text>
      </View>
    );
  }

  // Format currency with K, M suffixes
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `€${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `€${(value / 1000).toFixed(1)}K`
    }
    return `€${value.toFixed(0)}`
  }

  const renderSpecificationCard = (productId: string, index: number) => {
    const product = selectedProductsMetadata.find((p) => p.category === productId);
    const spec = specifications.find((s) => s.productId === productId);
    if (!spec) return null;

    const priceRange = prices[productId] || prices[productId.toUpperCase().replace(/[\s_-]/g, '_')];
    const quantity = parseFloat(spec.quantity) || 0;
    const estimatedValue = quantity && priceRange ? 
      quantity * ((priceRange.min + priceRange.max) / 2) : 0;

    return (
      <View key={productId} className="mb-4">
        <View className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <View className="flex-row">
            {/* Product Image - Responsive sizing */}
            <View style={{ width: width < 400 ? 60 : 80, height: width < 400 ? 60 : 80, flexShrink: 0 }}>
              {product?.image ? (
                <Image 
                  source={{ uri: product.image }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-full bg-gray-700 items-center justify-center">
                  <Package size={isLargeScreen ? 40 : 24} color="#9CA3AF" />
                </View>
              )}
            </View>

            {/* Product Details - Right side */}
            <View className="flex-1 p-4">
              {/* Product Name */}
              <Text className="text-white font-bold text-lg mb-2">
                {product?.name || productId}
              </Text>

              {/* Quantity Input */}
              <View className="flex-row items-center mb-3">
                <View className="flex-1 mr-3">
                  <Text className="text-gray-400 text-xs mb-1">Quantity (tons)</Text>
                  <TextInput
                    value={spec.quantity}
                    onChangeText={(value) => updateSpecification(productId, 'quantity', value)}
                    placeholder="Enter quantity"
                    keyboardType="numeric"
                    placeholderTextColor="#6B7280"
                    className="bg-gray-900 text-white px-3 py-2 rounded-lg"
                  />
                </View>

                {/* Price Range */}
                {locationDetected && priceRange && (
                  <View className="flex-1">
                    <Text className="text-gray-500 text-xs mb-1">Market Price</Text>
                    <Text className="text-gray-300 font-semibold text-sm">
                      €{priceRange.min.toFixed(0)}-{priceRange.max.toFixed(0)}/t
                    </Text>
                  </View>
                )}
              </View>

              {/* Estimated Value */}
              {estimatedValue > 0 && (
                <View className="mt-2">
                  <Text className="text-gray-500 text-xs">Estimated Value</Text>
                  <Text className="text-white font-bold text-lg">
                    {formatCurrency(estimatedValue)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <OnboardingLayout>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-primary-500 mb-2">
            Product Details & Pricing
          </Text>
          <Text className="text-gray-400">
            {selectedProducts.length} product{selectedProducts.length > 1 ? 's' : ''} selected • Add quantities
          </Text>
        </View>

        {/* Location Section */}
        <View className="bg-gray-800 rounded-lg p-4 mb-6">
          <View className="flex-row items-center mb-3">
            <MapPin size={20} color="#10b981" />
            <Text className="text-white font-semibold ml-2">Your Location</Text>
          </View>
          
          {!locationDetected && !showManualInput && (
            <TouchableOpacity
              onPress={detectLocation}
              disabled={detectingLocation}
              className="bg-primary-500 py-3 rounded-lg flex-row justify-center items-center"
            >
              {detectingLocation ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-medium">Detect My Location</Text>
              )}
            </TouchableOpacity>
          )}
          
          {showManualInput && !locationDetected && (
            <View>
              <TextInput
                placeholder="Enter your city name"
                value={manualCityInput}
                onChangeText={setManualCityInput}
                placeholderTextColor="#6B7280"
                className="bg-gray-900 text-white px-3 py-2 rounded-lg mb-2"
              />
              <TouchableOpacity
                onPress={searchCityManually}
                disabled={detectingLocation}
                className="bg-primary-500 py-3 rounded-lg"
              >
                {detectingLocation ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-center font-medium">Search City</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
          
          {locationDetected && (
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-300">
                📍 {cityName}{userLocation?.country && `, ${userLocation.country}`}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setLocationDetected(false);
                  setShowManualInput(true);
                  setCityName('');
                }}
              >
                <Text className="text-primary-400 text-sm">Change</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {loadingPrices && (
          <View className="bg-blue-900/20 p-3 rounded-lg mb-4 flex-row items-center">
            <ActivityIndicator size="small" color="#3B82F6" />
            <Text className="ml-2 text-blue-400">Loading regional prices...</Text>
          </View>
        )}

        {/* Product Cards */}
        <ResponsiveGrid minItemWidth={300} maxItemWidth={500} spacing={16}>
          {specifications.map((spec, index) => 
            renderSpecificationCard(spec.productId, index)
          )}
        </ResponsiveGrid>
    </OnboardingLayout>
  );
}