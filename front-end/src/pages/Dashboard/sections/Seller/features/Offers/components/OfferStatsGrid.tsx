import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GlassCard, COLORS } from '@design-system';
import type { OfferStatCard } from '../types';

interface OfferStatsGridProps {
  cards: OfferStatCard[];
}

export const OfferStatsGrid: React.FC<OfferStatsGridProps> = ({ cards }) => (
  <View style={styles.grid}>
    {cards.map((card, idx) => (
      <GlassCard key={card.id} tier="medium" style={styles.card} delay={idx * 60}>
        <View style={styles.cardTop}>
          <card.Icon color={card.iconColor} size={22} />
          <Text style={styles.value}>{card.value}</Text>
        </View>
        <Text style={styles.label}>{card.label}</Text>
        {card.subLabel ? <Text style={styles.subLabel}>{card.subLabel}</Text> : null}
      </GlassCard>
    ))}
  </View>
);

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  cardTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  grid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  subLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  value: {
    color: COLORS.accentGold,
    fontSize: 22,
    fontWeight: '800',
  },
});
