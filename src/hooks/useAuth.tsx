import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import posthog from 'posthog-js';
import { BACKEND_URL } from '@/lib/constants';

interface UserProfile {
  id: string;
  name?: string;
  username?: string;
  streaks?: {
    combined_streak: {
      current: number;
      longest: number;
      total_active_days: number;
    };
  };
  summary?: {
    contributions: {
      total_contributions: number;
      contributions_by_media_type: {
        text: number;
        audio: number;
        image: number;
        video: number;
        document: number;
      };
    };
    edits: {
      total_edits: number;
    };
    overall: {
      total_activities: number;
    };
  };
  timeline?: Record<string, unknown>;
  streak_days?: number;
  total_contributions?: number;
  total_edits?: number;
  total_active_days?: number;
  uploads_today?: number;
  hours_active?: number;
  user_id?: string;
  user_name?: string;
}

type AuthContextType = {
  token: string | null;
  user: UserProfile | null;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
  isReady: boolean;
  refetchUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: BACKEND_URL,
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isReady, setIsReady] = useState<boolean>(false);

  // Function to fetch comprehensive user profile data
  const fetchUserProfile = async (accessToken: string) => {
    try {
      // Set the token for this specific request
      const config = {
        headers: { Authorization: `Bearer ${accessToken}` },
      };

      // First, get the basic user info to get the user ID
      const basicResponse = await apiClient.get('/auth/me', config);

      const basicUserData = basicResponse.data;
      const userId = basicUserData.id;

      // Then fetch the comprehensive profile with streaks and stats
      try {
        const profileResponse = await apiClient.get(
          `/users/${userId}/profile?include=streaks,timeline,summary&days=30`,
          config,
        );

        const profileData = profileResponse.data;

        // Merge the data to have both basic info and detailed stats
        return {
          ...basicUserData,
          // Override with profile data if available
          streaks: profileData.streaks,
          summary: profileData.summary,
          timeline: profileData.timeline,
          // Keep basic user properties
          id: basicUserData.id,
          name: basicUserData.name || profileData.user_name,
          username: basicUserData.username || profileData.username,
        };
      } catch (profileError) {
        // If the detailed profile fails, fall back to basic user data
        console.warn(
          'Failed to fetch detailed profile, falling back to basic data',
          profileError,
        );
        return basicUserData;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('token');
      if (!savedToken) {
        setIsReady(true);
        return;
      }

      try {
        // Validate token and fetch comprehensive user data
        const userData = await fetchUserProfile(savedToken);

        // Token is valid, set user data
        setToken(savedToken);
        setUser(userData);
        posthog.identify(userData.user_id || userData.id);
      } catch (error) {
        // Token is invalid, clear storage
        console.error('Auth validation failed', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      } finally {
        setIsReady(true);
      }
    };

    initializeAuth();
  }, []);

  const login = async (accessToken: string, userData: UserProfile) => {
    try {
      // Fetch comprehensive profile data after login
      const fullUserData = await fetchUserProfile(accessToken);

      setToken(accessToken);
      setUser(fullUserData);
      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(fullUserData));
      posthog.identify(fullUserData.user_id || fullUserData.id);
      posthog.capture('user_logged_in');
      return fullUserData;
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.clear();
    posthog.reset();
  };

  const refetchUser = async () => {
    if (token) {
      try {
        const userData = await fetchUserProfile(token);
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (error) {
        console.error('Error refetching user data:', error);
        // Optionally logout if token becomes invalid
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{ token, user, login, logout, isReady, refetchUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
