import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../../../../../../design-system/tokens';

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
    <View style={styles.container}>
      {/* Step circles and connectors */}
      <View style={styles.row}>
        {Array.from({ length: totalSteps }, (_, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          return (
            <React.Fragment key={index}>
              {/* Circle */}
              <View
                style={[
                  styles.circle,
                  isCompleted && styles.circleCompleted,
                  isCurrent && styles.circleCurrent,
                  !isCompleted && !isCurrent && styles.circleUpcoming,
                ]}
              >
                {isCompleted ? (
                  <Text style={styles.circleCheckmark}>✓</Text>
                ) : (
                  <Text
                    style={[
                      styles.circleText,
                      isCurrent && styles.circleTextCurrent,
                      !isCompleted && !isCurrent && styles.circleTextUpcoming,
                    ]}
                  >
                    {index + 1}
                  </Text>
                )}
              </View>

              {/* Connector */}
              {index < totalSteps - 1 && (
                <View style={[styles.connector, isCompleted && styles.connectorCompleted]} />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* Step label */}
      {stepLabels[currentStep] && (
        <Text style={styles.label}>
          Step {currentStep + 1}: {stepLabels[currentStep]}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  circleCheckmark: {
    color: '#052e16',
    fontSize: 14,
    fontWeight: '800',
  },
  circleCompleted: {
    backgroundColor: '#4ADE80',
  },
  circleCurrent: {
    backgroundColor: 'transparent',
    borderColor: '#FFFFFF',
    borderWidth: 2,
  },
  circleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  circleTextCurrent: {
    color: '#FFFFFF',
  },
  circleTextUpcoming: {
    color: 'rgba(255,255,255,0.35)',
  },
  circleUpcoming: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
  },
  connector: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    flex: 1,
    height: 2,
    marginHorizontal: 4,
  },
  connectorCompleted: {
    backgroundColor: '#4ADE80',
  },
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 8,
  },
});
