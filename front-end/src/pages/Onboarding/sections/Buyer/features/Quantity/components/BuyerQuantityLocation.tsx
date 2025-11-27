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
import { MapPin, Package, Edit2, Weight, DollarSign } from 'lucide-react-native';
import { useOnboardingStore } from '@stores/onboarding.store';
import { useProductStore } from '@stores/product.store';
import { getApiUrl } from '@shared/utils/environment';
import * as Location from 'expo-location';

const PRESET_QUANTITIES = [50, 100, 500, 1000];

export function BuyerQuantityLocation() {
  const {
    selectedProducts,
    selectedProductsMetadata,
    buyerSpecifications,
    updateBuyerSpecification,
    location,
    setLocation,
  } = useOnboardingStore();

  const { products } = useProductStore();

  const [showCustomInput, setShowCustomInput] = useState(false);
  const [manualLocation, setManualLocation] = useState('');
  const [showManualLocation, setShowManualLocation] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const productId = selectedProducts[0];
  const product = products.find((p) => p.id === productId);
  const productMetadata = selectedProductsMetadata.find((m) => m.id === productId);

  // Use store as single source of truth
  const currentSpecs = buyerSpecifications[productId] || {};
  const currentQuantity = currentSpecs.quantity ? parseFloat(currentSpecs.quantity.toString()) : 0;
  const currentPrice = currentSpecs.pricePerKilo || '';
  const isPresetQuantity = PRESET_QUANTITIES.includes(currentQuantity);

  // Initialize state based on store
  useEffect(() => {
    if (currentQuantity > 0 && !isPresetQuantity) {
      setShowCustomInput(true);
    }

    // Auto-detect location if not set
    if (!location) {
      requestLocationPermission();
    }
  }, []);

  const requestLocationPermission = async () => {
    try {
      setLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({});
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });

        if (reverseGeocode && reverseGeocode[0]) {
          const locationData = reverseGeocode[0];
          setLocation({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            address:
              `${locationData.street || ''} ${locationData.city || ''} ${locationData.region || ''} ${locationData.country || ''}`.trim(),
            city: locationData.city || '',
            region: locationData.region || '',
            country: locationData.country || '',
          });
        }
      }
    } catch (error) {
      console.error('Error getting location:', error);
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleManualLocation = () => {
    if (!manualLocation.trim()) {
      Alert.alert('Error', 'Please enter a location');
      return;
    }

    setLocation({
      latitude: 0,
      longitude: 0,
      address: manualLocation,
      city: manualLocation.split(',')[0]?.trim() || manualLocation,
      region: '',
      country: '',
    });
    setShowManualLocation(false);
  };

  const handleQuantitySelect = (quantity: number) => {
    setShowCustomInput(false);
    updateBuyerSpecification(productId, {
      ...currentSpecs,
      quantity: quantity.toString(),
      unit: 'tons',
    });
  };

  const handleCustomQuantity = () => {
    setShowCustomInput(true);
    // Clear quantity when switching to custom
    updateBuyerSpecification(productId, {
      ...currentSpecs,
      quantity: '',
      unit: 'tons',
    });
  };

  const handleCustomQuantityChange = (value: string) => {
    const numValue = value.replace(/[^0-9.]/g, '');
    updateBuyerSpecification(productId, {
      ...currentSpecs,
      quantity: numValue,
      unit: 'tons',
    });
  };

  const handleMaxPriceChange = (value: string) => {
    const numValue = value.replace(/[^0-9.]/g, '');
    updateBuyerSpecification(productId, {
      ...currentSpecs,
      pricePerKilo: numValue,
    });
  };

  // Validation directly from store
  const isFormValid = () => {
    const hasQuantity = currentQuantity > 0;
    const hasPrice = currentPrice && parseFloat(currentPrice) > 0;
    const hasLocation = location !== null;
    return hasQuantity && hasPrice && hasLocation;
  };

  // Get product image URL
  const productImage = product?.image || productMetadata?.image;
  const imageUrl = productImage
    ? productImage.startsWith('http')
      ? productImage
      : `${getApiUrl().replace('/api', '')}/static/${productImage}`
    : null;

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-blue-500 mb-2">Quantity & Location</Text>
          <Text className="text-gray-400">Set your purchase quantity and delivery location</Text>
        </View>

        {/* ===== SECTION 1: DELIVERY LOCATION ===== */}
        <View className="bg-gray-800/30 rounded-2xl p-5 mb-6 border border-gray-700/50">
          <View className="flex-row items-center mb-4">
            <MapPin size={22} color="#3B82F6" />
            <Text className="text-white text-xl font-bold ml-2">Delivery Location</Text>
          </View>

          {!showManualLocation ? (
            <TouchableOpacity
              onPress={() => setShowManualLocation(true)}
              className="bg-gray-900/50 rounded-xl p-4 flex-row items-center justify-between"
            >
              <View className="flex-row items-center flex-1">
                <View className="ml-3 flex-1">
                  {loadingLocation ? (
                    <ActivityIndicator size="small" color="#3B82F6" />
                  ) : location ? (
                    <>
                      <Text className="text-white text-sm font-medium">
                        {location.city || location.address || 'Location set'}
                      </Text>
                      {location.region && (
                        <Text className="text-gray-400 text-xs">
                          {location.region}, {location.country}
                        </Text>
                      )}
                    </>
                  ) : (
                    <Text className="text-gray-400">Tap to set delivery location</Text>
                  )}
                </View>
              </View>
              <Edit2 size={18} color="#3B82F6" />
            </TouchableOpacity>
          ) : (
            <View className="bg-gray-900/50 rounded-xl p-4">
              <TextInput
                value={manualLocation}
                onChangeText={setManualLocation}
                placeholder="Enter delivery city or region..."
                placeholderTextColor="#6B7280"
                className="bg-gray-800 rounded-xl px-4 py-3 text-white mb-3"
                autoFocus
              />
              <View className="flex-row space-x-3">
                <TouchableOpacity
                  onPress={() => setShowManualLocation(false)}
                  className="flex-1 py-3 rounded-xl bg-gray-700"
                >
                  <Text className="text-center text-gray-300 font-medium">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleManualLocation}
                  className="flex-1 py-3 rounded-xl bg-blue-600"
                >
                  <Text className="text-center text-white font-medium">Set Location</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* ===== SECTION 2: QUANTITY & PRICING ===== */}
        <View className="bg-gray-800/30 rounded-2xl p-5 mb-6 border border-gray-700/50">
          {/* Product Info */}
          {product && (
            <View className="bg-gray-900/50 rounded-xl p-4 mb-4 flex-row items-center">
              {imageUrl && (
                <Image
                  source={{ uri: imageUrl }}
                  style={{ width: 60, height: 60 }}
                  className="rounded-xl mr-4"
                  resizeMode="cover"
                />
              )}
              <View className="flex-1">
                <Text className="text-white text-lg font-semibold">
                  {product.displayName || product.name}
                </Text>
                <Text className="text-gray-400 text-sm">{product.category.replace(/_/g, ' ')}</Text>
              </View>
            </View>
          )}

          {/* Quantity Selection */}
          <View className="mb-4">
            <View className="flex-row items-center mb-3">
              <Weight size={22} color="#3B82F6" />
              <Text className="text-white text-xl font-bold ml-2">Purchase Quantity</Text>
            </View>

            {/* Preset Quantities */}
            <View className="flex-row flex-wrap mb-3">
              {PRESET_QUANTITIES.map((qty) => (
                <TouchableOpacity
                  key={qty}
                  onPress={() => handleQuantitySelect(qty)}
                  className="w-[48%] mx-[1%] mb-2"
                >
                  <View
                    className={`py-4 rounded-2xl border-2 ${
                      currentQuantity === qty && !showCustomInput
                        ? 'bg-blue-600/20 border-blue-500'
                        : 'bg-gray-900/50 border-gray-800'
                    }`}
                  >
                    <Text
                      className={`text-center text-lg font-bold ${
                        currentQuantity === qty && !showCustomInput
                          ? 'text-blue-400'
                          : 'text-gray-300'
                      }`}
                    >
                      {qty} tons
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Amount */}
            {!showCustomInput ? (
              <TouchableOpacity onPress={handleCustomQuantity} className="mb-3">
                <View
                  className={`py-4 rounded-2xl border-2 ${
                    currentQuantity > 0 && !isPresetQuantity
                      ? 'bg-blue-600/20 border-blue-500'
                      : 'bg-gray-900/50 border-gray-800'
                  }`}
                >
                  <Text
                    className={`text-center font-medium ${
                      currentQuantity > 0 && !isPresetQuantity ? 'text-blue-400' : 'text-gray-400'
                    }`}
                  >
                    {currentQuantity > 0 && !isPresetQuantity
                      ? `Custom: ${currentQuantity} tons`
                      : 'Custom Amount'}
                  </Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View className="mb-3">
                <TextInput
                  value={currentSpecs.quantity?.toString() || ''}
                  onChangeText={handleCustomQuantityChange}
                  placeholder="Enter quantity in tons..."
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  className="bg-white rounded-2xl px-4 py-4 text-gray-900 text-center"
                  autoFocus
                />
                <TouchableOpacity
                  onPress={() => {
                    setShowCustomInput(false);
                    // Clear custom quantity
                    updateBuyerSpecification(productId, {
                      ...currentSpecs,
                      quantity: '',
                    });
                  }}
                  className="mt-2"
                >
                  <Text className="text-center text-gray-500 text-sm">Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Max Price Field */}
          <View className="mb-4">
            <View className="flex-row items-center mb-3">
              <DollarSign size={22} color="#3B82F6" />
              <Text className="text-white text-xl font-bold ml-2">Maximum Price</Text>
            </View>
            <View className="flex-row items-center">
              <TextInput
                value={currentPrice}
                onChangeText={handleMaxPriceChange}
                placeholder="Enter max price"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
                className="flex-1 bg-white rounded-l-xl px-4 py-3 text-gray-900"
              />
              <View className="bg-white rounded-r-xl border-l border-gray-200 px-4 py-3 min-w-[60px] items-center justify-center">
                <Text className="text-emerald-600 font-medium text-sm">€/kg</Text>
              </View>
            </View>
          </View>

          {/* Summary Display */}
          {currentQuantity > 0 && currentPrice && parseFloat(currentPrice) > 0 && (
            <View className="bg-blue-600/10 rounded-xl p-4 mt-4 border border-blue-600/20">
              <Text className="text-blue-400 text-sm font-semibold mb-2">Purchase Summary</Text>
              <View className="flex-row justify-between mb-1">
                <Text className="text-gray-400">Quantity:</Text>
                <Text className="text-white font-medium">{currentQuantity} tons</Text>
              </View>
              <View className="flex-row justify-between mb-1">
                <Text className="text-gray-400">Max Price:</Text>
                <Text className="text-white font-medium">€{currentPrice}/kg</Text>
              </View>
              <View className="flex-row justify-between pt-2 border-t border-blue-600/20">
                <Text className="text-gray-400">Total Budget:</Text>
                <Text className="text-blue-400 font-bold">
                  €{(currentQuantity * 1000 * parseFloat(currentPrice)).toLocaleString()}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Validation Status */}
        {!isFormValid() && (
          <View className="bg-yellow-500/10 rounded-xl p-3 mb-4 border border-yellow-500/20">
            <Text className="text-yellow-400 text-sm text-center">
              {!location
                ? 'Please set delivery location'
                : currentQuantity === 0
                  ? 'Please select quantity'
                  : !currentPrice || parseFloat(currentPrice) === 0
                    ? 'Please enter maximum price'
                    : 'Complete all fields to continue'}
            </Text>
          </View>
        )}
      </ScrollView>
  );
}
