import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { X, ChevronUp, ChevronDown } from 'lucide-react-native';
import { COLORS } from '@design-system';
import { PriceAlert } from '../../../../../stores/market.store';

interface AlertPillProps {
  alert: PriceAlert;
  onRemove: (id: string) => void;
}

export const AlertPill: React.FC<AlertPillProps> = ({ alert, onRemove }) => {
  const isAbove = alert.condition === 'above';
  const conditionColor = isAbove ? COLORS.accentGreen : COLORS.danger;
  const ConditionIcon = isAbove ? ChevronUp : ChevronDown;

  return (
    <View style={[styles.pill, alert.triggered && styles.pillTriggered]}>
      <View style={styles.left}>
        <ConditionIcon size={12} color={conditionColor} />
        <Text style={styles.symbol}>{alert.symbol}</Text>
        <Text style={[styles.condition, { color: conditionColor }]}>
          {alert.condition.toUpperCase()}
        </Text>
        <Text style={styles.threshold}>${alert.threshold.toFixed(2)}</Text>
      </View>
      {alert.triggered ? (
        <Text style={styles.triggered}>TRIGGERED</Text>
      ) : (
        <TouchableOpacity
          onPress={() => onRemove(alert.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X size={14} color={COLORS.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  condition: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  left: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  pill: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillTriggered: {
    backgroundColor: 'rgba(74,222,128,0.08)',
    borderColor: 'rgba(74,222,128,0.25)',
  },
  symbol: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  threshold: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  triggered: {
    color: COLORS.accentGreen,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});
