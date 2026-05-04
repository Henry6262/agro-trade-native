import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar, Clock, Package } from 'lucide-react-native';
import { GlassCard, GlassBadge, GlassButton, COLORS } from '@design-system';
import type { BuyerIncomingOffer } from '../types';

interface IncomingOffersListProps {
  offers: BuyerIncomingOffer[];
}

const OfferCard = React.memo(({ offer }: { offer: BuyerIncomingOffer }) => {
  const handleViewDetails = (offerId: string) => {
    // TODO: Navigate to offer details
    console.log('View details for offer:', offerId);
  };

  const handleAcceptOffer = (offerId: string) => {
    // TODO: Trigger accept offer flow
    console.log('Accept offer:', offerId);
  };

  return (
    <GlassCard tier="medium" style={styles.card}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.productName} numberOfLines={1}>
            {offer.product}
          </Text>
          <Text style={styles.sellerInfo} numberOfLines={1}>
            {offer.sellerFlag ? `${offer.sellerFlag} ` : ''}
            {offer.seller} • {offer.sellerLocation}
          </Text>
        </View>
        <GlassBadge label="New Offer" variant="success" size="sm" />
      </View>

      {/* Metrics row */}
      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Quantity</Text>
          <Text style={styles.metricValue}>{offer.quantity} tons</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Price/ton</Text>
          <Text style={[styles.metricValue, { color: COLORS.accentGold }]}>
            ${offer.offeredPricePerTon}
          </Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Total</Text>
          <Text style={[styles.metricValue, { color: COLORS.accentGold }]}>
            ${offer.totalValue.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Quality badges */}
      {offer.qualityOffered.length > 0 && (
        <View style={styles.qualityTags}>
          {offer.qualityOffered.map((quality) => (
            <GlassBadge key={quality} label={quality} variant="muted" size="sm" />
          ))}
        </View>
      )}

      {/* Info Box */}
      <View style={styles.infoBox}>
        <View style={styles.infoRow}>
          <Calendar size={12} color={COLORS.info} />
          <Text style={styles.infoText}>Delivery {offer.deliveryDate}</Text>
        </View>
        <View style={styles.infoRow}>
          <Clock size={12} color={COLORS.danger} />
          <Text style={styles.infoText}>Deadline {offer.deadline}</Text>
        </View>
      </View>

      {/* Admin note (conditional) */}
      {!!offer.adminNote && (
        <View style={styles.noteSection}>
          <Text style={styles.noteText}>{offer.adminNote}</Text>
        </View>
      )}

      {/* CTAs */}
      <View style={styles.actions}>
        <GlassButton
          label="DETAILS"
          variant="ghost"
          size="sm"
          style={{ flex: 1 }}
          onPress={() => handleViewDetails(offer.id)}
        />
        <GlassButton
          label="ACCEPT OFFER"
          variant="primary"
          size="sm"
          style={{ flex: 1.5 }}
          onPress={() => handleAcceptOffer(offer.id)}
        />
      </View>
    </GlassCard>
  );
});

OfferCard.displayName = 'OfferCard';

export const IncomingOffersList: React.FC<IncomingOffersListProps> = ({ offers }) => {
  if (offers.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Package size={40} color="rgba(255,255,255,0.05)" />
        <Text style={styles.emptyText}>No incoming offers at the moment.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {offers.map((offer) => (
        <OfferCard key={offer.id} offer={offer} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  card: {
    marginBottom: 12,
  },
  container: {
    gap: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 12,
  },
  headerLeft: {
    flex: 1,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  infoBox: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 16,
    padding: 10,
  },
  infoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  infoText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  metric: {
    flex: 1,
  },
  metricLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  metricValue: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  metricsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  noteSection: {
    borderLeftColor: COLORS.accentGold,
    borderLeftWidth: 2,
    marginTop: 12,
    paddingLeft: 10,
  },
  noteText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
  },
  productName: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  qualityTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  sellerInfo: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
});
