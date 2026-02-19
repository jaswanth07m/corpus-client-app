import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslation from '@/locales/en/translation.json';
import teTranslation from '@/locales/te/translation.json';
import hiTranslation from '@/locales/hi/translation.json';

// Define available resources
export const resources = {
  en: {
    translation: enTranslation,
  },
  te: {
    translation: teTranslation,
  },
  hi: {
    translation: hiTranslation,
  },
};

// Supported languages
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
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
    resources,

    // Fallback language
    fallbackLng: 'en',

    // Default language
    lng: 'en',

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

    // Load translations on demand (optional - for large apps)
    // partialBundledLanguages: true,
  });

// Export for use in components
export default i18n;
