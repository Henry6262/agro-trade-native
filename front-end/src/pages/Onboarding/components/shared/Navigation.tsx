import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

interface NavigationProps {
  currentStepIndex: number;
  totalSteps: number;
  canProceedToNext: boolean;
  isAnimating: boolean;
  onBack: () => void;
  onNext: () => void;
}

export function Navigation({
  currentStepIndex,
  totalSteps,
  canProceedToNext,
  isAnimating,
  onBack,
  onNext,
}: NavigationProps) {
  const insets = useSafeAreaInsets();
  const isBackDisabled = currentStepIndex === 0 || isAnimating;
  const isNextDisabled = !canProceedToNext || currentStepIndex === totalSteps - 1 || isAnimating;
  const { width } = Dimensions.get('window');
  const isMobile = width < 768;

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom + 12,
          paddingHorizontal: isMobile ? 12 : 16,
          paddingTop: isMobile ? 12 : 14,
        },
      ]}
    >
      <View style={styles.row}>
        {/* Back button */}
        <TouchableOpacity
          style={[styles.backBtn, isBackDisabled && styles.disabled]}
          onPress={onBack}
          disabled={isBackDisabled}
          activeOpacity={0.7}
        >
          <ChevronLeft size={isMobile ? 14 : 16} color="rgba(74,222,128,0.7)" />
          <Text style={[styles.backLabel, { fontSize: isMobile ? 13 : 15 }]}>Back</Text>
        </TouchableOpacity>

        {/* Step indicator dots */}
        <View style={styles.dots}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentStepIndex && styles.dotActive,
                i < currentStepIndex && styles.dotCompleted,
              ]}
            />
          ))}
        </View>

        {/* Next button */}
        <TouchableOpacity
          style={[styles.nextBtn, isNextDisabled && styles.nextDisabled]}
          onPress={onNext}
          disabled={isNextDisabled}
          activeOpacity={0.8}
        >
          <Text style={[styles.nextLabel, { fontSize: isMobile ? 13 : 15 }]}>Next</Text>
          <ChevronRight size={isMobile ? 14 : 16} color={isNextDisabled ? '#4B5563' : '#052e16'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(74,222,128,0.22)',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    minWidth: 80,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  backLabel: {
    color: 'rgba(74,222,128,0.7)',
    fontWeight: '500',
  },
  container: {
    backgroundColor: 'rgba(3,15,9,0.95)',
    borderTopColor: 'rgba(74,222,128,0.18)',
    borderTopWidth: 1,
    bottom: 0,
    elevation: 20,
    left: 0,
    position: 'absolute',
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    zIndex: 9999,
  },
  disabled: {
    opacity: 0.35,
  },
  dot: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  dotActive: {
    backgroundColor: '#4ADE80',
    width: 18,
  },
  dotCompleted: {
    backgroundColor: 'rgba(74,222,128,0.5)',
  },
  dots: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  nextBtn: {
    alignItems: 'center',
    backgroundColor: '#4ADE80',
    borderRadius: 10,
    elevation: 8,
    flexDirection: 'row',
    gap: 4,
    minWidth: 80,
    paddingHorizontal: 18,
    paddingVertical: 10,
    shadowColor: '#4ADE80',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  nextDisabled: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    elevation: 0,
    shadowOpacity: 0,
  },
  nextLabel: {
    color: '#052e16',
    fontWeight: '700',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
