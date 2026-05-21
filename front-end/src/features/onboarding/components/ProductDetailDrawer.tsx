import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X, ShoppingCart, Sparkles } from 'lucide-react-native';

import { useOnboardingStore } from '@stores/onboarding.store';
import { useProductStore } from '@stores/product.store';
import { useAuthStore } from '@stores/auth.store';

import { AuthStep } from './product-detail-drawer/AuthStep';
import { PRESET_QUANTITIES } from './product-detail-drawer/constants';
import { QuantityStep } from './product-detail-drawer/QuantityStep';
import { SpecificationsStep } from './product-detail-drawer/SpecificationsStep';
import { styles } from './product-detail-drawer/styles';
import type {
  ProductDetailDrawerProps,
  ProductDetailStep,
  ProductSpecificationsMap,
} from './product-detail-drawer/types';
import {
  getDefaultPriceOffer,
  getInitialSpecifications,
  getProductImageUri,
  getQuantityValue,
  normalizeSpecificationValue,
  parseQuantityInput,
  validateSpecifications,
} from './product-detail-drawer/utils';

export const ProductDetailDrawer: React.FC<ProductDetailDrawerProps> = ({
  visible,
  onClose,
  productId,
  onConfirm,
}) => {
  const { products } = useProductStore();
  const { location } = useOnboardingStore();
  const { isAuthenticated } = useAuthStore();

  const product = productId ? products.find((candidate) => candidate.id === productId) : null;

  const [selectedQuantity, setSelectedQuantity] = useState<number | null>(null);
  const [customQuantity, setCustomQuantity] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [currentStep, setCurrentStep] = useState<ProductDetailStep>('quantity');
  const [specifications, setSpecifications] = useState<ProductSpecificationsMap>({});
  const [priceOffer, setPriceOffer] = useState(getDefaultPriceOffer(product));

  const slideAnim = React.useRef(new Animated.Value(Dimensions.get('window').height)).current;

  useEffect(() => {
    if (visible) {
      setSelectedQuantity(null);
      setCustomQuantity('');
      setShowCustomInput(false);
      setCurrentStep('quantity');
      setSpecifications(getInitialSpecifications(product));
      setPriceOffer(location && product ? getDefaultPriceOffer(product) : null);

      slideAnim.setValue(Dimensions.get('window').height);
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
      return;
    }

    Animated.timing(slideAnim, {
      toValue: Dimensions.get('window').height,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible, product, location, slideAnim]);

  const quantity = getQuantityValue(selectedQuantity, customQuantity);
  const isFormValid = quantity > 0;

  const resetDrawerState = () => {
    setSelectedQuantity(null);
    setCustomQuantity('');
    setShowCustomInput(false);
    setSpecifications({});
    setCurrentStep('quantity');
  };

  const handleLocationChange = () => {
    Alert.alert('Change Location', 'Would you like to update your location for accurate pricing?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Update Location',
        onPress: () => {
          Alert.alert('Location', 'Location update functionality will be implemented');
        },
      },
    ]);
  };

  const handleCreateListing = () => {
    if (!product || !quantity) {
      return;
    }

    onConfirm({
      productId: product.id,
      quantity,
      unit: product.defaultUnit || 'TON',
      action: 'listing',
    });
    resetDrawerState();
    onClose();
  };

  const handleContinueToSpecifications = () => {
    if (!product || !quantity) {
      return;
    }

    setCurrentStep('specifications');
  };

  const handleSubmitCustomOffer = () => {
    if (!product || !quantity) {
      return;
    }

    if (!validateSpecifications(product, specifications)) {
      return;
    }

    if (!isAuthenticated) {
      setCurrentStep('auth');
      return;
    }

    onConfirm({
      productId: product.id,
      quantity,
      unit: product.defaultUnit || 'TON',
      action: 'custom-offer',
      specifications,
    });
    resetDrawerState();
    onClose();
  };

  const handleChangeSpecification = (
    specification: Parameters<typeof normalizeSpecificationValue>[0],
    value: string
  ) => {
    const nextValue = normalizeSpecificationValue(specification, value);
    const specificationKey = specification.code || specification.id;

    setSpecifications((currentSpecifications) => ({
      ...currentSpecifications,
      [specificationKey]: nextValue,
    }));
  };

  const imageUri = getProductImageUri(product?.image);

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
              <View style={styles.drawerHeader}>
                <View style={styles.dragHandleContainer}>
                  <View style={styles.dragHandle} />
                </View>

                <View style={styles.productHeaderRow}>
                  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <X size={24} color="rgba(255,255,255,0.5)" />
                  </TouchableOpacity>

                  {product ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {imageUri ? (
                        <Image
                          source={{ uri: imageUri }}
                          style={{ width: 50, height: 50, borderRadius: 12, marginRight: 12 }}
                          resizeMode="cover"
                        />
                      ) : null}
                      <View style={{ flex: 1, paddingRight: 32 }}>
                        <Text style={styles.productName}>
                          {product.displayName || product.name}
                        </Text>
                        <Text style={styles.productCategory}>
                          {product.category.replace(/_/g, ' ')}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </View>
              </View>

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
                ) : null}

                {product && currentStep === 'quantity' ? (
                  <QuantityStep
                    location={location}
                    priceOffer={priceOffer}
                    defaultUnit={product.defaultUnit || 'TON'}
                    quantity={quantity}
                    selectedQuantity={selectedQuantity}
                    showCustomInput={showCustomInput}
                    customQuantity={customQuantity}
                    presetQuantities={PRESET_QUANTITIES}
                    onLocationChange={handleLocationChange}
                    onSelectQuantity={(value) => {
                      setSelectedQuantity(value);
                      setShowCustomInput(false);
                      setCustomQuantity('');
                    }}
                    onShowCustomInput={() => {
                      setShowCustomInput(true);
                      setSelectedQuantity(null);
                    }}
                    onCustomQuantityChange={(value) => {
                      const nextValue = parseQuantityInput(value);
                      setCustomQuantity(nextValue);
                      setSelectedQuantity(nextValue ? parseFloat(nextValue) : null);
                    }}
                    onCancelCustomInput={() => {
                      setShowCustomInput(false);
                      setCustomQuantity('');
                      setSelectedQuantity(null);
                    }}
                  />
                ) : null}

                {product && currentStep === 'specifications' ? (
                  <SpecificationsStep
                    productName={product.displayName || product.name}
                    productSpecifications={product.specifications || []}
                    specifications={specifications}
                    quantity={quantity}
                    defaultUnit={product.defaultUnit || 'TON'}
                    onBack={() => setCurrentStep('quantity')}
                    onChangeSpecification={handleChangeSpecification}
                  />
                ) : null}

                {product && currentStep === 'auth' ? (
                  <AuthStep
                    productName={product.displayName || product.name}
                    quantity={quantity}
                    defaultUnit={product.defaultUnit || 'TON'}
                    specificationCount={Object.keys(specifications).length}
                    onBack={() => setCurrentStep('specifications')}
                  />
                ) : null}
              </ScrollView>

              {currentStep !== 'auth' ? (
                <View style={styles.actionBar}>
                  {currentStep === 'quantity' ? (
                    <View style={{ flexDirection: 'row' }}>
                      <TouchableOpacity
                        onPress={handleCreateListing}
                        disabled={!product || !isFormValid}
                        style={{ flex: 1, marginRight: 8 }}
                      >
                        <View
                          style={[
                            styles.actionBtn,
                            product && isFormValid
                              ? styles.actionBtnBlue
                              : styles.actionBtnDisabled,
                          ]}
                        >
                          <ShoppingCart
                            size={18}
                            color={product && isFormValid ? 'white' : 'rgba(255,255,255,0.3)'}
                          />
                          <Text
                            style={[
                              styles.actionBtnText,
                              !(product && isFormValid) && styles.actionBtnTextDisabled,
                            ]}
                          >
                            Create Listing
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={handleContinueToSpecifications}
                        disabled={!product || !isFormValid}
                        style={{ flex: 1, marginLeft: 8 }}
                      >
                        <View
                          style={[
                            styles.actionBtn,
                            product && isFormValid
                              ? styles.actionBtnGreen
                              : styles.actionBtnDisabled,
                          ]}
                        >
                          <Sparkles
                            size={18}
                            color={product && isFormValid ? '#052e16' : 'rgba(255,255,255,0.3)'}
                          />
                          <Text
                            style={[
                              styles.actionBtnText,
                              product && isFormValid
                                ? styles.actionBtnTextGreen
                                : styles.actionBtnTextDisabled,
                            ]}
                          >
                            Custom Offer
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={handleSubmitCustomOffer}
                      disabled={!product || !isFormValid}
                    >
                      <View
                        style={[
                          styles.actionBtn,
                          product && isFormValid ? styles.actionBtnGreen : styles.actionBtnDisabled,
                        ]}
                      >
                        <Sparkles
                          size={18}
                          color={product && isFormValid ? '#052e16' : 'rgba(255,255,255,0.3)'}
                        />
                        <Text
                          style={[
                            styles.actionBtnText,
                            product && isFormValid
                              ? styles.actionBtnTextGreen
                              : styles.actionBtnTextDisabled,
                          ]}
                        >
                          Submit Custom Offer
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              ) : null}
            </SafeAreaView>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
};
