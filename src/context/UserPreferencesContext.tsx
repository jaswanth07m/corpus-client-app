import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';

export interface UserPreferences {
  language: string;
  rights: string;
}

interface UserPreferencesContextType {
  preferences: UserPreferences;
  setPreferences: (prefs: Partial<UserPreferences>) => void;
  isLoaded: boolean;
}

const STORAGE_KEY = 'user_preferences';

const defaultPreferences: UserPreferences = {
  language: '',
  rights: '',
};

const getStoredPreferences = (): UserPreferences => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultPreferences, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Error reading preferences from localStorage:', error);
  }
  return defaultPreferences;
};

const UserPreferencesContext = createContext<
  UserPreferencesContextType | undefined
>(undefined);

interface UserPreferencesProviderProps {
  children: ReactNode;
}

export const UserPreferencesProvider: React.FC<
  UserPreferencesProviderProps
> = ({ children }) => {
  const [preferences, setPreferencesState] =
    useState<UserPreferences>(getStoredPreferences);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const setPreferences = useCallback((prefs: Partial<UserPreferences>) => {
    setPreferencesState((prev) => {
      const newPreferences = { ...prev, ...prefs };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences));
      } catch (error) {
        console.error('Error saving preferences to localStorage:', error);
      }
      return newPreferences;
    });
  }, []);

  return (
    <UserPreferencesContext.Provider
      value={{ preferences, setPreferences, isLoaded }}
    >
      {children}
    </UserPreferencesContext.Provider>
  );
};

export const useUserPreferences = (): UserPreferencesContextType => {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error(
      'useUserPreferences must be used within a UserPreferencesProvider',
    );
  }
  return context;
};
