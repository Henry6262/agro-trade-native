import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';
import { Mic, Brain, Volume2, CircleDot } from 'lucide-react-native';
import { useAIModeStore } from '../store/ai-mode.store';
import type { VoiceState } from '../types';

const STATE_CONFIG: Record<
  VoiceState,
  { label: string; labelBg: string; icon: React.ReactNode; dots: boolean }
> = {
  idle: {
    label: 'Готов съм',
    labelBg: 'rgba(74, 222, 128, 0.15)',
    icon: <CircleDot size={18} color="#4ADE80" />,
    dots: false,
  },
  listening: {
    label: 'Слушам...',
    labelBg: 'rgba(59, 130, 246, 0.2)',
    icon: <Mic size={18} color="#60A5FA" />,
    dots: false,
  },
  thinking: {
    label: 'Мисля...',
    labelBg: 'rgba(168, 85, 247, 0.2)',
    icon: <Brain size={18} color="#A78BFA" />,
    dots: true,
  },
  talking: {
    label: 'Говоря...',
    labelBg: 'rgba(74, 222, 128, 0.2)',
    icon: <Volume2 size={18} color="#4ADE80" />,
    dots: false,
  },
};

export const VoiceStateIndicator: React.FC = () => {
  const voiceState = useAIModeStore((s) => s.voiceState);
  const config = STATE_CONFIG[voiceState];

  return (
    <View style={styles.container}>
      <View style={[styles.badge, { backgroundColor: config.labelBg }]}>
        {config.icon}
        <Text style={styles.badgeText}>{config.label}</Text>
        {config.dots && <ThinkingDots />}
      </View>
    </View>
  );
};

const ThinkingDots: React.FC = () => {
  return (
    <View style={styles.dotsRow}>
      {[0, 1, 2].map((i) => (
        <MotiView
          key={i}
          style={styles.dot}
          animate={{ opacity: [0.3, 1, 0.3], translateY: [0, -3, 0] }}
          transition={{
            loop: true,
            delay: i * 150,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
          }}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  container: {
    alignItems: 'center',
    marginTop: 12,
  },
  dot: {
    backgroundColor: '#A78BFA',
    borderRadius: 2,
    height: 4,
    width: 4,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 4,
    marginLeft: 4,
  },
});
