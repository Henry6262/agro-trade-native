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
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MotiView } from 'moti';
import { Mic, MicOff, ArrowLeft, RotateCcw, Check } from 'lucide-react-native';
import { GradientBackground, COLORS } from '@design-system';
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
            'Publish your sale offer?',
            `Offer: ${JSON.stringify(action.params)}`,
            action
          );
          break;
        case 'create_request':
          showConfirmation(
            'Publish your buy request?',
            `Request: ${JSON.stringify(action.params)}`,
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

  const handleDone = () => {
    disconnect();
    (navigation as any).getParent()?.navigate('Onboarding', {
      screen: 'OnboardingComplete',
    });
  };

  // Show "Done" CTA once we have at least a name OR some role-specific data
  const hasCapturedData = Boolean(
    onboardingForm.fullName ||
    onboardingForm.village ||
    onboardingForm.phone ||
    onboardingForm.sellerOffer?.commodity ||
    onboardingForm.buyerRequest?.commodity ||
    onboardingForm.transporterProfile?.truckType
  );

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
                {mode === 'onboarding' ? 'Voice Setup' : 'AI Assistant'}
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
              <Text style={styles.connectingText}>Connecting to your AI assistant…</Text>
            </MotiView>
          )}

          {/* Character + Live Form Area */}
          <View style={styles.characterSection}>
            <CharacterAvatar role={role} />
            <VoiceStateIndicator />

            {/* Live form preview (shows what AI has captured) */}
            {mode === 'onboarding' && <LiveFormPreview form={onboardingForm} role={role} />}
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
                      ? `Hi — I'll set up your ${role} profile.`
                      : 'How can I help you today?'}
                  </Text>
                  <Text style={styles.welcomeSubtitle}>
                    {mode === 'onboarding'
                      ? "Press and hold the mic, then just talk. I'll fill in everything as we go."
                      : 'Press the mic to start a conversation.'}
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
                <Text style={styles.retryText}>Try again</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Push-to-Talk Button + optional Done CTA */}
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
                {isListening ? 'Listening…' : isConnecting ? 'Connecting…' : 'Hold to speak'}
              </Text>
            </TouchableOpacity>

            {mode === 'onboarding' && hasCapturedData && !isListening && (
              <MotiView
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'spring', damping: 18, stiffness: 200 }}
                style={styles.doneWrap}
              >
                <TouchableOpacity onPress={handleDone} style={styles.doneBtn} activeOpacity={0.85}>
                  <Check size={16} color={COLORS.accentGreen} />
                  <Text style={styles.doneText}>I&apos;m done — take me to my dashboard</Text>
                </TouchableOpacity>
              </MotiView>
            )}
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
      <Text style={styles.formPreviewTitle}>Captured so far</Text>
      {form.fullName ? <Text style={styles.formPreviewItem}>👤 Name · {form.fullName}</Text> : null}
      {form.village ? (
        <Text style={styles.formPreviewItem}>📍 Location · {form.village}</Text>
      ) : null}
      {form.phone ? <Text style={styles.formPreviewItem}>📞 Phone · {form.phone}</Text> : null}
      {role === 'seller' && form.sellerOffer?.commodity ? (
        <Text style={styles.formPreviewItem}>
          🌾 Offer · {form.sellerOffer.quantity}kg {form.sellerOffer.commodity} @{' '}
          {form.sellerOffer.pricePerKg}/kg
        </Text>
      ) : null}
      {role === 'buyer' && form.buyerRequest?.commodity ? (
        <Text style={styles.formPreviewItem}>
          🛒 Request · {form.buyerRequest.quantity}kg {form.buyerRequest.commodity}
        </Text>
      ) : null}
    </MotiView>
  );
};

const styles = StyleSheet.create({
  backBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  characterSection: {
    alignItems: 'center',
    paddingBottom: 12,
    paddingTop: 4,
  },
  chatContent: {
    gap: 8,
    paddingVertical: 12,
  },
  chatScroll: {
    flex: 1,
  },
  chatSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  connectingBanner: {
    alignItems: 'center',
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    borderColor: 'rgba(74, 222, 128, 0.2)',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 4,
    marginHorizontal: 16,
    paddingVertical: 8,
  },
  connectingText: {
    color: '#4ADE80',
    fontSize: 13,
    fontWeight: '600',
  },
  connectionDot: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  connectionDotActive: {
    backgroundColor: '#4ADE80',
  },
  container: {
    flex: 1,
  },
  controls: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  doneBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    borderColor: 'rgba(74, 222, 128, 0.35)',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  doneText: {
    color: COLORS.accentGreen,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  doneWrap: {
    alignItems: 'center',
    marginTop: 32,
  },
  errorBanner: {
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    marginHorizontal: 16,
    padding: 12,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
    marginBottom: 8,
    textAlign: 'center',
  },
  formPreview: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    maxWidth: 380,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '90%',
  },
  formPreviewItem: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    lineHeight: 20,
  },
  formPreviewTitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerCenter: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  pttButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
    borderColor: 'rgba(74, 222, 128, 0.5)',
    borderRadius: 40,
    borderWidth: 2,
    elevation: 8,
    height: 80,
    justifyContent: 'center',
    shadowColor: '#4ADE80',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    width: 80,
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
    bottom: -24,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '500',
    position: 'absolute',
  },
  resetBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  retryBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  safeArea: {
    flex: 1,
  },
  welcomeMessage: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  welcomeSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    textAlign: 'center',
  },
  welcomeTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
});
