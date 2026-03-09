import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import bg from './locales/bg.json';

export const SUPPORTED_LANGUAGES = ['en', 'bg'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_STORAGE_KEY = '@agrotrade_language';

// Use Intl (available on Hermes/RN 0.70+) instead of expo-localization native module.
// expo-localization requires a native bridge compiled into the dev build binary;
// Intl works in pure JS so it survives any dev-client build without native linking.
const getDeviceLanguage = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale.split('-')[0] ?? 'en';
  } catch {
    return 'en';
  }
};
const deviceLocale = getDeviceLanguage();
const defaultLanguage: SupportedLanguage = SUPPORTED_LANGUAGES.includes(
  deviceLocale as SupportedLanguage
)
  ? (deviceLocale as SupportedLanguage)
  : 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    bg: { translation: bg },
  },
  lng: defaultLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

// Restore persisted language preference
AsyncStorage.getItem(LANGUAGE_STORAGE_KEY).then((saved) => {
  if (saved && SUPPORTED_LANGUAGES.includes(saved as SupportedLanguage)) {
    i18n.changeLanguage(saved);
  }
});

export default i18n;
