import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MapPin, DollarSign, Weight, Calendar, Star } from 'lucide-react-native';
import { GlassCard, GlassBadge, GlassButton, COLORS } from '../../../../../../../design-system';
import type { SellerTrade, TradeStage } from '../types';
import { getTradeStages } from '../utils';
import { TradeStageTimeline } from './TradeStageTimeline';

function getStatusBadgeVariant(
  status: string
): 'success' | 'warning' | 'danger' | 'info' | 'muted' {
  switch (status) {
    case 'Completed':
      return 'success';
    case 'Traveling':
    case 'Scheduled':
      return 'info';
    case 'Awaiting Departure':
      return 'warning';
    case 'At Location':
      return 'info';
    default:
      return 'muted';
  }
}

interface SellerTradeCardProps {
  trade: SellerTrade;
}

export const SellerTradeCard: React.FC<SellerTradeCardProps> = ({ trade }) => {
  const [expanded, setExpanded] = useState(false);
  const stages: TradeStage[] = getTradeStages();

  return (
    <GlassCard tier="subtle" style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.productName}>{trade.product}</Text>
          <View style={styles.chipsRow}>
            <View style={styles.chip}>
              <Weight color={COLORS.accentGreen} size={14} />
              <Text style={styles.chipText}>{trade.quantity} tons</Text>
            </View>
            <View style={styles.chip}>
              <DollarSign color={COLORS.accentGold} size={14} />
              <Text style={styles.goldText}>${trade.agreedPricePerTon}/ton</Text>
            </View>
            <View style={styles.totalChip}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>${trade.price.toLocaleString()}</Text>
            </View>
          </View>
        </View>
        <GlassBadge label={trade.status} variant={getStatusBadgeVariant(trade.status)} />
      </View>

      {/* Stage timeline */}
      <TradeStageTimeline currentStage={trade.currentStage} stages={stages} />

      {/* Meta row */}
      <View style={styles.metaRow}>
        <View style={styles.chip}>
          <MapPin color={COLORS.accentGold} size={12} />
          <Text style={styles.metaText}>
            {trade.buyerFlag} {trade.buyerLocation}
          </Text>
        </View>
        <View style={styles.chip}>
          <Text style={styles.metaMuted}>Transporter:</Text>
          <Text style={styles.metaText}>{trade.transporter}</Text>
        </View>
        <View style={styles.chip}>
          <Calendar color={COLORS.accentGold} size={12} />
          <Text style={styles.metaText}>Pickup {trade.pickupDate}</Text>
        </View>
      </View>

      {/* Expand toggle */}
      <View style={styles.expandRow}>
        <GlassButton
          label={expanded ? 'Hide Details' : 'View Details'}
          onPress={() => setExpanded((prev) => !prev)}
          variant="ghost"
          size="sm"
        />
      </View>

      {/* Expanded details */}
      {expanded && (
        <GlassCard tier="subtle" style={styles.detailsCard}>
          <View style={styles.detailSection}>
            <Text style={styles.detailTitle}>Transport Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>License Plate:</Text>
              <Text style={styles.detailValueMono}>{trade.licensePlate}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Fleet Size:</Text>
              <Text style={styles.detailValue}>{trade.transporterTrucks} trucks</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Rating:</Text>
              <View style={styles.ratingRow}>
                <Star color="#EAB308" size={12} fill="#EAB308" />
                <Text style={styles.detailValue}>4.8/5</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailSection}>
            <Text style={styles.detailTitle}>Trade Summary</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Quantity:</Text>
              <Text style={styles.detailValue}>{trade.quantity} tons</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Price/ton:</Text>
              <Text style={styles.detailValue}>${trade.agreedPricePerTon}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Value:</Text>
              <Text style={styles.detailValueGold}>${trade.price.toLocaleString()}</Text>
            </View>
          </View>
        </GlassCard>
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 8,
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
  detailLabel: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  detailRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailSection: {
    gap: 6,
  },
  detailTitle: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  detailValue: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
  detailValueGold: {
    color: COLORS.accentGold,
    fontSize: 13,
    fontWeight: '700',
  },
  detailValueMono: {
    color: COLORS.textPrimary,
    fontFamily: 'monospace',
    fontSize: 13,
  },
  detailsCard: {
    marginTop: 12,
  },
  divider: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    height: 1,
    marginVertical: 10,
  },
  expandRow: {
    alignItems: 'center',
  },
  goldText: {
    color: COLORS.accentGold,
    fontSize: 12,
    fontWeight: '700',
  },
  headerLeft: {
    flex: 1,
    marginRight: 8,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaMuted: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
    marginTop: 8,
  },
  metaText: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  productName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  ratingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  totalChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(74,222,128,0.1)',
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
    color: COLORS.accentGreen,
    fontSize: 12,
    fontWeight: '700',
  },
});
