import React, { useState } from 'react';
import { View, Text, Modal, Pressable, TouchableOpacity, ScrollView } from 'react-native';
import { X, ChevronLeft } from 'lucide-react-native';
import { Input } from '../../../../../../../shared/components/Input';
import { Button } from '../../../../../../../shared/components/Button';
import { ProgressIndicator } from '../shared/ProgressIndicator';
import { TruckBasicInfo } from '../../types';

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
      // Add validation feedback
      return;
    }
    onNext(formData);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <Pressable className="flex-1" onPress={onClose} />
        
        <View className="bg-neutral-900 rounded-t-3xl max-h-[90%]">
          {/* Header */}
          <View className="flex-row items-center justify-between p-6 border-b border-neutral-800">
            <View className="flex-row items-center flex-1">
              <TouchableOpacity onPress={onBack} className="mr-4">
                <ChevronLeft size={24} color="#9CA3AF" />
              </TouchableOpacity>
              <Text className="text-xl font-bold text-white">Add New Truck</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Progress Indicator */}
          <ProgressIndicator
            currentStep={0}
            totalSteps={4}
            stepLabels={['Basic Info', 'Specifications', 'Documents', 'Review']}
          />

          {/* Content */}
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
            <View className="p-6">
              <Text className="text-lg font-semibold text-white mb-4">
                Basic Information
              </Text>

              {/* License Plate */}
              <View className="mb-4">
                <Text className="text-sm text-neutral-400 mb-2">License Plate *</Text>
                <Input
                  placeholder="ABC-1234"
                  value={formData.licensePlate}
                  onChangeText={(text) => setFormData({ ...formData, licensePlate: text })}
                  className="bg-neutral-800 border-neutral-700"
                />
              </View>

              {/* Model */}
              <View className="mb-4">
                <Text className="text-sm text-neutral-400 mb-2">Truck Model/Make *</Text>
                <Input
                  placeholder="Volvo FH16"
                  value={formData.model}
                  onChangeText={(text) => setFormData({ ...formData, model: text })}
                  className="bg-neutral-800 border-neutral-700"
                />
              </View>

              {/* Year */}
              <View className="mb-4">
                <Text className="text-sm text-neutral-400 mb-2">Year of Manufacture *</Text>
                <Input
                  placeholder="2022"
                  value={formData.year}
                  onChangeText={(text) => setFormData({ ...formData, year: text })}
                  keyboardType="numeric"
                  maxLength={4}
                  className="bg-neutral-800 border-neutral-700"
                />
              </View>

              {/* Vehicle Type */}
              <View className="mb-6">
                <Text className="text-sm text-neutral-400 mb-2">Vehicle Type</Text>
                <View className="flex-row flex-wrap">
                  {vehicleTypes.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      onPress={() => setFormData({ ...formData, vehicleType: type.value as any })}
                      className={`px-4 py-2 rounded-lg mr-2 mb-2 border ${
                        formData.vehicleType === type.value
                          ? 'bg-green-500/20 border-green-500'
                          : 'bg-neutral-800 border-neutral-700'
                      }`}
                    >
                      <Text
                        className={
                          formData.vehicleType === type.value
                            ? 'text-green-400'
                            : 'text-neutral-400'
                        }
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View className="p-6 border-t border-neutral-800">
            <Button
              variant="gradient"
              className="bg-gradient-to-r from-green-600 to-green-700"
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