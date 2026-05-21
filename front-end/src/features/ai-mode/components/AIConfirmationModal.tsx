import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { MotiView } from 'moti';
import { Check, X, AlertCircle } from 'lucide-react-native';
import { useAIModeStore } from '../store/ai-mode.store';
import { GlassButton } from '@design-system';

export const AIConfirmationModal: React.FC = () => {
  const { confirmation, hideConfirmation } = useAIModeStore();

  if (!confirmation.visible) return null;

  const handleConfirm = () => {
    // TODO: Execute the action payload
    console.log('AI Action confirmed:', confirmation.actionPayload);
    hideConfirmation();
  };

  const handleCancel = () => {
    hideConfirmation();
  };

  return (
    <Modal visible={confirmation.visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          style={styles.card}
        >
          <View style={styles.iconWrapper}>
            <AlertCircle size={32} color="#FBBF24" />
          </View>

          <Text style={styles.title}>{confirmation.title}</Text>
          <Text style={styles.description}>{confirmation.description}</Text>

          <View style={styles.actions}>
            <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
              <X size={18} color="rgba(255,255,255,0.7)" />
              <Text style={styles.cancelText}>Не</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleConfirm} style={styles.confirmBtn}>
              <Check size={18} color="#FFFFFF" />
              <Text style={styles.confirmText}>Да, потвърждавам</Text>
            </TouchableOpacity>
          </View>
        </MotiView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: 'rgba(20, 25, 35, 0.95)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cancelText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#4ADE80',
  },
  confirmText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
});
