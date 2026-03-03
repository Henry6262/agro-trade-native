import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ChevronLeft, ShoppingCart } from 'lucide-react-native';
import { GradientBackground } from '../../../design-system/GradientBackground';
import { GlassCard } from '../../../design-system/GlassCard';
import { GlassButton } from '../../../design-system/GlassButton';
import { GlassBadge } from '../../../design-system/GlassBadge';
import { COLORS } from '../../../design-system/tokens';

export default function ProductDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { productId } = route.params as { productId: string };

  return (
    <GradientBackground>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* Main info card */}
        <GlassCard tier="medium" style={{ marginBottom: 16 }}>
          <View style={styles.cardHeader}>
            <Text style={styles.productTitle}>Product Details</Text>
            <GlassBadge label="Active" variant="success" />
          </View>

          <Text style={styles.productId}>ID: {productId}</Text>

          <Text style={styles.bodyText}>Product information will be loaded from the backend.</Text>
        </GlassCard>

        {/* Price card */}
        <GlassCard tier="subtle" style={{ marginBottom: 16 }}>
          <Text style={styles.priceLabel}>PRICE</Text>
          <Text style={styles.priceValue}>—</Text>
        </GlassCard>

        {/* Action */}
        <GlassButton
          label="Add to Cart"
          onPress={() => {}}
          variant="primary"
          fullWidth
          leftIcon={<ShoppingCart size={18} color="#FFFFFF" />}
        />
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  bodyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 52,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  priceLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
  },
  priceValue: {
    color: '#FCD34D',
    fontSize: 28,
    fontWeight: '800',
  },
  productId: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginBottom: 12,
  },
  productTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
});
