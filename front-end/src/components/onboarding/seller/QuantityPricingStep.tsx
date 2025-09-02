import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MapPin, TrendingUp, Package } from 'lucide-react-native';
import { useOnboardingStore } from '../../../store/onboardingStore';
import axios from 'axios';
import { API_URL } from '../../../config/api';

interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
}

interface PriceRange {
  min: number;
  max: number;
  currency: string;
  confidence: 'high' | 'medium' | 'low';
}

interface MarketData {
  averagePrice: number;
  trend: 'rising' | 'stable' | 'falling';
  demandLevel: 'high' | 'medium' | 'low';
}

const PRESET_QUANTITIES = [100, 250, 500];
const MAX_CUSTOM_QUANTITY = 1000;

export function QuantityPricingStep() {
  const {
    selectedProducts,
    selectedProductsMetadata,
    sellerSpecifications,
    updateSellerSpecification,
    userLocation,
    updateLocation,
    nextStep,
  } = useOnboardingStore();

  const [selectedQuantity, setSelectedQuantity] = useState<number | null>(null);
  const [customQuantity, setCustomQuantity] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [priceRange, setPriceRange] = useState<PriceRange | null>(null);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loadingPricing, setLoadingPricing] = useState(false);
  const [showPriceCard, setShowPriceCard] = useState(false);
  const [wantCustomOffer, setWantCustomOffer] = useState<boolean | null>(null);

  const productId = selectedProducts[0];
  const productMetadata = selectedProductsMetadata[0];
  const currentSpecs = sellerSpecifications[productId] || {};

  // Load existing data
  useEffect(() => {
    if (currentSpecs.quantity) {
      const quantity = parseFloat(currentSpecs.quantity);
      if (PRESET_QUANTITIES.includes(quantity)) {
        setSelectedQuantity(quantity);
      } else {
        setShowCustomInput(true);
        setCustomQuantity(quantity.toString());
      }
    }

    if (userLocation?.city) {
      setLocationInput(userLocation.city);
    }
  }, []);

  const handleQuantitySelect = (quantity: number) => {
    setSelectedQuantity(quantity);
    setShowCustomInput(false);
    setCustomQuantity('');
    
    // Update store
    updateSellerSpecification(productId, {
      quantity: quantity.toString(),
      unit: 'tons',
    });
  };

  const handleCustomQuantity = () => {
    setShowCustomInput(true);
    setSelectedQuantity(null);
  };

  const handleCustomQuantityChange = (value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue > MAX_CUSTOM_QUANTITY) {
      Alert.alert('Invalid Quantity', `Maximum quantity is ${MAX_CUSTOM_QUANTITY} tons`);
      return;
    }
    
    setCustomQuantity(value);
    
    // Update store
    updateSellerSpecification(productId, {
      quantity: value,
      unit: 'tons',
    });
  };

  const handleLocationSubmit = async () => {
    if (!locationInput.trim()) {
      Alert.alert('Location Required', 'Please enter your location to get pricing');
      return;
    }

    setLoadingPricing(true);
    
    try {
      // For demo purposes, we'll simulate location geocoding and pricing
      // In real implementation, you'd call a geocoding service first
      const mockLocation: LocationData = {
        latitude: 42.7339,
        longitude: 25.4858,
        city: locationInput.trim(),
        country: 'Bulgaria',
      };

      updateLocation(mockLocation);

      // Get price range
      const quantity = selectedQuantity || parseFloat(customQuantity);
      const priceData = await getPriceRange(productId, quantity, mockLocation);
      
      setPriceRange(priceData.priceRange);
      setMarketData(priceData.marketData);
      setShowPriceCard(true);
      
    } catch (error) {
      console.error('Error getting pricing:', error);
      Alert.alert('Error', 'Failed to get pricing information. Please try again.');
    } finally {
      setLoadingPricing(false);
    }
  };

  const getPriceRange = async (productId: string, quantity: number, location: LocationData) => {
    try {
      const response = await axios.get(`${API_URL}/pricing/location-based`, {
        params: { 
          productId, 
          quantity, 
          lat: location.latitude, 
          lng: location.longitude 
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('API pricing call failed, using fallback:', error);
      
      // Fallback mock data if API fails
      return {
        priceRange: {
          min: 1.2,
          max: 1.8,
          currency: 'EUR',
          confidence: 'medium' as const,
        },
        marketData: {
          averagePrice: 1.5,
          trend: 'stable' as const,
          demandLevel: 'medium' as const,
        },
      };
    }
  };

  const handleCustomOfferDecision = (wants: boolean) => {
    setWantCustomOffer(wants);
    
    // Update store with decision
    updateSellerSpecification(productId, {
      wantCustomOffer: wants,
    });

    if (wants) {
      // Proceed to custom offer step
      nextStep();
    } else {
      // Skip to account creation
      // This would typically advance 2 steps, but we'll handle in parent component
      nextStep();
    }
  };

  const getQuantity = () => selectedQuantity || parseFloat(customQuantity) || 0;
  const isQuantityValid = () => getQuantity() > 0;
  const isLocationProvided = () => !!userLocation;
  const canShowPricing = () => isQuantityValid() && isLocationProvided();

  return (
    <ScrollView className="flex-1 bg-gray-900">
      <View className="p-4">
        {/* Header */}
        <View className="items-center mb-6">
          <Text className="text-3xl font-bold text-green-500 text-center mb-3">
            Quantity & Pricing
          </Text>
          <Text className="text-gray-400 text-base text-center max-w-lg">
            Set your quantity and get market pricing for your location
          </Text>
        </View>

        {/* Selected Product Display */}
        {productMetadata && (
          <View className="bg-gray-800 rounded-xl p-4 mb-6 border border-gray-700">
            <View className="flex-row items-center">
              {productMetadata.image ? (
                <Image 
                  source={{ uri: productMetadata.image }}
                  className="w-16 h-16 rounded-lg mr-4"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-16 h-16 rounded-lg bg-gray-700 items-center justify-center mr-4">
                  <Package size={32} color="#9CA3AF" />
                </View>
              )}
              <View className="flex-1">
                <Text className="text-white text-xl font-bold">{productMetadata.name}</Text>
                <Text className="text-gray-400">Selected Product</Text>
              </View>
            </View>
          </View>
        )}

        {/* Quantity Selection */}
        <View className="mb-6">
          <Text className="text-white text-lg font-semibold mb-4">Select Quantity</Text>
          
          {/* Preset Quantity Buttons */}
          <View className="flex-row flex-wrap gap-3 mb-4">
            {PRESET_QUANTITIES.map((quantity) => (
              <TouchableOpacity
                key={quantity}
                onPress={() => handleQuantitySelect(quantity)}
                className={`flex-1 min-w-20 py-4 px-6 rounded-xl border-2 ${
                  selectedQuantity === quantity
                    ? 'bg-green-500/20 border-green-500'
                    : 'bg-gray-800 border-gray-600'
                }`}
              >
                <Text className={`text-center font-bold ${
                  selectedQuantity === quantity ? 'text-green-400' : 'text-white'
                }`}>
                  {quantity} tons
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Quantity Option */}
          <TouchableOpacity
            onPress={handleCustomQuantity}
            className={`py-4 px-6 rounded-xl border-2 ${
              showCustomInput
                ? 'bg-green-500/20 border-green-500'
                : 'bg-gray-800 border-gray-600'
            }`}
          >
            <Text className={`text-center font-bold ${
              showCustomInput ? 'text-green-400' : 'text-white'
            }`}>
              Custom Amount
            </Text>
          </TouchableOpacity>

          {/* Custom Input */}
          {showCustomInput && (
            <View className="mt-4">
              <Text className="text-gray-400 mb-2">Enter custom quantity (max {MAX_CUSTOM_QUANTITY} tons)</Text>
              <TextInput
                value={customQuantity}
                onChangeText={handleCustomQuantityChange}
                placeholder="Enter quantity..."
                keyboardType="numeric"
                className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white"
                placeholderTextColor="#6B7280"
              />
            </View>
          )}
        </View>

        {/* Location Input */}
        {isQuantityValid() && (
          <View className="mb-6">
            <Text className="text-white text-lg font-semibold mb-4">Your Location</Text>
            <View className="flex-row gap-3">
              <TextInput
                value={locationInput}
                onChangeText={setLocationInput}
                placeholder="Enter your city..."
                className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white"
                placeholderTextColor="#6B7280"
              />
              <TouchableOpacity
                onPress={handleLocationSubmit}
                disabled={loadingPricing || !locationInput.trim()}
                className={`px-6 py-3 rounded-lg ${
                  loadingPricing || !locationInput.trim()
                    ? 'bg-gray-700'
                    : 'bg-green-500'
                }`}
              >
                {loadingPricing ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <View className="flex-row items-center">
                    <MapPin size={16} color="white" />
                    <Text className="text-white font-bold ml-1">Get Price</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Price Range Card */}
        {showPriceCard && priceRange && marketData && (
          <View className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl p-6 border border-green-500/30 mb-6">
            <View className="flex-row items-center mb-4">
              <TrendingUp size={24} color="#10B981" />
              <Text className="text-green-400 text-lg font-bold ml-2">Market Price Range</Text>
            </View>
            
            <View className="mb-4">
              <Text className="text-white text-2xl font-bold">
                {priceRange.min.toFixed(2)} - {priceRange.max.toFixed(2)} {priceRange.currency}/kg
              </Text>
              <Text className="text-gray-300">
                For {getQuantity()} tons in {userLocation?.city}
              </Text>
              <Text className="text-sm text-gray-400 mt-1">
                Confidence: {priceRange.confidence} • Trend: {marketData.trend} • Demand: {marketData.demandLevel}
              </Text>
            </View>

            {/* Custom Offer CTA */}
            <View className="border-t border-gray-700 pt-4">
              <Text className="text-white font-semibold mb-3">Want a Custom Offer?</Text>
              <Text className="text-gray-400 text-sm mb-4">
                Get a personalized offer based on your specific requirements and quality standards.
              </Text>
              
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => handleCustomOfferDecision(true)}
                  className="flex-1 bg-green-500 py-3 px-4 rounded-lg"
                >
                  <Text className="text-white font-bold text-center">Yes, Custom Offer</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => handleCustomOfferDecision(false)}
                  className="flex-1 bg-gray-700 py-3 px-4 rounded-lg border border-gray-600"
                >
                  <Text className="text-white font-bold text-center">No, Continue</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}