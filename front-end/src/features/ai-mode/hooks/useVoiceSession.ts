/**
 * useVoiceSession Hook
 * Manages the Pipecat RTVI voice session lifecycle.
 *
 * Uses @pipecat-ai/client-js + @pipecat-ai/react-native-daily-transport
 * for real-time voice AI via Daily.co WebRTC.
 */

import { useCallback, useRef, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useAIModeStore } from '../store/ai-mode.store';
import type { AIActionPayload } from '../types';

// Pipecat imports — lazy-loaded to avoid crashes in Expo Go
// These require native modules, so they only work in custom dev builds
let PipecatClient: any;
let RNDailyTransport: any;
let RTVIEvent: any;

try {
  const clientJs = require('@pipecat-ai/client-js');
  PipecatClient = clientJs.PipecatClient;
  RTVIEvent = clientJs.RTVIEvent;
} catch {
  console.warn('[useVoiceSession] @pipecat-ai/client-js not available — running in sim mode');
}

try {
  const transport = require('@pipecat-ai/react-native-daily-transport');
  RNDailyTransport = transport.RNDailyTransport;
} catch {
  console.warn('[useVoiceSession] RNDailyTransport not available — running in sim mode');
}

// ─── Config ──────────────────────────────────────────────────────────────────
const VOICE_API_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:8000' // Android emulator → localhost
    : 'http://localhost:8000'; // iOS simulator

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
    addUserMessage,
    addAssistantMessage,
  } = useAIModeStore();

  const [isConnecting, setIsConnecting] = useState(false);
  const clientRef = useRef<any>(null);

  // ─── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  // ─── Connect ───────────────────────────────────────────────────────────────
  const connect = useCallback(async () => {
    if (isConnecting || isConnected) return;

    // Fallback to simulation if Pipecat SDK is not available (Expo Go)
    if (!PipecatClient || !RNDailyTransport) {
      await connectSimulation();
      return;
    }

    setIsConnecting(true);
    setSessionError(null);
    setVoiceState('idle');

    try {
      // 1. Create Pipecat client
      const transport = new RNDailyTransport();

      const client = new PipecatClient({
        transport,
        enableMic: true,
        enableCam: false,
        callbacks: {
          onConnected: () => {
            console.log('[Pipecat] Connected');
            setConnected(true);
            setIsConnecting(false);
            setVoiceState('idle');
          },
          onDisconnected: () => {
            console.log('[Pipecat] Disconnected');
            setConnected(false);
            setVoiceState('idle');
          },
          onBotReady: () => {
            console.log('[Pipecat] Bot ready');
            setVoiceState('idle');
          },
          onError: (err: any) => {
            console.error('[Pipecat] Error:', err);
            setSessionError(err.message || 'Voice connection error');
            setConnected(false);
            setIsConnecting(false);
          },
        },
      });

      // 3. Listen for transcripts and messages
      if (RTVIEvent) {
        client.on(RTVIEvent.UserTranscript, (data: any) => {
          const text = data?.text || '';
          if (text) {
            addUserMessage(text);
          }
          setVoiceState('thinking');
        });

        client.on(RTVIEvent.BotTranscript, (data: any) => {
          const text = data?.text || '';
          if (text) {
            addAssistantMessage(text);
            setVoiceState('talking');
          }
        });

        client.on(RTVIEvent.BotStoppedSpeaking, () => {
          setVoiceState('idle');
        });

        // Handle action messages from bot
        client.on(RTVIEvent.ServerMessage, (msg: any) => {
          if (msg?.data?.label === 'action') {
            try {
              const action: AIActionPayload = JSON.parse(msg.data.data);
              onAction?.(action);
            } catch {
              console.warn('[Pipecat] Invalid action JSON:', msg.data.data);
            }
          }
        });
      }

      clientRef.current = client;

      // 2. Connect — this calls /start, spawns the bot, and joins the Daily room
      await client.startBotAndConnect({
        endpoint: VOICE_API_URL + '/start',
        body: { role, mode, language: 'bg' },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect to voice AI';
      console.error('[useVoiceSession] Connect failed:', message);
      setSessionError(message);
      setConnected(false);
      setIsConnecting(false);

      // Fallback to simulation on connection failure
      await connectSimulation();
    }
  }, [
    isConnecting,
    isConnected,
    role,
    mode,
    setConnected,
    setSessionError,
    setVoiceState,
    addUserMessage,
    addAssistantMessage,
    onAction,
  ]);

  // ─── Disconnect ────────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    if (clientRef.current) {
      try {
        clientRef.current.disconnect();
      } catch {
        // Ignore
      }
      clientRef.current = null;
    }

    // Bot auto-cancels on_client_disconnected; no explicit cleanup needed

    setConnected(false);
    setIsConnecting(false);
    setVoiceState('idle');
  }, [setConnected, setVoiceState]);

  // ─── Push-to-Talk ──────────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (!isConnected) return;
    setVoiceState('listening');
    // Enable mic if it was muted
    try {
      clientRef.current?.enableMic(true);
    } catch {
      // Fallback — simulation handles this visually
    }
  }, [isConnected, setVoiceState]);

  const stopListening = useCallback(() => {
    if (!isConnected) return;
    setVoiceState('thinking');
    // The bot will transition to talking when it responds
  }, [isConnected, setVoiceState]);

  // ─── Simulation Fallback ───────────────────────────────────────────────────
  const connectSimulation = useCallback(async () => {
    setIsConnecting(true);
    setSessionError(null);

    await new Promise((r) => setTimeout(r, 800));
    setConnected(true);
    setIsConnecting(false);

    const welcomeMessages: Record<string, string> = {
      seller:
        'Здравейте! Ще ви помогна да създадете профил и първата си оферта. Как се казвате?',
      buyer:
        'Здравейте! Ще ви помогна да намерите продукция и да направите заявка. Как се казвате?',
      transporter:
        'Здравейте! Ще ви помогна да регистрирате камиона си. Как се казвате?',
    };

    setTimeout(() => {
      addAssistantMessage(welcomeMessages[role] || 'Здравейте! Как мога да ви помогна?');
      setVoiceState('talking');
      setTimeout(() => setVoiceState('idle'), 4000);
    }, 300);
  }, [role, setConnected, setIsConnecting, setSessionError, setVoiceState, addAssistantMessage]);

  return {
    isConnected,
    isConnecting,
    error: sessionError,
    connect,
    disconnect,
    startListening,
    stopListening,
  };
}
