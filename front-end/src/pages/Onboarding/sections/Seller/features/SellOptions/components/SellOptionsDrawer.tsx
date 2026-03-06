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
  StyleSheet,
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

export function SellOptionsDrawer({ visible, onClose, productId }: SellOptionsDrawerProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [offerType, setOfferType] = useState<OfferType>(null);
  const [specifications, setSpecifications] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [_listingCreated, setListingCreated] = useState(false);
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const [drawerHeight, setDrawerHeight] = useState(Dimensions.get('window').height * 0.4);
  const successAnimScale = useRef(new Animated.Value(0)).current;
  const successAnimOpacity = useRef(new Animated.Value(0)).current;

  const { sellerSpecifications, updateSellerSpecification, location, selectedRole } =
    useOnboardingStore();
  const { products } = useProductStore();
  const { isAuthenticated } = useAuthStore();

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
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        300,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.scaleY
      )
    );

    if (offerType === 'custom-offer') {
      setDrawerHeight(Dimensions.get('window').height * 0.75);
    } else if (offerType === null) {
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
    successAnimScale.setValue(0);
    successAnimOpacity.setValue(0);
    onClose();
  };

  const handleBack = () => {
    setOfferType(null);
    setErrors({});
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
      handleSubmit(type);
    }
  };

  const handleSubmit = async (type: OfferType = offerType) => {
    if (!type) return;

    if (type === 'custom-offer' && !validateSpecifications()) {
      Alert.alert('Missing Information', 'Please fill in all required specifications');
      return;
    }

    updateSellerSpecification(productId, {
      action: type,
      specifications: type === 'custom-offer' ? specifications : undefined,
    });

    if (!isAuthenticated) {
      setShowAuth(true);
      return;
    }

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
        <View style={{ padding: 24 }}>
          <Text style={{ color: '#F87171', textAlign: 'center' }}>
            Error: No product ID provided
          </Text>
        </View>
      );
    }

    if (showSuccess) {
      return (
        <Animated.View
          style={[
            styles.contentPad,
            {
              flex: 1,
              opacity: successAnimOpacity,
              transform: [{ scale: successAnimScale }],
            },
          ]}
        >
          {/* Success Animation */}
          <View style={styles.successCenter}>
            <View style={styles.successIconCircle}>
              <Check size={48} color="#4ADE80" />
            </View>
            <Text style={styles.successTitle}>Listing Created Successfully!</Text>
            <Text style={styles.mutedText}>
              {offerType === 'custom-offer'
                ? 'Your custom offer request has been submitted. You will receive a quote within 24 hours.'
                : 'Your listing is now live on the marketplace.'}
            </Text>
          </View>

          {/* Product Summary */}
          <View style={styles.darkCard}>
            <Text style={styles.mutedSmallText}>Product Listed</Text>
            <Text style={styles.cardTitle}>{product?.displayName || product?.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.mutedText}>
                {currentSpecs.quantity} {currentSpecs.unit || product?.defaultUnit}
              </Text>
              {location?.city && (
                <>
                  <Text style={[styles.mutedText, { marginHorizontal: 8 }]}>•</Text>
                  <Text style={styles.mutedText}>{location.city}</Text>
                </>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={{ gap: 12, marginTop: 8 }}>
            <TouchableOpacity
              onPress={() => {
                handleClose();
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Main' }],
                });
              }}
              style={styles.primaryBtn}
            >
              <Text style={styles.primaryBtnText}>Go to Dashboard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setShowSuccess(false);
                setListingCreated(false);
                setOfferType(null);
                setSpecifications({});
                handleClose();
              }}
              style={styles.secondaryBtn}
            >
              <Text style={styles.secondaryBtnText}>Create Another Listing</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      );
    }

    if (showAuth) {
      return (
        <View style={{ flex: 1 }}>
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
        <View style={styles.contentPad}>
          <View style={{ marginBottom: 24 }}>
            <Text style={styles.drawerTitle}>How would you like to sell?</Text>
            <Text style={styles.mutedText}>Choose between quick listing or custom offer</Text>
          </View>

          <View>
            {/* Quick Listing Option */}
            <TouchableOpacity
              onPress={() => handleOfferTypeSelect('listing')}
              style={[styles.optionCard, { marginBottom: 12 }]}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={styles.optionIconWrapBlue}>
                    <ShoppingCart size={24} color="#3B82F6" />
                  </View>
                  <View style={{ marginLeft: 16, flex: 1 }}>
                    <Text style={styles.optionTitle}>Quick Listing</Text>
                    <Text style={styles.mutedText}>List instantly on the marketplace</Text>
                  </View>
                </View>
                <ChevronRight size={20} color="rgba(255,255,255,0.3)" />
              </View>
            </TouchableOpacity>

            {/* Custom Offer Option */}
            <TouchableOpacity
              onPress={() => handleOfferTypeSelect('custom-offer')}
              style={styles.optionCard}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={styles.optionIconWrapGreen}>
                    <Sparkles size={24} color="#4ADE80" />
                  </View>
                  <View style={{ marginLeft: 16, flex: 1 }}>
                    <Text style={styles.optionTitle}>Custom Offer</Text>
                    <Text style={styles.mutedText}>Get personalized quote with specifications</Text>
                  </View>
                </View>
                <ChevronRight size={20} color="rgba(255,255,255,0.3)" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Show specifications form for custom offer
    return (
      <View style={{ flex: 1 }}>
        {/* Back button header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingBottom: 12,
          }}
        >
          <TouchableOpacity
            onPress={handleBack}
            style={{ flexDirection: 'row', alignItems: 'center' }}
          >
            <ChevronLeft size={20} color="#4ADE80" />
            <Text style={styles.greenText}>Back</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>
          <View style={{ marginBottom: 24 }}>
            <Text style={styles.drawerTitle}>Product Specifications</Text>
            <Text style={styles.mutedText}>
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
                        setSpecifications((prev) => ({ ...prev, [specKey]: value }));
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
            <View style={[styles.darkCard, { padding: 24, marginBottom: 16 }]}>
              <View style={{ alignItems: 'center' }}>
                <AlertCircle size={48} color="rgba(255,255,255,0.3)" />
                <Text style={[styles.mutedText, { textAlign: 'center', marginTop: 12 }]}>
                  No specifications required for this product
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Submit Button - Fixed at bottom */}
        <View style={styles.submitBar}>
          <TouchableOpacity
            onPress={() => handleSubmit()}
            disabled={isSubmitting}
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <View
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
              >
                <Check size={20} color="#052e16" />
                <Text style={styles.submitBtnText}>Complete</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="none" transparent={true} onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={handleClose} />

        <Animated.View
          style={[
            styles.drawerContainer,
            {
              transform: [{ translateY: slideAnim }],
              height: drawerHeight,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.drawerHeader}>
            <View style={{ width: 40 }} />
            <View style={styles.dragHandle} />
            <TouchableOpacity onPress={handleClose} style={{ padding: 8 }}>
              <X size={24} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={{ flex: 1 }}>{renderContent()}</View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.75)',
    flex: 1,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 4,
  },
  contentPad: {
    padding: 16,
  },
  darkCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
  },
  dragHandle: {
    backgroundColor: 'rgba(74,222,128,0.3)',
    borderRadius: 2,
    height: 4,
    width: 48,
  },
  drawerContainer: {
    backgroundColor: 'rgba(3,15,9,0.97)',
    borderTopColor: 'rgba(74,222,128,0.2)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  drawerHeader: {
    alignItems: 'center',
    borderBottomColor: 'rgba(74,222,128,0.1)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  drawerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  greenText: {
    color: '#4ADE80',
    marginLeft: 4,
  },
  mutedSmallText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginBottom: 4,
  },
  mutedText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  optionCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  optionIconWrapBlue: {
    alignItems: 'center',
    backgroundColor: 'rgba(59,130,246,0.15)',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  optionIconWrapGreen: {
    alignItems: 'center',
    backgroundColor: 'rgba(74,222,128,0.15)',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  optionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  primaryBtn: {
    alignItems: 'center',
    backgroundColor: '#4ADE80',
    borderRadius: 12,
    elevation: 6,
    paddingVertical: 16,
    shadowColor: '#4ADE80',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  primaryBtnText: {
    color: '#052e16',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 16,
  },
  secondaryBtnText: {
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
  },
  submitBar: {
    backgroundColor: 'rgba(3,15,9,0.95)',
    borderTopColor: 'rgba(74,222,128,0.12)',
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  submitBtn: {
    alignItems: 'center',
    backgroundColor: '#4ADE80',
    borderRadius: 12,
    elevation: 6,
    paddingVertical: 16,
    shadowColor: '#4ADE80',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    elevation: 0,
    shadowOpacity: 0,
  },
  submitBtnText: {
    color: '#052e16',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  successCenter: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successIconCircle: {
    alignItems: 'center',
    backgroundColor: 'rgba(74,222,128,0.15)',
    borderRadius: 50,
    justifyContent: 'center',
    marginBottom: 16,
    padding: 24,
  },
  successTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
});
