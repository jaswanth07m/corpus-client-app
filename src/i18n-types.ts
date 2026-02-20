// Type definitions for i18next translation keys
// This provides type safety when using t() function

import enTranslation from '@/locales/en/translation.json';

// Get the type of the translation object
type Translation = typeof enTranslation;

// Extract all nested keys recursively
type KeysOf<T, Prefix extends string = ''> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? KeysOf<T[K], `${Prefix}${K}.`>
          : `${Prefix}${K}`
        : never;
    }[keyof T]
  : never;

// All translation keys
export type TranslationKeys = KeysOf<Translation>;

// Helper type for translation options
export interface TranslationOptions {
  [key: string]: string | number | undefined;
}

// Declare module augmentation for react-i18next
declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: Translation;
    };
    allowObjectInHTMLChildren: false;
  }
}

// Export the translation type for direct use
export type { Translation };
