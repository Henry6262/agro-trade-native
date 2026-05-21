import React from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, StyleSheet } from 'react-native';
import { Truck, User, X } from 'lucide-react-native';
import { GlassCard } from '../../../../../../../design-system/GlassCard';
import { COLORS } from '../../../../../../../design-system/tokens';

interface CreationTypeSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelectType: (type: 'truck' | 'driver') => void;
}

export const CreationTypeSelector: React.FC<CreationTypeSelectorProps> = ({
  visible,
  onClose,
  onSelectType,
}) => {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Add to Fleet</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.subtitle}>Choose what you want to add to your fleet</Text>

            {/* Truck Option */}
            <TouchableOpacity
              onPress={() => onSelectType('truck')}
              activeOpacity={0.75}
              style={styles.optionWrap}
            >
              <GlassCard
                tier="subtle"
                animate={false}
                style={[styles.optionCard, styles.optionCardGreen]}
              >
                <View style={styles.optionRow}>
                  <View style={styles.optionIconWrapGreen}>
                    <Truck size={32} color="#4ADE80" />
                  </View>
                  <View style={styles.optionTextWrap}>
                    <Text style={styles.optionTitle}>Add New Truck</Text>
                    <Text style={styles.optionDesc}>Register a new vehicle to your fleet</Text>
                  </View>
                </View>
              </GlassCard>
            </TouchableOpacity>

            {/* Driver Option */}
            <TouchableOpacity
              onPress={() => onSelectType('driver')}
              activeOpacity={0.75}
              style={styles.optionWrap}
            >
              <GlassCard
                tier="subtle"
                animate={false}
                style={[styles.optionCard, styles.optionCardBlue]}
              >
                <View style={styles.optionRow}>
                  <View style={styles.optionIconWrapBlue}>
                    <User size={32} color="#60A5FA" />
                  </View>
                  <View style={styles.optionTextWrap}>
                    <Text style={styles.optionTitle}>Add New Driver</Text>
                    <Text style={styles.optionDesc}>Add a driver to operate your vehicles</Text>
                  </View>
                </View>
              </GlassCard>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  optionCard: {
    borderWidth: 1,
  },
  optionCardBlue: {
    borderColor: 'rgba(96,165,250,0.3)',
    shadowColor: '#60A5FA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  optionCardGreen: {
    borderColor: 'rgba(74,222,128,0.3)',
    shadowColor: '#4ADE80',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  optionDesc: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  optionIconWrapBlue: {
    alignItems: 'center',
    backgroundColor: 'rgba(96,165,250,0.15)',
    borderRadius: 32,
    height: 64,
    justifyContent: 'center',
    marginRight: 16,
    width: 64,
  },
  optionIconWrapGreen: {
    alignItems: 'center',
    backgroundColor: 'rgba(74,222,128,0.15)',
    borderRadius: 32,
    height: 64,
    justifyContent: 'center',
    marginRight: 16,
    width: 64,
  },
  optionRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  optionTextWrap: {
    flex: 1,
  },
  optionTitle: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  optionWrap: {
    marginBottom: 12,
  },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: 'rgba(5,46,22,0.97)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 20,
  },
});
