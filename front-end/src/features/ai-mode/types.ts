/**
 * AI Mode — Core Type Definitions
 */

export type AIUserRole = 'seller' | 'buyer' | 'transporter';

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'talking';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

export interface AIOfferDraft {
  commodity?: string;
  quantity?: number;
  pricePerKg?: number;
  location?: string;
  description?: string;
}

export interface AIBuyerRequestDraft {
  commodity?: string;
  quantity?: number;
  maxPricePerKg?: number;
  deliveryLocation?: string;
}

export interface AITransporterDraft {
  truckType?: string;
  capacity?: number;
  ratePerKm?: number;
  availableRoutes?: string[];
}

export interface AIOnboardingForm {
  fullName: string;
  phone: string;
  village: string;
  role: AIUserRole | null;
  // Role-specific fields
  sellerOffer: AIOfferDraft | null;
  buyerRequest: AIBuyerRequestDraft | null;
  transporterProfile: AITransporterDraft | null;
}

export interface AIActionPayload {
  action:
    | 'navigate'
    | 'create_offer'
    | 'create_request'
    | 'update_profile'
    | 'show_offers'
    | 'show_orders'
    | 'accept_bid'
    | 'reject_bid'
    | 'confirm'
    | 'cancel';
  params: Record<string, unknown>;
}

export interface AIConfirmationState {
  visible: boolean;
  title: string;
  description: string;
  actionPayload: AIActionPayload | null;
}

export interface AIModeState {
  // Session
  isActive: boolean;
  voiceState: VoiceState;
  isConnected: boolean;
  sessionError: string | null;

  // Chat
  messages: ChatMessage[];

  // Onboarding (AI Mode only)
  onboardingForm: AIOnboardingForm;

  // Confirmation
  confirmation: AIConfirmationState;

  // Actions
  setActive: (active: boolean) => void;
  setVoiceState: (state: VoiceState) => void;
  setConnected: (connected: boolean) => void;
  setSessionError: (error: string | null) => void;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  updateOnboardingField: <K extends keyof AIOnboardingForm>(
    field: K,
    value: AIOnboardingForm[K]
  ) => void;
  stageOffer: (offer: AIOfferDraft) => void;
  stageBuyerRequest: (request: AIBuyerRequestDraft) => void;
  stageTransporterProfile: (profile: AITransporterDraft) => void;
  showConfirmation: (title: string, description: string, action: AIActionPayload) => void;
  hideConfirmation: () => void;
  resetOnboarding: () => void;
  resetSession: () => void;
}
