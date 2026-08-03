import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MotiView } from 'moti';

/**
 * Three-dot "AI is typing" indicator. Rendered as a left-aligned assistant
 * bubble while the bot is thinking/preparing its reply.
 */
export const TypingIndicator: React.FC = () => {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 10, scale: 0.95 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      transition={{ type: 'timing', duration: 200 }}
      style={styles.container}
    >
      <View style={styles.bubble}>
        {[0, 1, 2].map((i) => (
          <MotiView
            key={i}
            style={styles.dot}
            from={{ opacity: 0.3, translateY: 0 }}
            animate={{ opacity: 1, translateY: -4 }}
            transition={{
              loop: true,
              type: 'timing',
              duration: 450,
              delay: i * 150,
            }}
          />
        ))}
      </View>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  bubble: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomLeftRadius: 4,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  container: {
    alignSelf: 'flex-start',
    marginVertical: 6,
  },
  dot: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 4,
    height: 8,
    width: 8,
  },
});
