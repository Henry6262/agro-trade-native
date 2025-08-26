import React from 'react'
import {
  View,
  TouchableOpacity,
  Text,
  Platform,
  Dimensions,
  StyleSheet,
} from 'react-native'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react-native'

interface FixedNavigationBarProps {
  currentStepIndex: number
  totalSteps: number
  canProceedToNext: boolean
  isAnimating: boolean
  onBack: () => void
  onNext: () => void
  isLastStep?: boolean
  showProgress?: boolean
}

export function FixedNavigationBar({
  currentStepIndex,
  totalSteps,
  canProceedToNext,
  isAnimating,
  onBack,
  onNext,
  isLastStep = false,
  showProgress = true,
}: FixedNavigationBarProps) {
  const isBackDisabled = currentStepIndex === 0 || isAnimating
  const isNextDisabled = !canProceedToNext || isAnimating
  const { width } = Dimensions.get('window')
  const isMobile = width < 768
  const isSmallMobile = width < 375

  const progress = ((currentStepIndex + 1) / totalSteps) * 100

  return (
    <View style={[styles.container, { 
      paddingBottom: Platform.OS === 'ios' ? 24 : isMobile ? 12 : 16,
    }]}>
      {/* Progress Bar */}
      {showProgress && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${progress}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            Step {currentStepIndex + 1} of {totalSteps}
          </Text>
        </View>
      )}
      
      {/* Navigation Buttons Container */}
      <View style={[
        styles.buttonContainer,
        { 
          paddingHorizontal: isSmallMobile ? 12 : isMobile ? 16 : 24,
          marginTop: showProgress ? 12 : 0
        }
      ]}>
        {/* Back Button */}
        <TouchableOpacity
          style={[
            styles.backButton,
            {
              paddingHorizontal: isSmallMobile ? 10 : isMobile ? 12 : 16,
              paddingVertical: isSmallMobile ? 8 : isMobile ? 10 : 12,
              opacity: isBackDisabled ? 0.3 : 1,
            }
          ]}
          onPress={onBack}
          disabled={isBackDisabled}
          activeOpacity={0.7}
        >
          <ChevronLeft size={isSmallMobile ? 12 : isMobile ? 14 : 16} color="#9CA3AF" />
          {!isSmallMobile && (
            <Text style={[
              styles.backButtonText,
              { fontSize: isMobile ? 13 : 14 }
            ]}>
              Back
            </Text>
          )}
        </TouchableOpacity>

        {/* Step Indicator (mobile only) */}
        {isMobile && showProgress && (
          <View style={styles.mobileStepIndicator}>
            <Text style={styles.mobileStepText}>
              {currentStepIndex + 1}/{totalSteps}
            </Text>
          </View>
        )}

        {/* Next/Complete Button */}
        <TouchableOpacity
          style={[
            styles.nextButton,
            {
              paddingHorizontal: isSmallMobile ? 14 : isMobile ? 16 : 24,
              paddingVertical: isSmallMobile ? 8 : isMobile ? 10 : 12,
              backgroundColor: isNextDisabled ? '#374151' : isLastStep ? '#8B5CF6' : '#22C55E',
              opacity: isNextDisabled ? 0.3 : 1,
            }
          ]}
          onPress={onNext}
          disabled={isNextDisabled}
          activeOpacity={0.8}
        >
          {isLastStep ? (
            <>
              <Check size={isSmallMobile ? 12 : isMobile ? 14 : 16} color="white" />
              {!isSmallMobile && (
                <Text style={[
                  styles.nextButtonText,
                  { fontSize: isMobile ? 13 : 14 }
                ]}>
                  Complete
                </Text>
              )}
            </>
          ) : (
            <>
              {!isSmallMobile && (
                <Text style={[
                  styles.nextButtonText,
                  { fontSize: isMobile ? 13 : 14 }
                ]}>
                  Next
                </Text>
              )}
              <ChevronRight 
                size={isSmallMobile ? 12 : isMobile ? 14 : 16} 
                color="white" 
                style={{ marginLeft: isSmallMobile ? 0 : 4 }} 
              />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: 'rgba(17, 24, 39, 0.98)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(55, 65, 81, 0.8)',
    paddingTop: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  progressContainer: {
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(55, 65, 81, 0.5)',
    borderRadius: 2,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 2,
  },
  progressText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(31, 41, 55, 0.9)',
    borderWidth: 1,
    borderColor: '#4B5563',
    borderRadius: 8,
    minWidth: 60,
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  backButtonText: {
    color: '#9CA3AF',
    fontWeight: '500',
    marginLeft: 4,
  },
  mobileStepIndicator: {
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mobileStepText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    minWidth: 60,
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#22C55E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  nextButtonText: {
    color: 'white',
    fontWeight: '600',
    marginRight: 4,
  },
})

export default FixedNavigationBar