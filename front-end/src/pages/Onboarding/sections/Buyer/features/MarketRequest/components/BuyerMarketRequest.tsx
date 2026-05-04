import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { MapPin, ShoppingCart, Info } from 'lucide-react-native';
import type { ProductSpecification } from '@shared/types/onboarding';
import { useOnboardingStore } from '@stores/onboarding.store';
import { useProductStore } from '@stores/product.store';
import { getApiUrl } from '@shared/utils/environment';
import { BuyerSubmitDrawer } from './BuyerSubmitDrawer';

interface BuyerMarketRequestProps {
  selectedProducts: string[];
  specifications: ProductSpecification[];
  onSpecificationsChange: (specifications: ProductSpecification[]) => void;
  onComplete?: (() => void) | undefined;
}

export function BuyerMarketRequest({
  selectedProducts,
  specifications,
  onComplete,
}: BuyerMarketRequestProps) {
  const {
    selectedProductsMetadata,
    location: userLocation,
    buyerSpecifications,
  } = useOnboardingStore();
  const { products, getProductSpecifications } = useProductStore();
  const [showSubmitDrawer, setShowSubmitDrawer] = useState(false);

  const handleComplete = () => setShowSubmitDrawer(true);
  const handleDrawerComplete = () => {
    setShowSubmitDrawer(false);
    onComplete?.();
  };

  const selectedProductId = selectedProducts[0];
  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const productMetadata = selectedProductsMetadata.find((m) => m.id === selectedProductId);
  const spec = specifications[0] || (selectedProductId ? buyerSpecifications[selectedProductId] : undefined);
  const productSpecs = selectedProductId ? getProductSpecifications(selectedProductId) : [];

  const quantity = parseFloat(spec?.quantity) || 0;
  const pricePerKilo = parseFloat(spec?.pricePerKilo) || 0;
  const totalBudget = quantity * 1000 * pricePerKilo;

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `€${(value / 1000).toFixed(1)}K`;
    return `€${value.toFixed(0)}`;
  };

  const productImage = selectedProduct?.image || productMetadata?.image;
  const imageUrl = productImage
    ? productImage.startsWith('http')
      ? productImage
      : `${getApiUrl().replace('/api', '')}/static/${productImage}`
    : null;

  const productName =
    selectedProduct?.displayName ||
    selectedProduct?.name ||
    productMetadata?.name ||
    'Unknown Product';

  return (
    <>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Purchase Request</Text>
          <Text style={styles.subtitle}>Review your complete request before submitting</Text>
        </View>

        {/* Delivery Location */}
        {userLocation && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MapPin size={20} color="#4ADE80" />
              <Text style={styles.sectionTitle}>Delivery Location</Text>
            </View>
            <View style={styles.locationRow}>
              <MapPin size={16} color="rgba(74,222,128,0.6)" />
              <View style={styles.locationText}>
                <Text style={styles.locationLabel}>Delivery To</Text>
                <Text style={styles.locationValue}>
                  {userLocation.city}
                  {userLocation.country ? `, ${userLocation.country}` : ''}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Purchase Request Card */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ShoppingCart size={20} color="#4ADE80" />
            <Text style={styles.sectionTitle}>Purchase Request</Text>
          </View>

          {/* Product image */}
          {imageUrl && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUrl }} style={styles.productImage} resizeMode="cover" />
              <View style={styles.imageBadge}>
                <Text style={styles.imageBadgeText}>Purchase Request</Text>
              </View>
              <View style={styles.imageOverlay} />
            </View>
          )}

          <Text style={styles.productName}>{productName}</Text>

          {/* Requirements */}
          <View style={styles.subSection}>
            <Text style={styles.subSectionTitle}>Requirements</Text>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Quantity Required:</Text>
              <Text style={styles.dataValue}>{spec?.quantity || '0'} tons</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Maximum Price:</Text>
              <Text style={styles.dataValue}>€{pricePerKilo}/kg</Text>
            </View>
            <View style={[styles.dataRow, styles.dataRowTotal]}>
              <Text style={styles.dataLabel}>Total Budget:</Text>
              <Text style={styles.totalValue}>{formatCurrency(totalBudget)}</Text>
            </View>
          </View>

          {/* Specifications */}
          {productSpecs && productSpecs.length > 0 && spec && (
            <View style={styles.subSection}>
              <Text style={styles.subSectionTitle}>Specifications</Text>
              {productSpecs.map((prodSpec: any) => {
                const specKey = prodSpec.code || prodSpec.id;
                const specValue = spec[specKey];
                if (!specValue) return null;
                return (
                  <View key={specKey} style={styles.dataRow}>
                    <Text style={styles.dataLabel}>{prodSpec.name || specKey}:</Text>
                    <Text style={styles.dataValue}>
                      {specValue} {prodSpec.unit || ''}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Notes */}
          {spec?.notes && (
            <View style={styles.subSection}>
              <Text style={styles.subSectionTitle}>Additional Requirements</Text>
              <Text style={styles.notesText}>{spec.notes}</Text>
            </View>
          )}
        </View>

        {/* How it works */}
        <View style={styles.infoBox}>
          <Info size={16} color="#4ADE80" />
          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>How it Works</Text>
            <Text style={styles.infoBody}>
              Once submitted, your purchase request will be sent to verified sellers. You&apos;ll
              receive quotes within 24-48 hours and can choose the best offer.
            </Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton} onPress={handleComplete} activeOpacity={0.82}>
          <ShoppingCart size={20} color="#052e16" />
          <Text style={styles.submitButtonText}>Submit Purchase Request</Text>
        </TouchableOpacity>
      </ScrollView>

      {selectedProductId && (
        <BuyerSubmitDrawer
          visible={showSubmitDrawer}
          onClose={() => setShowSubmitDrawer(false)}
          productId={selectedProductId}
          specifications={spec}
          onComplete={handleDrawerComplete}
        />
      )}
    </>
  );
}

const GLASS_BG = 'rgba(255,255,255,0.06)';
const GLASS_BORDER = 'rgba(255,255,255,0.1)';
const GREEN = '#4ADE80';
const GREEN_BG = 'rgba(74,222,128,0.12)';

const styles = StyleSheet.create({
  dataLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dataRowTotal: {
    borderTopColor: 'rgba(255,255,255,0.08)',
    borderTopWidth: 1,
    marginTop: 4,
    paddingTop: 10,
  },
  dataValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  header: {
    marginBottom: 20,
  },
  imageBadge: {
    backgroundColor: 'rgba(74,222,128,0.85)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    position: 'absolute',
    right: 12,
    top: 12,
  },
  imageBadgeText: {
    color: '#052e16',
    fontSize: 11,
    fontWeight: '700',
  },
  imageContainer: {
    borderRadius: 14,
    height: 175,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  imageOverlay: {
    backgroundColor: 'rgba(3,15,9,0.3)',
    bottom: 0,
    height: 50,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  infoBody: {
    color: 'rgba(74,222,128,0.6)',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
  },
  infoBox: {
    alignItems: 'flex-start',
    backgroundColor: GREEN_BG,
    borderColor: 'rgba(74,222,128,0.2)',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 16,
    padding: 16,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    color: GREEN,
    fontSize: 14,
    fontWeight: '700',
  },
  locationLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    marginBottom: 2,
  },
  locationRow: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  locationText: {
    flex: 1,
    marginLeft: 10,
  },
  locationValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  notesText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    lineHeight: 19,
  },
  productImage: {
    height: '100%',
    width: '100%',
  },
  productName: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 14,
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
  subSection: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    padding: 14,
  },
  subSectionTitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: GREEN,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
    paddingVertical: 16,
  },
  submitButtonText: {
    color: '#052e16',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 10,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  title: {
    color: GREEN,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  totalValue: {
    color: GREEN,
    fontSize: 16,
    fontWeight: '800',
  },
});
