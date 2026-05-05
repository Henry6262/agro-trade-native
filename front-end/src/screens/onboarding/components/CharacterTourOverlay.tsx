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
import { TOUR_STEPS, SpotlightArea } from '../tourSteps';

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

/* eslint-disable react-native/no-inline-styles -- Spotlight strips require runtime-computed pixel dimensions */
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
      {/* Top strip — height is runtime-computed from screen dimensions */}
      <View
        style={[styles.strip, { top: 0, left: 0, right: 0, height: top, backgroundColor: DIM }]}
        pointerEvents="none"
      />
      {/* Bottom strip — top offset is runtime-computed */}
      <View
        style={[
          styles.strip,
          { top: top + height, left: 0, right: 0, bottom: 0, backgroundColor: DIM },
        ]}
        pointerEvents="none"
      />
      {/* Left strip — width is runtime-computed */}
      <View
        style={[styles.strip, { top, left: 0, width: left, height, backgroundColor: DIM }]}
        pointerEvents="none"
      />
      {/* Right strip — left offset is runtime-computed */}
      <View
        style={[styles.strip, { top, left: left + width, right: 0, height, backgroundColor: DIM }]}
        pointerEvents="none"
      />
      {/* Glow border around the spotlight hole */}
      <View
        style={[
          styles.spotlightGlow,
          {
            top: top - 2,
            left: left - 2,
            width: width + 4,
            height: height + 4,
          },
        ]}
        pointerEvents="none"
      />
    </>
  );
};
/* eslint-enable react-native/no-inline-styles */

// ─── Main overlay ────────────────────────────────────────────────────────────
export const CharacterTourOverlay: React.FC = () => {
  const { width: W, height: H } = useWindowDimensions();
  const { isTourActive, currentStep, tourRole, nextStep, skipTour, completeTour } = useTourStore();

  // Fade-in the overlay when it becomes active
  const overlayOpacity = useSharedValue(0);
  useEffect(() => {
    overlayOpacity.value = isTourActive
      ? withTiming(1, { duration: 350, easing: Easing.out(Easing.ease) })
      : 0;
    // overlayOpacity is a shared value object (stable ref) — intentionally omitted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTourActive]);

  // Fade bubble when step changes
  const bubbleOpacity = useSharedValue(1);
  useEffect(() => {
    bubbleOpacity.value = 0;
    bubbleOpacity.value = withTiming(1, { duration: 250 });
    // bubbleOpacity is a shared value object (stable ref) — intentionally omitted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const bubbleStyle = useAnimatedStyle(() => ({ opacity: bubbleOpacity.value }));

  const steps = isTourActive && tourRole ? TOUR_STEPS[tourRole] : null;

  // Complete tour when currentStep advances past the last step (must not call during render)
  useEffect(() => {
    if (isTourActive && steps && currentStep >= steps.length) {
      completeTour();
    }
  }, [currentStep, steps, isTourActive, completeTour]);

  if (!isTourActive || !tourRole) return null;

  // tourRole is narrowed to non-null here; re-derive so TypeScript knows steps is defined
  const activeSteps = TOUR_STEPS[tourRole];
  const step = activeSteps[currentStep];
  const isLastStep = currentStep === activeSteps.length - 1;

  if (!step) return null;

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, overlayStyle, styles.overlay]}
      pointerEvents="box-none"
    >
      {/* Spotlight */}
      <Spotlight area={step.spotlight} W={W} H={H} />

      {/* Character image — bottom-right corner */}
      <Image source={CHARACTER_IMAGES[tourRole]} style={styles.characterImage} />

      {/* Speech bubble */}
      <Animated.View style={[bubbleStyle, styles.bubble]}>
        {/* Bubble tail (triangle pointing down-right toward character) */}
        <View style={styles.bubbleTail} />

        {/* Step title */}
        <Text style={styles.stepTitle}>{step.title}</Text>

        {/* Step message */}
        <Text style={styles.stepMessage}>{step.message}</Text>

        {/* Footer: skip | dots | next */}
        <View style={styles.footer}>
          {/* Skip */}
          <Pressable onPress={skipTour} hitSlop={8}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>

          {/* Step dots */}
          <View style={styles.dotsRow}>
            {activeSteps.map((_s: any, i: number) => (
              <View
                key={i}
                style={[styles.dot, i === currentStep ? styles.dotActive : styles.dotInactive]}
              />
            ))}
          </View>

          {/* Next / Done */}
          <Pressable onPress={isLastStep ? completeTour : nextStep} style={styles.nextBtn}>
            <Text style={styles.nextText}>{isLastStep ? 'Get Started' : 'Next →'}</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderRadius: 18,
    bottom: 206, // sits above character (88 + 110 + 8)
    elevation: 14,
    left: 20,
    padding: 18,
    position: 'absolute',
    right: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  bubbleTail: {
    borderLeftColor: 'transparent',
    borderLeftWidth: 11,
    borderRightColor: 'transparent',
    borderRightWidth: 11,
    borderTopColor: 'rgba(255, 255, 255, 0.97)',
    borderTopWidth: 11,
    bottom: -11,
    height: 0,
    position: 'absolute',
    right: 48,
    width: 0,
  },
  characterImage: {
    bottom: 88,
    height: 110,
    position: 'absolute',
    resizeMode: 'contain',
    right: 20,
    width: 110,
  },
  dot: {
    borderRadius: 3,
    height: 6,
  },
  dotActive: {
    backgroundColor: '#4ADE80',
    width: 18,
  },
  dotInactive: {
    backgroundColor: '#D1FAE5',
    width: 6,
  },
  dotsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  nextBtn: {
    backgroundColor: '#4ADE80',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  nextText: {
    color: '#052e16',
    fontSize: 14,
    fontWeight: '700',
  },
  overlay: {
    zIndex: 9999,
  },
  skipText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
  },
  spotlightGlow: {
    borderColor: 'rgba(74, 222, 128, 0.85)',
    borderRadius: 10,
    borderWidth: 2,
    position: 'absolute',
  },
  stepMessage: {
    color: '#374151',
    fontSize: 14,
    lineHeight: 20,
  },
  stepTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  strip: {
    position: 'absolute',
  },
});
