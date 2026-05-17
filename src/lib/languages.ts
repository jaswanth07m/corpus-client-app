import { useEffect, useState } from 'react';
import { axiosInstance } from '@/api/axiosInstance';

export interface LanguageOption {
  value: string;
  label: string;
}

export const BUILTIN_LANGUAGES = [
  'assamese',
  'bengali',
  'bhili',
  'bodo',
  'dogri',
  'english',
  'garo',
  'gujarati',
  'gondi',
  'hindi',
  'ho',
  'kannada',
  'khandeshi',
  'kashmiri',
  'khasi',
  'konkani',
  'kurukh',
  'maithili',
  'malayalam',
  'marathi',
  'mundari',
  'meitei',
  'nepali',
  'odia',
  'punjabi',
  'sanskrit',
  'santali',
  'sindhi',
  'tamil',
  'telugu',
  'tulu',
  'urdu',
];

export const DEFAULT_PROFILE_LANGUAGES = ['telugu', 'hindi', 'english', 'urdu'];

export function formatLanguageLabel(language: string): string {
  return language.charAt(0).toUpperCase() + language.slice(1);
}

export function toLanguageOptions(languages: string[]): LanguageOption[] {
  return languages.map((language) => ({
    value: language,
    label: formatLanguageLabel(language),
  }));
}

let cachedLanguages: string[] | null = BUILTIN_LANGUAGES;
let inFlightLanguagesRequest: Promise<string[]> | null = null;

export async function fetchLanguages(): Promise<string[]> {
  if (cachedLanguages) {
    return cachedLanguages;
  }

  if (inFlightLanguagesRequest) {
    return inFlightLanguagesRequest;
  }

  inFlightLanguagesRequest = axiosInstance
    .get<string[]>('/languages')
    .then((response) => {
      cachedLanguages = response.data;
      return response.data;
    })
    .finally(() => {
      inFlightLanguagesRequest = null;
    });

  return inFlightLanguagesRequest;
}

export function useLanguages() {
  const [languages, setLanguages] = useState<string[]>(cachedLanguages ?? []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let isMounted = true;

    setIsLoading(true);
    fetchLanguages()
      .then((data) => {
        if (!isMounted) {
          return;
        }
        setLanguages(data);
        setError(null);
      })
      .catch((err) => {
        if (!isMounted) {
          return;
        }
        setError(err);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    languages,
    languageOptions: toLanguageOptions(languages),
    isLoading,
    error,
  };
}
