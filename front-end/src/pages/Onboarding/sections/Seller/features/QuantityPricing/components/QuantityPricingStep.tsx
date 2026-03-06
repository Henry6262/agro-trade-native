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
  StyleSheet,
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
    sellerSpecifications,
    updateSellerSpecification,
    location,
    setLocation,
  } = useOnboardingStore();

  const { products } = useProductStore();

  const [selectedQuantity, setSelectedQuantity] = useState<number | null>(null);
  const [customQuantity, setCustomQuantity] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [manualLocation, setManualLocation] = useState('');
  const [showManualLocation, setShowManualLocation] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const productId = selectedProducts[0];
  const product = products.find((p) => p.id === productId);
  const currentSpecs = sellerSpecifications[productId] || {};

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

  const priceOffer = product
    ? {
        min: parseFloat(product.priceRangeMin || '0'),
        max: parseFloat(product.priceRangeMax || '0'),
      }
    : null;

  const imageUrl = product?.image
    ? product.image.startsWith('http')
      ? product.image
      : `${getApiUrl().replace('/api', '')}/static/${product.image}`
    : null;

  return (
    <ScrollView
      style={styles.scroll}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Quantity & Location</Text>
        <Text style={styles.subtitle}>Set your supply quantity and confirm your location</Text>
      </View>

      {/* Supply Quantity */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Weight size={20} color="#4ADE80" />
          <Text style={styles.sectionTitle}>Supply Quantity</Text>
        </View>

        {/* Product pill */}
        {product && (
          <View style={styles.productRow}>
            {imageUrl && (
              <Image source={{ uri: imageUrl }} style={styles.productImage} resizeMode="cover" />
            )}
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.displayName || product.name}</Text>
              <Text style={styles.productCategory}>{product.category.replace(/_/g, ' ')}</Text>
            </View>
          </View>
        )}

        <Text style={styles.hint}>How much can you supply?</Text>

        {/* Preset quantities */}
        <View style={styles.quantityRow}>
          {PRESET_QUANTITIES.map((qty) => {
            const active = selectedQuantity === qty && !showCustomInput;
            return (
              <TouchableOpacity
                key={qty}
                style={[styles.quantityBtn, active && styles.quantityBtnActive]}
                onPress={() => handleQuantitySelect(qty)}
                activeOpacity={0.75}
              >
                <Text style={[styles.quantityBtnText, active && styles.quantityBtnTextActive]}>
                  {qty}/t
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Custom amount */}
        {!showCustomInput ? (
          <TouchableOpacity
            style={styles.customBtn}
            onPress={handleCustomQuantity}
            activeOpacity={0.75}
          >
            <Text style={styles.customBtnText}>Custom Amount</Text>
          </TouchableOpacity>
        ) : (
          <View>
            <TextInput
              value={customQuantity}
              onChangeText={handleCustomQuantityChange}
              placeholder="Enter quantity in tons..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              keyboardType="numeric"
              style={[styles.textInput, styles.textInputCenter]}
              autoFocus
              returnKeyType="done"
            />
            <TouchableOpacity
              onPress={() => {
                setShowCustomInput(false);
                setCustomQuantity('');
                setSelectedQuantity(null);
              }}
              style={styles.cancelInline}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Location */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MapPin size={20} color="#4ADE80" />
          <Text style={styles.sectionTitle}>Your Location</Text>
        </View>

        {!showManualLocation ? (
          <TouchableOpacity
            style={styles.locationRow}
            onPress={() => setShowManualLocation(true)}
            activeOpacity={0.75}
          >
            <View style={styles.locationText}>
              {loadingLocation ? (
                <ActivityIndicator size="small" color="#4ADE80" />
              ) : location ? (
                <>
                  <Text style={styles.locationCity}>
                    {location.city || location.address || 'Location set'}
                  </Text>
                  {location.region ? (
                    <Text style={styles.locationRegion}>
                      {location.region}, {location.country}
                    </Text>
                  ) : null}
                </>
              ) : (
                <Text style={styles.locationPlaceholder}>Tap to set location</Text>
              )}
            </View>
            <Edit2 size={16} color="#4ADE80" />
          </TouchableOpacity>
        ) : (
          <View>
            <TextInput
              value={manualLocation}
              onChangeText={setManualLocation}
              placeholder="Enter your city or region..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              style={styles.textInput}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleManualLocation}
            />
            <View style={styles.manualButtonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowManualLocation(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleManualLocation}>
                <Text style={styles.confirmButtonText}>Set Location</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Price range badge */}
        {location && priceOffer && (priceOffer.min > 0 || priceOffer.max > 0) && (
          <View style={styles.priceRange}>
            <DollarSign size={16} color="#052e16" />
            <Text style={styles.priceRangeText}>
              {priceOffer.min} – {priceOffer.max} / {product?.defaultUnit || 'TON'}
            </Text>
            <Text style={styles.priceRangeHint}> · price range for your region</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const GLASS_BG = 'rgba(255,255,255,0.06)';
const GLASS_BORDER = 'rgba(255,255,255,0.1)';
const GREEN = '#4ADE80';
const GREEN_BG = 'rgba(74,222,128,0.1)';
const GREEN_BORDER = 'rgba(74,222,128,0.4)';

const styles = StyleSheet.create({
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    flex: 1,
    marginRight: 8,
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelInline: {
    marginTop: 8,
  },
  cancelText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    textAlign: 'center',
  },
  confirmButton: {
    backgroundColor: GREEN_BG,
    borderColor: GREEN_BORDER,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 12,
  },
  confirmButtonText: {
    color: GREEN,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  customBtn: {
    backgroundColor: GLASS_BG,
    borderColor: GLASS_BORDER,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 8,
    paddingVertical: 14,
  },
  customBtnText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  header: {
    marginBottom: 20,
  },
  hint: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    marginBottom: 12,
  },
  locationCity: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  locationPlaceholder: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 14,
  },
  locationRegion: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    marginTop: 2,
  },
  locationRow: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: GLASS_BORDER,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  locationText: {
    flex: 1,
    marginRight: 12,
  },
  manualButtonRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  priceRange: {
    alignItems: 'center',
    backgroundColor: GREEN,
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  priceRangeHint: {
    color: 'rgba(5,46,22,0.7)',
    fontSize: 12,
  },
  priceRangeText: {
    color: '#052e16',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 6,
  },
  productCategory: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  productImage: {
    borderRadius: 12,
    height: 52,
    marginRight: 14,
    width: 52,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  productRow: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: GLASS_BORDER,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  quantityBtn: {
    backgroundColor: GLASS_BG,
    borderColor: GLASS_BORDER,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 14,
  },
  quantityBtnActive: {
    backgroundColor: GREEN_BG,
    borderColor: GREEN_BORDER,
  },
  quantityBtnText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  quantityBtnTextActive: {
    color: GREEN,
  },
  quantityRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140,
  },
  section: {
    backgroundColor: GLASS_BG,
    borderColor: GLASS_BORDER,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    padding: 18,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 10,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: GLASS_BORDER,
    borderRadius: 14,
    borderWidth: 1,
    color: '#FFFFFF',
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  textInputCenter: {
    textAlign: 'center',
  },
  title: {
    color: GREEN,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
