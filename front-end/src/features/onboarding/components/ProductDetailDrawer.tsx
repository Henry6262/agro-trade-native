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
  StyleSheet,
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
import { getApiUrl } from '@shared/utils/environment';
// TODO: InlineAuth component not yet implemented
// import { InlineAuth } from './shared/InlineAuth';

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
  const { products } = useProductStore();
  const { location } = useOnboardingStore();
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
  const [_showAuthDrawer, setShowAuthDrawer] = useState(false);

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
      <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.75)' }}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />

        <Animated.View style={[styles.drawerContainer, { transform: [{ translateY: slideAnim }] }]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <SafeAreaView style={{ flex: 1 }}>
              {/* Top Section with Product Info */}
              <View style={styles.drawerHeader}>
                {/* Drag Handle */}
                <View style={styles.dragHandleContainer}>
                  <View style={styles.dragHandle} />
                </View>

                {/* Header with Product Info */}
                <View style={styles.productHeaderRow}>
                  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <X size={24} color="rgba(255,255,255,0.5)" />
                  </TouchableOpacity>

                  {product && (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {product.image && (
                        <Image
                          source={{
                            uri: product.image.startsWith('http')
                              ? product.image
                              : `${getApiUrl().replace('/api', '')}/static/${product.image}`,
                          }}
                          style={{ width: 50, height: 50, borderRadius: 12, marginRight: 12 }}
                          resizeMode="cover"
                        />
                      )}
                      <View style={{ flex: 1, paddingRight: 32 }}>
                        <Text style={styles.productName}>
                          {product.displayName || product.name}
                        </Text>
                        <Text style={styles.productCategory}>
                          {product.category.replace(/_/g, ' ')}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* Main Content Area */}
              <ScrollView
                style={{ flex: 1, backgroundColor: 'transparent' }}
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16 }}
                showsVerticalScrollIndicator={false}
              >
                {!product ? (
                  <View
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: 40,
                    }}
                  >
                    <ActivityIndicator size="large" color="#4ADE80" />
                    <Text style={styles.mutedText}>Loading product details...</Text>
                  </View>
                ) : currentStep === 'quantity' ? (
                  <>
                    {/* Location Display with Edit */}
                    <TouchableOpacity onPress={handleLocationChange} style={styles.locationRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <MapPin size={16} color="#4ADE80" />
                        <View style={{ marginLeft: 8, flex: 1 }}>
                          <Text style={styles.mutedSmallText}>Your Location</Text>
                          <Text style={styles.bodyText}>
                            {location?.city || location?.region || 'Not set'}
                          </Text>
                        </View>
                      </View>
                      <Edit2 size={16} color="rgba(255,255,255,0.4)" />
                    </TouchableOpacity>

                    {/* Compact Price Badge */}
                    {location && priceOffer ? (
                      <View style={{ alignItems: 'center', marginBottom: 24 }}>
                        <View style={styles.priceBadge}>
                          <DollarSign size={18} color="white" />
                          <Text style={styles.priceText}>
                            {priceOffer.min} - {priceOffer.max}
                          </Text>
                          <Text style={styles.priceUnit}>/{product.defaultUnit || 'TON'}</Text>
                        </View>
                        <Text style={styles.mutedSmallText}>Price range for your region</Text>
                      </View>
                    ) : !location ? (
                      <View style={styles.infoBox}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Info size={14} color="#F59E0B" />
                          <Text style={styles.amberText}>Set location to see regional prices</Text>
                        </View>
                      </View>
                    ) : null}

                    {/* Quantity Selection */}
                    <View style={{ marginBottom: 24 }}>
                      <View
                        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}
                      >
                        <Weight size={20} color="white" />
                        <Text style={[styles.sectionTitle, { marginLeft: 8 }]}>
                          How much can you supply?
                        </Text>
                      </View>

                      {/* Preset Quantities */}
                      <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                        {PRESET_QUANTITIES.map((qty) => (
                          <TouchableOpacity
                            key={qty}
                            onPress={() => handleQuantitySelect(qty)}
                            style={{ flex: 1, marginHorizontal: 4 }}
                          >
                            <View
                              style={[
                                styles.qtyCard,
                                selectedQuantity === qty && !showCustomInput
                                  ? styles.qtyCardSelected
                                  : styles.qtyCardUnselected,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.qtyText,
                                  selectedQuantity === qty && !showCustomInput
                                    ? styles.qtyTextSelected
                                    : styles.qtyTextUnselected,
                                ]}
                              >
                                {qty}/t
                              </Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>

                      {/* Custom Amount Button */}
                      {!showCustomInput ? (
                        <TouchableOpacity
                          onPress={handleCustomQuantity}
                          style={{ marginBottom: 12 }}
                        >
                          <View style={styles.qtyCardUnselected}>
                            <Text style={styles.mutedText}>Custom Amount</Text>
                          </View>
                        </TouchableOpacity>
                      ) : (
                        <View style={{ marginBottom: 12 }}>
                          <TextInput
                            value={customQuantity}
                            onChangeText={handleCustomQuantityChange}
                            placeholder="Enter quantity in tons..."
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            keyboardType="numeric"
                            style={styles.customInput}
                            autoFocus
                          />
                          <TouchableOpacity
                            onPress={() => {
                              setShowCustomInput(false);
                              setCustomQuantity('');
                              setSelectedQuantity(null);
                            }}
                            style={{ marginTop: 8 }}
                          >
                            <Text style={[styles.mutedSmallText, { textAlign: 'center' }]}>
                              Cancel
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>

                    {/* Info Text */}
                    <View style={styles.infoBoxBlue}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                        <Info size={14} color="#3B82F6" />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={styles.blueText}>Choose your selling option</Text>
                          <Text style={styles.blueMutedText}>
                            <Text style={{ fontWeight: '600' }}>Create Listing:</Text> List your
                            product on the marketplace.{'\n'}
                            <Text style={{ fontWeight: '600' }}>Custom Offer:</Text> Provide
                            specifications for a personalized quote.
                          </Text>
                        </View>
                      </View>
                    </View>
                  </>
                ) : currentStep === 'specifications' ? (
                  <>
                    {/* Step 2: Specifications for Custom Offer */}
                    <View style={{ marginBottom: 16 }}>
                      <TouchableOpacity
                        onPress={() => setCurrentStep('quantity')}
                        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
                      >
                        <ChevronRight
                          size={20}
                          color="rgba(255,255,255,0.4)"
                          style={{ transform: [{ rotate: '180deg' }] }}
                        />
                        <Text style={[styles.mutedText, { marginLeft: 8 }]}>Back to quantity</Text>
                      </TouchableOpacity>

                      <Text style={styles.sectionTitle}>Product Specifications</Text>
                      <Text style={[styles.mutedText, { marginBottom: 16 }]}>
                        Provide details about your {product.displayName || product.name}
                      </Text>
                    </View>

                    {/* Specification Fields */}
                    {product.specifications && product.specifications.length > 0 ? (
                      <View>
                        {product.specifications.map((spec) => {
                          const specKey = spec.code || spec.id;
                          const isRequired =
                            spec.importance === 'CRITICAL' || spec.importance === 'IMPORTANT';

                          return (
                            <View key={specKey} style={styles.specCard}>
                              {/* Label Row */}
                              <View
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  marginBottom: 12,
                                }}
                              >
                                <Text style={[styles.specLabel, { flex: 1 }]}>
                                  {spec.name || spec.code}
                                  {isRequired && <Text style={{ color: '#F87171' }}> *</Text>}
                                </Text>
                                {spec.unit && (
                                  <View style={styles.unitBadge}>
                                    <Text style={styles.unitText}>{spec.unit}</Text>
                                  </View>
                                )}
                              </View>

                              {/* Input Field */}
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <TextInput
                                  value={specifications[specKey] || ''}
                                  onChangeText={(value) => {
                                    if (spec.dataType === 'NUMBER') {
                                      const numValue = value.replace(/[^0-9.]/g, '');
                                      setSpecifications({ ...specifications, [specKey]: numValue });
                                    } else {
                                      setSpecifications({ ...specifications, [specKey]: value });
                                    }
                                  }}
                                  placeholder={`Enter ${spec.name?.toLowerCase() || spec.code}`}
                                  placeholderTextColor="rgba(255,255,255,0.3)"
                                  style={styles.specInput}
                                  keyboardType={spec.dataType === 'NUMBER' ? 'numeric' : 'default'}
                                />
                              </View>

                              {/* Valid Range Display */}
                              {spec.dataType === 'NUMBER' && (spec.minValue || spec.maxValue) && (
                                <View
                                  style={{
                                    flexDirection: 'row',
                                    justifyContent: 'flex-end',
                                    marginTop: 8,
                                  }}
                                >
                                  <View style={styles.rangeTag}>
                                    <Text style={styles.blueText}>
                                      Valid range: {spec.minValue || '0'} - {spec.maxValue || '∞'}
                                    </Text>
                                  </View>
                                </View>
                              )}

                              {/* Importance Badge */}
                              {spec.importance && (
                                <View
                                  style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginTop: 8,
                                  }}
                                >
                                  <View
                                    style={[
                                      styles.importanceBadge,
                                      spec.importance === 'CRITICAL'
                                        ? { backgroundColor: 'rgba(220,38,38,0.15)' }
                                        : spec.importance === 'IMPORTANT'
                                          ? { backgroundColor: 'rgba(245,158,11,0.15)' }
                                          : { backgroundColor: 'rgba(255,255,255,0.08)' },
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        styles.importanceText,
                                        spec.importance === 'CRITICAL'
                                          ? { color: '#F87171' }
                                          : spec.importance === 'IMPORTANT'
                                            ? { color: '#FCD34D' }
                                            : { color: 'rgba(255,255,255,0.4)' },
                                      ]}
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
                      <View style={styles.darkCard}>
                        <Text style={[styles.mutedText, { textAlign: 'center' }]}>
                          No specifications required for this product
                        </Text>
                      </View>
                    )}

                    {/* Selected Quantity Reminder */}
                    <View style={styles.greenInfoBox}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Package size={14} color="#4ADE80" />
                        <Text style={[styles.greenText, { marginLeft: 8 }]}>
                          Quantity: {getQuantity()} {product.defaultUnit || 'TON'}
                        </Text>
                      </View>
                    </View>
                  </>
                ) : currentStep === 'auth' ? (
                  <>
                    {/* Authentication Step */}
                    <View style={{ paddingVertical: 16 }}>
                      <TouchableOpacity
                        onPress={() => setCurrentStep('specifications')}
                        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
                      >
                        <ChevronRight
                          size={20}
                          color="rgba(255,255,255,0.4)"
                          style={{ transform: [{ rotate: '180deg' }] }}
                        />
                        <Text style={[styles.mutedText, { marginLeft: 8 }]}>
                          Back to specifications
                        </Text>
                      </TouchableOpacity>

                      <View style={{ marginBottom: 16 }}>
                        <Text style={styles.sectionTitle}>Sign in to Submit Your Offer</Text>
                        <Text style={styles.mutedText}>
                          Create an account or sign in to submit your custom offer for{' '}
                          {product?.displayName || product?.name}
                        </Text>
                      </View>

                      {/* Display Selected Details */}
                      <View style={[styles.darkCard, { marginBottom: 24 }]}>
                        <View
                          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
                        >
                          <Package size={16} color="#4ADE80" />
                          <Text style={[styles.greenText, { marginLeft: 8 }]}>
                            Quantity: {getQuantity()} {product?.defaultUnit || 'TON'}
                          </Text>
                        </View>
                        {Object.keys(specifications).length > 0 && (
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Info size={16} color="#3B82F6" />
                            <Text style={[styles.blueText, { marginLeft: 8 }]}>
                              {Object.keys(specifications).length} specifications provided
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* TODO: InlineAuth component not yet implemented */}
                      <View style={styles.darkCard}>
                        <Text style={[styles.mutedText, { textAlign: 'center' }]}>
                          Authentication required. Please sign in to continue.
                        </Text>
                      </View>
                    </View>
                  </>
                ) : null}
              </ScrollView>

              {/* Action Buttons */}
              {currentStep !== 'auth' && (
                <View style={styles.actionBar}>
                  {currentStep === 'quantity' ? (
                    <>
                      <View style={{ flexDirection: 'row' }}>
                        {/* Create Listing Button */}
                        <TouchableOpacity
                          onPress={() => handleAction('listing')}
                          disabled={!product || !isFormValid()}
                          style={{ flex: 1, marginRight: 8 }}
                        >
                          <View
                            style={[
                              styles.actionBtn,
                              product && isFormValid()
                                ? styles.actionBtnBlue
                                : styles.actionBtnDisabled,
                            ]}
                          >
                            <ShoppingCart
                              size={18}
                              color={product && isFormValid() ? 'white' : 'rgba(255,255,255,0.3)'}
                            />
                            <Text
                              style={[
                                styles.actionBtnText,
                                !(product && isFormValid()) && styles.actionBtnTextDisabled,
                              ]}
                            >
                              Create Listing
                            </Text>
                          </View>
                        </TouchableOpacity>

                        {/* Custom Offer Button */}
                        <TouchableOpacity
                          onPress={() => handleAction('custom-offer')}
                          disabled={!product || !isFormValid()}
                          style={{ flex: 1, marginLeft: 8 }}
                        >
                          <View
                            style={[
                              styles.actionBtn,
                              product && isFormValid()
                                ? styles.actionBtnGreen
                                : styles.actionBtnDisabled,
                            ]}
                          >
                            <Sparkles
                              size={18}
                              color={product && isFormValid() ? '#052e16' : 'rgba(255,255,255,0.3)'}
                            />
                            <Text
                              style={[
                                styles.actionBtnText,
                                product && isFormValid()
                                  ? styles.actionBtnTextGreen
                                  : styles.actionBtnTextDisabled,
                              ]}
                            >
                              Custom Offer
                            </Text>
                          </View>
                        </TouchableOpacity>
                      </View>

                      {/* Display selected quantity */}
                      {isFormValid() && (
                        <Text
                          style={[styles.mutedSmallText, { textAlign: 'center', marginTop: 12 }]}
                        >
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
                          style={[
                            styles.actionBtn,
                            product && isFormValid()
                              ? styles.actionBtnGreen
                              : styles.actionBtnDisabled,
                          ]}
                        >
                          <Sparkles
                            size={18}
                            color={product && isFormValid() ? '#052e16' : 'rgba(255,255,255,0.3)'}
                          />
                          <Text
                            style={[
                              styles.actionBtnText,
                              product && isFormValid()
                                ? styles.actionBtnTextGreen
                                : styles.actionBtnTextDisabled,
                            ]}
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

const styles = StyleSheet.create({
  actionBar: {
    borderTopColor: 'rgba(74,222,128,0.12)',
    borderTopWidth: 1,
    padding: 16,
  },
  actionBtn: {
    alignItems: 'center',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  actionBtnBlue: {
    backgroundColor: '#2563EB',
  },
  actionBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
  },
  actionBtnGreen: {
    backgroundColor: '#4ADE80',
    elevation: 6,
    shadowColor: '#4ADE80',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  actionBtnText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  actionBtnTextDisabled: {
    color: 'rgba(255,255,255,0.3)',
  },
  actionBtnTextGreen: {
    color: '#052e16',
    fontWeight: '700',
  },
  amberText: {
    color: '#FCD34D',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 8,
  },
  blueMutedText: {
    color: 'rgba(147,197,253,0.7)',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  blueText: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '500',
  },
  bodyText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  closeButton: {
    padding: 8,
    position: 'absolute',
    right: 16,
    top: 8,
    zIndex: 10,
  },
  customInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(74,222,128,0.3)',
    borderRadius: 16,
    borderWidth: 2,
    color: '#FFFFFF',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    textAlign: 'center',
  },
  darkCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  dragHandle: {
    backgroundColor: 'rgba(74,222,128,0.35)',
    borderRadius: 2,
    height: 4,
    width: 48,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  drawerContainer: {
    backgroundColor: 'rgba(3,15,9,0.97)',
    borderTopColor: 'rgba(74,222,128,0.2)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    bottom: 0,
    elevation: 20,
    left: 0,
    maxHeight: '75%',
    position: 'absolute',
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  drawerHeader: {
    backgroundColor: 'transparent',
  },
  greenInfoBox: {
    backgroundColor: 'rgba(74,222,128,0.08)',
    borderColor: 'rgba(74,222,128,0.2)',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
    padding: 12,
  },
  greenText: {
    color: '#4ADE80',
    fontSize: 14,
  },
  importanceBadge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  importanceText: {
    fontSize: 11,
  },
  infoBox: {
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderColor: 'rgba(245,158,11,0.2)',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    padding: 12,
  },
  infoBoxBlue: {
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderColor: 'rgba(59,130,246,0.2)',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    padding: 12,
  },
  locationRow: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    padding: 12,
  },
  mutedSmallText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginTop: 4,
  },
  mutedText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  priceBadge: {
    alignItems: 'center',
    backgroundColor: '#4ADE80',
    borderRadius: 100,
    elevation: 6,
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 12,
    shadowColor: '#4ADE80',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  priceText: {
    color: '#052e16',
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 4,
  },
  priceUnit: {
    color: 'rgba(5,46,22,0.7)',
    fontSize: 14,
  },
  productCategory: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
  productHeaderRow: {
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  productName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  qtyCard: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 2,
    paddingVertical: 16,
  },
  qtyCardSelected: {
    backgroundColor: 'rgba(74,222,128,0.15)',
    borderColor: '#4ADE80',
  },
  qtyCardUnselected: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    borderWidth: 2,
    paddingVertical: 16,
  },
  qtyText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  qtyTextSelected: {
    color: '#4ADE80',
  },
  qtyTextUnselected: {
    color: 'rgba(255,255,255,0.5)',
  },
  rangeTag: {
    backgroundColor: 'rgba(59,130,246,0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  specCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  specInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    color: '#FFFFFF',
    flex: 1,
    fontSize: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  specLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  unitBadge: {
    backgroundColor: 'rgba(74,222,128,0.15)',
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  unitText: {
    color: '#4ADE80',
    fontSize: 12,
    fontWeight: '500',
  },
});
