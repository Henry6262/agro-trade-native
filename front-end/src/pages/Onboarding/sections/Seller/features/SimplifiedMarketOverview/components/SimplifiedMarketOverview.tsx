import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { MapPin, DollarSign, Info, Weight, TrendingUp } from 'lucide-react-native';
import { useOnboardingStore } from '@stores/onboarding.store';
import { useProductStore } from '@stores/product.store';
import { useAuthStore } from '@stores/auth.store';
import { SellOptionsDrawer } from '@pages/Onboarding/sections/Seller/features/SellOptions/components/SellOptionsDrawer';
import { APP_CONFIG } from '@shared/constants';

export interface CreateListingDTO {
  productId: string;
  quantity: number;
  unit: string;
  offerType: 'listing' | 'custom-offer';
  location: {
    latitude: number;
    longitude: number;
    city?: string;
    region?: string;
    country?: string;
    address?: string;
  };
  specifications?: Record<string, any>;
  priceExpectation?: { min?: number; max?: number; currency: string };
  sellerId?: string;
  status: 'draft' | 'active' | 'pending';
  createdAt?: Date;
}

interface SimplifiedMarketOverviewProps {
  selectedProducts: string[];
  specifications: any;
  onComplete?: () => void;
}

export function SimplifiedMarketOverview({
  selectedProducts = [],
  onComplete,
}: SimplifiedMarketOverviewProps) {
  const {
    location,
    sellerSpecifications,
    selectedProducts: storeSelectedProducts,
  } = useOnboardingStore();
  const { products } = useProductStore();
  const { user } = useAuthStore();
  const [showSellDrawer, setShowSellDrawer] = useState(false);

  const productList = selectedProducts.length > 0 ? selectedProducts : storeSelectedProducts;
  const productId = productList?.[0];
  const product = products.find((p) => p.id === productId);
  const productSpecs = sellerSpecifications[productId] || {};

  const handleSellClick = () => setShowSellDrawer(true);
  const handleDrawerComplete = () => {
    setShowSellDrawer(false);
    onComplete?.();
  };

  const buildListingDTO = (): CreateListingDTO | null => {
    if (!productId || !product) return null;
    const quantity = parseFloat(productSpecs.quantity || '0');
    const unit = productSpecs.unit || product?.defaultUnit || 'TON';
    const offerType = productSpecs.action || 'listing';
    const priceMin = parseFloat(product?.priceRangeMin || '0');
    const priceMax = parseFloat(product?.priceRangeMax || '0');
    const dto: CreateListingDTO = {
      productId,
      quantity,
      unit,
      offerType: offerType as 'listing' | 'custom-offer',
      location: {
        latitude: location?.latitude || 0,
        longitude: location?.longitude || 0,
        city: location?.city,
        region: location?.region,
        country: location?.country,
        address: location?.address,
      },
      status: 'draft',
    };
    if (offerType === 'custom-offer' && productSpecs.specifications) {
      dto.specifications = productSpecs.specifications;
    }
    if (priceMin > 0 || priceMax > 0) {
      dto.priceExpectation = { min: priceMin, max: priceMax, currency: 'USD' };
    }
    if (user?.id) dto.sellerId = user.id;
    return dto;
  };

  const calculateEstimatedValue = () => {
    const quantity = parseFloat(productSpecs.quantity || '0');
    const priceMin = parseFloat(product?.priceRangeMin || '0');
    const priceMax = parseFloat(product?.priceRangeMax || '0');
    return { min: quantity * priceMin, max: quantity * priceMax };
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const estimatedValue = calculateEstimatedValue();

  if (!productId || !product) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>
          No product selected. Please go back and select a product.
        </Text>
      </View>
    );
  }

  const imageUrl = product.image
    ? product.image.startsWith('http')
      ? product.image
      : `${APP_CONFIG.API_URL.replace('/api', '')}/static/${product.image}`
    : null;

  const isCustomOffer = productSpecs.action === 'custom-offer';

  return (
    <>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Listing Overview</Text>
          <Text style={styles.subtitle}>Review your listing details before submitting</Text>
        </View>

        {/* Product Card */}
        <View style={styles.section}>
          {imageUrl && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUrl }} style={styles.productImage} resizeMode="cover" />
              <View
                style={[
                  styles.typeBadge,
                  isCustomOffer ? styles.typeBadgeCustom : styles.typeBadgeListing,
                ]}
              >
                <Text style={styles.typeBadgeText}>
                  {isCustomOffer ? 'Custom Offer' : 'Marketplace Listing'}
                </Text>
              </View>
              <View style={styles.imageOverlay} />
            </View>
          )}

          <Text style={styles.productName}>{product.displayName || product.name}</Text>
          <Text style={styles.productCategory}>{product.category.replace(/_/g, ' ')}</Text>

          {/* Metrics grid */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Weight size={13} color="#4ADE80" />
                <Text style={styles.metricLabel}>Quantity</Text>
              </View>
              <Text style={styles.metricValue}>
                {productSpecs.quantity || '0'} {productSpecs.unit || product.defaultUnit || 'TON'}
              </Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <MapPin size={13} color="#4ADE80" />
                <Text style={styles.metricLabel}>Location</Text>
              </View>
              <Text style={styles.metricValue} numberOfLines={1}>
                {location?.city || location?.address || 'Not set'}
              </Text>
            </View>
          </View>

          {/* Estimated value */}
          {(estimatedValue.min > 0 || estimatedValue.max > 0) && (
            <View style={styles.estimatedValue}>
              <View style={styles.metricHeader}>
                <DollarSign size={13} color="#4ADE80" />
                <Text style={styles.estimatedLabel}>Estimated Value</Text>
              </View>
              <Text style={styles.estimatedAmount}>
                {formatCurrency(estimatedValue.min)} – {formatCurrency(estimatedValue.max)}
              </Text>
            </View>
          )}
        </View>

        {/* Info box */}
        <View style={styles.infoBox}>
          <Info size={16} color="#4ADE80" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Ready to Sell</Text>
            <Text style={styles.infoBody}>
              Choose between a quick marketplace listing or a custom offer with detailed
              specifications.
            </Text>
          </View>
        </View>

        {/* Sell Button */}
        <TouchableOpacity style={styles.sellButton} onPress={handleSellClick} activeOpacity={0.82}>
          <TrendingUp size={20} color="#052e16" />
          <Text style={styles.sellButtonText}>Sell</Text>
        </TouchableOpacity>

        {/* Dev DTO preview */}
        {__DEV__ && (
          <View style={styles.devBox}>
            <Text style={styles.devLabel}>DTO Preview:</Text>
            <Text style={styles.devText}>{JSON.stringify(buildListingDTO() || {}, null, 2)}</Text>
          </View>
        )}
      </ScrollView>

      {productId && (
        <SellOptionsDrawer
          visible={showSellDrawer}
          onClose={() => setShowSellDrawer(false)}
          productId={productId}
          onComplete={handleDrawerComplete}
        />
      )}
    </>
  );
}

