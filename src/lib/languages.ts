import { useEffect, useState } from 'react';
import { axiosInstance } from '@/api/axiosInstance';

export interface LanguageOption {
  value: string;
  label: string;
}

export interface LanguageResponseItem {
  name: string;
  code: string | null;
}

export const DEFAULT_PROFILE_LANGUAGES = ['te', 'hi', 'en', 'ur'];

export function formatLanguageLabel(language: string): string {
  return language.charAt(0).toUpperCase() + language.slice(1);
}

export function toLanguageOptions(languages: string[]): LanguageOption[] {
  return languages.map((code) => ({
    value: code,
    label: formatLanguageLabel(cachedLanguageNames[code] ?? code),
  }));
}

let cachedLanguages: string[] | null = null;
let cachedLanguageNames: Record<string, string> = {};
let cachedLanguageCodes: Record<string, string> = {};
let inFlightLanguagesRequest: Promise<string[]> | null = null;

export async function fetchLanguages(): Promise<string[]> {
  if (cachedLanguages) {
    return cachedLanguages;
  }

  if (inFlightLanguagesRequest) {
    return inFlightLanguagesRequest;
  }

  inFlightLanguagesRequest = axiosInstance
    .get<LanguageResponseItem[]>('/languages')
    .then((response) => {
      const filtered = response.data.filter(
        (item) => item.name.toLowerCase() !== 'na',
      );
      cachedLanguageNames = {};
      cachedLanguageCodes = {};
      for (const item of filtered) {
        if (item.code) {
          cachedLanguageNames[item.code] = item.name;
          cachedLanguageCodes[item.name] = item.code;
        }
      }
      cachedLanguages = filtered
        .map((item) => item.code)
        .filter((code): code is string => code !== null);
      return cachedLanguages;
    })
    .finally(() => {
      inFlightLanguagesRequest = null;
    });

  return inFlightLanguagesRequest;
}

export function getLanguageName(code: string): string {
  return cachedLanguageNames[code] ?? code;
}

export function getLanguageCode(name: string): string {
  return cachedLanguageCodes[name] ?? name;
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
