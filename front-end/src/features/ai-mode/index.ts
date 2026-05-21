// AI Mode — Voice-first onboarding & assistant
export { AIModeScreen } from './screens/AIModeScreen';
export { CharacterAvatar } from './components/CharacterAvatar';
export { VoiceStateIndicator } from './components/VoiceStateIndicator';
export { ChatBubble } from './components/ChatBubble';
export { AIFloatingButton } from './components/AIFloatingButton';
export { AIConfirmationModal } from './components/AIConfirmationModal';
export { useAIModeStore } from './store/ai-mode.store';
export * from './types';
export { parseBulgarianQuantity, parseBulgarianCurrency, extractOfferFromText } from './utils/bulgarianParser';
