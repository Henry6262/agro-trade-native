import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Shield, CheckCircle, AlertTriangle } from 'lucide-react-native';
import { GlassCard, GlassButton, GlassBadge, COLORS } from '../../../../../design-system';
import { escrowService, EscrowStatus } from '../../../../../services/escrowService';

interface EscrowStatusCardProps {
  tradeOperationId: string;
  isAdmin?: boolean;
}

const STATE_LABELS: Record<string, string> = {
  AWAITING_PAYMENT: 'Awaiting Payment',
  AWAITING_DELIVERY: 'Funds Secured',
  COMPLETE: 'Payment Released',
  DISPUTED: 'Dispute Active',
  REFUNDED: 'Refunded',
  UNKNOWN: 'Not Set Up',
};

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'gold';

function getStateBadgeVariant(state: string): BadgeVariant {
  switch (state) {
    case 'COMPLETE':
      return 'success';
    case 'DISPUTED':
      return 'danger';
    case 'REFUNDED':
      return 'muted';
    default:
      return 'info';
  }
}

export const EscrowStatusCard: React.FC<EscrowStatusCardProps> = ({
  tradeOperationId,
  isAdmin = false,
}) => {
  const [status, setStatus] = useState<EscrowStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const data = await escrowService.getStatus(tradeOperationId);
      setStatus(data);
    } catch {
      // Escrow not created yet
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [tradeOperationId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleRelease = useCallback(() => {
    Alert.alert(
      'Release Payment',
      'Are you sure you want to release the escrowed funds to the seller?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Release',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await escrowService.releaseFunds(tradeOperationId);
              await fetchStatus();
            } catch (err: unknown) {
              const message = err instanceof Error ? err.message : 'Failed to release funds';
              Alert.alert('Error', message);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  }, [tradeOperationId, fetchStatus]);

  const handleDispute = useCallback(() => {
    Alert.alert('Raise Dispute', 'This will freeze the payment and flag the trade for review.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Raise Dispute',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(true);
          try {
            await escrowService.raiseDispute(tradeOperationId);
            await fetchStatus();
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to raise dispute';
            Alert.alert('Error', message);
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  }, [tradeOperationId, fetchStatus]);

  return (
    <GlassCard tier="medium" style={styles.card}>
      <View style={styles.header}>
        <Shield size={18} color={COLORS.accentGreen} />
        <Text style={styles.title}>Blockchain Escrow</Text>
        {loading && <ActivityIndicator size="small" color={COLORS.accentGreen} />}
      </View>

      {status ? (
        <>
          <GlassBadge
            label={STATE_LABELS[status.state] ?? status.state}
            variant={getStateBadgeVariant(status.state)}
            size="sm"
          />
          <Text style={styles.meta}>State: {status.state}</Text>

          {isAdmin && !actionLoading && status.state === 'AWAITING_DELIVERY' && (
            <View style={styles.actions}>
              <GlassButton
                label="Release Payment"
                onPress={handleRelease}
                leftIcon={<CheckCircle size={14} color={COLORS.textPrimary} />}
              />
              <GlassButton
                label="Raise Dispute"
                onPress={handleDispute}
                leftIcon={<AlertTriangle size={14} color={COLORS.textPrimary} />}
                variant="danger"
              />
            </View>
          )}

          {actionLoading && <ActivityIndicator color={COLORS.accentGreen} />}
        </>
      ) : (
        <Text style={styles.notSetup}>
          No escrow configured for this trade. Set up via admin API.
        </Text>
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  actions: { gap: 8 },
  card: { gap: 10 },
  header: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  meta: { color: COLORS.textSecondary, fontSize: 12 },
  notSetup: { color: COLORS.textSecondary, fontSize: 12, fontStyle: 'italic' },
  title: { color: COLORS.textPrimary, flex: 1, fontSize: 14, fontWeight: '600' },
});

export default EscrowStatusCard;
