import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';
import { Mic, Sparkles } from 'lucide-react-native';
import { useAIModeStore } from '../store/ai-mode.store';

interface AIFloatingButtonProps {
  onPress: () => void;
}

export const AIFloatingButton: React.FC<AIFloatingButtonProps> = ({ onPress }) => {
  const isActive = useAIModeStore((s) => s.isActive);

  return (
    <MotiView
      style={styles.container}
      from={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', damping: 12 }}
    >
      {/* Pulse ring when not active */}
      {!isActive && (
        <MotiView
          style={[styles.pulseRing, styles.pulseRingOuter]}
          animate={{ scale: [1, 1.4], opacity: [0.4, 0] }}
          transition={{
            loop: true,
            duration: 2000,
            easing: Easing.out(Easing.ease),
          }}
        />
      )}
      {!isActive && (
        <MotiView
          style={[styles.pulseRing, styles.pulseRingInner]}
          animate={{ scale: [1, 1.25], opacity: [0.3, 0] }}
          transition={{
            loop: true,
            duration: 2000,
            delay: 500,
            easing: Easing.out(Easing.ease),
          }}
        />
      )}

      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={[styles.button, isActive && styles.buttonActive]}
      >
        {isActive ? <Sparkles size={24} color="#FFFFFF" /> : <Mic size={24} color="#FFFFFF" />}
      </TouchableOpacity>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: '#4ADE80',
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 28,
    borderWidth: 2,
    elevation: 8,
    height: 56,
    justifyContent: 'center',
    shadowColor: '#4ADE80',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    width: 56,
  },
  buttonActive: {
    backgroundColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
  },
  container: {
    bottom: 110,
    position: 'absolute',
    right: 20,
    zIndex: 100,
  },
  pulseRing: {
    borderColor: '#4ADE80',
    borderRadius: 28,
    borderWidth: 2,
    height: 56,
    position: 'absolute',
    width: 56,
  },
  pulseRingInner: {
    left: 0,
    top: 0,
  },
  pulseRingOuter: {
    left: 0,
    top: 0,
  },
});
