import { useState, useEffect } from 'react';
import LoginForm from '@/components/LoginForm';
import Categories from '@/components/Categories';
import MediaTypeWheel from '@/components/MediaTypeWheel';
import posthog from 'posthog-js';

type View = 'login' | 'content' | 'categories' | 'mediaWheel';

const Index = () => {
  const [currentView, setCurrentView] = useState<View>('login');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<
    'text' | 'audio' | 'video' | 'image' | 'document' | null
  >(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [selectedCategoryName, setSelectedCategoryName] = useState<
    string | null
  >(null);

  useEffect(() => {
    // Check for existing session on load
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      const user = JSON.parse(savedUser);
      setUser(user);
      posthog.identify(user.user_id);
      setCurrentView('mediaWheel');
    }
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleLoginSuccess = (accessToken: string, userData: any) => {
    setToken(accessToken);
    setUser(userData);
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
    posthog.identify(userData.user_id);
    posthog.capture('user_logged_in');
    setCurrentView('mediaWheel');
  };

  const handleLogout = () => {
    console.log('🚪 Logging out and clearing all data...');

    // Clear all authentication and cached data
    setToken(null);
    setUser(null);
    setSelectedMediaType(null);
    setSelectedCategoryId(null);
    setSelectedCategoryName(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    localStorage.removeItem('cachedProfile');
    localStorage.clear();

    posthog.reset();

    setCurrentView('login');
  };

  const handleMediaTypeSelect = (
    type: 'text' | 'audio' | 'video' | 'image' | 'document',
  ) => {
    console.log('Media type selected:', type);
    setSelectedMediaType(type);
    setCurrentView('categories'); // This will show upload form directly
    posthog.capture('media_type_selected', { mediaType: type });
  };

  const handleCategorySelect = (categoryId: string, categoryName: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedCategoryName(categoryName);
    posthog.capture('category_selected', { categoryId, categoryName });
  };

  const handleSessionExpired = () => {
    setToken('');
    setCurrentView('login');
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
  };

  if (currentView === 'login') {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  if (currentView === 'mediaWheel') {
    return (
      <MediaTypeWheel
        onSelect={handleMediaTypeSelect}
        selectedType={selectedMediaType}
        onCategorySelect={handleCategorySelect}
      />
    );
  }

  if (currentView === 'categories') {
    return (
      <Categories
        token={token!}
        onBack={() => setCurrentView('mediaWheel')}
        onLogout={handleLogout}
        onContentInput={handleCategorySelect}
        onSessionExpired={handleSessionExpired}
        preSelectedMediaType={selectedMediaType}
        preSelectedCategoryId={selectedCategoryId}
        preSelectedCategoryName={selectedCategoryName}
      />
    );
  }

  return null;
};

export default Index;
