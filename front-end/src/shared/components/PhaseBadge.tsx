// src/shared/components/PhaseBadge.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

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

const PHASE_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  INITIATION: { label: 'Initiated', bg: 'rgba(148,163,184,0.15)', text: '#94A3B8' },
  SELLER_NEGOTIATION: { label: 'Negotiating', bg: 'rgba(96,165,250,0.15)', text: '#60A5FA' },
  INSPECTION_PENDING: { label: 'Inspection Pending', bg: 'rgba(251,191,36,0.15)', text: '#FBBF24' },
  INSPECTION_IN_PROGRESS: { label: 'Inspecting', bg: 'rgba(251,191,36,0.2)', text: '#FCD34D' },
  TRANSPORT_PENDING: { label: 'Transport Pending', bg: 'rgba(167,139,250,0.15)', text: '#A78BFA' },
  TRANSPORT_MATCHING: { label: 'Finding Transport', bg: 'rgba(167,139,250,0.1)', text: '#A78BFA' },
  TRANSPORT_BIDDING: { label: 'Transport Bidding', bg: 'rgba(167,139,250,0.15)', text: '#A78BFA' },
  IN_TRANSIT: { label: 'In Transit', bg: 'rgba(167,139,250,0.2)', text: '#C4B5FD' },
  DELIVERY_CONFIRMATION: { label: 'Confirming', bg: 'rgba(52,211,153,0.15)', text: '#34D399' },
  DELIVERED: { label: 'Delivered', bg: 'rgba(52,211,153,0.25)', text: '#10B981' },
  PAYMENT_PROCESSING: { label: 'Payment', bg: 'rgba(52,211,153,0.2)', text: '#6EE7B7' },
  PAYMENT: { label: 'Payment', bg: 'rgba(52,211,153,0.2)', text: '#6EE7B7' },
  COMPLETED: { label: 'Completed', bg: 'rgba(74,222,128,0.15)', text: '#4ADE80' },
  CANCELLED: { label: 'Cancelled', bg: 'rgba(239,68,68,0.15)', text: '#F87171' },
};

const DEFAULT_CONFIG = { label: 'Unknown', bg: 'rgba(255,255,255,0.08)', text: 'rgba(255,255,255,0.5)' };

export const PhaseBadge: React.FC<PhaseBadgeProps> = ({ phase }) => {
  const config = PHASE_CONFIG[phase] ?? DEFAULT_CONFIG;
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.label, { color: config.text }]}>{config.label}</Text>
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
