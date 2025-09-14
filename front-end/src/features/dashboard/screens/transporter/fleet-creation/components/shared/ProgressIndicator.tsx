import React from 'react';
import { View, Text } from 'react-native';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
  stepLabels = [],
}) => {
  return (
    <View className="px-6 py-4">
      {/* Progress Bar */}
      <View className="flex-row items-center mb-2">
        {Array.from({ length: totalSteps }, (_, index) => (
          <React.Fragment key={index}>
            {/* Step Circle */}
            <View
              className={`w-8 h-8 rounded-full items-center justify-center ${
                index < currentStep
                  ? 'bg-green-500'
                  : index === currentStep
                  ? 'bg-blue-500'
                  : 'bg-neutral-700'
              }`}
            >
              <Text className="text-white text-xs font-bold">{index + 1}</Text>
            </View>
            
            {/* Connector Line */}
            {index < totalSteps - 1 && (
              <View
                className={`flex-1 h-1 mx-2 ${
                  index < currentStep ? 'bg-green-500' : 'bg-neutral-700'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </View>
      
      {/* Step Label */}
      {stepLabels[currentStep] && (
        <Text className="text-center text-sm text-neutral-400">
          Step {currentStep + 1}: {stepLabels[currentStep]}
        </Text>
      )}
    </View>
  );
};