// src/shared/components/PhaseBadge.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

type TradePhase =
  | 'INITIATION'
  | 'SELLER_NEGOTIATION'
  | 'INSPECTION_PENDING'
  | 'INSPECTION_IN_PROGRESS'
  | 'TRANSPORT_PENDING'
  | 'TRANSPORT_MATCHING'
  | 'TRANSPORT_BIDDING'
  | 'IN_TRANSIT'
  | 'DELIVERY_CONFIRMATION'
  | 'DELIVERED'
  | 'PAYMENT_PROCESSING'
  | 'PAYMENT'
  | 'COMPLETED'
  | 'CANCELLED';

interface PhaseBadgeProps {
  phase: TradePhase | string;
}

const PHASE_STYLE: Record<string, { bg: string; text: string }> = {
  INITIATION: { bg: 'rgba(148,163,184,0.15)', text: '#94A3B8' },
  SELLER_NEGOTIATION: { bg: 'rgba(96,165,250,0.15)', text: '#60A5FA' },
  INSPECTION_PENDING: { bg: 'rgba(251,191,36,0.15)', text: '#FBBF24' },
  INSPECTION_IN_PROGRESS: { bg: 'rgba(251,191,36,0.2)', text: '#FCD34D' },
  TRANSPORT_PENDING: { bg: 'rgba(167,139,250,0.15)', text: '#A78BFA' },
  TRANSPORT_MATCHING: { bg: 'rgba(167,139,250,0.1)', text: '#A78BFA' },
  TRANSPORT_BIDDING: { bg: 'rgba(167,139,250,0.15)', text: '#A78BFA' },
  IN_TRANSIT: { bg: 'rgba(167,139,250,0.2)', text: '#C4B5FD' },
  DELIVERY_CONFIRMATION: { bg: 'rgba(52,211,153,0.15)', text: '#34D399' },
  DELIVERED: { bg: 'rgba(52,211,153,0.25)', text: '#10B981' },
  PAYMENT_PROCESSING: { bg: 'rgba(52,211,153,0.2)', text: '#6EE7B7' },
  PAYMENT: { bg: 'rgba(52,211,153,0.2)', text: '#6EE7B7' },
  COMPLETED: { bg: 'rgba(74,222,128,0.15)', text: '#4ADE80' },
  CANCELLED: { bg: 'rgba(239,68,68,0.15)', text: '#F87171' },
};

const DEFAULT_STYLE = { bg: 'rgba(255,255,255,0.08)', text: 'rgba(255,255,255,0.5)' };

export const PhaseBadge: React.FC<PhaseBadgeProps> = ({ phase }) => {
  const { t } = useTranslation();
  const style = PHASE_STYLE[phase] ?? DEFAULT_STYLE;
  const label = t(`phases.${phase}`, { defaultValue: t('phases.UNKNOWN') });
  return (
    <View style={[styles.badge, { backgroundColor: style.bg }]}>
      <Text style={[styles.label, { color: style.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
