import React, { useEffect } from 'react';
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

  const avatarSize = size || Math.min(width * 0.7, height * 0.45);
  const anim = stateAnimations[voiceState];

  return (
    <View style={[styles.container, { width: avatarSize, height: avatarSize }]}>
      {/* Glow effect behind character */}
      <MotiView
        style={[styles.glow, { width: avatarSize * 1.2, height: avatarSize * 1.2 }]}
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
          style={{ width: avatarSize, height: avatarSize }}
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
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(74, 222, 128, 0.25)',
  },
  characterWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(74, 222, 128, 0.4)',
    zIndex: 1,
  },
});