const GLASS_BG = 'rgba(255,255,255,0.06)';
const GLASS_BORDER = 'rgba(255,255,255,0.1)';
const GREEN = '#4ADE80';
const GREEN_BG = 'rgba(74,222,128,0.1)';
const GREEN_BORDER = 'rgba(74,222,128,0.2)';

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  devBox: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: GLASS_BORDER,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    padding: 12,
  },
  devLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontFamily: 'monospace',
    fontSize: 11,
    marginBottom: 6,
  },
  devText: {
    color: 'rgba(255,255,255,0.25)',
    fontFamily: 'monospace',
    fontSize: 10,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 14,
    textAlign: 'center',
  },
  estimatedAmount: {
    color: GREEN,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  estimatedLabel: {
    color: GREEN,
    fontSize: 12,
    marginLeft: 5,
  },
  estimatedValue: {
    backgroundColor: GREEN_BG,
    borderColor: GREEN_BORDER,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
    padding: 12,
  },
  header: {
    marginBottom: 20,
  },
  imageContainer: {
    borderRadius: 14,
    height: 175,
    marginBottom: 14,
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
    borderColor: GREEN_BORDER,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 16,
    padding: 16,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    color: GREEN,
    fontSize: 14,
    fontWeight: '700',
  },
  metricCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: GLASS_BORDER,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
  },
  metricHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 5,
  },
  metricLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    marginLeft: 5,
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    marginBottom: 10,
    marginHorizontal: -4,
    marginTop: 14,
  },
  productCategory: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginTop: 3,
    textTransform: 'capitalize',
  },
  productImage: {
    height: '100%',
    width: '100%',
  },
  productName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
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
  sellButton: {
    alignItems: 'center',
    backgroundColor: GREEN,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
    paddingVertical: 16,
  },
  sellButtonText: {
    color: '#052e16',
    fontSize: 17,
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
  typeBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    position: 'absolute',
    right: 12,
    top: 12,
  },
  typeBadgeCustom: {
    backgroundColor: 'rgba(74,222,128,0.88)',
  },
  typeBadgeListing: {
    backgroundColor: 'rgba(96,165,250,0.88)',
  },
  typeBadgeText: {
    color: '#052e16',
    fontSize: 11,
    fontWeight: '700',
  },
});
