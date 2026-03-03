// src/features/onboarding/components/CharacterTourOverlay.tsx

import React, { useEffect } from 'react';
import { View, Text, Image, Pressable, useWindowDimensions, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTourStore } from '@stores/tour.store';
import { TOUR_STEPS, SpotlightArea } from '../data/tourSteps';

// ─── Character images ────────────────────────────────────────────────────────
const CHARACTER_IMAGES = {
  buyer: require('../../../../assets/UserTypes/Buyer.png'),
  seller: require('../../../../assets/UserTypes/Seller.png'),
  transport: require('../../../../assets/UserTypes/transporter.png'),
} as const;

// ─── Spotlight (4-strip approach) ────────────────────────────────────────────
interface SpotlightProps {
  area: SpotlightArea | null;
  W: number;
  H: number;
}

const Spotlight: React.FC<SpotlightProps> = ({ area, W, H }) => {
  const DIM = 'rgba(0,0,0,0.82)';

  if (!area) {
    // Full-screen dim — no hole
    return (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: DIM }]} pointerEvents="none" />
    );
  }

  const top = area.topPct * H;
  const left = area.leftPct * W;
  const width = area.widthPct * W;
  const height = area.heightPct * H;

  return (
    <>
      {/* Top strip */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: top,
          backgroundColor: DIM,
        }}
        pointerEvents="none"
      />
      {/* Bottom strip */}
      <View
        style={{
          position: 'absolute',
          top: top + height,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: DIM,
        }}
        pointerEvents="none"
      />
      {/* Left strip */}
      <View
        style={{ position: 'absolute', top, left: 0, width: left, height, backgroundColor: DIM }}
        pointerEvents="none"
      />
      {/* Right strip */}
      <View
        style={{
          position: 'absolute',
          top,
          left: left + width,
          right: 0,
          height,
          backgroundColor: DIM,
        }}
        pointerEvents="none"
      />
      {/* Glow border around the spotlight hole */}
      <View
        style={{
          position: 'absolute',
          top: top - 2,
          left: left - 2,
          width: width + 4,
          height: height + 4,
          borderRadius: 10,
          borderWidth: 2,
          borderColor: 'rgba(74, 222, 128, 0.85)',
        }}
        pointerEvents="none"
      />
    </>
  );
};

// ─── Main overlay ────────────────────────────────────────────────────────────
export const CharacterTourOverlay: React.FC = () => {
  const { width: W, height: H } = useWindowDimensions();
  const { isTourActive, currentStep, tourRole, nextStep, skipTour, completeTour } = useTourStore();

  // Fade-in the overlay when it becomes active
  const overlayOpacity = useSharedValue(0);
  useEffect(() => {
    if (isTourActive) {
      overlayOpacity.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.ease) });
    } else {
      overlayOpacity.value = 0;
    }
  }, [isTourActive]);

  // Fade bubble when step changes
  const bubbleOpacity = useSharedValue(1);
  useEffect(() => {
    bubbleOpacity.value = 0;
    bubbleOpacity.value = withTiming(1, { duration: 250 });
  }, [currentStep]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const bubbleStyle = useAnimatedStyle(() => ({ opacity: bubbleOpacity.value }));

  if (!isTourActive || !tourRole) return null;

  const steps = TOUR_STEPS[tourRole];
  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  if (!step) {
    // Stepped past the last step — complete
    completeTour();
    return null;
  }

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, overlayStyle, { zIndex: 9999 }]}
      pointerEvents="box-none"
    >
      {/* Spotlight */}
      <Spotlight area={step.spotlight} W={W} H={H} />

      {/* Character image — bottom-right corner */}
      <Image
        source={CHARACTER_IMAGES[tourRole]}
        style={{
          position: 'absolute',
          bottom: 88,
          right: 20,
          width: 110,
          height: 110,
          resizeMode: 'contain',
        }}
      />

      {/* Speech bubble */}
      <Animated.View
        style={[
          bubbleStyle,
          {
            position: 'absolute',
            bottom: 206, // sits above character (88 + 110 + 8)
            right: 16,
            left: 20,
            backgroundColor: 'rgba(255, 255, 255, 0.97)',
            borderRadius: 18,
            padding: 18,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.25,
            shadowRadius: 12,
            elevation: 14,
          },
        ]}
      >
        {/* Bubble tail (triangle pointing down-right toward character) */}
        <View
          style={{
            position: 'absolute',
            bottom: -11,
            right: 48,
            width: 0,
            height: 0,
            borderLeftWidth: 11,
            borderRightWidth: 11,
            borderTopWidth: 11,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderTopColor: 'rgba(255, 255, 255, 0.97)',
          }}
        />

        {/* Step title */}
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 6 }}>
          {step.title}
        </Text>

        {/* Step message */}
        <Text style={{ fontSize: 14, color: '#374151', lineHeight: 20 }}>{step.message}</Text>

        {/* Footer: skip | dots | next */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 16,
          }}
        >
          {/* Skip */}
          <Pressable onPress={skipTour} hitSlop={8}>
            <Text style={{ color: '#9CA3AF', fontSize: 13, fontWeight: '500' }}>Skip</Text>
          </Pressable>

          {/* Step dots */}
          <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
            {steps.map((_, i) => (
              <View
                key={i}
                style={{
                  width: i === currentStep ? 18 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: i === currentStep ? '#4ADE80' : '#D1FAE5',
                }}
              />
            ))}
          </View>

          {/* Next / Done */}
          <Pressable
            onPress={isLastStep ? completeTour : nextStep}
            style={{
              backgroundColor: '#4ADE80',
              paddingHorizontal: 18,
              paddingVertical: 9,
              borderRadius: 22,
            }}
          >
            <Text style={{ color: '#052e16', fontWeight: '700', fontSize: 14 }}>
              {isLastStep ? 'Done 🎉' : 'Next →'}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </Animated.View>
  );
};
