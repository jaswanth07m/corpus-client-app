import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslation from '@/locales/en/translation.json';
import teTranslation from '@/locales/te/translation.json';
import hiTranslation from '@/locales/hi/translation.json';
import knTranslation from '@/locales/kn/translation.json';
import taTranslation from '@/locales/ta/translation.json';
import bnTranslation from '@/locales/bn/translation.json';
import mlTranslation from '@/locales/ml/translation.json';

// Supported languages
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]['code'];

i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    // Resources for each language
    resources: {
      en: {
        translation: enTranslation,
      },
      te: {
        translation: teTranslation,
      },
      hi: {
        translation: hiTranslation,
      },
      kn: {
        translation: knTranslation,
      },
      ta: {
        translation: taTranslation,
      },
      bn: {
        translation: bnTranslation,
      },
      ml: {
        translation: mlTranslation,
      },
    },

    // Fallback language
    fallbackLng: 'en',

    // Supported languages
    supportedLngs: SUPPORTED_LANGUAGES.map((lang) => lang.code),

    // Debug mode (disable in production)
    debug: import.meta.env.DEV,

    // Detection options
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },

    // Interpolation options
    interpolation: {
      escapeValue: false, // React already escapes values
    },

    // React options
    react: {
      useSuspense: false,
    },

    // Return key if translation missing
    appendMissingTo: 'fallback',
    appendMissingKey: true,

    // Load translations on demand (optional - for large apps)
    // partialBundledLanguages: true,
  });

// Safe translation helper to prevent crashes
export const safeT = (key: string, fallback?: string): string => {
  const translation = i18n.t(key);
  // Check if translation was found or if i18n returned the key itself (meaning no translation exists)
  if (translation === key || translation.includes('undefined')) {
    return fallback || key;
  }
  return translation;
};
