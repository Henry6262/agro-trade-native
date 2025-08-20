import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useEffect, useRef } from 'react';

interface MultiStepFormProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onComplete: () => void;
  canProceed: boolean;
  children: React.ReactNode;
}

export function MultiStepForm({
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onComplete,
  canProceed,
  children
}: MultiStepFormProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentStep / totalSteps) * 100,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentStep, totalSteps]);

  const isLastStep = currentStep === totalSteps;

  return (
    <View style={{ flex: 1 }}>
      {/* Progress Bar */}
      <View style={{ paddingHorizontal: 24, paddingTop: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ fontSize: 14, color: '#6b7280' }}>
            Step {currentStep} of {totalSteps}
          </Text>
          <Text style={{ fontSize: 14, color: '#6b7280' }}>
            {Math.round((currentStep / totalSteps) * 100)}% Complete
          </Text>
        </View>
        <View style={{ height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
          <Animated.View
            style={{
              height: '100%',
              backgroundColor: '#10b981',
              borderRadius: 4,
              width: progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            }}
          />
        </View>
      </View>

      {/* Form Content */}
      <View style={{ flex: 1, padding: 24 }}>
        {children}
      </View>

      {/* Navigation Buttons */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb'
      }}>
        <TouchableOpacity
          onPress={onPrevious}
          disabled={currentStep === 1}
          style={{
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 8,
            backgroundColor: currentStep === 1 ? '#f3f4f6' : '#ffffff',
            borderWidth: 1,
            borderColor: '#e5e7eb',
            opacity: currentStep === 1 ? 0.5 : 1,
          }}
        >
          <Text style={{ color: currentStep === 1 ? '#9ca3af' : '#374151', fontSize: 16, fontWeight: '500' }}>
            Previous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={isLastStep ? onComplete : onNext}
          disabled={!canProceed}
          style={{
            paddingVertical: 12,
            paddingHorizontal: 32,
            borderRadius: 8,
            backgroundColor: canProceed ? '#10b981' : '#e5e7eb',
            opacity: canProceed ? 1 : 0.5,
          }}
        >
          <Text style={{ color: canProceed ? '#ffffff' : '#9ca3af', fontSize: 16, fontWeight: '600' }}>
            {isLastStep ? 'Complete' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}