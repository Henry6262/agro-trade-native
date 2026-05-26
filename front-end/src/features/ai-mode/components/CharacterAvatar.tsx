import React from 'react';
import { View, StyleSheet, Image, useWindowDimensions } from 'react-native';
import { MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';
import { useAIModeStore } from '../store/ai-mode.store';
import type { AIUserRole, VoiceState } from '../types';

const CHARACTER_IMAGES: Record<AIUserRole, ReturnType<typeof require>> = {
  seller: require('../../../../assets/UserTypes/Seller.png'),
  buyer: require('../../../../assets/UserTypes/Buyer.png'),
  transporter: require('../../../../assets/UserTypes/transporter.png'),
};

interface CharacterAvatarProps {
  role: AIUserRole;
  size?: number;
}

const stateAnimations: Record<
  VoiceState,
  { scale: number[]; translateY: number[]; opacity: number[]; duration: number }
> = {
  idle: {
    scale: [1, 1.03, 1],
    translateY: [0, -4, 0],
    opacity: [0.95, 1, 0.95],
    duration: 3000,
  },
  listening: {
    scale: [1, 1.05, 1],
    translateY: [0, -2, 0],
    opacity: [1, 1, 1],
    duration: 1200,
  },
  thinking: {
    scale: [1, 0.98, 1],
    translateY: [0, 2, 0],
    opacity: [0.85, 1, 0.85],
    duration: 1500,
  },
  talking: {
    scale: [1, 1.04, 1],
    translateY: [0, -6, 0],
    opacity: [1, 1, 1],
    duration: 800,
  },
};

export const CharacterAvatar: React.FC<CharacterAvatarProps> = ({ role, size }) => {
  const { width, height } = useWindowDimensions();
  const voiceState = useAIModeStore((s) => s.voiceState);

  const avatarSize = size || Math.min(width * 0.9, height * 0.5);
  const anim = stateAnimations[voiceState];

  // The character image asset has the figure in the upper ~75 % with empty
  // background below. We render into a rectangular container that's 78 % of
  // the natural square and clip overflow so the empty bottom (and the
  // bottom of the glow circle) are hidden — giving the look of a circular
  // backdrop that's cleanly "cut" at the bottom edge of the section.
  const visibleHeight = avatarSize * 0.7;
  // Image is rendered at 1.22x avatarSize so the figure inside grows
  // without scaling the surrounding glow/circle frame. Horizontal/vertical
  // overflow is clipped by the container's overflow: hidden so we still
  // read as a contained circle.
  const imageSize = avatarSize * 1.15;
  const imageOffsetTop = -avatarSize * 0.12;
  const imageOffsetLeft = (avatarSize - imageSize) / 2;
  const glowSize = avatarSize * 1.0;

  return (
    <View
      style={[styles.container, { width: avatarSize, height: visibleHeight, overflow: 'hidden' }]}
    >
      {/* Glow effect behind character — perfect circle, clipped by the
          container's bottom edge so the look is "circle cut along a line". */}
      <MotiView
        style={[
          styles.glow,
          {
            width: glowSize,
            height: glowSize,
            top: -glowSize * 0.05,
            left: (avatarSize - glowSize) / 2,
          },
        ]}
        // Start at the steady-state values so the first cycle doesn't read
        // as an entry "grow-in" — only the loop pulsation is visible.
        from={{
          opacity: voiceState === 'talking' ? 0.3 : 0.15,
          scale: 1,
        }}
        animate={{
          opacity: voiceState === 'talking' ? [0.3, 0.6, 0.3] : [0.15, 0.25, 0.15],
          scale: voiceState === 'talking' ? [1, 1.1, 1] : [1, 1.05, 1],
        }}
        transition={{
          loop: true,
          duration: anim.duration,
          easing: Easing.inOut(Easing.ease),
        }}
      />

      {/* Character image with state-based animation */}
      <MotiView
        style={styles.characterWrapper}
        // Same trick — no initial scale-in, jump straight into the loop.
        from={{ scale: 1, translateY: 0, opacity: anim.opacity[0] }}
        animate={{
          scale: anim.scale,
          translateY: anim.translateY,
          opacity: anim.opacity,
        }}
        transition={{
          loop: true,
          duration: anim.duration,
          easing: Easing.inOut(Easing.ease),
        }}
      >
        <Image
          source={CHARACTER_IMAGES[role]}
          style={{
            width: imageSize,
            height: imageSize,
            marginTop: imageOffsetTop,
            marginLeft: imageOffsetLeft,
          }}
          resizeMode="contain"
        />
      </MotiView>

      {/* Listening indicator rings */}
      {voiceState === 'listening' && <ListeningRings size={avatarSize} />}
    </View>
  );
};

const ListeningRings: React.FC<{ size: number }> = ({ size }) => {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <MotiView
          key={i}
          style={[
            styles.ring,
            {
              width: size * (1.1 + i * 0.15),
              height: size * (1.1 + i * 0.15),
              borderRadius: (size * (1.1 + i * 0.15)) / 2,
            },
          ]}
          from={{ opacity: 0.4, scale: 1 }}
          animate={{ opacity: 0, scale: 1.4 }}
          transition={{
            loop: true,
            delay: i * 400,
            duration: 2000,
            easing: Easing.out(Easing.ease),
          }}
        />
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  characterWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glow: {
    backgroundColor: 'rgba(74, 222, 128, 0.25)',
    borderRadius: 999,
    position: 'absolute',
  },
  ring: {
    borderColor: 'rgba(74, 222, 128, 0.4)',
    borderWidth: 2,
    position: 'absolute',
    zIndex: 1,
  },
});
