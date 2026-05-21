import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { X, ChevronLeft } from 'lucide-react-native';
import { GlassButton } from '../../../../../../../design-system/GlassButton';
import { GlassInput } from '../../../../../../../design-system/GlassInput';
import { COLORS } from '../../../../../../../design-system/tokens';
import { DriverInfo } from '../../types';

interface DriverInfoStepProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: DriverInfo) => void;
  onBack: () => void;
  initialData?: DriverInfo | null;
}

export const DriverInfoStep: React.FC<DriverInfoStepProps> = ({
  visible,
  onClose,
  onSubmit,
  onBack,
  initialData,
}) => {
  const [formData, setFormData] = useState<DriverInfo>(
    initialData || {
      fullName: '',
      egn: '',
      phoneNumber: '',
    }
  );

  const handleSubmit = () => {
    if (!formData.fullName || !formData.egn || !formData.phoneNumber) {
      return;
    }
    onSubmit(formData);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                <ChevronLeft size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Add New Driver</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
            <View style={styles.content}>
              <Text style={styles.sectionTitle}>Driver Information</Text>

              <GlassInput
                label="Full Name *"
                placeholder="John Smith"
                value={formData.fullName}
                onChangeText={(text) => setFormData({ ...formData, fullName: text })}
              />

              <GlassInput
                label="EGN (National ID Number) *"
                placeholder="9501011234"
                value={formData.egn}
                onChangeText={(text) => setFormData({ ...formData, egn: text })}
                keyboardType="numeric"
                maxLength={10}
              />
              <Text style={styles.hint}>10-digit Bulgarian National ID</Text>

              <GlassInput
                label="Phone Number *"
                placeholder="+359 88 123 4567"
                value={formData.phoneNumber}
                onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
                keyboardType="phone-pad"
                containerStyle={{ marginBottom: 0 }}
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <GlassButton label="Add Driver" onPress={handleSubmit} variant="primary" fullWidth />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  backdrop: {
    flex: 1,
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  footer: {
    borderTopColor: 'rgba(255,255,255,0.08)',
    borderTopWidth: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  headerLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 19,
    fontWeight: '700',
  },
  hint: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 16,
    marginLeft: 4,
    marginTop: -10,
  },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  sheet: {
    backgroundColor: 'rgba(5,46,22,0.97)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    maxHeight: '90%',
  },
});
