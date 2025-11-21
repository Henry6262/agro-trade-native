import React, { useState } from 'react';
import { View, Text, Modal, Pressable, TouchableOpacity, ScrollView } from 'react-native';
import { X, ChevronLeft } from 'lucide-react-native';
import { Input } from '@shared/components/Input';
import { Button } from '@shared/components/Button';
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
      // Add validation feedback
      return;
    }
    onSubmit(formData);
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

          {/* Content - No progress indicator needed for single step */}
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
            <View className="p-6">
              <Text className="text-lg font-semibold text-white mb-4">Driver Information</Text>

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

              {/* EGN (Bulgarian National ID) */}
              <View className="mb-4">
                <Text className="text-sm text-neutral-400 mb-2">EGN (National ID Number) *</Text>
                <Input
                  placeholder="9501011234"
                  value={formData.egn}
                  onChangeText={(text) => setFormData({ ...formData, egn: text })}
                  keyboardType="numeric"
                  maxLength={10}
                  className="bg-neutral-800 border-neutral-700"
                />
                <Text className="text-xs text-neutral-500 mt-1">
                  10-digit Bulgarian National ID
                </Text>
              </View>

              {/* Phone Number */}
              <View className="mb-6">
                <Text className="text-sm text-neutral-400 mb-2">Phone Number *</Text>
                <Input
                  placeholder="+359 88 123 4567"
                  value={formData.phoneNumber}
                  onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
                  keyboardType="phone-pad"
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
              onPress={handleSubmit}
            >
              <Text className="text-white font-semibold">Add Driver</Text>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};
