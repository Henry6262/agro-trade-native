import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import bg from './locales/bg.json';

export const LANG_STORAGE_KEY = '@agrotrade:language';
export type SupportedLang = 'en' | 'bg';

function getDeviceLang(): SupportedLang {
  const locale = Localization.getLocales()[0]?.languageCode ?? 'en';
  return locale.startsWith('bg') ? 'bg' : 'en';
}

// Initial sync setup with device defaults
i18next.use(initReactI18next).init({
  lng: getDeviceLang(),
  fallbackLng: 'en',
  resources: {
    en: { translation: en },
    bg: { translation: bg },
  },
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

// Async initialization to load saved language
export async function initI18n(): Promise<void> {
  const saved = await AsyncStorage.getItem(LANG_STORAGE_KEY).catch(() => null);
  if (saved && (saved === 'en' || saved === 'bg')) {
    await i18next.changeLanguage(saved);
  }
}

export async function setLanguage(lang: SupportedLang): Promise<void> {
  await AsyncStorage.setItem(LANG_STORAGE_KEY, lang);
  await i18next.changeLanguage(lang);
}

export { i18next };
