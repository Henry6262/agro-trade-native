import React, { useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { GlassCard, GlassBadge, GlassButton } from '../../../../../design-system';
import { MapOffer } from '../maps/types';

interface OfferCardProps {
  offer: MapOffer;
  onViewRoute?: (offer: MapOffer) => void | Promise<void>;
}

interface ExtendedMapOffer extends MapOffer {
  estimatedDistance?: number;
}

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'gold';

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  pending: 'warning',
  delivered: 'success',
  active: 'info',
};

/**
 * Offer card component with View Route button — Bold Fintech Glassmorphism
 */
export const OfferCard: React.FC<OfferCardProps> = ({ offer, onViewRoute }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const extendedOffer = offer as ExtendedMapOffer;
  const trucksNeeded = Math.ceil(offer.quantity / 40);
  const isDelivered = offer.status === 'delivered';

  const handleViewRoute = async () => {
    if (!onViewRoute || isDelivered) return;

    setIsLoading(true);
    setHasError(false);

    try {
      await onViewRoute(offer);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonLabel = () => {
    if (hasError) return 'Route Unavailable';
    if (isLoading) return 'Calculating...';
    return 'View Route';
  };

  const badgeVariant: BadgeVariant = STATUS_VARIANT[offer.status] ?? 'muted';

  return (
    <GlassCard tier="medium" style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.productType}>
            {offer.productType.charAt(0).toUpperCase() + offer.productType.slice(1)}
          </Text>
          <Text style={styles.quantity}>{offer.quantity} tons</Text>
        </View>
        <GlassBadge label={offer.status.toUpperCase()} variant={badgeVariant} />
      </View>

      {/* Separator */}
      <View style={styles.separator} />

      {/* Location Info */}
      <View style={styles.locationSection}>
        <View style={styles.locationRow}>
          <MapPin size={13} color="rgba(255,255,255,0.4)" />
          <Text style={styles.locationLabel}>From: </Text>
          <Text style={styles.locationValue}>{offer.pickup.name || offer.pickup.address.city}</Text>
        </View>
        <View style={styles.locationRow}>
          <MapPin size={13} color="#FCD34D" />
          <Text style={styles.locationLabel}>To: </Text>
          <Text style={styles.locationValue}>
            {offer.delivery.name || offer.delivery.address.city}
          </Text>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <Text style={styles.statText}>{trucksNeeded} trucks needed</Text>
        {extendedOffer.estimatedDistance && (
          <Text style={styles.statText}>~{extendedOffer.estimatedDistance} km</Text>
        )}
      </View>

      {/* Value and Deadline */}
      <View style={styles.valueRow}>
        <Text style={styles.valueText}>QAR {offer.estimatedValue.toLocaleString()}</Text>
        <Text style={styles.deadlineText}>
          Due: {new Date(offer.deadline).toLocaleDateString()}
        </Text>
      </View>

      {/* Separator */}
      <View style={styles.separator} />

      {/* View Route Button */}
      {isLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#4ADE80" />
          <Text style={styles.loadingText}>Calculating route...</Text>
        </View>
      ) : (
        <GlassButton
          label={getButtonLabel()}
          onPress={handleViewRoute}
          variant={hasError ? 'danger' : isDelivered ? 'secondary' : 'primary'}
          size="md"
          fullWidth
          disabled={isDelivered}
          leftIcon={<MapPin size={16} color="#FFFFFF" testID="map-icon" />}
        />
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  deadlineText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  loadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
  },
  locationLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '600',
  },
  locationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  locationSection: {
    gap: 6,
    marginBottom: 10,
  },
  locationValue: {
    color: 'rgba(255,255,255,0.8)',
    flex: 1,
    fontSize: 13,
  },
  productType: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  quantity: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    marginTop: 2,
  },
  separator: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    height: 1,
    marginVertical: 12,
  },
  statText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  valueRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  valueText: {
    color: '#FCD34D',
    fontSize: 15,
    fontWeight: '700',
  },
});
