import { useEffect, useState } from 'react';
import { axiosInstance } from '@/api/axiosInstance';

export interface LanguageOption {
  value: string;
  label: string;
}

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

let cachedLanguages: string[] | null = null;
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
      const filtered = response.data.filter(
        (lang) => lang.toLowerCase() !== 'na',
      );
      cachedLanguages = filtered;
      return filtered;
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
