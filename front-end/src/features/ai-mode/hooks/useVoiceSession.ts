/**
 * useVoiceSession Hook
 * Manages the Pipecat RTVI voice session lifecycle.
 *
 * Uses @pipecat-ai/client-js + @pipecat-ai/react-native-daily-transport
 * for real-time voice AI via Daily.co WebRTC.
 */

import { useCallback, useRef, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Localization from 'expo-localization';
import { useAIModeStore } from '../store/ai-mode.store';
import type { AIActionPayload } from '../types';

// Pipecat imports — lazy-loaded to avoid crashes in Expo Go
// These require native modules, so they only work in custom dev builds
let PipecatClient: any;
let RNDailyTransport: any;
let RTVIEvent: any;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const clientJs = require('@pipecat-ai/client-js');
  PipecatClient = clientJs.PipecatClient;
  RTVIEvent = clientJs.RTVIEvent;
} catch {
  console.warn('[useVoiceSession] @pipecat-ai/client-js not available — running in sim mode');
}

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const transport = require('@pipecat-ai/react-native-daily-transport');
  RNDailyTransport = transport.RNDailyTransport;
} catch {
  console.warn('[useVoiceSession] RNDailyTransport not available — running in sim mode');
}

// ─── Config ──────────────────────────────────────────────────────────────────
// In production, set EXPO_PUBLIC_VOICE_API_URL to the deployed voice-agent URL
// (e.g. https://voice-agent-production.up.railway.app). Falls back to local
// dev defaults for simulator / emulator.
const VOICE_API_URL =
  process.env['EXPO_PUBLIC_VOICE_API_URL'] ||
  (Platform.OS === 'android'
    ? 'http://10.0.2.2:8000' // Android emulator → localhost
    : 'http://localhost:8000'); // iOS simulator

/**
 * Read the device's preferred language as a BCP-47 tag (e.g. "bg-BG", "en-US").
 * Falls back to Bulgarian — primary market.
 */
function getDeviceLanguageTag(): string {
  try {
    const locales = Localization.getLocales();
    return locales?.[0]?.languageTag || 'bg-BG';
  } catch {
    return 'bg-BG';
  }
}

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

    // Probe the voice-agent /health endpoint first. If the backend isn't
    // running (e.g. local dev without the python service up, or no API keys
    // wired yet) skip the real Pipecat connect entirely and go straight to
    // the simulation fallback — avoids the noisy "Network request failed"
    // Pipecat error overlay the user otherwise sees.
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const probe = await fetch(VOICE_API_URL + '/health', {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!probe.ok) throw new Error('health probe non-200');
    } catch {
      console.info('[useVoiceSession] Voice backend not reachable — using simulation mode');
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
            // Treat network errors as a transport failure — drop to sim mode
            // silently instead of throwing a fatal red-screen overlay at the
            // user. Real errors (auth, etc) still log but don't crash the UI.
            const msg = err?.message || err?.data?.message || '';
            const isNetwork =
              /network request failed|fetch failed|failed to fetch|ECONN|abort/i.test(msg);
            if (isNetwork) {
              console.info('[Pipecat] Network failure — falling back to simulation:', msg);
            } else {
              console.warn('[Pipecat] Error:', err);
            }
            setSessionError(null);
            setConnected(false);
            setIsConnecting(false);
          },
        },
      });

      // 3. Listen for transcripts and messages
      if (RTVIEvent) {
        // User speech. UserTranscript fires for BOTH partial and final results.
        // Only commit a chat bubble on the FINAL transcript — otherwise every
        // partial creates a duplicate/garbled bubble. While the user is still
        // speaking (partials), show the "listening" state; once final, switch
        // to "thinking" so the typing indicator appears.
        client.on(RTVIEvent.UserTranscript, (data: any) => {
          const text = (data?.text || '').trim();
          const isFinal = data?.final !== false; // default true if undefined
          if (!text) return;
          if (isFinal) {
            addUserMessage(text);
            setVoiceState('thinking');
          } else {
            setVoiceState('listening');
          }
        });

        // AI speech, sentence-aggregated → one clean bubble per sentence.
        client.on(RTVIEvent.BotTranscript, (data: any) => {
          const text = (data?.text || '').trim();
          if (text) {
            addAssistantMessage(text);
            setVoiceState('talking');
          }
        });

        // The AI started speaking → it's no longer "thinking", hide typing dots.
        if (RTVIEvent.BotStartedSpeaking) {
          client.on(RTVIEvent.BotStartedSpeaking, () => {
            setVoiceState('talking');
          });
        }

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

      // 2. Connect — this calls /start, spawns the bot, and joins the Daily room.
      // Language is auto-detected from the device locale so the user never has
      // to touch a settings screen — Bulgarian phone speaks Bulgarian, etc.
      const language = getDeviceLanguageTag();
      await client.startBotAndConnect({
        endpoint: VOICE_API_URL + '/start',
        body: { role, mode, language },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect to voice AI';
      console.info('[useVoiceSession] Connect failed, falling back to simulation:', message);
      setConnected(false);
      setIsConnecting(false);

      // Silent fallback — clear any prior error and run the simulated session
      setSessionError(null);
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

    const lang = (getDeviceLanguageTag().split('-')[0] || 'bg') as 'bg' | 'en' | 'ro' | 'es';
    const welcome: Record<'bg' | 'en' | 'ro' | 'es', Record<string, string>> = {
      bg: {
        seller: 'Здравейте! Ще ви помогна да създадете профил и първата си оферта. Как се казвате?',
        buyer:
          'Здравейте! Ще ви помогна да намерите продукция и да направите заявка. Как се казвате?',
        transporter: 'Здравейте! Ще ви помогна да регистрирате камиона си. Как се казвате?',
      },
      en: {
        seller:
          "Hi! I'll help you set up your profile and create your first offer. What's your name?",
        buyer: "Hi! I'll help you find produce and place a request. What's your name?",
        transporter: "Hi! I'll help you register your truck. What's your name?",
      },
      ro: {
        seller: 'Salut! Te voi ajuta să-ți creezi profilul și prima ofertă. Cum te numești?',
        buyer: 'Salut! Te voi ajuta să găsești produse și să faci o cerere. Cum te numești?',
        transporter: 'Salut! Te voi ajuta să-ți înregistrezi camionul. Cum te numești?',
      },
      es: {
        seller:
          'Hola! Te ayudaré a configurar tu perfil y crear tu primera oferta. ¿Cómo te llamas?',
        buyer: 'Hola! Te ayudaré a encontrar productos y hacer un pedido. ¿Cómo te llamas?',
        transporter: 'Hola! Te ayudaré a registrar tu camión. ¿Cómo te llamas?',
      },
    };
    const set = welcome[lang] || welcome.bg;

    setTimeout(() => {
      addAssistantMessage(set[role] || welcome.bg[role] || 'Hello! How can I help?');
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
