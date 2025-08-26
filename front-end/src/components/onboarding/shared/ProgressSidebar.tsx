import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  Animated,
  Platform,
} from 'react-native'
import { Check, Leaf } from 'lucide-react-native'
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
  const glowAnimation = useRef(new Animated.Value(0)).current

  // Calculate progress based on completed steps
  useEffect(() => {
    const totalSteps = steps.length - 1;
    const completedSteps = currentStepIndex;
    const progressPercent = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
    
    Animated.timing(progressAnimation, {
      toValue: progressPercent,
      duration: 800,
      useNativeDriver: false,
    }).start()
  }, [currentStepIndex, steps.length])

  // Pulsating animation for current step
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnimation, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnimation, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ])
    )

    pulse.start()
    return () => pulse.stop()
  }, [currentStepIndex, pulseAnimation, glowAnimation])

  // Calculate centered positioning for steps with 60% coverage
  const [containerHeight, setContainerHeight] = useState(600); // Default height
  const containerRef = useRef<View>(null);
  
  // Calculate dimensions
  const availableHeight = containerHeight * 0.6; // Use 60% of container height
  const stepSpacing = steps.length > 1 ? availableHeight / (steps.length - 1) : 0;
  const progressHeight = steps.length > 1 ? availableHeight : 0;
  
  // Center the progress area vertically
  const logoHeight = 120; // Approximate logo section height
  const bottomPadding = 80; // Space for percentage display
  const contentHeight = containerHeight - logoHeight - bottomPadding;
  const verticalOffset = (contentHeight - progressHeight) / 2;
  const startOffset = logoHeight + verticalOffset;

  return (
    <View 
      ref={containerRef}
      style={{ 
        width: 75, 
        height: '100%', 
        backgroundColor: '#1f2937', 
        borderRightWidth: 1, 
        borderRightColor: '#4b5563',
        alignItems: 'center',
        position: 'relative'
      }}
      onLayout={(event) => {
        const { height } = event.nativeEvent.layout;
        setContainerHeight(height);
      }}
    >
      {/* Logo Section */}
      <View style={{
        paddingTop: 24,
        paddingBottom: 32,
        alignItems: 'center',
      }}>
        <View style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: '#22c55e',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 8,
        }}>
          <Leaf size={24} color="white" />
        </View>
        <Text style={{
          color: '#22c55e',
          fontSize: 12,
          fontWeight: 'bold',
          letterSpacing: 0.5,
        }}>
          AGRO
        </Text>
        <Text style={{
          color: '#9ca3af',
          fontSize: 10,
          fontWeight: '500',
        }}>
          TRADE
        </Text>
      </View>

      {/* Progress Container */}
      <View style={{
        position: 'absolute',
        top: startOffset,
        width: '100%',
        alignItems: 'center',
        height: progressHeight,
      }}>
        {/* Progress Line Background */}
        <View style={{
          position: 'absolute',
          left: '50%',
          marginLeft: -1,
          top: 0,
          height: progressHeight,
          width: 2,
          backgroundColor: '#374151',
        }}>
          {/* Animated Progress Line */}
          <Animated.View 
            style={{
              width: 2,
              backgroundColor: '#22c55e',
              position: 'absolute',
              top: 0,
              left: 0,
              height: progressAnimation.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            }}
          />
        </View>

        {/* Steps */}
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isPending = index > currentStepIndex;
          
          return (
            <View
              key={step.id}
              style={{
                position: 'absolute',
                alignItems: 'center',
                top: index * stepSpacing - 16, // Center the circle on the position
                width: '100%',
              }}
            >
              {/* Step Circle Container */}
              <View style={{
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
              }}>
                {/* Glow effect for current step */}
                {isCurrent && (
                  <Animated.View
                    style={{
                      position: 'absolute',
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: '#fbbf24',
                      opacity: glowAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.3, 0.6],
                      }),
                      transform: [{ 
                        scale: glowAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.5],
                        })
                      }],
                    }}
                  />
                )}
                
                {/* Main Step Circle */}
                <Animated.View
                  style={[
                    {
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isCompleted ? '#22c55e' : isCurrent ? '#fbbf24' : '#374151',
                      borderWidth: isCurrent ? 2 : 0,
                      borderColor: isCurrent ? '#f59e0b' : 'transparent',
                      elevation: isCurrent ? 4 : 0,
                      shadowColor: isCurrent ? '#fbbf24' : 'transparent',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isCurrent ? 0.3 : 0,
                      shadowRadius: 4,
                    },
                    isCurrent && {
                      transform: [{ scale: pulseAnimation }],
                    },
                  ]}
                >
                  {isCompleted ? (
                    <Check size={16} color="white" strokeWidth={3} />
                  ) : (
                    <Text style={{
                      fontSize: 14,
                      fontWeight: '700',
                      color: isCurrent ? '#78350f' : isPending ? '#6b7280' : '#d1d5db'
                    }}>
                      {index + 1}
                    </Text>
                  )}
                </Animated.View>
              </View>

              {/* Step Labels - Below circles, only show for current step */}
              {isCurrent && (
                <View style={{ 
                  position: 'absolute',
                  top: 40,
                  width: 80,
                  alignItems: 'center',
                }}>
                  <Text style={{
                    fontSize: 10,
                    fontWeight: '600',
                    color: '#fbbf24',
                    textAlign: 'center',
                    marginBottom: 2,
                  }} numberOfLines={2}>
                    {step.title}
                  </Text>
                  <Text style={{
                    fontSize: 8,
                    color: '#9ca3af',
                    textAlign: 'center',
                  }} numberOfLines={2}>
                    {step.description}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Progress Percentage Display */}
      <View style={{
        position: 'absolute',
        bottom: 24,
        alignItems: 'center',
      }}>
        <Text style={{
          color: '#22c55e',
          fontSize: 18,
          fontWeight: 'bold',
        }}>
          {Math.round((currentStepIndex / (steps.length - 1)) * 100)}%
        </Text>
        <Text style={{
          color: '#6b7280',
          fontSize: 10,
          marginTop: 2,
        }}>
          Complete
        </Text>
      </View>
    </View>
  )
}