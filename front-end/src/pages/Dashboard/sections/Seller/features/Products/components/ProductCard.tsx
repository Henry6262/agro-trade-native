import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import {
  MapPin,
  Weight,
  TrendingUp,
  Edit,
  Package,
  Eye,
  Shield,
  ShieldCheck,
  DollarSign,
} from 'lucide-react-native';

import { GlassCard, GlassBadge, COLORS } from '@design-system';
import type {
  OfferSummary,
  ProductMetadata,
  SellerProduct,
} from '@pages/Dashboard/sections/Seller/features/Products/types';
import {
  formatLocation,
  formatTimeAgo,
  getPriceRange,
  getProductImage,
} from '@pages/Dashboard/sections/Seller/features/Products/utils';

interface SellerProductCardProps {
  product: SellerProduct;
  metadata: ProductMetadata[];
  offerSummary: OfferSummary;
  onEdit: (product: SellerProduct) => void;
  onViewOffers: (product: SellerProduct, offers: OfferSummary['offers']) => void;
}

export const SellerProductCard: React.FC<SellerProductCardProps> = ({
  product,
  metadata,
  offerSummary,
  onEdit,
  onViewOffers,
}) => {
  const productImage = getProductImage(product, metadata);
  const locationStr = formatLocation(product.location);
  const timeAgo = formatTimeAgo(product.updatedAt);
  const { min: priceRangeMin, max: priceRangeMax } = getPriceRange(product, metadata);

  return (
    <View style={styles.wrapper}>
      <GlassCard tier="medium" noPadding>
        <View style={styles.row}>
          <View style={styles.imageWrap}>
            <Image source={{ uri: productImage }} style={styles.image} resizeMode="cover" />
            <View style={styles.verifyBadge}>
              {product.isVerified ? (
                <View style={styles.verifiedIcon}>
                  <ShieldCheck color="#ffffff" size={14} />
                </View>
              ) : (
                <View style={styles.unverifiedIcon}>
                  <Shield color="#ffffff" size={14} />
                </View>
              )}
            </View>
            {offerSummary.urgent > 0 && (
              <View style={styles.urgentBadge}>
                <Text style={styles.urgentText}>{offerSummary.urgent}</Text>
              </View>
            )}
          </View>

          <View style={styles.info}>
            <View style={styles.infoHeader}>
              <Text style={styles.productName}>{product.name}</Text>
              <View style={styles.locationRow}>
                <MapPin color={COLORS.textMuted} size={12} />
                <Text style={styles.locationText}>{locationStr}</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statChip}>
                <Weight color="#60A5FA" size={14} />
                <Text style={styles.statChipText}>
                  {product.quantity} {product.unit || 'tons'}
                </Text>
              </View>
              <View style={styles.priceChip}>
                <TrendingUp color={COLORS.accentGreen} size={12} />
                <Text style={styles.priceChipText}>
                  {priceRangeMin && priceRangeMax
                    ? `€${priceRangeMin}-${priceRangeMax}`
                    : 'Price TBD'}
                </Text>
              </View>
            </View>

            {product.qualityTags?.length ? (
              <View style={styles.tagsRow}>
                {product.qualityTags.slice(0, 3).map((tag, index) => (
                  <GlassBadge key={index} label={tag} variant="success" size="sm" />
                ))}
                {product.qualityTags.length > 3 && (
                  <GlassBadge
                    label={`+${product.qualityTags.length - 3}`}
                    variant="muted"
                    size="sm"
                  />
                )}
              </View>
            ) : null}

            <View style={styles.footerRow}>
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>👁 {product.views || 0}</Text>
                <Text style={styles.metaText}>💬 {product.inquiries || 0}</Text>
                <Text style={styles.metaMuted}>{timeAgo}</Text>
              </View>
              <TouchableOpacity onPress={() => onEdit(product)} style={styles.editBtn}>
                <Edit color={COLORS.textMuted} size={14} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.offersSection}>
          {offerSummary.total > 0 ? (
            <TouchableOpacity
              onPress={() => onViewOffers(product, offerSummary.offers)}
              activeOpacity={0.8}
              style={styles.offersCard}
            >
              <View style={styles.offersCardInner}>
                <View style={styles.offersLeft}>
                  <View style={styles.offersLabelRow}>
                    <Package color={COLORS.accentGreen} size={16} />
                    <Text style={styles.offersLabel}>
                      {offerSummary.total} Buyer Offer{offerSummary.total > 1 ? 's' : ''}
                    </Text>
                    {offerSummary.urgent > 0 && (
                      <GlassBadge
                        label={`${offerSummary.urgent} urgent`}
                        variant="danger"
                        size="sm"
                      />
                    )}
                  </View>
                  {offerSummary.bestOffer && (
                    <View style={styles.bestOfferRow}>
                      <DollarSign color={COLORS.accentGold} size={14} />
                      <Text style={styles.bestOfferText}>Best: €{offerSummary.bestOffer}/kg</Text>
                      {priceRangeMax && offerSummary.bestOffer > priceRangeMax && (
                        <GlassBadge
                          label={`+€${(offerSummary.bestOffer - priceRangeMax).toFixed(1)} premium`}
                          variant="success"
                          size="sm"
                        />
                      )}
                    </View>
                  )}
                </View>
                <View style={styles.viewOffersIcon}>
                  <Eye color={COLORS.accentGreen} size={20} />
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.noOffersCard}>
              <View>
                <Text style={styles.noOffersTitle}>No Offers Yet</Text>
                <Text style={styles.noOffersSubtitle}>
                  Promote this product to reach more buyers
                </Text>
              </View>
              <GlassBadge label="Boost" variant="muted" size="sm" />
            </View>
          )}
        </View>
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  bestOfferRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  bestOfferText: {
    color: COLORS.accentGold,
    fontSize: 14,
    fontWeight: '700',
  },
  editBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 99,
    padding: 8,
  },
  footerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  image: {
    height: '100%',
    width: '100%',
  },
  imageWrap: {
    height: 120,
    position: 'relative',
    width: 120,
  },
  info: {
    flex: 1,
    padding: 12,
  },
  infoHeader: {
    marginBottom: 8,
  },
  locationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  metaMuted: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metaText: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  noOffersCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
  },
  noOffersSubtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  noOffersTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  offersCard: {
    backgroundColor: 'rgba(74,222,128,0.08)',
    borderColor: 'rgba(74,222,128,0.25)',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  offersCardInner: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  offersLabel: {
    color: COLORS.accentGreen,
    fontSize: 14,
    fontWeight: '600',
  },
  offersLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  offersLeft: {
    flex: 1,
  },
  offersSection: {
    padding: 12,
    paddingTop: 0,
  },
  priceChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(74,222,128,0.12)',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  priceChipText: {
    color: COLORS.accentGreen,
    fontSize: 12,
    fontWeight: '600',
  },
  productName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
  },
  statChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statChipText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  unverifiedIcon: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 99,
    padding: 4,
  },
  urgentBadge: {
    backgroundColor: 'rgba(248,113,113,0.9)',
    borderRadius: 99,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    position: 'absolute',
    top: 8,
  },
  urgentText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  verifiedIcon: {
    backgroundColor: 'rgba(74,222,128,0.9)',
    borderRadius: 99,
    padding: 4,
  },
  verifyBadge: {
    position: 'absolute',
    right: 8,
    top: 8,
  },
  viewOffersIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(74,222,128,0.15)',
    borderColor: 'rgba(74,222,128,0.3)',
    borderRadius: 99,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    marginLeft: 12,
    width: 44,
  },
  wrapper: {
    marginBottom: 12,
  },
});
