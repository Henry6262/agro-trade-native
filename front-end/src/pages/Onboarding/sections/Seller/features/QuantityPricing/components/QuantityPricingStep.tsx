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
import { MapPin, Edit2, DollarSign, Weight } from 'lucide-react-native';
import { useOnboardingStore } from '@stores/onboarding.store';
import { useProductStore } from '@stores/product.store';
import { getApiUrl } from '@shared/utils/environment';
import * as Location from 'expo-location';

const PRESET_QUANTITIES = [100, 500, 1000];

export function QuantityPricingStep() {
  const {
    selectedProducts,
    selectedProductsMetadata,
    sellerSpecifications,
    updateSellerSpecification,
    location,
    setLocation,
    nextStep,
    setStep,
  } = useOnboardingStore();

  const { products } = useProductStore();

  const [selectedQuantity, setSelectedQuantity] = useState<number | null>(null);
  const [customQuantity, setCustomQuantity] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [manualLocation, setManualLocation] = useState('');
  const [showManualLocation, setShowManualLocation] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  // Removed offer type - moved to final step

  const productId = selectedProducts[0];
  const product = products.find((p) => p.id === productId);
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
    setSelectedQuantity(quantity);
    setShowCustomInput(false);
    setCustomQuantity('');

    updateSellerSpecification(productId, {
      quantity: quantity.toString(),
      unit: product?.defaultUnit || 'TON',
    });
  };

  const handleCustomQuantity = () => {
    setShowCustomInput(true);
    setSelectedQuantity(null);
  };

  const handleCustomQuantityChange = (value: string) => {
    const numValue = value.replace(/[^0-9.]/g, '');
    setCustomQuantity(numValue);

    if (numValue) {
      setSelectedQuantity(parseFloat(numValue));
      updateSellerSpecification(productId, {
        quantity: numValue,
        unit: product?.defaultUnit || 'TON',
      });
    }
  };

  const handleContinue = () => {
    if (!isFormValid()) return;

    // Save the quantity and location data
    updateSellerSpecification(productId, {
      quantity: getQuantity().toString(),
      unit: product?.defaultUnit || 'TON',
    });

    // Go directly to the overview step
    nextStep();
  };

  const getQuantity = () => selectedQuantity || parseFloat(customQuantity) || 0;
  const isFormValid = () => getQuantity() > 0 && location;

  // Mock price data - will be replaced with API call
  const priceOffer = product
    ? {
        min: parseFloat(product.priceRangeMin || '0'),
        max: parseFloat(product.priceRangeMax || '0'),
        currency: 'USD',
      }
    : null;

  return (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 140 }}
    >
      {/* Header */}
      <View className="mb-6">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Quantity & Location</Text>
        <Text className="text-gray-400">Set your supply quantity and confirm your location</Text>
      </View>

      {/* ===== SECTION 1: QUANTITY ===== */}
      <View className="bg-white/30 rounded-2xl p-5 mb-6 border border-gray-200/50">
        <View className="flex-row items-center mb-4">
          <Weight size={22} color="#10B981" />
          <Text className="text-gray-900 text-xl font-bold ml-2">Supply Quantity</Text>
        </View>

        {/* Product Info */}
        {product && (
          <View className="bg-gray-50/50 rounded-xl p-4 mb-4 flex-row items-center">
            {product.image && (
              <Image
                source={{
                  uri: product.image.startsWith('http')
                    ? product.image
                    : `${getApiUrl().replace('/api', '')}/static/${product.image}`,
                }}
                style={{ width: 60, height: 60 }}
                className="rounded-xl mr-4"
                resizeMode="cover"
              />
            )}
            <View className="flex-1">
              <Text className="text-gray-900 text-lg font-semibold">
                {product.displayName || product.name}
              </Text>
              <Text className="text-gray-400 text-sm">{product.category.replace(/_/g, ' ')}</Text>
            </View>
          </View>
        )}

        {/* Quantity Selection */}
        <View>
          <Text className="text-gray-600 text-sm mb-3">How much can you supply?</Text>

          {/* Preset Quantities */}
          <View className="flex-row mb-3">
            {PRESET_QUANTITIES.map((qty) => (
              <TouchableOpacity
                key={qty}
                onPress={() => handleQuantitySelect(qty)}
                className="flex-1 mx-1"
              >
                <View
                  className={`py-4 rounded-2xl border-2 ${
                    selectedQuantity === qty && !showCustomInput
                      ? 'bg-emerald-600/20 border-emerald-500'
                      : 'bg-gray-50/50 border-gray-200'
                  }`}
                >
                  <Text
                    className={`text-center text-lg font-bold ${
                      selectedQuantity === qty && !showCustomInput
                        ? 'text-emerald-400'
                        : 'text-gray-600'
                    }`}
                  >
                    {qty}/t
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Amount */}
          {!showCustomInput ? (
            <TouchableOpacity onPress={handleCustomQuantity}>
              <View className="py-4 rounded-2xl border-2 bg-gray-50/50 border-gray-200">
                <Text className="text-center text-gray-400 font-medium">Custom Amount</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View>
              <TextInput
                value={customQuantity}
                onChangeText={handleCustomQuantityChange}
                placeholder="Enter quantity in tons..."
                placeholderTextColor="#6B7280"
                keyboardType="numeric"
                className="bg-gray-50/50 border-2 border-emerald-500/30 rounded-2xl px-4 py-4 text-gray-900 text-center"
                autoFocus
                returnKeyType="done"
              />
              <TouchableOpacity
                onPress={() => {
                  setShowCustomInput(false);
                  setCustomQuantity('');
                  setSelectedQuantity(null);
                }}
                className="mt-2"
              >
                <Text className="text-center text-gray-500 text-sm">Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* ===== SECTION 2: LOCATION ===== */}
      <View className="bg-white/30 rounded-2xl p-5 mb-6 border border-gray-200/50">
        <View className="flex-row items-center mb-4">
          <MapPin size={22} color="#10B981" />
          <Text className="text-gray-900 text-xl font-bold ml-2">Your Location</Text>
        </View>

        {!showManualLocation ? (
          <TouchableOpacity
            onPress={() => setShowManualLocation(true)}
            className="bg-gray-50/50 rounded-xl p-4 flex-row items-center justify-between"
          >
            <View className="flex-row items-center flex-1">
              <View className="ml-3 flex-1">
                {loadingLocation ? (
                  <ActivityIndicator size="small" color="#10B981" />
                ) : location ? (
                  <>
                    <Text className="text-gray-900 text-sm font-medium">
                      {location.city || location.address || 'Location set'}
                    </Text>
                    {location.region && (
                      <Text className="text-gray-400 text-xs">
                        {location.region}, {location.country}
                      </Text>
                    )}
                  </>
                ) : (
                  <Text className="text-gray-400">Tap to set location</Text>
                )}
              </View>
            </View>
            <Edit2 size={18} color="#10B981" />
          </TouchableOpacity>
        ) : (
          <View className="bg-gray-50/50 rounded-xl p-4">
            <TextInput
              value={manualLocation}
              onChangeText={setManualLocation}
              placeholder="Enter your city or region..."
              placeholderTextColor="#6B7280"
              className="bg-white rounded-xl px-4 py-3 text-gray-900 mb-3"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleManualLocation}
            />
            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={() => setShowManualLocation(false)}
                className="flex-1 py-3 rounded-xl bg-gray-700"
              >
                <Text className="text-center text-gray-600 font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleManualLocation}
                className="flex-1 py-3 rounded-xl bg-emerald-600"
              >
                <Text className="text-center text-white font-medium">Set Location</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Price Display (if location is set) */}
        {location && priceOffer && (
          <View className="mt-4 items-center">
            <View className="bg-emerald-600 rounded-full px-6 py-3 flex-row items-center">
              <DollarSign size={20} color="white" />
              <Text className="text-white text-xl font-bold mx-2">
                {priceOffer.min} - {priceOffer.max}
              </Text>
              <Text className="text-emerald-100 text-sm">/{product?.defaultUnit || 'TON'}</Text>
            </View>
            <Text className="text-gray-400 text-xs mt-2">Price range for your region</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
