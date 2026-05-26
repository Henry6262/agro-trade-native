import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import type { ChatMessage } from '../types';

interface ChatBubbleProps {
  message: ChatMessage;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <MotiView
      from={{ opacity: 0, translateY: 10, scale: 0.95 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      transition={{ type: 'timing', duration: 250 }}
      style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}
    >
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.text, isUser ? styles.userText : styles.assistantText]}>
          {message.text}
        </Text>
      </View>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  assistantBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomLeftRadius: 4,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
  },
  assistantContainer: {
    alignSelf: 'flex-start',
  },
  assistantText: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  container: {
    marginVertical: 6,
    maxWidth: '88%',
  },
  text: {
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 26,
  },
  userBubble: {
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
    borderBottomRightRadius: 4,
    borderColor: 'rgba(74, 222, 128, 0.3)',
    borderWidth: 1,
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  userText: {
    color: '#FFFFFF',
  },
});
