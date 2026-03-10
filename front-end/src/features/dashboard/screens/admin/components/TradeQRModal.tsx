import React, { useCallback } from 'react';
import { Modal, View, Text, StyleSheet, Image, TouchableOpacity, Share } from 'react-native';
import { X, Share2 } from 'lucide-react-native';
import { GlassCard, GlassButton, COLORS } from '../../../../../design-system';
import { traceabilityService } from '../../../../../services/traceabilityService';

interface TradeQRModalProps {
  visible: boolean;
  tradeOperationId: string;
  onClose: () => void;
}

export const TradeQRModal: React.FC<TradeQRModalProps> = ({
  visible,
  tradeOperationId,
  onClose,
}) => {
  const qrUrl = tradeOperationId ? traceabilityService.getQRUrl(tradeOperationId) : '';

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `Verify this AgroAI trade: ${qrUrl}`,
        url: qrUrl,
      });
    } catch {
      // ignore share cancellation
    }
  }, [qrUrl]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <GlassCard tier="strong" style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Trade QR Code</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>Scan to verify: {tradeOperationId.slice(0, 12)}...</Text>

          {qrUrl !== '' && (
            <Image source={{ uri: qrUrl }} style={styles.qrImage} resizeMode="contain" />
          )}

          <GlassButton
            label="Share QR"
            onPress={handleShare}
            leftIcon={<Share2 size={16} color={COLORS.textPrimary} />}
          />
        </GlassCard>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  closeBtn: {
    padding: 4,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modal: {
    alignItems: 'center',
    gap: 12,
    maxWidth: 320,
    width: '100%',
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  qrImage: {
    height: 200,
    width: 200,
  },
  subtitle: {
    alignSelf: 'flex-start',
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TradeQRModal;
