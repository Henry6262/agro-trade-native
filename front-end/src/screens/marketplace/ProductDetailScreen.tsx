import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import {
  ArrowLeft,
  MapPin,
  Star,
  Package,
  User,
  ShoppingCart,
  MessageCircle,
} from 'lucide-react-native';

import { RootStackParamList } from '../../navigation/types';
import { productService } from '../../services/productService';
import { Product } from '../../shared/types';
import { GradientBackground, GlassCard, GlassButton, GlassBadge, COLORS } from '../../design-system';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import { EmptyState } from '../../shared/components/EmptyState';

type ProductDetailRouteProp = RouteProp<RootStackParamList, 'ProductDetail'>;
type NavigationProp = any;

export default function ProductDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ProductDetailRouteProp>();
  const { productId } = route.params;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await productService.getProduct(productId);
      setProduct(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleMakeOffer = () => {
    Alert.alert(
      'Make an Offer',
      `You're about to make an offer for ${quantity} ${product?.unit} of ${product?.name} at $${product?.price}/${product?.unit}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Offer',
          onPress: () => {
            Alert.alert('Offer Sent', 'Your offer has been sent to the seller. You will be notified when they respond.');
          },
        },
      ]
    );
  };

  const handleContactSeller = () => {
    Alert.alert('Contact Seller', `Opening chat with ${product?.seller?.name || 'the seller'}...`);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Product Details</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.center}>
          <LoadingSpinner message="Loading product..." />
        </View>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Product Details</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.center}>
          <EmptyState
            title="Error"
            subtitle={error || 'Product not found'}
            cta="Go Back"
            onPress={() => navigation.goBack()}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {product.name}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Image placeholder */}
        <GlassCard tier="medium" style={styles.imageCard} noPadding animate={false}>
          <View style={styles.imagePlaceholder}>
            <Package size={48} color="rgba(255,255,255,0.2)" />
            <Text style={styles.imagePlaceholderText}>{product.category?.name || 'Product'}</Text>
          </View>
        </GlassCard>

        {/* Title & Price */}
        <View style={styles.titleRow}>
          <View style={styles.titleLeft}>
            <Text style={styles.productName}>{product.name}</Text>
            <View style={styles.metaRow}>
              <GlassBadge
                label={product.quality?.grade || 'A'}
                variant="success"
                size="sm"
              />
              {product.isOrganic && (
                <GlassBadge label="ORGANIC" variant="gold" size="sm" />
              )}
            </View>
          </View>
          <View style={styles.priceBlock}>
            <Text style={styles.price}>${product.price}</Text>
            <Text style={styles.priceUnit}>/{product.unit}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <GlassCard tier="subtle" style={styles.statCard} animate={false}>
            <Text style={styles.statValue}>{product.quantity}</Text>
            <Text style={styles.statLabel}>{product.unit} available</Text>
          </GlassCard>
          <GlassCard tier="subtle" style={styles.statCard} animate={false}>
            <Text style={styles.statValue}>{product.certifications?.length || 0}</Text>
            <Text style={styles.statLabel}>Certifications</Text>
          </GlassCard>
        </View>

        {/* Description */}
        <GlassCard tier="medium" style={styles.sectionCard} animate={false}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{product.description}</Text>
        </GlassCard>

        {/* Seller Info */}
        <GlassCard tier="medium" style={styles.sectionCard} animate={false}>
          <Text style={styles.sectionTitle}>Seller</Text>
          <View style={styles.sellerRow}>
            <User size={16} color="rgba(255,255,255,0.5)" />
            <Text style={styles.sellerName}>{product.seller?.name || 'Unknown Seller'}</Text>
          </View>
          {product.location && (
            <View style={styles.sellerRow}>
              <MapPin size={16} color="rgba(255,255,255,0.5)" />
              <Text style={styles.sellerLocation}>
                {product.location.city}, {product.location.country}
              </Text>
            </View>
          )}
        </GlassCard>

        {/* Quality */}
        {product.quality && (
          <GlassCard tier="medium" style={styles.sectionCard} animate={false}>
            <Text style={styles.sectionTitle}>Quality</Text>
            <Text style={styles.qualityText}>
              Grade {product.quality.grade}: {product.quality.description}
            </Text>
            {product.quality.certifiedBy && (
              <Text style={styles.qualityCertifier}>
                Certified by {product.quality.certifiedBy}
              </Text>
            )}
          </GlassCard>
        )}

        {/* Certifications */}
        {product.certifications?.length ? (
          <GlassCard tier="medium" style={styles.sectionCard} animate={false}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            <View style={styles.certRow}>
              {product.certifications.map((cert, idx) => (
                <GlassBadge key={idx} label={cert} variant="info" size="sm" />
              ))}
            </View>
          </GlassCard>
        ) : null}
      </ScrollView>

      {/* Action Footer */}
      <View style={styles.footer}>
        <GlassButton
          label="Contact Seller"
          onPress={handleContactSeller}
          variant="ghost"
          size="md"
          style={styles.footerBtn}
          leftIcon={<MessageCircle size={16} color={COLORS.textSecondary} />}
        />
        <GlassButton
          label="Make Offer"
          onPress={handleMakeOffer}
          variant="primary"
          size="md"
          style={styles.footerBtnPrimary}
          leftIcon={<ShoppingCart size={16} color="#fff" />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#021207',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  imageCard: {
    marginBottom: 16,
    height: 200,
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  imagePlaceholderText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 14,
    marginTop: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleLeft: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priceBlock: {
    alignItems: 'flex-end',
  },
  price: {
    color: COLORS.accentGold,
    fontSize: 24,
    fontWeight: '800',
  },
  priceUnit: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
  },
  statValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  sectionCard: {
    marginBottom: 12,
    padding: 16,
  },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  descriptionText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    lineHeight: 20,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  sellerName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sellerLocation: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },
  qualityText: {
    color: '#fff',
    fontSize: 14,
  },
  qualityCertifier: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  certRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: 'rgba(10,15,10,0.95)',
  },
  footerBtn: {
    flex: 1,
  },
  footerBtnPrimary: {
    flex: 2,
  },
});
