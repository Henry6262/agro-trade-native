import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MotiView } from 'moti';
import { Mic, MicOff, ArrowLeft, RotateCcw } from 'lucide-react-native';
import { GradientBackground } from '@design-system';
import { CharacterAvatar } from '../components/CharacterAvatar';
import { VoiceStateIndicator } from '../components/VoiceStateIndicator';
import { ChatBubble } from '../components/ChatBubble';
import { AIConfirmationModal } from '../components/AIConfirmationModal';
import { useVoiceSession } from '../hooks/useVoiceSession';
import { useAIModeStore } from '../store/ai-mode.store';
import type { AIUserRole, AIOnboardingForm, AIActionPayload } from '../types';

interface AIModeScreenProps {
  route: {
    params?: {
      role?: AIUserRole;
      mode?: 'onboarding' | 'assistant';
    };
  };
}

export const AIModeScreen: React.FC<AIModeScreenProps> = ({ route }) => {
  const navigation = useNavigation();
  const { height } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);

  const role = route.params?.role || 'seller';
  const mode = route.params?.mode || 'onboarding';

  const {
    messages,
    voiceState,
    isConnected,
    sessionError,
    onboardingForm,
    setActive,
    resetSession,
    showConfirmation,
  } = useAIModeStore();

  // Handle AI actions from voice bot
  const handleAction = useCallback(
    (action: AIActionPayload) => {
      switch (action.action) {
        case 'create_offer':
          showConfirmation(
            'Публикуване на оферта?',
            `Оферта: ${JSON.stringify(action.params)}`,
            action
          );
          break;
        case 'create_request':
          showConfirmation(
            'Публикуване на заявка?',
            `Заявка: ${JSON.stringify(action.params)}`,
            action
          );
          break;
        case 'navigate':
          // Direct navigation without confirmation
          navigation.navigate(action.params['screen'] as never);
          break;
        default:
          console.log('AI Action:', action);
      }
    },
    [showConfirmation, navigation]
  );

  const { isConnecting, connect, disconnect, startListening, stopListening } = useVoiceSession({
    role,
    mode,
    onAction: handleAction,
  });

  const isListening = voiceState === 'listening';

  // Scroll to bottom on new messages
  React.useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Set active on mount, auto-connect
  React.useEffect(() => {
    setActive(true);
    if (!isConnected && !isConnecting) {
      connect();
    }
    return () => {
      setActive(false);
      disconnect();
    };
  }, []);

  const handlePushToTalk = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const handleBack = () => {
    disconnect();
    navigation.goBack();
  };

  const handleReset = () => {
    disconnect();
    resetSession();
    connect();
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
              <ArrowLeft size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>
                {mode === 'onboarding' ? 'AI Регистрация' : 'AI Асистент'}
              </Text>
              <View style={[styles.connectionDot, isConnected && styles.connectionDotActive]} />
            </View>
            <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
              <RotateCcw size={18} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          </View>

          {/* Connecting state */}
          {isConnecting && (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={styles.connectingBanner}
            >
              <ActivityIndicator size="small" color="#4ADE80" />
              <Text style={styles.connectingText}>Свързване с AI...</Text>
            </MotiView>
          )}

          {/* Character + Live Form Area */}
          <View style={styles.characterSection}>
            <CharacterAvatar role={role} />
            <VoiceStateIndicator />

            {/* Live form preview (shows what AI has captured) */}
            {mode === 'onboarding' && (
              <LiveFormPreview form={onboardingForm} role={role} />
            )}
          </View>

          {/* Chat transcript */}
          <View style={styles.chatSection}>
            <ScrollView
              ref={scrollRef}
              style={styles.chatScroll}
              contentContainerStyle={styles.chatContent}
              showsVerticalScrollIndicator={false}
            >
              {messages.length === 0 && !isConnecting && (
                <View style={styles.welcomeMessage}>
                  <Text style={styles.welcomeTitle}>
                    {mode === 'onboarding'
                      ? 'Здравейте! Аз съм вашият AI асистент.'
                      : 'Как мога да ви помогна днес?'}
                  </Text>
                  <Text style={styles.welcomeSubtitle}>
                    {mode === 'onboarding'
                      ? 'Говорете свободно и аз ще попълня вашия профил.'
                      : 'Говорете или докоснете бутона по-долу.'}
                  </Text>
                </View>
              )}
              {messages.map((msg) => (
                <ChatBubble key={msg.id} message={msg} />
              ))}
            </ScrollView>
          </View>

          {/* Session error */}
          {sessionError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{sessionError}</Text>
              <TouchableOpacity onPress={connect} style={styles.retryBtn}>
                <Text style={styles.retryText}>Опитайте отново</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Push-to-Talk Button */}
          <View style={styles.controls}>
            <TouchableOpacity
              onPressIn={handlePushToTalk}
              activeOpacity={0.8}
              style={[
                styles.pttButton,
                isListening && styles.pttButtonActive,
                !isConnected && !isConnecting && styles.pttButtonDisabled,
              ]}
              disabled={!isConnected && !isConnecting}
            >
              <MotiView
                animate={{
                  scale: isListening ? [1, 1.15, 1] : 1,
                }}
                transition={{
                  loop: isListening,
                  duration: 800,
                }}
              >
                {isListening ? (
                  <MicOff size={32} color="#FFFFFF" />
                ) : (
                  <Mic size={32} color="#FFFFFF" />
                )}
              </MotiView>
              <Text style={styles.pttLabel}>
                {isListening
                  ? 'Слушам...'
                  : isConnecting
                    ? 'Свързване...'
                    : 'Задръжте, за да говорите'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Confirmation Modal */}
          <AIConfirmationModal />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
};

