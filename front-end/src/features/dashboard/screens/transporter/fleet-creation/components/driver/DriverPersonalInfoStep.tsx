import React, { useState } from 'react';
import { View, Text, Modal, Pressable, TouchableOpacity, ScrollView } from 'react-native';
import { X, ChevronLeft } from 'lucide-react-native';
import { Input } from '../../../../../../../shared/components/Input';
import { Button } from '../../../../../../../shared/components/Button';
import { ProgressIndicator } from '../shared/ProgressIndicator';
import { DriverPersonalInfo } from '../../types';

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
      // Add validation feedback
      return;
    }
    onNext(formData);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <Pressable className="flex-1" onPress={onClose} />

        <View className="bg-neutral-900 rounded-t-3xl max-h-[90%]">
          {/* Header */}
          <View className="flex-row items-center justify-between p-6 border-b border-neutral-800">
            <View className="flex-row items-center flex-1">
              <TouchableOpacity onPress={onBack} className="mr-4">
                <ChevronLeft size={24} color="#9CA3AF" />
              </TouchableOpacity>
              <Text className="text-xl font-bold text-white">Add New Driver</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Progress Indicator */}
          <ProgressIndicator
            currentStep={0}
            totalSteps={4}
            stepLabels={['Personal Info', 'Licensing', 'Documents', 'Review']}
          />

          {/* Content */}
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
            <View className="p-6">
              <Text className="text-lg font-semibold text-white mb-4">Personal Information</Text>

              {/* Full Name */}
              <View className="mb-4">
                <Text className="text-sm text-neutral-400 mb-2">Full Name *</Text>
                <Input
                  placeholder="John Smith"
                  value={formData.fullName}
                  onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                  className="bg-neutral-800 border-neutral-700"
                />
              </View>

              {/* Phone Number */}
              <View className="mb-4">
                <Text className="text-sm text-neutral-400 mb-2">Phone Number *</Text>
                <Input
                  placeholder="+1 (555) 123-4567"
                  value={formData.phoneNumber}
                  onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
                  keyboardType="phone-pad"
                  className="bg-neutral-800 border-neutral-700"
                />
              </View>

              {/* Email */}
              <View className="mb-4">
                <Text className="text-sm text-neutral-400 mb-2">Email Address</Text>
                <Input
                  placeholder="john.smith@example.com"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  keyboardType="email-address"
                  className="bg-neutral-800 border-neutral-700"
                />
              </View>

              {/* Date of Birth */}
              <View className="mb-6">
                <Text className="text-sm text-neutral-400 mb-2">Date of Birth</Text>
                <Input
                  placeholder="MM/DD/YYYY"
                  value={formData.dateOfBirth}
                  onChangeText={(text) => setFormData({ ...formData, dateOfBirth: text })}
                  className="bg-neutral-800 border-neutral-700"
                />
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View className="p-6 border-t border-neutral-800">
            <Button
              variant="gradient"
              className="bg-gradient-to-r from-blue-600 to-blue-700"
              onPress={handleNext}
            >
              <Text className="text-white font-semibold">Continue</Text>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};
