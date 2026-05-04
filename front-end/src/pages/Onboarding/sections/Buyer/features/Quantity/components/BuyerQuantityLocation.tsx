import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { MapPin, Edit2, Weight, DollarSign, CheckCircle } from 'lucide-react-native';
import { useOnboardingStore } from '@stores/onboarding.store';
import { useProductStore } from '@stores/product.store';
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
  const productName = product?.displayName || product?.name || productMetadata?.name || 'Product';

  const currentSpecs = buyerSpecifications[productId || ''] || {};
  const currentQuantity = currentSpecs.quantity ? parseFloat(currentSpecs.quantity.toString()) : 0;
  const currentPrice = currentSpecs.pricePerKilo || '';
  const isPresetQuantity = PRESET_QUANTITIES.includes(currentQuantity);

  useEffect(
    () => {
      if (currentQuantity > 0 && !isPresetQuantity) {
        setShowCustomInput(true);
      }
      if (!location) {
        requestLocationPermission();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

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
          const loc = reverseGeocode[0];
          setLocation({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            address:
              `${loc.street || ''} ${loc.city || ''} ${loc.region || ''} ${loc.country || ''}`.trim(),
            city: loc.city || '',
            region: loc.region || '',
            country: loc.country || '',
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
    updateBuyerSpecification(productId || '', {
      ...currentSpecs,
      quantity: quantity.toString(),
      unit: 'tons',
    });
  };

  const handleCustomQuantity = () => {
    setShowCustomInput(true);
    updateBuyerSpecification(productId || '', { ...currentSpecs, quantity: '', unit: 'tons' });
  };

  const handleCustomQuantityChange = (value: string) => {
    const numValue = value.replace(/[^0-9.]/g, '');
    updateBuyerSpecification(productId || '', { ...currentSpecs, quantity: numValue, unit: 'tons' });
  };

  const handleMaxPriceChange = (value: string) => {
    const numValue = value.replace(/[^0-9.]/g, '');
    updateBuyerSpecification(productId || '', { ...currentSpecs, pricePerKilo: numValue });
  };

  const totalBudget =
    currentQuantity > 0 && currentPrice && parseFloat(currentPrice) > 0
      ? currentQuantity * 1000 * parseFloat(currentPrice)
      : 0;

  const formatBudget = (v: number) => {
    if (v >= 1_000_000) return `€${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `€${(v / 1_000).toFixed(0)}K`;
    return `€${v.toFixed(0)}`;
  };

  return (
    <ScrollView
      style={styles.scroll}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* ── Product chip ── */}
      {(product || productMetadata) && (
        <View style={styles.productChip}>
          <View style={styles.productDot} />
          <Text style={styles.productChipText}>{productName}</Text>
        </View>
      )}

      {/* ── Delivery Location ── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconCircle}>
            <MapPin size={16} color="#4ADE80" />
          </View>
          <Text style={styles.cardTitle}>Delivery Location</Text>
          {location && <CheckCircle size={16} color="#4ADE80" style={styles.checkIcon} />}
        </View>

        {!showManualLocation ? (
          <TouchableOpacity
            style={[styles.locationRow, location && styles.locationRowFilled]}
            onPress={() => setShowManualLocation(true)}
            activeOpacity={0.75}
          >
            {loadingLocation ? (
              <ActivityIndicator size="small" color="#4ADE80" />
            ) : location ? (
              <View style={styles.locationContent}>
                <Text style={styles.locationCity}>
                  {location.city || location.address || 'Location set'}
                </Text>
                {location.region ? (
                  <Text style={styles.locationRegion}>
                    {location.region}
                    {location.country ? `, ${location.country}` : ''}
                  </Text>
                ) : null}
              </View>
            ) : (
              <Text style={styles.locationPlaceholder}>Tap to set delivery location</Text>
            )}
            <View style={styles.editBadge}>
              <Edit2 size={13} color="#4ADE80" />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.manualWrap}>
            <TextInput
              value={manualLocation}
              onChangeText={setManualLocation}
              placeholder="City or region..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              style={styles.textInput}
              autoFocus
            />
            <View style={styles.manualBtns}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={() => setShowManualLocation(false)}
              >
                <Text style={styles.btnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnConfirm} onPress={handleManualLocation}>
                <Text style={styles.btnConfirmText}>Set Location</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* ── Purchase Quantity ── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconCircle}>
            <Weight size={16} color="#4ADE80" />
          </View>
          <Text style={styles.cardTitle}>Purchase Quantity</Text>
          {currentQuantity > 0 && (
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedBadgeText}>{currentQuantity}t</Text>
            </View>
          )}
        </View>

        <View style={styles.qtyGrid}>
          {PRESET_QUANTITIES.map((qty) => {
            const active = currentQuantity === qty && !showCustomInput;
            return (
              <TouchableOpacity
                key={qty}
                style={[styles.qtyBtn, active && styles.qtyBtnActive]}
                onPress={() => handleQuantitySelect(qty)}
                activeOpacity={0.75}
              >
                <Text style={[styles.qtyBtnNum, active && styles.qtyBtnNumActive]}>{qty}</Text>
                <Text style={[styles.qtyBtnUnit, active && styles.qtyBtnUnitActive]}>tons</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {!showCustomInput ? (
          <TouchableOpacity
            style={[
              styles.customBtn,
              currentQuantity > 0 && !isPresetQuantity && styles.qtyBtnActive,
            ]}
            onPress={handleCustomQuantity}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.customBtnText,
                currentQuantity > 0 && !isPresetQuantity && styles.qtyBtnNumActive,
              ]}
            >
              {currentQuantity > 0 && !isPresetQuantity
                ? `Custom: ${currentQuantity} tons`
                : 'Custom Amount'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.customInputWrap}>
            <TextInput
              value={currentSpecs.quantity?.toString() || ''}
              onChangeText={handleCustomQuantityChange}
              placeholder="Enter quantity in tons..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              keyboardType="numeric"
              style={[styles.textInput, styles.textInputCenter]}
              autoFocus
            />
            <TouchableOpacity
              onPress={() => {
                setShowCustomInput(false);
                updateBuyerSpecification(productId || '', { ...currentSpecs, quantity: '' });
              }}
            >
              <Text style={styles.btnCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── Max Price ── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconCircle}>
            <DollarSign size={16} color="#4ADE80" />
          </View>
          <Text style={styles.cardTitle}>Maximum Price</Text>
        </View>

        <View style={styles.priceRow}>
          <TextInput
            value={currentPrice}
            onChangeText={handleMaxPriceChange}
            placeholder="0.00"
            placeholderTextColor="rgba(255,255,255,0.25)"
            keyboardType="decimal-pad"
            style={styles.priceInput}
          />
          <View style={styles.priceUnit}>
            <Text style={styles.priceUnitText}>€ / kg</Text>
          </View>
        </View>

        {/* Budget pill */}
        {totalBudget > 0 && (
          <View style={styles.budgetPill}>
            <Text style={styles.budgetLabel}>Total Budget</Text>
            <Text style={styles.budgetValue}>{formatBudget(totalBudget)}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const GREEN = '#4ADE80';
const GREEN_BG = 'rgba(74,222,128,0.12)';
const GREEN_BORDER = 'rgba(74,222,128,0.4)';
const GLASS_BG = 'rgba(255,255,255,0.05)';
const GLASS_BORDER = 'rgba(255,255,255,0.09)';

const styles = StyleSheet.create({
  btnCancel: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    flex: 1,
    marginRight: 8,
    paddingVertical: 12,
  },
  btnCancelText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  btnConfirm: {
    backgroundColor: GREEN_BG,
    borderColor: GREEN_BORDER,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 12,
  },
  btnConfirmText: {
    color: GREEN,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  budgetLabel: {
    color: 'rgba(74,222,128,0.7)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  budgetPill: {
    alignItems: 'center',
    backgroundColor: GREEN_BG,
    borderColor: GREEN_BORDER,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  budgetValue: {
    color: GREEN,
    fontSize: 18,
    fontWeight: '800',
  },
  card: {
    backgroundColor: GLASS_BG,
    borderColor: GLASS_BORDER,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
    padding: 18,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 16,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
  checkIcon: {
    marginLeft: 'auto',
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
  customInputWrap: {
    gap: 8,
    marginTop: 8,
  },
  editBadge: {
    alignItems: 'center',
    backgroundColor: GREEN_BG,
    borderColor: GREEN_BORDER,
    borderRadius: 8,
    borderWidth: 1,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: GREEN_BG,
    borderColor: GREEN_BORDER,
    borderRadius: 10,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  locationCity: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  locationContent: {
    flex: 1,
  },
  locationPlaceholder: {
    color: 'rgba(255,255,255,0.35)',
    flex: 1,
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
  locationRowFilled: {
    backgroundColor: 'rgba(74,222,128,0.05)',
    borderColor: 'rgba(74,222,128,0.25)',
  },
  manualBtns: {
    flexDirection: 'row',
    marginTop: 10,
  },
  manualWrap: {
    gap: 0,
  },
  priceInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderBottomLeftRadius: 14,
    borderColor: GLASS_BORDER,
    borderTopLeftRadius: 14,
    borderWidth: 1,
    color: '#FFFFFF',
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  priceRow: {
    flexDirection: 'row',
  },
  priceUnit: {
    alignItems: 'center',
    backgroundColor: GREEN_BG,
    borderBottomRightRadius: 14,
    borderColor: GREEN_BORDER,
    borderLeftWidth: 0,
    borderTopRightRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  priceUnitText: {
    color: GREEN,
    fontSize: 14,
    fontWeight: '800',
  },
  productChip: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(74,222,128,0.08)',
    borderColor: 'rgba(74,222,128,0.2)',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  productChipText: {
    color: 'rgba(74,222,128,0.85)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  productDot: {
    backgroundColor: GREEN,
    borderRadius: 4,
    height: 7,
    marginRight: 7,
    width: 7,
  },
  qtyBtn: {
    alignItems: 'center',
    backgroundColor: GLASS_BG,
    borderColor: GLASS_BORDER,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
    paddingVertical: 16,
    width: '48%',
  },
  qtyBtnActive: {
    backgroundColor: GREEN_BG,
    borderColor: GREEN_BORDER,
  },
  qtyBtnNum: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 20,
    fontWeight: '800',
  },
  qtyBtnNumActive: {
    color: GREEN,
  },
  qtyBtnUnit: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  qtyBtnUnitActive: {
    color: 'rgba(74,222,128,0.6)',
  },
  qtyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140,
  },
  selectedBadge: {
    backgroundColor: GREEN_BG,
    borderColor: GREEN_BORDER,
    borderRadius: 10,
    borderWidth: 1,
    marginLeft: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  selectedBadgeText: {
    color: GREEN,
    fontSize: 12,
    fontWeight: '800',
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
});
