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
import { GlassCard } from '../../../../../../../design-system/GlassCard';
import { GlassButton } from '../../../../../../../design-system/GlassButton';
import { GlassInput } from '../../../../../../../design-system/GlassInput';
import { ProgressIndicator } from '../shared/ProgressIndicator';
import { COLORS } from '../../../../../../../design-system/tokens';
import { TruckInfo as TruckBasicInfo } from '../../types';

interface TruckBasicInfoStepProps {
  visible: boolean;
  onClose: () => void;
  onNext: (data: TruckBasicInfo) => void;
  onBack: () => void;
  initialData?: TruckBasicInfo | null;
}

export const TruckBasicInfoStep: React.FC<TruckBasicInfoStepProps> = ({
  visible,
  onClose,
  onNext,
  onBack,
  initialData,
}) => {
  const [formData, setFormData] = useState<TruckBasicInfo>(
    initialData || {
      licensePlate: '',
      model: '',
      year: '',
      vehicleType: 'flatbed',
    }
  );

  const vehicleTypes = [
    { value: 'flatbed', label: 'Flatbed' },
    { value: 'refrigerated', label: 'Refrigerated' },
    { value: 'tanker', label: 'Tanker' },
    { value: 'box', label: 'Box Truck' },
    { value: 'other', label: 'Other' },
  ];

  const handleNext = () => {
    if (!formData.licensePlate || !formData.model || !formData.year) {
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
              <Text style={styles.headerTitle}>Add New Truck</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ProgressIndicator
            currentStep={0}
            totalSteps={4}
            stepLabels={['Basic Info', 'Specifications', 'Documents', 'Review']}
          />

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
            <View style={styles.content}>
              <Text style={styles.sectionTitle}>Basic Information</Text>

              <GlassInput
                label="License Plate *"
                placeholder="ABC-1234"
                value={formData.licensePlate}
                onChangeText={(text) => setFormData({ ...formData, licensePlate: text })}
              />

              <GlassInput
                label="Truck Model/Make *"
                placeholder="Volvo FH16"
                value={formData.model}
                onChangeText={(text) => setFormData({ ...formData, model: text })}
              />

              <GlassInput
                label="Year of Manufacture *"
                placeholder="2022"
                value={formData.year}
                onChangeText={(text) => setFormData({ ...formData, year: text })}
                keyboardType="numeric"
                maxLength={4}
              />

              {/* Vehicle Type */}
              <View style={{ marginBottom: 8 }}>
                <Text style={styles.label}>VEHICLE TYPE</Text>
                <View style={styles.typeRow}>
                  {vehicleTypes.map((type) => {
                    const isSelected = formData.vehicleType === type.value;
                    return (
                      <TouchableOpacity
                        key={type.value}
                        onPress={() => setFormData({ ...formData, vehicleType: type.value as any })}
                        style={[styles.typeChip, isSelected && styles.typeChipSelected]}
                      >
                        <Text
                          style={[styles.typeChipText, isSelected && styles.typeChipTextSelected]}
                        >
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
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
  label: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
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
  typeChip: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  typeChipSelected: {
    backgroundColor: 'rgba(74,222,128,0.15)',
    borderColor: '#4ADE80',
  },
  typeChipText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  typeChipTextSelected: {
    color: '#4ADE80',
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
