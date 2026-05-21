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
import { ProgressIndicator } from '../shared/ProgressIndicator';
import { COLORS } from '../../../../../../../design-system/tokens';
import { DriverInfo as DriverPersonalInfo } from '../../types';

interface DriverPersonalInfoStepProps {
  visible: boolean;
  onClose: () => void;
  onNext: (data: DriverPersonalInfo) => void;
  onBack: () => void;
  initialData?: DriverPersonalInfo | null;
}

export const DriverPersonalInfoStep: React.FC<DriverPersonalInfoStepProps> = ({
  visible,
  onClose,
  onNext,
  onBack,
  initialData,
}) => {
  const [formData, setFormData] = useState<DriverPersonalInfo>(
    initialData || {
      fullName: '',
      phoneNumber: '',
      email: '',
      dateOfBirth: '',
    }
  );

  const handleNext = () => {
    if (!formData.fullName || !formData.phoneNumber) {
      return;
    }
    onNext(formData);
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

          <ProgressIndicator
            currentStep={0}
            totalSteps={4}
            stepLabels={['Personal Info', 'Licensing', 'Documents', 'Review']}
          />

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
            <View style={styles.content}>
              <Text style={styles.sectionTitle}>Personal Information</Text>

              <GlassInput
                label="Full Name *"
                placeholder="John Smith"
                value={formData.fullName}
                onChangeText={(text) => setFormData({ ...formData, fullName: text })}
              />

              <GlassInput
                label="Phone Number *"
                placeholder="+1 (555) 123-4567"
                value={formData.phoneNumber}
                onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
                keyboardType="phone-pad"
              />

              <GlassInput
                label="Email Address"
                placeholder="john.smith@example.com"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
              />

              <GlassInput
                label="Date of Birth"
                placeholder="MM/DD/YYYY"
                value={formData.dateOfBirth}
                onChangeText={(text) => setFormData({ ...formData, dateOfBirth: text })}
                containerStyle={{ marginBottom: 0 }}
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <GlassButton label="Continue" onPress={handleNext} variant="primary" fullWidth />
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
