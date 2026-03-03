import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import {
  Weight,
  DollarSign,
  MapPin,
  Calendar,
  CheckCircle,
  X,
  Clock,
  AlertTriangle,
} from 'lucide-react-native';
import { GlassCard, GlassBadge, GlassButton, COLORS } from '../../../../../../../design-system';
import type { SellerOffer } from '../types';

interface SellerOfferCardProps {
  offer: SellerOffer;
  onAccept: (offer: SellerOffer) => void;
  onReject: (offer: SellerOffer) => void;
  onCounter: (offer: SellerOffer) => void;
  isProcessing: boolean;
}

function getStatusBadgeVariant(
  status: string
): 'warning' | 'success' | 'danger' | 'info' | 'muted' {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'accepted':
      return 'success';
    case 'rejected':
      return 'danger';
    case 'countered':
      return 'info';
    default:
      return 'muted';
  }
}

export const SellerOfferCard: React.FC<SellerOfferCardProps> = ({
  offer,
  onAccept,
  onReject,
  onCounter,
  isProcessing,
}) => (
  <GlassCard tier="medium" style={styles.card}>
    {/* Header row */}
    <View style={styles.headerRow}>
      <View style={styles.headerLeft}>
        <Text style={styles.productName}>{offer.product}</Text>
        <View style={styles.chipsRow}>
          <View style={styles.chip}>
            <Weight color={COLORS.accentGold} size={14} />
            <Text style={styles.chipText}>{offer.quantity} tons</Text>
          </View>
          <View style={styles.chip}>
            <DollarSign color={COLORS.accentGold} size={14} />
            <Text style={styles.goldText}>${offer.offeredPricePerTon}/ton</Text>
          </View>
          <View style={styles.totalChip}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>${offer.totalValue.toLocaleString()}</Text>
          </View>
        </View>
      </View>
      <View style={styles.headerRight}>
        <GlassBadge label={offer.status} variant={getStatusBadgeVariant(offer.status)} />
        <View style={styles.locationRow}>
          <MapPin color={COLORS.textMuted} size={12} />
          <Text style={styles.locationText}>
            {offer.buyerFlag} {offer.buyerLocation}
          </Text>
        </View>
      </View>
    </View>

    {/* Buyer notes */}
    <View style={styles.notesSection}>
      <Text style={styles.notesLabel}>Buyer Notes</Text>
      <Text style={styles.notesText}>{offer.adminNote}</Text>
    </View>

    {/* Meta chips */}
    <View style={styles.metaRow}>
      <View style={styles.chip}>
        <Calendar color={COLORS.accentGold} size={12} />
        <Text style={styles.metaText}>Deadline {offer.deadline}</Text>
      </View>
      <View style={styles.chip}>
        <Clock color={COLORS.accentGold} size={12} />
        <Text style={styles.metaText}>{offer.responseTime}</Text>
      </View>
      {offer.isExpiringSoon && (
        <View style={styles.expiringChip}>
          <AlertTriangle color={COLORS.danger} size={12} />
          <Text style={styles.expiringText}>Expiring soon</Text>
        </View>
      )}
    </View>

    {/* Profit row */}
    <View style={styles.profitCard}>
      <Text style={styles.profitLabel}>Estimated Profit</Text>
      <Text style={styles.profitValue}>+${offer.estimatedProfit.toLocaleString()}</Text>
    </View>

    {/* Quality requirements */}
    <GlassCard tier="subtle" style={styles.qualityCard}>
      <Text style={styles.qualityLabel}>Quality Requirements</Text>
      <View style={styles.qualityTags}>
        {offer.qualityRequirements.map((req) => (
          <GlassBadge key={req} label={req} variant="muted" size="sm" />
        ))}
      </View>
    </GlassCard>

    {/* Actions */}
    {offer.status === 'pending' ? (
      <View style={styles.actionsRow}>
        <GlassButton
          label={isProcessing ? '' : 'Accept'}
          onPress={() => onAccept(offer)}
          variant="primary"
          disabled={isProcessing}
          loading={isProcessing}
          style={styles.acceptBtn}
        />
        <GlassButton
          label="Reject"
          onPress={() => onReject(offer)}
          variant="danger"
          disabled={isProcessing}
          size="sm"
          style={styles.actionBtn}
        />
        <GlassButton
          label="Counter"
          onPress={() => onCounter(offer)}
          variant="ghost"
          disabled={isProcessing}
          size="sm"
          style={styles.actionBtn}
        />
      </View>
    ) : null}

    {offer.status === 'accepted' && (
      <View style={styles.statusCard}>
        <GlassBadge label="Offer Accepted" variant="success" />
        <Text style={styles.statusNote}>
          You&apos;ve accepted this offer. The buyer has been notified.
        </Text>
      </View>
    )}

    {offer.status === 'rejected' && (
      <View style={styles.statusCard}>
        <GlassBadge label="Offer Rejected" variant="danger" />
        <Text style={styles.statusNote}>
          You&apos;ve rejected this offer. The negotiation has ended.
        </Text>
      </View>
    )}

    {offer.status === 'countered' && (
      <View style={styles.statusCard}>
        <GlassBadge label="Counter Offer Sent" variant="info" />
        <Text style={styles.statusNote}>
          Waiting for buyer&apos;s response to your counter offer.
        </Text>
      </View>
    )}

    {offer.status === 'expired' && (
      <View style={styles.statusCard}>
        <GlassBadge label="Offer Expired" variant="muted" />
        <Text style={styles.statusNote}>This offer has expired and is no longer valid.</Text>
      </View>
    )}
  </GlassCard>
);

const styles = StyleSheet.create({
  acceptBtn: {
    flex: 1,
  },
  actionBtn: {},
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  card: {
    marginBottom: 12,
  },
  chip: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '500',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  expiringChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(248,113,113,0.15)',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  expiringText: {
    color: COLORS.danger,
    fontSize: 11,
    fontWeight: '600',
  },
  goldText: {
    color: COLORS.accentGold,
    fontSize: 12,
    fontWeight: '700',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 6,
    marginLeft: 8,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  locationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  metaText: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  notesLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  notesSection: {
    marginBottom: 10,
  },
  notesText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  productName: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  profitCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(74,222,128,0.1)',
    borderColor: 'rgba(74,222,128,0.25)',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    padding: 12,
  },
  profitLabel: {
    color: COLORS.accentGreen,
    fontSize: 13,
  },
  profitValue: {
    color: COLORS.accentGreen,
    fontSize: 18,
    fontWeight: '800',
  },
  qualityCard: {
    marginBottom: 12,
  },
  qualityLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  qualityTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statusCard: {
    gap: 6,
    marginTop: 8,
  },
  statusNote: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  totalChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(252,211,77,0.12)',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  totalLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  totalValue: {
    color: COLORS.accentGold,
    fontSize: 12,
    fontWeight: '700',
  },
});
