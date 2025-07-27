import React, { useState, useEffect } from 'react';
import LoginForm from '@/components/LoginForm';
import UserProfile from '@/components/UserProfile';
import ContentInput from '@/components/ContentInput';
import Categories from '@/components/Categories';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, User, Grid3X3 } from 'lucide-react';
import posthog from 'posthog-js';

type View = 'login' | 'profile' | 'content' | 'categories';

const Index = () => {
  const [currentView, setCurrentView] = useState<View>('login');
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing session on load
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      const user = JSON.parse(savedUser);
      setUser(user);
      posthog.identify(user.user_id);
      setCurrentView('categories');
    }
  }, []);

  const handleLoginSuccess = (accessToken: string, userData: any) => {
    setToken(accessToken);
    setUser(userData);
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
    posthog.identify(userData.user_id);
    posthog.capture('user_logged_in');
    setCurrentView('categories');
  };

  const handleLogout = () => {
    console.log('🚪 Logging out and clearing all data...');

    // Clear all authentication and cached data
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('authToken'); // Clear this too if it exists
    localStorage.removeItem('cachedProfile'); // Clear cached profile
    localStorage.clear(); // Or clear everything if needed

    posthog.reset();

    setCurrentView('login');
  };

  if (currentView === 'login') {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  if (currentView === 'profile') {
    return (
      <UserProfile
        key={user?.id || Date.now()}
        user={user}
        token={token!}
        onLogout={handleLogout}
        onBack={() => setCurrentView('categories')}
      />
    );
  }

  if (currentView === 'content') {
    return (
      <ContentInput
        token={token!}
        onBack={() => setCurrentView('categories')}
      />
    );
  }
  const handleSessionExpired = () => {
    setToken('');
    setCurrentView('login');
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
  };

  if (currentView === 'categories') {
    return (
      <Categories
        token={token!}
        onBack={handleLogout} // Changed: Now goes directly to login
        onLogout={handleLogout}
        onProfile={() => setCurrentView('profile')}
        onContentInput={() => setCurrentView('content')}
        onSessionExpired={handleSessionExpired}
      />
    );
  }

  // This return statement should never be reached now
  return null;
};

export default Index;
