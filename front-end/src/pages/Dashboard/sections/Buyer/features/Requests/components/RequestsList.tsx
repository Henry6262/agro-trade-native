import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { format } from 'date-fns';
import { GlassCard, GlassBadge, COLORS } from '@design-system';
import { BuyerRequestCard } from '@shared/components/BuyerRequestCard';
import type { BuyerRequest } from '../types';

interface RequestsListProps {
  requests: BuyerRequest[];
  onOpenOffers: (request: BuyerRequest) => void;
}

function getStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'info' | 'muted' {
  switch (status) {
    case 'active':
    case 'matched':
      return 'success';
    case 'pending':
      return 'warning';
    case 'cancelled':
    case 'rejected':
      return 'danger';
    default:
      return 'info';
  }
}

export const RequestsList: React.FC<RequestsListProps> = ({ requests }) => (
  <View style={styles.list}>
    {requests.map((request) => (
      <GlassCard key={request.id} tier="subtle" style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.topLeft}>
            <Text style={styles.productName}>{request.product}</Text>
            <Text style={styles.locationText}>{request.deliveryLocation}</Text>
          </View>
          <GlassBadge label={request.status} variant={getStatusVariant(request.status)} />
        </View>

        <BuyerRequestCard
          buyerRequest={{
            id: request.id,
            product: request.product,
            quantity: request.quantity,
            unit: request.unit,
            budget: request.maxPricePerUnit ?? undefined,
            deliveryLocation: request.deliveryLocation,
            qualityRequirements: request.qualityRequirements,
            createdAt: request.created,
            offers: request.offers,
            bestOffer: request.bestOffer ?? undefined,
            status: request.status,
          }}
        />

        <View style={styles.footer}>
          <Text style={styles.footerMuted}>
            Requested {format(new Date(request.created), 'MMM dd, yyyy')}
          </Text>
          <Text style={styles.footerOffers}>{request.offers} offers</Text>
        </View>
      </GlassCard>
    ))}
  </View>
);

const styles = StyleSheet.create({
  card: {},
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  footerMuted: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  footerOffers: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    gap: 8,
  },
  locationText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  productName: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  topLeft: {
    flex: 1,
    marginRight: 8,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
});
