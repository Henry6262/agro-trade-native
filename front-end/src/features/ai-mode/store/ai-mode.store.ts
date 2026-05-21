import { create } from 'zustand';
import type {
  AIOnboardingForm,
  AIOfferDraft,
  AIBuyerRequestDraft,
  AITransporterDraft,
  AIConfirmationState,
  AIActionPayload,
  ChatMessage,
  VoiceState,
  AIUserRole,
} from '../types';

const INITIAL_ONBOARDING_FORM: AIOnboardingForm = {
  fullName: '',
  phone: '',
  village: '',
  role: null,
  sellerOffer: null,
  buyerRequest: null,
  transporterProfile: null,
};

const INITIAL_CONFIRMATION: AIConfirmationState = {
  visible: false,
  title: '',
  description: '',
  actionPayload: null,
};

interface AIModeStore {
  // ─── Session ───────────────────────────────────────────────────────────────
  isActive: boolean;
  voiceState: VoiceState;
  isConnected: boolean;
  sessionError: string | null;

  // ─── Chat ──────────────────────────────────────────────────────────────────
  messages: ChatMessage[];

  // ─── Onboarding ────────────────────────────────────────────────────────────
  onboardingForm: AIOnboardingForm;

  // ─── Confirmation ──────────────────────────────────────────────────────────
  confirmation: AIConfirmationState;

  // ─── Actions ───────────────────────────────────────────────────────────────
  setActive: (active: boolean) => void;
  setVoiceState: (state: VoiceState) => void;
  setConnected: (connected: boolean) => void;
  setSessionError: (error: string | null) => void;

  addMessage: (message: ChatMessage) => void;
  addUserMessage: (text: string) => void;
  addAssistantMessage: (text: string) => void;
  clearMessages: () => void;

  updateOnboardingField: <K extends keyof AIOnboardingForm>(
    field: K,
    value: AIOnboardingForm[K]
  ) => void;
  setRole: (role: AIUserRole) => void;
  stageOffer: (offer: AIOfferDraft) => void;
  stageBuyerRequest: (request: AIBuyerRequestDraft) => void;
  stageTransporterProfile: (profile: AITransporterDraft) => void;

  showConfirmation: (title: string, description: string, action: AIActionPayload) => void;
  hideConfirmation: () => void;

  resetOnboarding: () => void;
  resetSession: () => void;
}

export const useAIModeStore = create<AIModeStore>((set, get) => ({
  // ─── Initial state ─────────────────────────────────────────────────────────
  isActive: false,
  voiceState: 'idle',
  isConnected: false,
  sessionError: null,

  messages: [],

  onboardingForm: { ...INITIAL_ONBOARDING_FORM },

  confirmation: { ...INITIAL_CONFIRMATION },

  // ─── Session actions ───────────────────────────────────────────────────────
  setActive: (active) => set({ isActive: active }),

  setVoiceState: (voiceState) => set({ voiceState }),

  setConnected: (isConnected) => set({ isConnected }),

  setSessionError: (sessionError) => set({ sessionError }),

  // ─── Chat actions ──────────────────────────────────────────────────────────
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  addUserMessage: (text) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: `user-${Date.now()}`,
          role: 'user',
          text,
          timestamp: Date.now(),
        },
      ],
    })),

  addAssistantMessage: (text) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text,
          timestamp: Date.now(),
        },
      ],
    })),

  clearMessages: () => set({ messages: [] }),

  // ─── Onboarding actions ────────────────────────────────────────────────────
  updateOnboardingField: (field, value) =>
    set((state) => ({
      onboardingForm: {
        ...state.onboardingForm,
        [field]: value,
      },
    })),

  setRole: (role) =>
    set((state) => ({
      onboardingForm: {
        ...state.onboardingForm,
        role,
      },
    })),

  stageOffer: (sellerOffer) =>
    set((state) => ({
      onboardingForm: {
        ...state.onboardingForm,
        sellerOffer,
      },
    })),

  stageBuyerRequest: (buyerRequest) =>
    set((state) => ({
      onboardingForm: {
        ...state.onboardingForm,
        buyerRequest,
      },
    })),

  stageTransporterProfile: (transporterProfile) =>
    set((state) => ({
      onboardingForm: {
        ...state.onboardingForm,
        transporterProfile,
      },
    })),

  // ─── Confirmation actions ──────────────────────────────────────────────────
  showConfirmation: (title, description, actionPayload) =>
    set({
      confirmation: {
        visible: true,
        title,
        description,
        actionPayload,
      },
    }),

  hideConfirmation: () =>
    set({
      confirmation: { ...INITIAL_CONFIRMATION },
    }),

  // ─── Reset actions ─────────────────────────────────────────────────────────
  resetOnboarding: () =>
    set({
      onboardingForm: { ...INITIAL_ONBOARDING_FORM },
      messages: [],
    }),

  resetSession: () =>
    set({
      voiceState: 'idle',
      isConnected: false,
      sessionError: null,
      messages: [],
      confirmation: { ...INITIAL_CONFIRMATION },
    }),
}));
