import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '@/lib/constants';

const MyProfileRedirect = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    const getCurrentUserId = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return null;
      }

      try {
        const response = await fetch(`${BACKEND_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch current user profile');
        }

        const userData = await response.json();
        // Store the username in localStorage for easy access
        if (userData.username) {
          localStorage.setItem('username', userData.username);
        }
        return userData.username || userData.id; // Use username if available, fallback to id
      } catch (error) {
        console.error('Error fetching current user ID:', error);
        return null;
      }
    };

    const redirect = async () => {
      const currentUserId = await getCurrentUserId();
      if (currentUserId) {
        navigate(`/profile/${currentUserId}`, { replace: true });
      } else {
        // If we can't get the user ID, maybe redirect to login or show an error
        navigate('/login', { replace: true });
      }
    };

    redirect();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">{t('messages.loadingProfile')}</p>
      </div>
    </div>
  );
};

export default MyProfileRedirect;
