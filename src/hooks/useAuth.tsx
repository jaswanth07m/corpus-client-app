import { createContext, useContext, useEffect, useState } from 'react';
import posthog from 'posthog-js';
import { access } from 'fs';
import { BACKEND_URL } from '@/lib/constants';

type AuthContextType = {
  token: string | null;
  user: unknown;
  login: (token: string, user: unknown) => void;
  logout: () => void;
  isReady: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<unknown>(null);
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsReady(true);
        return;
      }

      try {
        const response = await fetch(`${BACKEND_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          localStorage.removeItem('token');
          setToken(null);
        }
      } catch (error) {
        console.error('Auth validation failed', error);
      } finally {
        setIsReady(true);
      }
    };

    validateToken();

    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setToken(savedToken);
      setUser(parsedUser);
      posthog.identify(parsedUser.user_id);
    }

    setIsReady(true);
  }, []);

  const login = (accessToken: string, userData: unknown) => {
    setToken(accessToken);
    setUser(userData);
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
    posthog.identify(userData.user_id);
    posthog.capture('user_logged_in');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.clear();
    posthog.reset();
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isReady }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
