import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Product } from '@shared/types';
import { formatCurrency } from '@shared/utils';
import { GlassCard } from '../../../design-system/GlassCard';
import { GlassBadge } from '../../../design-system/GlassBadge';
import { GlassButton } from '../../../design-system/GlassButton';
import { COLORS } from '../../../design-system/tokens';
import { ShoppingCart } from 'lucide-react-native';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onAddToCart?: () => void;
  showAddToCart?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  onAddToCart,
  showAddToCart = true,
}) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.wrapper}>
      <GlassCard tier="medium" animate={false} noPadding>
        {product.images.length > 0 && (
          <Image source={{ uri: product.images[0] }} style={styles.image} resizeMode="cover" />
        )}

        <View style={styles.body}>
          {/* Title + Price */}
          <View style={styles.titleRow}>
            <Text style={styles.productName} numberOfLines={2}>
              {product.name}
            </Text>
            <Text style={styles.price}>{formatCurrency(product.price)}</Text>
          </View>

          {/* Description */}
          <Text style={styles.description} numberOfLines={2}>
            {product.description}
          </Text>

          {/* Quantity + Organic */}
          <View style={styles.metaRow}>
            <Text style={styles.quantity}>
              {product.quantity} {product.unit} available
            </Text>
            {product.isOrganic && <GlassBadge label="Organic" variant="success" size="sm" />}
          </View>

          {/* Seller + Cart */}
          <View style={styles.footerRow}>
            <Text style={styles.seller}>{product.seller.name}</Text>
            {showAddToCart && onAddToCart && (
              <GlassButton
                label="Add"
                onPress={onAddToCart}
                variant="primary"
                size="sm"
                leftIcon={<ShoppingCart size={14} color="#FFFFFF" />}
              />
            )}
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  body: {
    padding: 16,
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  footerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  image: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: 180,
    width: '100%',
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  price: {
    color: '#FCD34D',
    fontSize: 17,
    fontWeight: '800',
  },
  productName: {
    color: COLORS.textPrimary,
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
  },
  quantity: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  seller: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  titleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  wrapper: {
    marginBottom: 16,
  },
});