/**
 * Live form preview — shows the user what the AI has captured so far
 */
const LiveFormPreview: React.FC<{ form: AIOnboardingForm; role: AIUserRole }> = ({
  form,
  role,
}) => {
  const hasData = form.fullName || form.village || form.sellerOffer || form.buyerRequest;

  if (!hasData) return null;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      style={styles.formPreview}
    >
      <Text style={styles.formPreviewTitle}>📋 Попълнено досега:</Text>
      {form.fullName ? (
        <Text style={styles.formPreviewItem}>👤 Име: {form.fullName}</Text>
      ) : null}
      {form.village ? (
        <Text style={styles.formPreviewItem}>📍 Село: {form.village}</Text>
      ) : null}
      {form.phone ? (
        <Text style={styles.formPreviewItem}>📞 Телефон: {form.phone}</Text>
      ) : null}
      {role === 'seller' && form.sellerOffer?.commodity ? (
        <Text style={styles.formPreviewItem}>
          🌾 Оферта: {form.sellerOffer.quantity}кг {form.sellerOffer.commodity} @{' '}
          {form.sellerOffer.pricePerKg} лв/кг
        </Text>
      ) : null}
      {role === 'buyer' && form.buyerRequest?.commodity ? (
        <Text style={styles.formPreviewItem}>
          🛒 Заявка: {form.buyerRequest.quantity}кг {form.buyerRequest.commodity}
        </Text>
      ) : null}
    </MotiView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  connectionDotActive: {
    backgroundColor: '#4ADE80',
  },
  resetBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginBottom: 4,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.2)',
  },
  connectingText: {
    color: '#4ADE80',
    fontSize: 13,
    fontWeight: '600',
  },
  characterSection: {
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 12,
  },
  chatSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    paddingVertical: 12,
    gap: 8,
  },
  welcomeMessage: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  welcomeTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    textAlign: 'center',
  },
  formPreview: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    width: '90%',
    maxWidth: 380,
  },
  formPreviewTitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formPreviewItem: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    lineHeight: 20,
  },
  controls: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  pttButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(74, 222, 128, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4ADE80',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  pttButtonActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  pttButtonDisabled: {
    opacity: 0.5,
  },
  pttLabel: {
    position: 'absolute',
    bottom: -24,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '500',
  },
  errorBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 8,
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
