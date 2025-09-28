/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';
import PropTypes from 'prop-types';
import { toast } from 'sonner';

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
  Pencil,
  AlertTriangle,
  X,
  Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UserContributions from './UserContributions';
import { BACKEND_URL } from '@/lib/constants';
import { formatModernTime, formatSizeMB, formatDuration } from '@/lib/utils';

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

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface ContributionItem {
  id: string;
  size: number;
  category_id: string;
  reviewed: boolean;
  title: string;
  description: string;
  duration?: number;
  timestamp?: string;
  location?: Coordinates;
  release_rights: string;
  language: string;
  file_hash: string;
  snr_frequency: number;
}

interface UserContributions {
  totalContributions: number;
  contributionsByType: {
    text: number;
    audio: number;
    image: number;
    video: number;
    document: number;
  };
  audioContributions: ContributionItem[];
  videoContributions: ContributionItem[];
  textContributions: ContributionItem[];
  imageContributions: ContributionItem[];
  documentContributions: ContributionItem[];
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
      setProfile(null);
      setContributions(null);
      setError(null);
      setLoading({ profile: true, stats: true, contributions: true });

      localStorage.removeItem('cachedProfile');
    }
  }, [shouldReset]);
  const [exportData, setExportData] = useState<any>(null);

  const getAuthToken = useCallback(() => {
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

    for (const key of possibleKeys) {
      const localToken = localStorage.getItem(key);
      if (localToken) {
        token = localToken;
        foundKey = `localStorage.${key}`;
        break;
      }
    }

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

    return token;
  }, []);

  const decodeUserIdFromToken = useCallback((token: string): string | null => {
    try {
      const cleanToken = token.replace(/^Bearer\s+/i, '');
      const parts = cleanToken.split('.');

      if (parts.length !== 3) {
        return null;
      }

      let payload = parts[1];

      payload = payload.replace(/-/g, '+').replace(/_/g, '/');
      while (payload.length % 4 !== 0) {
        payload += '=';
      }

      const decodedBytes = atob(payload);
      const payloadObj = JSON.parse(decodedBytes);

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

      for (const field of possibleFields) {
        if (payloadObj[field]) {
          return payloadObj[field].toString();
        }
      }

      return null;
    } catch (error) {
      console.error('🔍 Error details:', {
        message: error.message,
        stack: error.stack,
      });
      return null;
    }
  }, []);

  const getCurrentUserId = useCallback(() => {
    if (userId) {
      return userId;
    }

    const token = getAuthToken();

    if (!token) {
      return null;
    }

    const decodedUserId = decodeUserIdFromToken(token);
    return decodedUserId;
  }, [userId, getAuthToken, decodeUserIdFromToken]);

  const fetchUserProfile = useCallback(
    async (currentUserId: string) => {
      setLoading((prev) => ({ ...prev, profile: true }));

      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const apiUrl = BACKEND_URL + '/auth/me';

        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error(
              'Authentication failed. Please log in again. Your session might have expired.',
            );
          }
          if (response.status === 404) {
            throw new Error(
              `User profile not found. The user ID ${currentUserId} might not exist.`,
            );
          }
          throw new Error(
            `Failed to fetch profile: ${response.status} ${response.statusText}`,
          );
        }

        const userData = await response.json();

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
        console.log('🔍 Profile data prepared for state:', profileData);
        setProfile(profileData);
        localStorage.setItem('cachedProfile', JSON.stringify(userData));
      } catch (err) {
        const cachedProfile = localStorage.getItem('cachedProfile');
        if (cachedProfile) {
          try {
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
          } catch (cacheError) {
            setError('Failed to load profile data');
          }
        } else {
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
      setLoading((prev) => ({ ...prev, stats: true }));

      try {
        const token = getAuthToken();
        const response = await fetch(BACKEND_URL + `/users/${currentUserId}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch daily stats: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          setDailyStats({
            uploads_today: data.data.uploads_today || 0,
            total_uploads: data.data.total_uploads || 0,
            last_upload_date: data.data.last_upload_date || '',
            streak_days: data.data.streak_days || 0,
          });
        }
      } catch (err) {
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
      setLoading((prev) => ({ ...prev, contributions: true }));

      try {
        const token = getAuthToken();
        const baseUrl = BACKEND_URL;
        const apiUrl = `${baseUrl}/users/${currentUserId}/contributions`;

        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch contributions: ${response.status}`);
        }

        const data = await response.json();

        setContributions({
          totalContributions: data.total_contributions || 0,
          contributionsByType: data.contributions_by_media_type || {
            text: 0,
            audio: 0,
            image: 0,
            video: 0,
            document: 0,
          },
          audioContributions: data.audio_contributions || [],
          videoContributions: data.video_contributions || [],
          textContributions: data.text_contributions || [],
          imageContributions: data.image_contributions || [],
          documentContributions: data.document_contributions || [],
          audioDuration: data.audio_duration || 0,
          videoDuration: data.video_duration || 0,
        });
      } catch (err) {
        setContributions({
          totalContributions: 0,
          contributionsByType: {
            text: 0,
            audio: 0,
            image: 0,
            video: 0,
            document: 0,
          },
          audioContributions: [],
          videoContributions: [],
          textContributions: [],
          imageContributions: [],
          documentContributions: [],
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export request failed');
    }
  }, [getCurrentUserId, getAuthToken]);

  const refetch = useCallback(() => {
    const currentUserId = getCurrentUserId();
    if (currentUserId) {
      setError(null);
      fetchUserProfile(currentUserId);
      fetchDailyStats(currentUserId);
      fetchUserContributions(currentUserId);
    }
  }, [
    getCurrentUserId,
    fetchUserProfile,
    fetchDailyStats,
    fetchUserContributions,
  ]);

  useEffect(() => {
    const currentUserId = getCurrentUserId();

    if (currentUserId) {
      fetchUserProfile(currentUserId);
      fetchDailyStats(currentUserId);
      fetchUserContributions(currentUserId);
    } else {
      setError('No user ID found. Please log in again.');
      setLoading({ profile: false, stats: false, contributions: false });
    }
  }, [
    userId,
    getCurrentUserId,
    fetchUserProfile,
    fetchDailyStats,
    fetchUserContributions,
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

enum ReleaseRights {
  creator = 'creator',
  familyOrFriend = 'family_or_friend',
  downloaded = 'downloaded',
}

const releaseRightsMap: Record<ReleaseRights, string> = {
  [ReleaseRights.creator]:
    'This work is created by me and anyone is allowed to use it',
  [ReleaseRights.familyOrFriend]:
    'This work is created by my family/friends and I took permission to upload their work.',
  [ReleaseRights.downloaded]:
    'I downloaded this from the internet OR This is AI generted contnet',
};

enum SelectedLanguage {
  assamese = 'assamese',
  bengali = 'bengali',
  bodo = 'bodo',
  dogri = 'dogri',
  gujarati = 'gujarati',
  hindi = 'hindi',
  kannada = 'kannada',
  kashmiri = 'kashmiri',
  konkani = 'konkani',
  maithili = 'maithili',
  malayalam = 'malayalam',
  marathi = 'marathi',
  meitei = 'meitei',
  nepali = 'nepali',
  odia = 'odia',
  punjabi = 'punjabi',
  sanskrit = 'sanskrit',
  santali = 'santali',
  sindhi = 'sindhi',
  tamil = 'tamil',
  telugu = 'telugu',
  urdu = 'urdu',
}

const selectedLanguageMap: Record<SelectedLanguage, string> = {
  [SelectedLanguage.assamese]: 'Assamese',
  [SelectedLanguage.bengali]: 'Bengali',
  [SelectedLanguage.bodo]: 'Bodo',
  [SelectedLanguage.dogri]: 'Dogri',
  [SelectedLanguage.gujarati]: 'Gujarati',
  [SelectedLanguage.hindi]: 'Hindi',
  [SelectedLanguage.kannada]: 'Kannada',
  [SelectedLanguage.kashmiri]: 'Kashmiri',
  [SelectedLanguage.konkani]: 'Konkani',
  [SelectedLanguage.maithili]: 'Maithili',
  [SelectedLanguage.malayalam]: 'Malayalam',
  [SelectedLanguage.marathi]: 'Marathi',
  [SelectedLanguage.meitei]: 'Meitei',
  [SelectedLanguage.nepali]: 'Nepali',
  [SelectedLanguage.odia]: 'Odia',
  [SelectedLanguage.punjabi]: 'Punjabi',
  [SelectedLanguage.sanskrit]: 'Sanskrit',
  [SelectedLanguage.santali]: 'Santali',
  [SelectedLanguage.sindhi]: 'Sindhi',
  [SelectedLanguage.tamil]: 'Tamil',
  [SelectedLanguage.telugu]: 'Telugu',
  [SelectedLanguage.urdu]: 'Urdu',
};

const countMeaningfulWords = (text: string) => {
  return text.split(/\s+/).filter((word) => word.length > 1).length;
};

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
    'text' | 'audio' | 'video' | 'image' | 'document'
  >('text');

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

  const handleUpdate = async (updatedItem: ContributionItem) => {
    if (!token) {
      alert('Authentication Error. Cannot save changes.');
      return;
    }

    console.log(' update iterm:' + updatedItem.release_rights);

    try {
      const response = await fetch(`${BACKEND_URL}/records/${updatedItem.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: updatedItem.title,
          description: updatedItem.description,
          release_rights: updatedItem.release_rights,
          location: updatedItem.location,
          language: updatedItem.language,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = `Failed to update: ${response.statusText}`; // Default error message

        if (errorData.detail && Array.isArray(errorData.detail)) {
          const specificMessages = errorData.detail.map((err) => err.msg);
          errorMessage = specificMessages.join('\n');
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        }

        throw new Error(errorMessage);
      }

      toast.success('Contribution updated successfully!');
      refetch();
    } catch (error) {
      console.error('Update failed:', error);

      toast.error(
        error instanceof Error ? error.message : 'An unknown error occurred.',
      );
    }
  };

  const handleExport = () => {
    try {
      const exportData = {
        profile: currentUser,
        contributions: contributions,
        exportedAt: new Date().toISOString(),
        exportedBy: currentUser?.name || 'Unknown User',
      };

      const fileData = JSON.stringify(exportData, null, 2);

      const blob = new Blob([fileData], { type: 'application/json' });

      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.download = `profile-data-${
        currentUser?.name?.replace(/\s+/g, '-') || 'user'
      }-${new Date().toISOString().split('T')[0]}.json`;
      link.href = url;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Failed to export profile data');
    }
  };

  const handleExportCSV = () => {
    try {
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
        [
          'Document Contributions',
          contributions?.contributionsByType?.document || 0,
        ],
        ['Total Contributions', contributions?.totalContributions || 0],
      ];

      const csvString = csvData
        .map((row) => row.map((field) => `"${field}"`).join(','))
        .join('\n');

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
    } catch (err) {
      toast.error('Failed to export profile data as CSV');
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
                onClick={onBack}
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
              {/* Edit Profile Button removed from header, now only in Profile Information section */}
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
        {/* Profile Information or Edit Form */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-normal text-center w-full p-4 bg-gray-100 rounded-lg uppercase tracking-wide font-sans">
              <span className="font-sans">Profile Information</span>
            </h2>
          </div>

          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  key: 'email',
                  icon: <Mail size={18} className="text-gray-500" />,
                  title: 'Email',
                  value: isEmailRevealed
                    ? currentUser.email
                    : maskEmail(currentUser.email),
                  hasButton: true,
                  buttonAction: toggleEmailReveal,
                  buttonIcon: isEmailRevealed ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  ),
                  buttonTitle: 'Reveal Email',
                },
                {
                  key: 'phone',
                  icon: <Phone size={18} className="text-gray-500" />,
                  title: 'Phone',
                  value: isPhoneRevealed
                    ? currentUser.phone
                    : maskPhone(currentUser.phone),
                  hasButton: true,
                  buttonAction: togglePhoneReveal,
                  buttonIcon: isPhoneRevealed ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  ),
                  buttonTitle: 'Reveal Phone',
                },
                ...(currentUser.gender
                  ? [
                      {
                        key: 'gender',
                        icon: <User size={18} className="text-gray-500" />,
                        title: 'Gender',
                        value: currentUser.gender,
                        hasButton: false,
                      },
                    ]
                  : []),
                ...(currentUser.dateOfBirth
                  ? [
                      {
                        key: 'dateOfBirth',
                        icon: <Calendar size={18} className="text-gray-500" />,
                        title: 'Date of Birth',
                        value: formatDate(currentUser.dateOfBirth),
                        hasButton: false,
                      },
                    ]
                  : []),
                ...(currentUser.place
                  ? [
                      {
                        key: 'place',
                        icon: <MapPin size={18} className="text-gray-500" />,
                        title: 'Location',
                        value: currentUser.place,
                        hasButton: false,
                      },
                    ]
                  : []),
              ].map((item) => (
                <ProfileDetail key={item.key} {...item} />
              ))}
            </div>
          </>
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
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <Award size={24} className="text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-orange-600">
                  {contributions.contributionsByType.image}
                </p>
                <p className="text-sm text-gray-600">Image Contributions</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <Award size={24} className="text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-orange-600">
                  {contributions.contributionsByType.document}
                </p>
                <p className="text-sm text-gray-600">Document Contributions</p>
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
          <h2 className="mt-6 text-2xl font-normal text-center p-4 bg-gray-100 rounded-lg uppercase tracking-wide font-sans">
            <span className="font-sans">MY CONTRIBUTIONS</span>
          </h2>

          {/* Media type selector - improved layout and style */}
          <div className="flex justify-center gap-4 my-4">
            {(['text', 'image', 'audio', 'video', 'document'] as const).map(
              (type) => (
                <ContributionTypeButton
                  key={type}
                  type={type}
                  selectedMediaType={selectedMediaType}
                  setSelectedMediaType={setSelectedMediaType}
                />
              ),
            )}
          </div>
          {/* Modernized display of contributions for selected media type */}
          <div className="max-w-2xl mx-auto">
            <ContributionsList
              contributions={contributions}
              selectedMediaType={selectedMediaType}
              onUpdate={refetch}
              handleUpdate={handleUpdate}
              token={token}
            />
          </div>
        </div>
        {/* Account Information */}
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

const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

function ContributionTypeButton({
  type,
  selectedMediaType,
  setSelectedMediaType,
}: {
  type: 'text' | 'image' | 'video' | 'audio' | 'document';
  selectedMediaType: 'text' | 'image' | 'video' | 'audio' | 'document';
  setSelectedMediaType: (
    type: 'text' | 'image' | 'video' | 'audio' | 'document',
  ) => void;
}) {
  return (
    <button
      key={type}
      onClick={() => setSelectedMediaType(type)}
      className={`px-4 py-2 rounded-lg font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400
        ${
          selectedMediaType === type
            ? 'bg-blue-600 text-white border-blue-600'
            : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'
        }`}
    >
      {capitalize(type)}
    </button>
  );
}

interface ContributionsListProps {
  contributions: UserContributions | null;
  selectedMediaType: 'text' | 'audio' | 'video' | 'image' | 'document';
  onUpdate: () => void;
  handleUpdate: (item: ContributionItem) => Promise<void>;
  token: string;
}

const ContributionsList: React.FC<ContributionsListProps> = ({
  contributions,
  selectedMediaType,
  onUpdate,
  handleUpdate,
  token,
}) => {
  const [editingItem, setEditingItem] = useState<ContributionItem | null>(null);
  let items: ContributionItem[] = [];
  if (!contributions) return null;
  if (selectedMediaType === 'text') items = contributions.textContributions;
  if (selectedMediaType === 'audio') items = contributions.audioContributions;
  if (selectedMediaType === 'video') items = contributions.videoContributions;
  if (selectedMediaType === 'image') items = contributions.imageContributions;
  if (selectedMediaType === 'document')
    items = contributions.documentContributions;

  if (!items || items.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8 text-lg font-medium">
        No{' '}
        {selectedMediaType.charAt(0).toUpperCase() + selectedMediaType.slice(1)}{' '}
        contributions yet.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-200">
      {items.map((item, idx) => {
        const getValidationWarnings = (): string[] => {
          const warnings: string[] = [];
          if (
            !item.title ||
            (typeof item.title === 'string' && item.title.trim().length < 8)
          ) {
            warnings.push('Title is missing or is less than 8 characters.');
          } else if (countMeaningfulWords(item.title) < 2) {
            warnings.push('Title must contain at least 2 meaningful words.');
          }

          if (
            !item.description ||
            (typeof item.description === 'string' &&
              item.description.trim().length < 32)
          ) {
            warnings.push(
              'Description is missing or is less than 32 characters.',
            );
          } else if (countMeaningfulWords(item.description) < 10) {
            warnings.push(
              'Description must contain at least 10 meaningful words.',
            );
          }

          if (!item.location) {
            warnings.push('Location is missing.');
          }

          const rights = item.release_rights;
          if (
            !rights ||
            (typeof rights === 'string' &&
              ['na', 'n/a', ''].includes(rights.trim().toLowerCase()))
          ) {
            warnings.push('Release rights have not been set.');
          }

          const language = item.language;
          if (
            !language ||
            (typeof language === 'string' &&
              ['na', 'n/a', ''].includes(language.trim().toLowerCase()))
          ) {
            warnings.push('Language has not been selected.');
          }
          return warnings;
        };

        const getSnrLabel = (snr) => {
          const value = parseFloat(snr);
          if (isNaN(value)) return 'N/A';

          if (value >= 40) return `${value} db (Excellent)`;
          if (value >= 25) return `${value} db (Good)`;
          if (value >= 15) return `${value} db (Acceptable)`;
          if (value >= 10) return `${value} db (Unreliable)`;
          return `${value} db (Probably unusable)`;
        };

        const validationWarnings = getValidationWarnings();
        const hasWarnings = validationWarnings.length > 0;
        return editingItem?.id === item.id ? (
          <EditableContributionItem
            key={item.id}
            item={editingItem}
            onSave={async (updatedItem) => {
              await handleUpdate(updatedItem);
              setEditingItem(null);
            }}
            onCancel={() => setEditingItem(null)}
          />
        ) : (
          <li
            key={item.id}
            className={`flex flex-col  py-4 px-2 rounded-lg transition ${
              hasWarnings ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex gap-2">
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold
                  ${selectedMediaType === 'text' && 'bg-blue-100 text-blue-700'}
                  ${selectedMediaType === 'audio' && 'bg-green-100 text-green-700'}
                  ${selectedMediaType === 'video' && 'bg-purple-100 text-purple-700'}
                  ${selectedMediaType === 'image' && 'bg-orange-100 text-orange-700'}
                  ${selectedMediaType === 'document' && 'bg-orange-100 text-orange-700'}
                `}
              >
                {capitalize(selectedMediaType)}
              </span>
              <span className="ml-2 text-base font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                {item.title || 'Untitled'}
              </span>
              {item.reviewed && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-green-200 text-green-800 text-xs font-bold uppercase tracking-wide">
                  Reviewed
                </span>
              )}
            </div>
            <div className="flex">
              <div className="mt-1 flex flex-wrap gap-3 text-sm text-gray-500">
                <span className="flex flex-row flex-wrap gap-2 w-full">
                  <span
                    className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium text-xs border border-gray-300 whitespace-nowrap min-w-[24ch] max-w-full overflow-x-auto italic shadow-none"
                    title={
                      item.timestamp
                        ? new Date(item.timestamp).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })
                        : '-'
                    }
                  >
                    <span className="font-semibold mr-1 italic">
                      Timestamp:
                    </span>{' '}
                    {item.timestamp
                      ? new Date(item.timestamp).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })
                      : '-'}
                  </span>
                  <span
                    className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium text-xs border border-gray-300 whitespace-nowrap min-w-[18ch] max-w-full overflow-x-auto italic shadow-none"
                    title={
                      item.location &&
                      typeof item.location.latitude === 'number' &&
                      typeof item.location.longitude === 'number'
                        ? `${item.location.latitude.toFixed(4)}, ${item.location.longitude.toFixed(4)}`
                        : '-'
                    }
                  >
                    <span className="font-semibold mr-1 italic">Location:</span>{' '}
                    {item.location &&
                    typeof item.location.latitude === 'number' &&
                    typeof item.location.longitude === 'number'
                      ? `${item.location.latitude.toFixed(4)}, ${item.location.longitude.toFixed(4)}`
                      : '-'}
                  </span>
                  {/* Size badge */}
                  <span
                    className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium text-xs border border-gray-300 whitespace-nowrap min-w-[60px] max-w-full overflow-x-auto italic"
                    style={{
                      display: 'inline-flex',
                      minWidth: '60px',
                      fontStyle: 'italic',
                      borderWidth: '1px',
                      boxShadow: 'none',
                      background: 'rgba(0,0,0,0.02)',
                    }}
                  >
                    <span className="font-semibold mr-1 italic">Size:</span>{' '}
                    {item.size ? formatSizeMB(item.size) : '-'}
                  </span>
                  {/* Duration badge */}
                  {selectedMediaType === 'audio' ||
                  selectedMediaType === 'video' ? (
                    <span
                      className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium text-xs border border-gray-300 whitespace-nowrap min-w-[60px] max-w-full overflow-x-auto italic"
                      style={{
                        display: 'inline-flex',
                        minWidth: '60px',
                        fontStyle: 'italic',
                        borderWidth: '1px',
                        boxShadow: 'none',
                        background: 'rgba(0,0,0,0.02)',
                      }}
                    >
                      <span className="font-semibold mr-1 italic">
                        Duration:
                      </span>{' '}
                      {item.duration ? formatDuration(item.duration) : '-'}
                    </span>
                  ) : null}
                  {/* Display release_rights directly from the data */}
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium text-xs border border-gray-300 whitespace-nowrap min-w-[60px] max-w-full overflow-x-auto italic">
                    <span className="font-semibold mr-1 italic">Rights:</span>{' '}
                    {releaseRightsMap[item.release_rights] || 'N/A'}
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium text-xs border border-gray-300 whitespace-nowrap min-w-[60px] max-w-full overflow-x-auto italic">
                    <span className="font-semibold mr-1 italic">Language:</span>{' '}
                    {selectedLanguageMap[
                      item.language as keyof typeof selectedLanguageMap
                    ] || 'N/A'}
                  </span>

                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium text-xs border border-gray-300 whitespace-nowrap min-w-[60px] max-w-full overflow-x-auto italic">
                    <span className="font-semibold mr-1 italic">
                      File Hash:
                    </span>{' '}
                    {item.file_hash || 'N/A'}
                  </span>

                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium text-xs border border-gray-300 whitespace-nowrap min-w-[60px] max-w-full overflow-x-auto italic">
                    <span className="font-semibold mr-1 italic">
                      SNR Frequency:
                    </span>{' '}
                    {getSnrLabel(item.snr_frequency)}
                  </span>
                </span>
              </div>
              <div className="flex flex-col items-center space-y-2 ml-4 flex-shrink-0">
                {(selectedMediaType === 'audio' ||
                  selectedMediaType === 'video' ||
                  selectedMediaType === 'document' ||
                  selectedMediaType === 'image') && (
                  <SecureViewButton recordId={item.id} apiToken={token} />
                )}

                <button
                  onClick={() => setEditingItem(item)}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                  title="Edit Contribution"
                >
                  <Pencil size={18} />
                </button>

                {item.release_rights == 'downloaded' && (
                  <div className="relative group flex items-center">
                    <X className="text-red-500" size={18} />
                    <div className="absolute top-1/2 -translate-y-1/2 right-full mr-3 w-max max-w-xs bg-gray-800 text-white text-xs rounded-md shadow-lg py-1.5 px-3 z-10 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-opacity duration-200">
                      Marked as Invalid
                    </div>
                  </div>
                )}

                {hasWarnings && (
                  <div className="relative group flex items-center">
                    <AlertTriangle className="text-yellow-500" size={18} />
                    <div className="absolute top-1/2 -translate-y-1/2 right-full mr-3 w-max max-w-xs bg-gray-800 text-white text-xs rounded-md shadow-lg py-1.5 px-3 z-10 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-opacity duration-200">
                      {validationWarnings.map((warning, index) => (
                        <div key={index}>{warning}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

function ProfileDetail(item: {
  icon: React.ReactNode;
  title: string;
  value: string;
  hasButton: boolean;
  buttonAction?: () => void;
  buttonTitle?: string;
  buttonIcon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center space-x-3">
        {item.icon}
        <div>
          <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            {item.title}
          </p>
          <p className="text-base text-gray-800 font-mono">{item.value}</p>
        </div>
      </div>
      {item.hasButton && (
        <button
          onClick={item.buttonAction}
          className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
          title={item.buttonTitle}
        >
          {item.buttonIcon}
        </button>
      )}
    </div>
  );
}

interface SecureViewButtonProps {
  recordId: string;
  apiToken: string;
}

const SecureViewButton: React.FC<SecureViewButtonProps> = ({
  recordId,
  apiToken,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleViewFile = async () => {
    if (!recordId || !apiToken) {
      setError('Missing required data to fetch file.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Call your FastAPI endpoint to get the Record URL
      const response = await fetch(
        `${BACKEND_URL}/records/${recordId}/record-url?expires_minutes=10`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get Record URL.');
      }

      const data = await response.json();

      // 2. Open the received URL in a new browser tab
      if (data.record_url) {
        window.open(data.record_url, '_blank', 'noopener,noreferrer');
      } else {
        throw new Error('API did not return a valid URL.');
      }
    } catch (err) {
      console.error('Failed to fetch Record URL:', err);
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred.',
      );
      // Optionally, show an alert to the user
      toast.error(
        `Error: ${err instanceof Error ? err.message : 'Could not load file.'}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleViewFile}
      disabled={isLoading}
      className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="View File Securely"
    >
      {isLoading ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <Eye size={18} />
      )}
    </button>
  );
};

SecureViewButton.propTypes = {
  recordId: PropTypes.string.isRequired,
  apiToken: PropTypes.string.isRequired,
};

const EditableContributionItem: React.FC<{
  item: ContributionItem;
  onSave: (updatedItem: ContributionItem) => void;
  onCancel: () => void;
}> = ({ item, onSave, onCancel }) => {
  const [title, setTitle] = useState(item.title || '');
  const [description, setDescription] = useState(item.description || '');
  const [titleError, setTitleError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  console.log(description);
  const [rightsKey, setRightsKey] = useState(item.release_rights || 'NA');
  const [language, setLanguage] = useState(item.language || 'NA');
  const {
    latitude,
    longitude,
    error: locationError,
    loading: locationLoading,
    getCurrentLocation,
    setLatitude,
    setLongitude,
  } = useGeolocation(
    item.location?.latitude.toString() || '',
    item.location?.longitude.toString() || '',
  );

  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    // Validate title: must be at least 8 characters and 2 meaningful words
    if (title.trim().length < 8) {
      setTitleError('Title must be at least 8 characters long.');
    } else if (countMeaningfulWords(title) < 2) {
      setTitleError('Title must contain at least 2 meaningful words.');
    } else {
      setTitleError(null);
    }

    // Validate description: must be at least 32 characters and 10 meaningful words
    if (description.trim().length < 32) {
      setDescriptionError('Description must be at least 32 characters long.');
    } else if (countMeaningfulWords(description) < 10) {
      setDescriptionError(
        'Description must contain at least 10 meaningful words.',
      );
    } else {
      setDescriptionError(null);
    }

    // Validate location: must be valid numbers within the correct range
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const isLocationValid =
      !isNaN(lat) &&
      !isNaN(lon) &&
      lat >= -90 &&
      lat <= 90 &&
      lon >= -180 &&
      lon <= 180;

    // Validate release rights: cannot be the default placeholder or the 'downloaded' option
    const areRightsValid = rightsKey !== 'NA';

    const isLanguageValid = language !== 'NA';

    // Update the overall form validity state
    setIsFormValid(
      !titleError &&
        !descriptionError &&
        isLocationValid &&
        areRightsValid &&
        isLanguageValid,
    );
  }, [
    title,
    description,
    latitude,
    longitude,
    rightsKey,
    language,
    titleError,
    descriptionError,
  ]); // Dependency Array

  const handleSave = () => {
    if (!isFormValid) {
      alert('Please correct the errors before saving.');
      return;
    }

    onSave({
      ...item,
      title,
      description,
      location: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      },
      release_rights: rightsKey,
      language: language,
    });
  };

  return (
    <li className="flex flex-col py-4 px-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Title
        </label>
        <input
          type="text"
          name="title"
          id="title"
          className={`w-full border px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
            titleError ? 'border-red-500' : ''
          }`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a title for the contribution"
        />
        {titleError && (
          <p className="text-xs text-red-600 mt-1">{titleError}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description
        </label>
        <input
          type="description"
          name="description"
          id="description"
          className={`w-full border px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
            descriptionError ? 'border-red-500' : ''
          }`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter the contribution description"
        />
        {descriptionError && (
          <p className="text-xs text-red-600 mt-1">{descriptionError}</p>
        )}
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="block text-sm font-medium text-gray-700">
            Location
          </label>
          <button
            onClick={getCurrentLocation}
            disabled={locationLoading}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            <MapPin className="w-4 h-4 mr-1" />
            Get Current Location
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            name="latitude"
            className="w-full border px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder="Latitude"
            step="any"
          />
          <input
            type="number"
            name="longitude"
            className="w-full border px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            placeholder="Longitude"
            step="any"
          />
        </div>
        {(!latitude || !longitude) && (
          <p className="text-xs text-red-600 mt-1">please enter location</p>
        )}
      </div>

      <div>
        <label
          htmlFor="release_rights"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Release Rights
        </label>
        <select
          name="release_rights"
          id="release_rights"
          className="w-full border px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          value={rightsKey}
          onChange={(e) => setRightsKey(e.target.value)}
        >
          <option value="NA" disabled>
            -- please declare the release rights for this record --
          </option>
          {Object.entries(releaseRightsMap).map(([key, value]) => (
            <option key={key} value={key}>
              {value}
            </option>
          ))}
        </select>
      </div>
      {rightsKey == 'NA' && (
        <p className="text-xs text-red-600 mt-1">
          Pleae declare release rights
        </p>
      )}

      {rightsKey == 'downloaded' && (
        <p className="text-xs text-red-600 mt-1">
          Marked as invalid submission, please submit only content created by
          you or content you have permission to upload
        </p>
      )}

      <div>
        <label
          htmlFor="language"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Language
        </label>
        <select
          name="language"
          id="language"
          className="w-full border px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="NA" disabled>
            -- please select the language --
          </option>
          {Object.entries(selectedLanguageMap).map(([key, value]) => (
            <option key={key} value={key}>
              {value}
            </option>
          ))}
        </select>
      </div>
      {language == 'NA' && (
        <p className="text-xs text-red-600 mt-1">
          Pleae Select the Contribution Language
        </p>
      )}

      <div className="flex items-center space-x-2 pt-2">
        <button
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          onClick={handleSave}
          disabled={!isFormValid}
        >
          Save
        </button>
        <button
          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </li>
  );
};

export default UserProfile;
