/**
 * useVoiceSession Hook
 * Manages the Pipecat RTVI voice session lifecycle.
 *
 * TODO: Integrate @pipecat-ai/client-js + @pipecat-ai/react-native-daily-transport
 * once Expo dev build is configured with Daily.co WebRTC native modules.
 *
 * For now, this hook provides the interface and simulated state transitions.
 */

import { useCallback, useRef, useEffect } from 'react';
import { useAIModeStore } from '../store/ai-mode.store';
import type { AIActionPayload } from '../types';

interface UseVoiceSessionOptions {
  role: 'seller' | 'buyer' | 'transporter';
  mode: 'onboarding' | 'assistant';
  onAction?: (action: AIActionPayload) => void;
}

interface UseVoiceSessionReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  startListening: () => void;
  stopListening: () => void;
}

export function useVoiceSession(options: UseVoiceSessionOptions): UseVoiceSessionReturn {
  const { role, mode, onAction } = options;

  const {
    isConnected,
    sessionError,
    setConnected,
    setSessionError,
    setVoiceState,
    addAssistantMessage,
  } = useAIModeStore();

  const isConnectingRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);

  // Simulate connection for MVP
  const connect = useCallback(async () => {
    if (isConnectingRef.current || isConnected) return;
    isConnectingRef.current = true;
    setSessionError(null);
    setVoiceState('idle');

    try {
      // TODO: Replace with real Pipecat connection:
      // 1. Call POST /start on voice-agent backend
      // 2. Get room_url + token
      // 3. Initialize PipecatClient with RNDailyTransport
      // 4. Connect to Daily room

      // Simulation:
      await new Promise((resolve) => setTimeout(resolve, 1200));
      sessionIdRef.current = `sim-${Date.now()}`;
      setConnected(true);

      // Simulate welcome message
      setTimeout(() => {
        const welcomeMessages: Record<string, string> = {
          seller:
            'Здравейте! Ще ви помогна да създадете профил и първата си оферта. Как се казвате?',
          buyer:
            'Здравейте! Ще ви помогна да намерите продукция и да направите заявка. Как се казвате?',
          transporter:
            'Здравейте! Ще ви помогна да регистрирате камиона си. Как се казвате?',
        };
        addAssistantMessage(welcomeMessages[role] || 'Здравейте! Как мога да ви помогна?');
        setVoiceState('talking');
        setTimeout(() => setVoiceState('idle'), 3000);
      }, 500);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect';
      setSessionError(message);
      setConnected(false);
    } finally {
      isConnectingRef.current = false;
    }
  }, [role, isConnected, setConnected, setSessionError, setVoiceState, addAssistantMessage]);

  const disconnect = useCallback(() => {
    // TODO: Call Pipecat client disconnect()
    setConnected(false);
    sessionIdRef.current = null;
    setVoiceState('idle');
  }, [setConnected, setVoiceState]);

  const startListening = useCallback(() => {
    if (!isConnected) return;
    setVoiceState('listening');
  }, [isConnected, setVoiceState]);

  const stopListening = useCallback(() => {
    if (!isConnected) return;
    // Transition to thinking, then simulate response
    setVoiceState('thinking');

    setTimeout(() => {
      setVoiceState('talking');
      // Simulate response after "processing"
      setTimeout(() => {
        setVoiceState('idle');
      }, 2500);
    }, 1200);
  }, [isConnected, setVoiceState]);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected,
    isConnecting: isConnectingRef.current,
    error: sessionError,
    connect,
    disconnect,
    startListening,
    stopListening,
  };
}
