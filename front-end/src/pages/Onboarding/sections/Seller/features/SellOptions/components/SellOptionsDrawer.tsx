import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import {
  X,
  ShoppingCart,
  Sparkles,
  Check,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react-native';
import { ProductSpecificationInput } from '@pages/Onboarding/components/shared/ProductSpecificationInput';
import { PrivyAuthNative } from '@pages/Onboarding/components/shared/PrivyAuthNative';
import { useOnboardingStore } from '@stores/onboarding.store';
import { useProductStore } from '@stores/product.store';
import { useAuthStore } from '@stores/auth.store';
import { apiClient } from '@services/api';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@navigation/types';

interface SellOptionsDrawerProps {
  visible: boolean;
  onClose: () => void;
  productId: string;
  onComplete?: () => void;
}

type OfferType = 'listing' | 'custom-offer' | null;

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function SellOptionsDrawer({
  visible,
  onClose,
  productId,
  onComplete,
}: SellOptionsDrawerProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [offerType, setOfferType] = useState<OfferType>(null);
  const [specifications, setSpecifications] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [listingCreated, setListingCreated] = useState(false);
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const [drawerHeight, setDrawerHeight] = useState(Dimensions.get('window').height * 0.4);
  const successAnimScale = useRef(new Animated.Value(0)).current;
  const successAnimOpacity = useRef(new Animated.Value(0)).current;

  const { sellerSpecifications, updateSellerSpecification, location, selectedRole } =
    useOnboardingStore();
  const { products } = useProductStore();
  const { isAuthenticated, user } = useAuthStore();

  const product = products.find((p) => p.id === productId);
  const currentSpecs = sellerSpecifications[productId] || {};

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();

      // Initialize specifications
      if (product?.specifications) {
        const initialSpecs: Record<string, string> = {};
        product.specifications.forEach((spec) => {
          const specKey = spec.code || spec.id;
          initialSpecs[specKey] = currentSpecs.specifications?.[specKey] || '';
        });
        setSpecifications(initialSpecs);
      }

      // Reset to initial height when opening
      setDrawerHeight(Dimensions.get('window').height * 0.4);
    } else {
      Animated.timing(slideAnim, {
        toValue: Dimensions.get('window').height,
        duration: 250,
        useNativeDriver: true,
      }).start();

      // Reset state when closing
      setOfferType(null);
      setErrors({});
    }
  }, [visible, product]);

  // Update height when offer type changes
  useEffect(() => {
    // Configure smooth animation
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        300,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.scaleY
      )
    );

    if (offerType === 'custom-offer') {
      // Expand to 75% height for specifications form
      setDrawerHeight(Dimensions.get('window').height * 0.75);
    } else if (offerType === null) {
      // Contract to 40% height for selection
      setDrawerHeight(Dimensions.get('window').height * 0.4);
    }
  }, [offerType]);

  const handleClose = () => {
    setOfferType(null);
    setErrors({});
    setShowAuth(false);
    setShowSuccess(false);
    setListingCreated(false);
    setSpecifications({});
    // Reset animations
    successAnimScale.setValue(0);
    successAnimOpacity.setValue(0);
    onClose();
  };

  const handleBack = () => {
    setOfferType(null);
    setErrors({});
    // Height animation is handled by the useEffect
  };

  const validateSpecifications = (): boolean => {
    if (!product?.specifications || product.specifications.length === 0) return true;

    const newErrors: Record<string, string> = {};
    let isValid = true;

    product.specifications.forEach((spec) => {
      const specKey = spec.code || spec.id;
      const value = specifications[specKey];
      const isRequired = spec.importance === 'CRITICAL' || spec.importance === 'IMPORTANT';

      if (isRequired && !value?.trim()) {
        newErrors[specKey] = 'This field is required';
        isValid = false;
      } else if (value && spec.dataType === 'NUMBER') {
        const numValue = parseFloat(value);

        if (isNaN(numValue)) {
          newErrors[specKey] = 'Must be a valid number';
          isValid = false;
        } else if (spec.minValue && numValue < spec.minValue) {
          newErrors[specKey] = `Must be at least ${spec.minValue}`;
          isValid = false;
        } else if (spec.maxValue && numValue > spec.maxValue) {
          newErrors[specKey] = `Must not exceed ${spec.maxValue}`;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleOfferTypeSelect = (type: 'listing' | 'custom-offer') => {
    setOfferType(type);

    if (type === 'listing') {
      // For quick listing, proceed directly
      handleSubmit(type);
    }
    // For custom offer, show specifications form
  };

  const handleSubmit = async (type: OfferType = offerType) => {
    if (!type) return;

    // For custom offer, validate specifications
    if (type === 'custom-offer' && !validateSpecifications()) {
      Alert.alert('Missing Information', 'Please fill in all required specifications');
      return;
    }

    // Save the offer type and specifications
    updateSellerSpecification(productId, {
      action: type,
      specifications: type === 'custom-offer' ? specifications : undefined,
    });

    // Check authentication
    if (!isAuthenticated) {
      setShowAuth(true);
      return;
    }

    // Submit to backend
    await submitListing(type);
  };

  const submitListing = async (type: OfferType): Promise<boolean> => {
    if (!type) return false;

    try {
      setIsSubmitting(true);

      const listingData = {
        productId,
        quantity: parseFloat(currentSpecs.quantity || '0'),
        unit: currentSpecs.unit || product?.defaultUnit || 'TON',
        offerType: type,
        location: {
          latitude: location?.latitude || 0,
          longitude: location?.longitude || 0,
          city: location?.city,
          region: location?.region,
          country: location?.country,
          address: location?.address,
        },
        specifications: type === 'custom-offer' ? specifications : undefined,
        priceExpectation: product
          ? {
              min: parseFloat(product.priceRangeMin || '0'),
              max: parseFloat(product.priceRangeMax || '0'),
              currency: 'USD',
            }
          : undefined,
        status: 'draft',
      };

      const response = await apiClient.post<{ success: boolean; data: any }>(
        '/seller/listings',
        listingData
      );

      if (response?.data?.success) {
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Failed to create listing:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to create listing. Please try again.',
        [{ text: 'OK' }]
      );
      return false;
    } finally {
      setIsSubmitting(false);
    }
    return false;
  };

  const handleAuthComplete = async () => {
    setShowAuth(false);
    const success = await submitListing(offerType);
    if (success) {
      setListingCreated(true);
      setShowSuccess(true);
      // Animate success screen
      Animated.parallel([
        Animated.spring(successAnimScale, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(successAnimOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const renderContent = () => {
    if (!productId) {
      return (
        <View className="p-6">
          <Text className="text-red-400 text-center">Error: No product ID provided</Text>
        </View>
      );
    }

    if (showSuccess) {
      return (
        <Animated.View
          className="flex-1 p-6"
          style={{
            opacity: successAnimOpacity,
            transform: [{ scale: successAnimScale }],
          }}
        >
          {/* Success Animation */}
          <View className="items-center mb-8">
            <View className="bg-emerald-600/20 p-6 rounded-full mb-4">
              <Check size={48} color="#10B981" />
            </View>
            <Text className="text-2xl font-bold text-white mb-2">
              Listing Created Successfully!
            </Text>
            <Text className="text-gray-400 text-center">
              {offerType === 'custom-offer'
                ? 'Your custom offer request has been submitted. You will receive a quote within 24 hours.'
                : 'Your listing is now live on the marketplace.'}
            </Text>
          </View>

          {/* Product Summary */}
          <View className="bg-gray-800/50 rounded-xl p-4 mb-6 border border-gray-700">
            <Text className="text-gray-400 text-sm mb-2">Product Listed</Text>
            <Text className="text-white font-semibold text-lg mb-1">
              {product?.displayName || product?.name}
            </Text>
            <View className="flex-row items-center">
              <Text className="text-gray-400">
                {currentSpecs.quantity} {currentSpecs.unit || product?.defaultUnit}
              </Text>
              {location?.city && (
                <>
                  <Text className="text-gray-600 mx-2">•</Text>
                  <Text className="text-gray-400">{location.city}</Text>
                </>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View className="space-y-3">
            <TouchableOpacity
              onPress={() => {
                handleClose();
                // Navigate to main app (dashboard)
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Main' }],
                });
              }}
              className="bg-emerald-600 rounded-xl p-4"
            >
              <Text className="text-white font-semibold text-center text-base">
                Go to Dashboard
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                // Reset states
                setShowSuccess(false);
                setListingCreated(false);
                setOfferType(null);
                setSpecifications({});
                handleClose();
              }}
              className="bg-gray-800 rounded-xl p-4 border border-gray-700"
            >
              <Text className="text-gray-300 font-semibold text-center text-base">
                Create Another Listing
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      );
    }

    if (showAuth) {
      return (
        <View className="flex-1">
          <PrivyAuthNative
            onComplete={handleAuthComplete}
            userRole={selectedRole || 'seller'}
            mode="inline"
          />
        </View>
      );
    }

    if (!offerType) {
      // Show offer type selection
      return (
        <View className="px-4 py-6">
          <View className="mb-6">
            <Text className="text-2xl font-bold text-white mb-2">How would you like to sell?</Text>
            <Text className="text-gray-400">Choose between quick listing or custom offer</Text>
          </View>

          <View>
            {/* Quick Listing Option */}
            <TouchableOpacity
              onPress={() => handleOfferTypeSelect('listing')}
              className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 mb-3"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="bg-blue-600/20 p-3 rounded-xl">
                    <ShoppingCart size={24} color="#3B82F6" />
                  </View>
                  <View className="ml-4 flex-1">
                    <Text className="text-white font-semibold text-base">Quick Listing</Text>
                    <Text className="text-gray-400 text-sm mt-1">
                      List instantly on the marketplace
                    </Text>
                  </View>
                </View>
                <ChevronRight size={20} color="#6B7280" />
              </View>
            </TouchableOpacity>

            {/* Custom Offer Option */}
            <TouchableOpacity
              onPress={() => handleOfferTypeSelect('custom-offer')}
              className="bg-gray-800/50 rounded-xl p-4 border border-gray-700"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="bg-emerald-600/20 p-3 rounded-xl">
                    <Sparkles size={24} color="#10B981" />
                  </View>
                  <View className="ml-4 flex-1">
                    <Text className="text-white font-semibold text-base">Custom Offer</Text>
                    <Text className="text-gray-400 text-sm mt-1">
                      Get personalized quote with specifications
                    </Text>
                  </View>
                </View>
                <ChevronRight size={20} color="#6B7280" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Show specifications form for custom offer
    return (
      <View className="flex-1">
        {/* Back button header */}
        <View className="flex-row items-center px-4 pb-3">
          <TouchableOpacity onPress={handleBack} className="flex-row items-center">
            <ChevronLeft size={20} color="#10B981" />
            <Text className="text-emerald-400 ml-1">Back</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          <View className="mb-6">
            <Text className="text-2xl font-bold text-white mb-2">Product Specifications</Text>
            <Text className="text-gray-400">
              Fill in the specifications for your {product?.displayName || product?.name}
            </Text>
          </View>

          {product?.specifications && product.specifications.length > 0 ? (
            <View>
              {product.specifications
                .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                .map((spec) => {
                  const specKey = spec.code || spec.id;
                  return (
                    <ProductSpecificationInput
                      key={specKey}
                      spec={spec}
                      value={specifications[specKey] || ''}
                      onChange={(value) => {
                        setSpecifications((prev) => ({
                          ...prev,
                          [specKey]: value,
                        }));
                        // Clear error when user types
                        if (errors[specKey]) {
                          setErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors[specKey];
                            return newErrors;
                          });
                        }
                      }}
                      error={errors[specKey]}
                    />
                  );
                })}
            </View>
          ) : (
            <View className="bg-gray-800/50 rounded-xl p-6 mb-4">
              <View className="items-center">
                <AlertCircle size={48} color="#6B7280" />
                <Text className="text-gray-400 text-center mt-3">
                  No specifications required for this product
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Submit Button - Fixed at bottom */}
        <View className="px-4 py-4 bg-gray-900 border-t border-gray-800">
          <TouchableOpacity
            onPress={() => handleSubmit()}
            disabled={isSubmitting}
            className={`rounded-xl py-4 ${isSubmitting ? 'bg-gray-700' : 'bg-emerald-600'}`}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <View className="flex-row items-center justify-center">
                <Check size={20} color="white" />
                <Text className="text-white font-semibold text-base ml-2">Complete</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="none" transparent={true} onRequestClose={handleClose}>
      <View className="flex-1 bg-black/60">
        <TouchableOpacity className="flex-1" activeOpacity={1} onPress={handleClose} />

        <Animated.View
          style={{
            transform: [{ translateY: slideAnim }],
            backgroundColor: '#111827',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            height: drawerHeight,
          }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between p-4 border-b border-gray-800">
            <View className="w-10" />
            <View className="h-1 w-12 bg-gray-600 rounded-full" />
            <TouchableOpacity onPress={handleClose} className="p-2">
              <X size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View className="flex-1">{renderContent()}</View>
        </Animated.View>
      </View>
    </Modal>
  );
}
