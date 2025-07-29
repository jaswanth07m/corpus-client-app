/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Eye,
  EyeOff,
  Download,
  RefreshCw,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Activity,
  TrendingUp,
  Award,
  ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UserContributions from './UserContributions';
import { BACKEND_URL } from '@/lib/constants';

// Types
interface UserProfile {
  id: string;
  username: string;
  email: string;
  phone: string;
  name: string;
  gender?: string;
  dateOfBirth?: string;
  place?: string;
  isActive: boolean;
  hasGivenConsent: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

interface DailyStats {
  uploads_today: number;
  total_uploads: number;
  last_upload_date: string;
  streak_days: number;
}

interface UserContributions {
  totalContributions: number;
  contributionsByType: {
    text: number;
    audio: number;
    image: number;
    video: number;
  };
  audioContributions: Array<{
    id: string;
    size: number;
    category_id: string;
    reviewed: boolean;
    title: string;
  }>;
  videoContributions: Array<{
    id: string;
    size: number;
    category_id: string;
    reviewed: boolean;
    title: string;
  }>;
  textContributions: Array<{
    id: string;
    size: number;
    category_id: string;
    reviewed: boolean;
    title: string;
  }>;
  imageContributions: Array<{
    id: string;
    size: number;
    category_id: string;
    reviewed: boolean;
    title: string;
  }>;
  audioDuration: number;
  videoDuration: number;
}

interface UserProfileProps {
  user: any;
  token: string;
  onLogout: () => void;
  onBack: () => void;
}

interface UseUserProfileReturn {
  profile: UserProfile | null;
  dailyStats: DailyStats | null;
  contributions: UserContributions | null;
  loading: {
    profile: boolean;
    stats: boolean;
    contributions: boolean;
  };
  error: string | null;
  refetch: () => void;
  exportData: any;
  requestExport: () => Promise<void>;
}

// Custom Hook with Debug Statements
const useUserProfile = (
  userId?: string,
  shouldReset?: boolean,
): UseUserProfileReturn => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [contributions, setContributions] = useState<UserContributions | null>(
    null,
  );
  const [loading, setLoading] = useState({
    profile: true,
    stats: true,
    contributions: true,
  });
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (shouldReset) {
      console.log('🔄 Resetting profile data...');
      setProfile(null);
      setContributions(null);
      setError(null);
      setLoading({ profile: true, stats: true, contributions: true });

      // Clear cached data
      localStorage.removeItem('cachedProfile');
    }
  }, [shouldReset]);
  const [exportData, setExportData] = useState<any>(null);

  // Enhanced token retrieval with debug
  const getAuthToken = useCallback(() => {
    console.log('🔍 Searching for auth token...');

    const possibleKeys = [
      'authToken',
      'token',
      'access_token',
      'accessToken',
      'jwt',
      'jwtToken',
      'authorization',
      'bearer',
    ];

    let token = null;
    let foundKey = '';

    // Check localStorage first
    for (const key of possibleKeys) {
      const localToken = localStorage.getItem(key);
      if (localToken) {
        token = localToken;
        foundKey = `localStorage.${key}`;
        break;
      }
    }

    // Check sessionStorage if not found in localStorage
    if (!token) {
      for (const key of possibleKeys) {
        const sessionToken = sessionStorage.getItem(key);
        if (sessionToken) {
          token = sessionToken;
          foundKey = `sessionStorage.${key}`;
          break;
        }
      }
    }

    if (token) {
      console.log(`✅ Token found in: ${foundKey}`);
      console.log(`📝 Token preview: ${token.substring(0, 50)}...`);
    } else {
      console.log('❌ No token found in storage');
      console.log('🔍 Available localStorage keys:', Object.keys(localStorage));
      console.log(
        '🔍 Available sessionStorage keys:',
        Object.keys(sessionStorage),
      );
    }

    return token;
  }, []);

  // Enhanced JWT decoding with comprehensive debug
  const decodeUserIdFromToken = useCallback((token: string): string | null => {
    console.log('🔓 Starting JWT token decoding...');

    try {
      // Remove 'Bearer ' prefix if present
      const cleanToken = token.replace(/^Bearer\s+/i, '');
      console.log(`📝 Clean token length: ${cleanToken.length}`);

      const parts = cleanToken.split('.');
      console.log(`🔧 JWT parts count: ${parts.length}`);

      if (parts.length !== 3) {
        console.error(
          '❌ Invalid JWT format - should have 3 parts separated by dots',
        );
        return null;
      }

      console.log(
        '📋 JWT parts lengths:',
        parts.map((p) => p.length),
      );

      let payload = parts[1];
      console.log(`📦 Raw payload: ${payload}`);

      // Fix base64 padding
      payload = payload.replace(/-/g, '+').replace(/_/g, '/');
      while (payload.length % 4 !== 0) {
        payload += '=';
      }

      console.log(`🔧 Padded payload: ${payload}`);

      const decodedBytes = atob(payload);
      console.log(`📄 Decoded bytes length: ${decodedBytes.length}`);

      const payloadObj = JSON.parse(decodedBytes);
      console.log('🎯 Decoded JWT payload:', payloadObj);
      console.log('🔑 Available fields in token:', Object.keys(payloadObj));

      // Check multiple possible user ID fields
      const possibleFields = [
        'user_id',
        'userId',
        'sub',
        'id',
        'uid',
        'user',
        'user_pk',
        'pk',
        'user_id_pk',
        'userID',
        'USER_ID',
        'username',
        'email',
        'user_name',
      ];

      console.log('🔍 Checking for user ID in fields:', possibleFields);

      for (const field of possibleFields) {
        if (payloadObj[field]) {
          console.log(
            `✅ Found user ID in field '${field}':`,
            payloadObj[field],
          );
          return payloadObj[field].toString();
        }
      }

      console.log('❌ No user ID found in any expected field');
      console.log(
        '💡 Try checking these available fields manually:',
        Object.keys(payloadObj),
      );

      return null;
    } catch (error) {
      console.error('💥 Token decoding error:', error);
      console.error('🔍 Error details:', {
        message: error.message,
        stack: error.stack,
      });
      return null;
    }
  }, []);

  // Enhanced user ID retrieval with debug
  const getCurrentUserId = useCallback(() => {
    console.log('🆔 Getting current user ID...');

    if (userId) {
      console.log(`✅ Using provided userId: ${userId}`);
      return userId;
    }

    console.log('🔍 No userId provided, attempting to decode from token...');
    const token = getAuthToken();

    if (!token) {
      console.log('❌ No token available for decoding');
      return null;
    }

    const decodedUserId = decodeUserIdFromToken(token);

    if (decodedUserId) {
      console.log(`✅ Successfully decoded user ID: ${decodedUserId}`);
    } else {
      console.log('❌ Failed to decode user ID from token');
    }

    return decodedUserId;
  }, [userId, getAuthToken, decodeUserIdFromToken]);

  // Enhanced profile fetching with debug
  const fetchUserProfile = useCallback(
    async (currentUserId: string) => {
      console.log(`👤 Fetching profile for user ID: ${currentUserId}`);
      setLoading((prev) => ({ ...prev, profile: true }));

      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const apiUrl = BACKEND_URL + '/auth/me';
        console.log(`🌐 Making API call to: ${apiUrl}`);

        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log(`📡 API Response status: ${response.status}`);
        console.log(
          `📡 API Response headers:`,
          Object.fromEntries(response.headers.entries()),
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch profile: ${response.status} ${response.statusText}`,
          );
        }

        const userData = await response.json();
        console.log('📦 Profile API response:', userData);

        console.log('✅ Profile data received:', userData);

        const profileData = {
          id: userData.id || currentUserId,
          username: userData.username || '',
          email: userData.email || '',
          phone: userData.phone || '',
          name: userData.name || userData.username || '',
          gender: userData.gender,
          dateOfBirth: userData.date_of_birth,
          place: userData.place,
          isActive: userData.is_active !== false,
          hasGivenConsent: userData.has_given_consent === true,
          createdAt: userData.created_at || '',
          updatedAt: userData.updated_at || '',
          lastLoginAt: userData.last_login_at,
        };

        setProfile(profileData);
        localStorage.setItem('cachedProfile', JSON.stringify(userData));
        console.log('💾 Profile cached successfully');
      } catch (err) {
        console.error('💥 Profile fetch error:', err);

        // Try to load from cache
        const cachedProfile = localStorage.getItem('cachedProfile');
        if (cachedProfile) {
          try {
            console.log('🔄 Loading profile from cache...');
            const userData = JSON.parse(cachedProfile);
            setProfile({
              id: userData.id || currentUserId,
              username: userData.username || '',
              email: userData.email || '',
              phone: userData.phone || '',
              name: userData.name || userData.username || '',
              gender: userData.gender,
              dateOfBirth: userData.date_of_birth,
              place: userData.place,
              isActive: userData.is_active !== false,
              hasGivenConsent: userData.has_given_consent === true,
              createdAt: userData.created_at || '',
              updatedAt: userData.updated_at || '',
              lastLoginAt: userData.last_login_at,
            });
            console.log('✅ Profile loaded from cache');
          } catch (cacheError) {
            console.error('💥 Cache loading error:', cacheError);
            setError('Failed to load profile data');
          }
        } else {
          console.log('❌ No cached profile available');
          setError(
            err instanceof Error ? err.message : 'Failed to fetch profile',
          );
        }
      } finally {
        setLoading((prev) => ({ ...prev, profile: false }));
      }
    },
    [getAuthToken],
  );

  const fetchDailyStats = useCallback(
    async (currentUserId: string) => {
      console.log(`📊 Fetching daily stats for user ID: ${currentUserId}`);
      setLoading((prev) => ({ ...prev, stats: true }));

      try {
        const token = getAuthToken();
        const response = await fetch(BACKEND_URL + `/users/${currentUserId}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log(`📡 Daily stats API response status: ${response.status}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch daily stats: ${response.status}`);
        }

        const data = await response.json();
        console.log('📦 Daily stats response:', data);

        if (data.success) {
          setDailyStats({
            uploads_today: data.data.uploads_today || 0,
            total_uploads: data.data.total_uploads || 0,
            last_upload_date: data.data.last_upload_date || '',
            streak_days: data.data.streak_days || 0,
          });
          console.log('✅ Daily stats loaded successfully');
        }
      } catch (err) {
        console.error('💥 Daily stats fetch error:', err);
        setDailyStats({
          uploads_today: 0,
          total_uploads: 0,
          last_upload_date: '',
          streak_days: 0,
        });
      } finally {
        setLoading((prev) => ({ ...prev, stats: false }));
      }
    },
    [getAuthToken],
  );

  const fetchUserContributions = useCallback(
    async (currentUserId: string) => {
      console.log(`🏆 Fetching contributions for user ID: ${currentUserId}`);
      setLoading((prev) => ({ ...prev, contributions: true }));

      try {
        const token = getAuthToken();
        const baseUrl = BACKEND_URL;
        const apiUrl = `${baseUrl}/users/${currentUserId}/contributions`;

        console.log(`🌐 Making contributions API call to: ${apiUrl}`);

        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        });

        console.log(`📡 Contributions API response status: ${response.status}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch contributions: ${response.status}`);
        }

        const data = await response.json();
        console.log('📦 Contributions response:', data);

        // Map the API response to your contributions structure
        setContributions({
          totalContributions: data.total_contributions || 0,
          contributionsByType: data.contributions_by_media_type || {
            text: 0,
            audio: 0,
            image: 0,
            video: 0,
          },
          audioContributions: data.audio_contributions || [],
          videoContributions: data.video_contributions || [],
          textContributions: data.text_contributions || [],
          imageContributions: data.image_contributions || [],
          audioDuration: data.audio_duration || 0,
          videoDuration: data.video_duration || 0,
        });
        console.log('✅ Contributions loaded successfully');
      } catch (err) {
        console.error('💥 Contributions fetch error:', err);
        setContributions({
          totalContributions: 0,
          contributionsByType: {
            text: 0,
            audio: 0,
            image: 0,
            video: 0,
          },
          audioContributions: [],
          videoContributions: [],
          textContributions: [],
          imageContributions: [],
          audioDuration: 0,
          videoDuration: 0,
        });
      } finally {
        setLoading((prev) => ({ ...prev, contributions: false }));
      }
    },
    [getAuthToken],
  );

  const requestExport = useCallback(async () => {
    console.log('📤 Requesting data export...');

    try {
      const currentUserId = getCurrentUserId();
      if (!currentUserId) throw new Error('User ID not found');

      const token = getAuthToken();
      const response = await fetch(`/api/users/${currentUserId}/export`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Export request failed: ${response.status}`);
      }

      const data = await response.json();
      setExportData(data);
      console.log('✅ Export request successful:', data);
    } catch (err) {
      console.error('💥 Export request error:', err);
      setError(err instanceof Error ? err.message : 'Export request failed');
    }
  }, [getCurrentUserId, getAuthToken]);

  const refetch = useCallback(() => {
    console.log('🔄 Refetching all data...');
    const currentUserId = getCurrentUserId();
    if (currentUserId) {
      setError(null);
      fetchUserProfile(currentUserId);
      fetchDailyStats(currentUserId);
      fetchUserContributions(currentUserId);
    } else {
      console.log('❌ Cannot refetch - no user ID available');
    }
  }, [
    getCurrentUserId,
    fetchUserProfile,
    fetchDailyStats,
    fetchUserContributions,
  ]);

  // Initial data fetch with comprehensive debug
  useEffect(() => {
    console.log('🚀 UserProfile hook initializing...');
    console.log('📋 Hook parameters:', { userId });

    const currentUserId = getCurrentUserId();
    console.log('🆔 Current user ID:', currentUserId);

    if (currentUserId) {
      console.log('✅ User ID found, fetching data...');
      fetchUserProfile(currentUserId);
      fetchDailyStats(currentUserId);
      fetchUserContributions(currentUserId);
    } else {
      console.log('❌ No user ID found, setting error state');
      setError('No user ID found. Please log in again.');
      setLoading({ profile: false, stats: false, contributions: false });
    }
  }, [
    getCurrentUserId,
    fetchUserProfile,
    fetchDailyStats,
    fetchUserContributions,
    userId,
  ]);

  return {
    profile,
    dailyStats,
    contributions,
    loading,
    error,
    refetch,
    exportData,
    requestExport,
  };
};

// Main Component (unchanged from your original)
const UserProfile: React.FC<UserProfileProps> = ({
  user,
  token,
  onLogout,
  onBack,
}) => {
  const navigate = useNavigate();

  const {
    profile: currentUser,
    dailyStats,
    contributions,
    loading,
    error,
    refetch,
    exportData,
    requestExport,
  } = useUserProfile();

  const [isEmailRevealed, setIsEmailRevealed] = useState(false);
  const [isPhoneRevealed, setIsPhoneRevealed] = useState(false);

  const [selectedMediaType, setSelectedMediaType] = useState<
    'text' | 'audio' | 'video' | 'image'
  >('text');

  // Utility functions
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Invalid date';
    }
  };

  const maskEmail = (email: string) => {
    if (!email) return '';
    const [username, domain] = email.split('@');
    if (!username || !domain) return email;
    return `${username.substring(0, 2)}${'*'.repeat(
      Math.max(0, username.length - 2),
    )}@${domain}`;
  };

  const maskPhone = (phone: string) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 4) return phone;
    return `${cleaned.substring(0, 2)}${'*'.repeat(
      Math.max(0, cleaned.length - 4),
    )}${cleaned.substring(cleaned.length - 2)}`;
  };

  const toggleEmailReveal = () => {
    setIsEmailRevealed(!isEmailRevealed);
  };

  const togglePhoneReveal = () => {
    setIsPhoneRevealed(!isPhoneRevealed);
  };

  const handleExport = () => {
    try {
      // Prepare the data to export
      const exportData = {
        profile: currentUser,
        contributions: contributions,
        exportedAt: new Date().toISOString(),
        exportedBy: currentUser?.name || 'Unknown User',
      };

      // Convert to JSON string with formatting
      const fileData = JSON.stringify(exportData, null, 2);

      // Create blob with JSON data
      const blob = new Blob([fileData], { type: 'application/json' });

      // Create download URL
      const url = URL.createObjectURL(blob);

      // Create temporary link element
      const link = document.createElement('a');
      link.download = `profile-data-${
        currentUser?.name?.replace(/\s+/g, '-') || 'user'
      }-${new Date().toISOString().split('T')[0]}.json`;
      link.href = url;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('✅ Profile data exported successfully');
    } catch (err) {
      console.error('💥 Export failed:', err);
      alert('Failed to export profile data');
    }
  };

  const handleExportCSV = () => {
    try {
      // Prepare CSV data
      const csvData = [
        ['Field', 'Value'],
        ['Name', currentUser?.name || ''],
        ['Email', currentUser?.email || ''],
        ['Phone', currentUser?.phone || ''],
        ['Gender', currentUser?.gender || ''],
        ['Date of Birth', currentUser?.dateOfBirth || ''],
        ['Place', currentUser?.place || ''],
        ['Status', currentUser?.isActive ? 'Active' : 'Inactive'],
        ['Consent Given', currentUser?.hasGivenConsent ? 'Yes' : 'No'],
        ['Member Since', formatDate(currentUser?.createdAt || '')],
        ['Last Login', formatDate(currentUser?.lastLoginAt || '')],
        ['Text Contributions', contributions?.contributionsByType?.text || 0],
        ['Audio Contributions', contributions?.contributionsByType?.audio || 0],
        ['Image Contributions', contributions?.contributionsByType?.image || 0],
        ['Video Contributions', contributions?.contributionsByType?.video || 0],
        ['Total Contributions', contributions?.totalContributions || 0],
      ];

      // Convert to CSV string
      const csvString = csvData
        .map((row) => row.map((field) => `"${field}"`).join(','))
        .join('\n');

      // Create blob and download
      const blob = new Blob([csvString], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `profile-data-${
        currentUser?.name?.replace(/\s+/g, '-') || 'user'
      }-${new Date().toISOString().split('T')[0]}.csv`;
      link.href = url;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('✅ Profile data exported as CSV successfully');
    } catch (err) {
      console.error('💥 CSV export failed:', err);
      alert('Failed to export profile data as CSV');
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'text-green-600' : 'text-red-600';
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? 'Active' : 'Inactive';
  };

  if (loading.profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">{error}</div>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No user data available</p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack} // or whatever your categories route is
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to Categories"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-semibold">
                {getInitials(currentUser.name)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {currentUser.name}
                </h1>
                <p className="text-gray-600">@{currentUser.id}</p>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                    currentUser.isActive,
                  )}`}
                >
                  {getStatusText(currentUser.isActive)}
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleRefresh}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw size={20} />
              </button>
              <button
                onClick={handleExport}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Export Data"
              >
                <Download size={20} />
              </button>
            </div>
          </div>
        </div>
        {/* Privacy Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <Eye size={16} className="text-blue-600" />
            <p className="text-sm text-blue-800">
              Tap the eye icon to reveal sensitive information
            </p>
          </div>
        </div>
        {/* Profile Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Profile Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Mail size={16} className="text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Email</p>
                  <p className="text-sm text-gray-600">
                    {isEmailRevealed
                      ? currentUser.email
                      : maskEmail(currentUser.email)}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleEmailReveal}
                className="p-1 text-gray-600 hover:text-gray-900 transition-colors"
              >
                {isEmailRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Phone size={16} className="text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Phone</p>
                  <p className="text-sm text-gray-600">
                    {isPhoneRevealed
                      ? currentUser.phone
                      : maskPhone(currentUser.phone)}
                  </p>
                </div>
              </div>
              <button
                onClick={togglePhoneReveal}
                className="p-1 text-gray-600 hover:text-gray-900 transition-colors"
              >
                {isPhoneRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {currentUser.gender && (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <User size={16} className="text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Gender</p>
                  <p className="text-sm text-gray-600">{currentUser.gender}</p>
                </div>
              </div>
            )}

            {currentUser.dateOfBirth && (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Calendar size={16} className="text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Date of Birth
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatDate(currentUser.dateOfBirth)}
                  </p>
                </div>
              </div>
            )}

            {currentUser.place && (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <MapPin size={16} className="text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Location</p>
                  <p className="text-sm text-gray-600">{currentUser.place}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        {contributions && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Contributions by Media Type
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Activity size={24} className="text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600">
                  {contributions.contributionsByType.text}
                </p>
                <p className="text-sm text-gray-600">Text Contributions</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <TrendingUp size={24} className="text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">
                  {contributions.contributionsByType.audio}
                </p>
                <p className="text-sm text-gray-600">Audio Contributions</p>
                <p className="text-xs text-gray-500 mt-1">
                  {contributions.audioDuration > 0
                    ? `${(contributions.audioDuration / 3600).toFixed(1)} hours`
                    : '0 hours'}
                </p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <Award size={24} className="text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-orange-600">
                  {contributions.contributionsByType.image}
                </p>
                <p className="text-sm text-gray-600">Image Contributions</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Calendar size={24} className="text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-600">
                  {contributions.contributionsByType.video}
                </p>
                <p className="text-sm text-gray-600">Video Contributions</p>
                <p className="text-xs text-gray-500 mt-1">
                  {contributions.videoDuration > 0
                    ? `${(contributions.videoDuration / 3600).toFixed(1)} hours`
                    : '0 hours'}
                </p>
              </div>
            </div>

            {/* Total Contributions Summary */}
            <div className="mt-6 text-center p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Total Contributions
              </h3>
              <p className="text-3xl font-bold text-indigo-600">
                {contributions.totalContributions}
              </p>
            </div>
          </div>
        )}
        {/* New section for detailed contributions */}
        <div className="detailed-contributions">
          <h2 className="mt-6 text-2xl font-semibold text-center p-4 bg-gray-100 rounded-lg">
            My Contributions
          </h2>

          {/* Media type selector */}
          <div className="media-type-selector">
            <button
              onClick={() => setSelectedMediaType('text')}
              className={selectedMediaType === 'text' ? 'active' : ''}
            >
              Text
            </button>
            <button
              onClick={() => setSelectedMediaType('audio')}
              className={selectedMediaType === 'audio' ? 'active' : ''}
            >
              Audio
            </button>
            <button
              onClick={() => setSelectedMediaType('video')}
              className={selectedMediaType === 'video' ? 'active' : ''}
            >
              Video
            </button>
            <button
              onClick={() => setSelectedMediaType('image')}
              className={selectedMediaType === 'image' ? 'active' : ''}
            >
              Image
            </button>
          </div>

          {/* Display contributions for selected media type */}
          <UserContributions
            userId={currentUser.id}
            mediaType={selectedMediaType}
            authToken={token}
          />
        </div>
        {/* Account Information */}{' '}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Account Information
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Member Since</span>
              <span className="text-sm font-medium text-gray-900">
                {formatDate(currentUser.createdAt)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Last Updated</span>
              <span className="text-sm font-medium text-gray-900">
                {formatDate(currentUser.updatedAt)}
              </span>
            </div>
            {currentUser.lastLoginAt && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Last Login</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatDate(currentUser.lastLoginAt)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Consent Given</span>
              <span
                className={`text-sm font-medium ${
                  currentUser.hasGivenConsent
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {currentUser.hasGivenConsent ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
        {/* Export Section */}
        <div className="flex space-x-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            disabled={!currentUser}
          >
            <Download size={16} />
            <span>Export JSON</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            disabled={!currentUser}
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
