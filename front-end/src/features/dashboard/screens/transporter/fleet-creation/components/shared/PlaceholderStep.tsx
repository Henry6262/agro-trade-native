import React from 'react';
import { View, Text, Modal, Pressable, TouchableOpacity } from 'react-native';
import { X, ChevronLeft } from 'lucide-react-native';
import { Button } from '../../../../../../../shared/components/Button';
import { ProgressIndicator } from './ProgressIndicator';

interface PlaceholderStepProps {
  visible: boolean;
  onClose: () => void;
  onNext: () => void;
  onBack: () => void;
  stepName: string;
  stepNumber: number;
  totalSteps: number;
  stepLabels: string[];
  isLastStep?: boolean;
  onSubmit?: () => void;
  flowType: 'truck' | 'driver';
}

export const PlaceholderStep: React.FC<PlaceholderStepProps> = ({
  visible,
  onClose,
  onNext,
  onBack,
  stepName,
  stepNumber,
  totalSteps,
  stepLabels,
  isLastStep = false,
  onSubmit,
  flowType,
}) => {
  const handleAction = () => {
    if (isLastStep && onSubmit) {
      onSubmit();
    } else {
      onNext();
    }
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
              <Text className="text-xl font-bold text-white">
                {flowType === 'truck' ? 'Add New Truck' : 'Add New Driver'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Progress Indicator */}
          <ProgressIndicator
            currentStep={stepNumber}
            totalSteps={totalSteps}
            stepLabels={stepLabels}
          />

          {/* Content */}
          <View className="p-6">
            <Text className="text-lg font-semibold text-white mb-4">{stepName}</Text>

            <View className="bg-neutral-800 rounded-lg p-8 items-center">
              <Text className="text-neutral-400 text-center mb-2">This step is coming soon</Text>
              <Text className="text-neutral-500 text-sm text-center">
                Click continue to proceed to the next step
              </Text>
            </View>
          </View>

          {/* Footer Actions */}
          <View className="p-6 border-t border-neutral-800">
            <Button
              variant="gradient"
              className={`bg-gradient-to-r ${
                flowType === 'truck' ? 'from-green-600 to-green-700' : 'from-blue-600 to-blue-700'
              }`}
              onPress={handleAction}
            >
              <Text className="text-white font-semibold">{isLastStep ? 'Submit' : 'Continue'}</Text>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};
