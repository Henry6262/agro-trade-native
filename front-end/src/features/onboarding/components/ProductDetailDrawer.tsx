import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  SafeAreaView,
  Platform,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  X,
  MapPin,
  DollarSign,
  Package,
  Info,
  Sparkles,
  ShoppingCart,
  Edit2,
  Weight,
  ChevronRight,
} from 'lucide-react-native';
import { useOnboardingStore } from '@stores/onboarding.store';
import { useProductStore } from '@stores/product.store';
import { useAuthStore } from '@stores/auth.store';
import { getApiUrl } from '../../@pages/Onboarding/components/shared/utils/environment';
import { InlineAuth } from './shared/InlineAuth';

interface ProductDetailDrawerProps {
  visible: boolean;
  onClose: () => void;
  productId: string | null;
  onConfirm: (data: {
    productId: string;
    quantity: number;
    unit: string;
    action: 'listing' | 'custom-offer';
    specifications?: any;
  }) => void;
}

const PRESET_QUANTITIES = [100, 500, 1000];

export const ProductDetailDrawer: React.FC<ProductDetailDrawerProps> = ({
  visible,
  onClose,
  productId,
  onConfirm,
}) => {
  const { products, specificationTypes } = useProductStore();
  const { location, setLocation, selectedRole } = useOnboardingStore();
  const { isAuthenticated } = useAuthStore();

  const product = productId ? products.find((p) => p.id === productId) : null;

  // Form states
  const [selectedQuantity, setSelectedQuantity] = useState<number | null>(null);
  const [customQuantity, setCustomQuantity] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [currentStep, setCurrentStep] = useState<'quantity' | 'specifications' | 'auth'>(
    'quantity'
  );
  const [specifications, setSpecifications] = useState<Record<string, string>>({});
  const [showAuthDrawer, setShowAuthDrawer] = useState(false);

  // Price offer from backend (mock for now - will come from API)
  const [priceOffer, setPriceOffer] = useState<{
    min: number;
    max: number;
    currency: string;
  } | null>(null);

  // Animation values
  const slideAnim = React.useRef(new Animated.Value(Dimensions.get('window').height)).current;

  useEffect(() => {
    if (visible) {
      // Reset form when drawer opens
      setSelectedQuantity(null);
      setCustomQuantity('');
      setShowCustomInput(false);
      setCurrentStep('quantity');
      setSpecifications({});
      setShowAuthDrawer(false);

      // Fetch price offer based on location
      if (location && product) {
        // TODO: Replace with actual API call
        setPriceOffer({
          min: parseFloat(product.priceRangeMin || '0'),
          max: parseFloat(product.priceRangeMax || '0'),
          currency: 'USD',
        });
      }

      // Initialize specifications with empty values
      if (product?.specifications) {
        const initialSpecs: Record<string, string> = {};
        product.specifications.forEach((spec) => {
          initialSpecs[spec.code || spec.id] = '';
        });
        setSpecifications(initialSpecs);
      }

      // Ensure initial position is off-screen
      slideAnim.setValue(Dimensions.get('window').height);

      // Start animation
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: Dimensions.get('window').height,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, productId, product, location, slideAnim]);

  const handleQuantitySelect = (quantity: number) => {
    setSelectedQuantity(quantity);
    setShowCustomInput(false);
    setCustomQuantity('');
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
    } else {
      setSelectedQuantity(null);
    }
  };

  const handleAction = (action: 'listing' | 'custom-offer') => {
    const quantity = selectedQuantity || parseFloat(customQuantity);
    if (!product || !quantity) {
      return;
    }

    if (action === 'custom-offer') {
      // Move to specifications step
      setCurrentStep('specifications');
    } else {
      // Create listing directly
      onConfirm({
        productId: product.id,
        quantity: quantity,
        unit: product.defaultUnit || 'TON',
        action: action,
      });

      // Reset form
      setSelectedQuantity(null);
      setCustomQuantity('');
      onClose();
    }
  };

  const handleCustomOfferSubmit = () => {
    const quantity = selectedQuantity || parseFloat(customQuantity);
    if (!product || !quantity) {
      return;
    }

    // Validate required specifications
    if (product.specifications && product.specifications.length > 0) {
      const missingRequired = product.specifications
        .filter((spec) => spec.importance === 'CRITICAL' || spec.importance === 'IMPORTANT')
        .filter((spec) => !specifications[spec.code || spec.id]?.trim());

      if (missingRequired.length > 0) {
        Alert.alert(
          'Missing Information',
          `Please fill in all required specifications: ${missingRequired.map((s) => s.name || s.code).join(', ')}`,
          [{ text: 'OK' }]
        );
        return;
      }

      // Validate numeric ranges
      for (const spec of product.specifications) {
        const specKey = spec.code || spec.id;
        const value = specifications[specKey];

        if (value && spec.dataType === 'NUMBER') {
          const numValue = parseFloat(value);

          if (isNaN(numValue)) {
            Alert.alert('Invalid Input', `${spec.name || spec.code} must be a valid number`);
            return;
          }

          if (spec.minValue && numValue < spec.minValue) {
            Alert.alert(
              'Invalid Input',
              `${spec.name || spec.code} must be at least ${spec.minValue}`
            );
            return;
          }

          if (spec.maxValue && numValue > spec.maxValue) {
            Alert.alert(
              'Invalid Input',
              `${spec.name || spec.code} must not exceed ${spec.maxValue}`
            );
            return;
          }
        }
      }
    }

    // Check if user is authenticated
    if (!isAuthenticated) {
      // Show authentication step
      setCurrentStep('auth');
      return;
    }

    // User is authenticated, proceed with submission
    onConfirm({
      productId: product.id,
      quantity: quantity,
      unit: product.defaultUnit || 'TON',
      action: 'custom-offer',
      specifications: specifications,
    });

    // Reset form
    setSelectedQuantity(null);
    setCustomQuantity('');
    setSpecifications({});
    setCurrentStep('quantity');
    onClose();
  };

  const handleAuthComplete = () => {
    // After successful authentication, submit the custom offer
    const quantity = selectedQuantity || parseFloat(customQuantity);
    if (!product || !quantity) {
      return;
    }

    onConfirm({
      productId: product.id,
      quantity: quantity,
      unit: product.defaultUnit || 'TON',
      action: 'custom-offer',
      specifications: specifications,
    });

    // Reset form
    setSelectedQuantity(null);
    setCustomQuantity('');
    setSpecifications({});
    setCurrentStep('quantity');
    onClose();
  };

  const handleLocationChange = () => {
    Alert.alert('Change Location', 'Would you like to update your location for accurate pricing?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Update Location',
        onPress: () => {
          // This would trigger location permission and update
          // For now, we'll just show a message
          Alert.alert('Location', 'Location update functionality will be implemented');
        },
      },
    ]);
  };

  const getQuantity = () => selectedQuantity || parseFloat(customQuantity) || 0;
  const isFormValid = () => getQuantity() > 0;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />

        <Animated.View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#0F172A',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            transform: [{ translateY: slideAnim }],
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.25,
            shadowRadius: 10,
            elevation: 5,
            maxHeight: '75%',
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <SafeAreaView style={{ flex: 1 }}>
              {/* Top Section with Product Info - Dark Background */}
              <View className="bg-gray-850" style={{ backgroundColor: '#111827' }}>
                {/* Drag Handle */}
                <View className="items-center py-2">
                  <View className="w-12 h-1 bg-gray-600 rounded-full" />
                </View>

                {/* Header with Product Info */}
                <View className="px-4 pb-3">
                  <TouchableOpacity onPress={onClose} className="absolute right-4 top-2 p-2 z-10">
                    <X size={24} color="#9CA3AF" />
                  </TouchableOpacity>

                  {product && (
                    <View className="flex-row items-center">
                      {product.image && (
                        <Image
                          source={{
                            uri: product.image.startsWith('http')
                              ? product.image
                              : `${getApiUrl().replace('/api', '')}/static/${product.image}`,
                          }}
                          style={{ width: 50, height: 50 }}
                          className="rounded-xl mr-3"
                          resizeMode="cover"
                        />
                      )}
                      <View className="flex-1 pr-8">
                        <Text className="text-white text-lg font-semibold">
                          {product.displayName || product.name}
                        </Text>
                        <Text className="text-gray-400 text-sm">
                          {product.category.replace(/_/g, ' ')}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* Main Content Area - Lighter Background */}
              <ScrollView
                className="flex-1"
                style={{ backgroundColor: '#0F172A' }}
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16 }}
                showsVerticalScrollIndicator={false}
              >
                {!product ? (
                  <View className="flex-1 items-center justify-center py-10">
                    <ActivityIndicator size="large" color="#10B981" />
                    <Text className="text-gray-400 mt-3">Loading product details...</Text>
                  </View>
                ) : currentStep === 'quantity' ? (
                  <>
                    {/* Location Display with Edit */}
                    <TouchableOpacity
                      onPress={handleLocationChange}
                      className="bg-gray-800/50 rounded-xl p-3 mb-4 flex-row items-center justify-between"
                    >
                      <View className="flex-row items-center flex-1">
                        <MapPin size={16} color="#10B981" />
                        <View className="ml-2 flex-1">
                          <Text className="text-gray-400 text-xs">Your Location</Text>
                          <Text className="text-white text-sm">
                            {location?.city || location?.region || 'Not set'}
                          </Text>
                        </View>
                      </View>
                      <Edit2 size={16} color="#6B7280" />
                    </TouchableOpacity>

                    {/* Compact Price Badge */}
                    {location && priceOffer ? (
                      <View className="items-center mb-6">
                        <View className="bg-emerald-600 rounded-full px-6 py-3 flex-row items-center">
                          <DollarSign size={18} color="white" />
                          <Text className="text-white text-xl font-bold mx-1">
                            {priceOffer.min} - {priceOffer.max}
                          </Text>
                          <Text className="text-emerald-100 text-sm">
                            /{product.defaultUnit || 'TON'}
                          </Text>
                        </View>
                        <Text className="text-gray-500 text-xs mt-2">
                          Price range for your region
                        </Text>
                      </View>
                    ) : !location ? (
                      <View className="bg-amber-500/10 rounded-xl p-3 mb-6 border border-amber-500/20">
                        <View className="flex-row items-center">
                          <Info size={14} color="#F59E0B" />
                          <Text className="text-amber-400 text-xs font-medium ml-2">
                            Set location to see regional prices
                          </Text>
                        </View>
                      </View>
                    ) : null}

                    {/* Quantity Selection */}
                    <View className="mb-6">
                      <View className="flex-row items-center mb-3">
                        <Weight size={20} color="white" />
                        <Text className="text-white text-base font-semibold ml-2">
                          How much can you supply?
                        </Text>
                      </View>

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
                                  : 'bg-gray-900/50 border-gray-800'
                              }`}
                            >
                              <Text
                                className={`text-center text-lg font-bold ${
                                  selectedQuantity === qty && !showCustomInput
                                    ? 'text-emerald-400'
                                    : 'text-gray-300'
                                }`}
                              >
                                {qty}/t
                              </Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>

                      {/* Custom Amount Button */}
                      {!showCustomInput ? (
                        <TouchableOpacity onPress={handleCustomQuantity} className="mb-3">
                          <View className="py-4 rounded-2xl border-2 bg-gray-900/50 border-gray-800">
                            <Text className="text-center text-gray-400 font-medium">
                              Custom Amount
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ) : (
                        <View className="mb-3">
                          <TextInput
                            value={customQuantity}
                            onChangeText={handleCustomQuantityChange}
                            placeholder="Enter quantity in tons..."
                            placeholderTextColor="#4B5563"
                            keyboardType="numeric"
                            className="bg-gray-900/50 border-2 border-emerald-500/30 rounded-2xl px-4 py-4 text-white text-center"
                            autoFocus
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

                    {/* Info Text */}
                    <View className="bg-blue-500/10 rounded-xl p-3 mb-4 border border-blue-500/20">
                      <View className="flex-row items-start">
                        <Info size={14} color="#3B82F6" />
                        <View className="flex-1 ml-2">
                          <Text className="text-blue-400 text-xs font-medium mb-1">
                            Choose your selling option
                          </Text>
                          <Text className="text-blue-400/70 text-xs leading-4">
                            <Text className="font-semibold">Create Listing:</Text> List your product
                            on the marketplace.
                            {'\n'}
                            <Text className="font-semibold">Custom Offer:</Text> Provide
                            specifications for a personalized quote.
                          </Text>
                        </View>
                      </View>
                    </View>
                  </>
                ) : currentStep === 'specifications' ? (
                  <>
                    {/* Step 2: Specifications for Custom Offer */}
                    <View className="mb-4">
                      <TouchableOpacity
                        onPress={() => setCurrentStep('quantity')}
                        className="flex-row items-center mb-4"
                      >
                        <ChevronRight
                          size={20}
                          color="#6B7280"
                          style={{ transform: [{ rotate: '180deg' }] }}
                        />
                        <Text className="text-gray-400 ml-2">Back to quantity</Text>
                      </TouchableOpacity>

                      <Text className="text-white text-lg font-semibold mb-2">
                        Product Specifications
                      </Text>
                      <Text className="text-gray-400 text-sm mb-4">
                        Provide details about your {product.displayName || product.name}
                      </Text>
                    </View>

                    {/* Specification Fields */}
                    {product.specifications && product.specifications.length > 0 ? (
                      <View className="space-y-3">
                        {product.specifications.map((spec) => {
                          const specKey = spec.code || spec.id;
                          const isRequired =
                            spec.importance === 'CRITICAL' || spec.importance === 'IMPORTANT';

                          return (
                            <View
                              key={specKey}
                              className="bg-gray-800/50 rounded-2xl p-4 mb-3 border border-gray-700/50"
                            >
                              {/* Label Row */}
                              <View className="flex-row items-center justify-between mb-3">
                                <Text className="text-white text-sm font-semibold flex-1">
                                  {spec.name || spec.code}
                                  {isRequired && <Text className="text-red-400"> *</Text>}
                                </Text>
                                {spec.unit && (
                                  <View className="bg-emerald-600/20 px-3 py-1 rounded-full">
                                    <Text className="text-emerald-400 text-xs font-medium">
                                      {spec.unit}
                                    </Text>
                                  </View>
                                )}
                              </View>

                              {/* Input Field */}
                              <View className="flex-row items-center">
                                <TextInput
                                  value={specifications[specKey] || ''}
                                  onChangeText={(value) => {
                                    // Validate numeric inputs
                                    if (spec.dataType === 'NUMBER') {
                                      const numValue = value.replace(/[^0-9.]/g, '');
                                      setSpecifications({
                                        ...specifications,
                                        [specKey]: numValue,
                                      });
                                    } else {
                                      setSpecifications({
                                        ...specifications,
                                        [specKey]: value,
                                      });
                                    }
                                  }}
                                  placeholder={`Enter ${spec.name?.toLowerCase() || spec.code}`}
                                  placeholderTextColor="#4B5563"
                                  className="bg-gray-900/50 rounded-xl px-4 py-3 text-white flex-1"
                                  keyboardType={spec.dataType === 'NUMBER' ? 'numeric' : 'default'}
                                />
                              </View>

                              {/* Valid Range Display */}
                              {spec.dataType === 'NUMBER' && (spec.minValue || spec.maxValue) && (
                                <View className="flex-row items-center justify-end mt-2">
                                  <View className="bg-blue-600/10 px-3 py-1 rounded-lg">
                                    <Text className="text-blue-400 text-xs">
                                      Valid range: {spec.minValue || '0'} - {spec.maxValue || '∞'}
                                    </Text>
                                  </View>
                                </View>
                              )}

                              {/* Importance Badge */}
                              {spec.importance && (
                                <View className="flex-row items-center mt-2">
                                  <View
                                    className={`px-2 py-0.5 rounded ${
                                      spec.importance === 'CRITICAL'
                                        ? 'bg-red-600/20'
                                        : spec.importance === 'IMPORTANT'
                                          ? 'bg-amber-600/20'
                                          : 'bg-gray-600/20'
                                    }`}
                                  >
                                    <Text
                                      className={`text-xs ${
                                        spec.importance === 'CRITICAL'
                                          ? 'text-red-400'
                                          : spec.importance === 'IMPORTANT'
                                            ? 'text-amber-400'
                                            : 'text-gray-400'
                                      }`}
                                    >
                                      {spec.importance.toLowerCase()}
                                    </Text>
                                  </View>
                                </View>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    ) : (
                      <View className="bg-gray-800/50 rounded-xl p-4 mb-4">
                        <Text className="text-gray-400 text-center">
                          No specifications required for this product
                        </Text>
                      </View>
                    )}

                    {/* Selected Quantity Reminder */}
                    <View className="bg-emerald-500/10 rounded-xl p-3 mt-4 border border-emerald-500/20">
                      <View className="flex-row items-center">
                        <Package size={14} color="#10B981" />
                        <Text className="text-emerald-400 text-sm ml-2">
                          Quantity: {getQuantity()} {product.defaultUnit || 'TON'}
                        </Text>
                      </View>
                    </View>
                  </>
                ) : currentStep === 'auth' ? (
                  <>
                    {/* Authentication Step */}
                    <View className="py-4">
                      <TouchableOpacity
                        onPress={() => setCurrentStep('specifications')}
                        className="flex-row items-center mb-4"
                      >
                        <ChevronRight
                          size={20}
                          color="#6B7280"
                          style={{ transform: [{ rotate: '180deg' }] }}
                        />
                        <Text className="text-gray-400 ml-2">Back to specifications</Text>
                      </TouchableOpacity>

                      <View className="mb-4">
                        <Text className="text-white text-lg font-semibold mb-2">
                          Sign in to Submit Your Offer
                        </Text>
                        <Text className="text-gray-400 text-sm">
                          Create an account or sign in to submit your custom offer for{' '}
                          {product?.displayName || product?.name}
                        </Text>
                      </View>

                      {/* Display Selected Details */}
                      <View className="bg-gray-800/50 rounded-xl p-4 mb-6 space-y-3">
                        <View className="flex-row items-center">
                          <Package size={16} color="#10B981" />
                          <Text className="text-emerald-400 text-sm ml-2">
                            Quantity: {getQuantity()} {product?.defaultUnit || 'TON'}
                          </Text>
                        </View>
                        {Object.keys(specifications).length > 0 && (
                          <View className="flex-row items-center">
                            <Info size={16} color="#3B82F6" />
                            <Text className="text-blue-400 text-sm ml-2">
                              {Object.keys(specifications).length} specifications provided
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* InlineAuth Component */}
                      <InlineAuth
                        onClose={() => setCurrentStep('specifications')}
                        onComplete={handleAuthComplete}
                        userRole={selectedRole || 'seller'}
                      />
                    </View>
                  </>
                ) : null}
              </ScrollView>

              {/* Action Buttons */}
              {currentStep !== 'auth' && (
                <View className="p-4 border-t border-gray-800">
                  {currentStep === 'quantity' ? (
                    <>
                      <View className="flex-row">
                        {/* Create Listing Button */}
                        <TouchableOpacity
                          onPress={() => handleAction('listing')}
                          disabled={!product || !isFormValid()}
                          className="flex-1 mr-2"
                        >
                          <View
                            className={`py-4 rounded-2xl flex-row items-center justify-center ${
                              product && isFormValid() ? 'bg-blue-600' : 'bg-gray-800'
                            }`}
                          >
                            <ShoppingCart
                              size={18}
                              color={product && isFormValid() ? 'white' : '#6B7280'}
                            />
                            <Text
                              className={`ml-2 font-semibold ${
                                product && isFormValid() ? 'text-white' : 'text-gray-500'
                              }`}
                            >
                              Create Listing
                            </Text>
                          </View>
                        </TouchableOpacity>

                        {/* Custom Offer Button - Green */}
                        <TouchableOpacity
                          onPress={() => handleAction('custom-offer')}
                          disabled={!product || !isFormValid()}
                          className="flex-1 ml-2"
                        >
                          <View
                            className={`py-4 rounded-2xl flex-row items-center justify-center ${
                              product && isFormValid() ? 'bg-emerald-600' : 'bg-gray-800'
                            }`}
                          >
                            <Sparkles
                              size={18}
                              color={product && isFormValid() ? 'white' : '#6B7280'}
                            />
                            <Text
                              className={`ml-2 font-semibold ${
                                product && isFormValid() ? 'text-white' : 'text-gray-500'
                              }`}
                            >
                              Custom Offer
                            </Text>
                          </View>
                        </TouchableOpacity>
                      </View>

                      {/* Display selected quantity */}
                      {isFormValid() && (
                        <Text className="text-center text-gray-500 text-xs mt-3">
                          {getQuantity()} {product?.defaultUnit || 'TON'} selected
                        </Text>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Submit Custom Offer Button */}
                      <TouchableOpacity
                        onPress={handleCustomOfferSubmit}
                        disabled={!product || !isFormValid()}
                      >
                        <View
                          className={`py-4 rounded-2xl flex-row items-center justify-center ${
                            product && isFormValid() ? 'bg-emerald-600' : 'bg-gray-800'
                          }`}
                        >
                          <Sparkles
                            size={18}
                            color={product && isFormValid() ? 'white' : '#6B7280'}
                          />
                          <Text
                            className={`ml-2 font-semibold ${
                              product && isFormValid() ? 'text-white' : 'text-gray-500'
                            }`}
                          >
                            Submit Custom Offer
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}
            </SafeAreaView>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
};
