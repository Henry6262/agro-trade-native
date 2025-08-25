import React, { useEffect, useRef } from 'react'
import {
  View,
  Text,
  Animated,
} from 'react-native'
import { Check } from 'lucide-react-native'
import type { OnboardingStep } from '../../../types/onboarding'

interface ProgressSidebarProps {
  steps: OnboardingStep[]
  currentStepIndex: number
  progressLineHeight: number
  isAnimating: boolean
}

export function ProgressSidebar({ steps, currentStepIndex, progressLineHeight, isAnimating }: ProgressSidebarProps) {
  const progressAnimation = useRef(new Animated.Value(0)).current
  const pulseAnimation = useRef(new Animated.Value(1)).current
  const opacityAnimation = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    Animated.timing(progressAnimation, {
      toValue: progressLineHeight,
      duration: 1200,
      useNativeDriver: false,
    }).start()
  }, [progressLineHeight])

  useEffect(() => {
    const pulse = Animated.sequence([
      Animated.parallel([
        Animated.timing(pulseAnimation, {
          toValue: 1.15,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnimation, {
          toValue: 0.8,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnimation, {
          toValue: 0.3,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ])

    const loopAnimation = Animated.loop(pulse)
    loopAnimation.start()

    return () => loopAnimation.stop()
  }, [currentStepIndex, pulseAnimation, opacityAnimation])

  return (
    <View style={{
      width: 120,
      backgroundColor: '#1F2937',
      borderRightWidth: 1,
      borderRightColor: '#374151',
      alignItems: 'center',
      paddingVertical: 32,
      position: 'relative'
    }}>
      <View style={{
        position: 'absolute',
        left: '50%',
        marginLeft: -1,
        top: 68, // Adjusted for circle size
        bottom: 68, // Adjusted for circle size
        width: 2,
        backgroundColor: '#374151'
      }}>
        <Animated.View
          style={{
            width: '100%',
            backgroundColor: '#22C55E',
            borderRadius: 1,
            position: 'relative',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
            height: progressAnimation,
          }}
        >
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#10B981',
            borderRadius: 1,
            opacity: 0.6
          }} />
        </Animated.View>
      </View>

      <View style={{ position: 'relative', zIndex: 10 }}>
        {steps.map((step, index) => (
          <View
            key={step.id}
            style={{
              alignItems: 'center',
              marginBottom: index < steps.length - 1 ? 40 : 0
            }}
          >
            <Animated.View
              style={[
                {
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  backgroundColor: index < currentStepIndex
                    ? '#22C55E'
                    : index === currentStepIndex
                      ? '#FCD34D' // Yellow background for active step
                      : '#374151',
                  borderWidth: index === currentStepIndex ? 3 : 2,
                  borderColor: index === currentStepIndex 
                    ? '#F59E0B' // Yellow border for active step
                    : index < currentStepIndex 
                      ? '#22C55E'
                      : '#6B7280',
                  shadowColor: index === currentStepIndex ? '#F59E0B' : '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: index === currentStepIndex ? 0.6 : 0.2,
                  shadowRadius: index === currentStepIndex ? 8 : 4,
                  elevation: index === currentStepIndex ? 8 : 4
                },
                index === currentStepIndex && {
                  transform: [{ scale: pulseAnimation }],
                  shadowColor: '#F59E0B',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: opacityAnimation,
                  shadowRadius: 12,
                  elevation: 10
                },
              ]}
            >
              {index < currentStepIndex ? (
                <Check size={16} color="white" />
              ) : (
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: index === currentStepIndex 
                    ? '#92400E' // Dark yellow text for active step
                    : index < currentStepIndex 
                      ? 'white' 
                      : '#9CA3AF'
                }}>
                  {index + 1}
                </Text>
              )}
            </Animated.View>

            <View style={{ alignItems: 'center', marginTop: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: '500', color: '#9CA3AF', textAlign: 'center' }}>{step.title}</Text>
              <Text style={{ fontSize: 10, color: '#6B7280', textAlign: 'center', marginTop: 2 }}>{step.description}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{
        position: 'absolute',
        bottom: 16,
        backgroundColor: 'rgba(31, 41, 55, 0.8)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#374151'
      }}>
        <Text style={{
          fontSize: 12,
          fontWeight: '600',
          color: '#9CA3AF'
        }}>
          {Math.round(progressLineHeight)}%
        </Text>
      </View>
    </View>
  )
}