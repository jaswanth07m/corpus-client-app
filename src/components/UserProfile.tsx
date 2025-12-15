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
  History,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UserContributions from './UserContributions';
import ContributionDashboard from './ContributionDashboard'; // Import the new dashboard component
import { BACKEND_URL } from '@/lib/constants';
import { formatModernTime, formatSizeMB, formatDuration } from '@/lib/utils';
import BottomNav from './BottomNav';
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
  creator: string;
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
  setContributions: React.Dispatch<
    React.SetStateAction<UserContributions | null>
  >;
  fetchUserContributions: (
    currentUserId: string,
    mediaType: 'text' | 'audio' | 'video' | 'image' | 'document' | undefined,
  ) => Promise<void>;
  // New additions for followers/following
  followers: any[];
  following: any[];
  followersCount: number;
  followingCount: number;
  fetchFollowers: (currentUserId: string) => Promise<void>;
  fetchFollowing: (currentUserId: string) => Promise<void>;
  loadingFollowers: boolean;
  loadingFollowing: boolean;
}

const useUserProfile = (
  userId?: string,
  shouldReset?: boolean,
  selectedMediaType?: 'text' | 'audio' | 'video' | 'image' | 'document' | null, // Allow null for no selection
  showDashboard?: boolean, // Add showDashboard
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
  // New states for followers and following
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);
  const [loadingFollowers, setLoadingFollowers] = useState<boolean>(true);
  const [loadingFollowing, setLoadingFollowing] = useState<boolean>(true);

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
        console.log(`🔑 Found token in ${foundKey}`);
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
          console.error('❌ No authentication token found');
          throw new Error(
            'No authentication token available. Please log in again.',
          );
        }

        console.log('🔑 Using token for profile fetch');
        const apiUrl = BACKEND_URL + '/auth/me';
        console.log('📡 Fetching profile from:', apiUrl);

        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            console.error('❌ Unauthorized: Token expired or invalid');
            // Clear invalid token
            localStorage.removeItem('token');
            localStorage.removeItem('authToken');
            sessionStorage.clear();
            toast.error('Session expired. Redirecting to login...');
            // Redirect to login after a short delay
            setTimeout(() => {
              window.location.href = '/';
            }, 2000);
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
        const response = await fetch(BACKEND_URL + `/users/${currentUserId}`, {
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
    async (
      currentUserId: string,
      mediaType: 'text' | 'audio' | 'video' | 'image' | 'document' | undefined,
    ) => {
      setLoading((prev) => ({ ...prev, contributions: true }));

      try {
        const token = getAuthToken();
        if (!token) {
          console.warn('⚠️ No token available for fetching contributions');
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
          setLoading((prev) => ({ ...prev, contributions: false }));
          return;
        }

        const baseUrl = BACKEND_URL;
        const apiUrl = mediaType
          ? `${baseUrl}/users/${currentUserId}/contributions/${mediaType}`
          : `${baseUrl}/users/${currentUserId}/contributions`; // Fallback to all if no mediaType

        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            console.error('❌ Unauthorized: Token may be expired');
            toast.error('Session expired. Please log in again.');
          }
          throw new Error(`Failed to fetch contributions: ${response.status}`);
        }

        const data = await response.json();

        // Initialize all contribution types as empty arrays
        const newContributions: UserContributions = {
          totalContributions: data.total_contributions || 0,
          contributionsByType: data.contributions_by_media_type || {
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
          audioDuration: data.audio_duration || 0,
          videoDuration: data.video_duration || 0,
        };

        // Populate only the fetched media type
        if (mediaType === 'text') {
          newContributions.textContributions = data.contributions || [];
        } else if (mediaType === 'audio') {
          newContributions.audioContributions = data.contributions || [];
        } else if (mediaType === 'video') {
          newContributions.videoContributions = data.contributions || [];
        } else if (mediaType === 'image') {
          newContributions.imageContributions = data.contributions || [];
        } else if (mediaType === 'document') {
          newContributions.documentContributions = data.contributions || [];
        } else {
          // If no specific mediaType was requested (dashboard view), populate all
          newContributions.audioContributions = data.audio_contributions || [];
          newContributions.videoContributions = data.video_contributions || [];
          newContributions.textContributions = data.text_contributions || [];
          newContributions.imageContributions = data.image_contributions || [];
          newContributions.documentContributions =
            data.document_contributions || [];
        }

        setContributions(newContributions);
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

  const fetchFollowers = useCallback(
    async (currentUserId: string) => {
      setLoadingFollowers(true);
      try {
        const token = getAuthToken();
        if (!token) {
          console.warn('⚠️ No token available for fetching followers');
          setFollowers([]);
          setFollowersCount(0);
          setLoadingFollowers(false);
          return;
        }

        const response = await fetch(
          `${BACKEND_URL}/users/${currentUserId}/followers`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        );

        if (!response.ok) {
          if (response.status === 401) {
            console.error('❌ Unauthorized: Token may be expired');
            toast.error('Session expired. Please log in again.');
          }
          throw new Error(`Failed to fetch followers: ${response.status}`);
        }

        const data = await response.json();

        setFollowers(data.followers || data || []);
        setFollowersCount(data.followers_count || data.length || 0);
      } catch (err) {
        console.error('Error fetching followers:', err);
        setFollowers([]);
        setFollowersCount(0);
      } finally {
        setLoadingFollowers(false);
      }
    },
    [getAuthToken],
  );

  const fetchFollowing = useCallback(
    async (currentUserId: string) => {
      setLoadingFollowing(true);
      try {
        const token = getAuthToken();
        if (!token) {
          console.warn('⚠️ No token available for fetching following');
          setFollowing([]);
          setFollowingCount(0);
          setLoadingFollowing(false);
          return;
        }

        const response = await fetch(
          `${BACKEND_URL}/users/${currentUserId}/following`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        );

        if (!response.ok) {
          if (response.status === 401) {
            console.error('❌ Unauthorized: Token may be expired');
            toast.error('Session expired. Please log in again.');
          }
          throw new Error(`Failed to fetch following: ${response.status}`);
        }

        const data = await response.json();

        setFollowing(data.following || data || []);
        setFollowingCount(data.following_count || data.length || 0);
      } catch (err) {
        console.error('Error fetching following:', err);
        setFollowing([]);
        setFollowingCount(0);
      } finally {
        setLoadingFollowing(false);
      }
    },
    [getAuthToken],
  );

  const refetch = useCallback(() => {
    const currentUserId = getCurrentUserId();
    if (currentUserId) {
      setError(null);
      fetchUserProfile(currentUserId);
      fetchDailyStats(currentUserId);
      // When refetching, if in dashboard mode, fetch all contributions.
      // If in detailed view, fetch only the selected media type.
      if (!showDashboard && selectedMediaType) {
        // Only fetch if not dashboard and a media type is selected
        fetchUserContributions(currentUserId, selectedMediaType);
      } else if (showDashboard) {
        // Fetch all for dashboard
        fetchUserContributions(currentUserId, undefined);
      } else {
        setContributions(null); // Clear contributions if in detailed view but no media type selected
      }
    }
  }, [
    getCurrentUserId,
    fetchUserProfile,
    fetchDailyStats,
    fetchUserContributions,
    showDashboard,
    selectedMediaType,
    setContributions,
  ]);

  useEffect(() => {
    const currentUserId = getCurrentUserId();

    if (currentUserId) {
      fetchUserProfile(currentUserId);
      fetchDailyStats(currentUserId);
      fetchFollowers(currentUserId);
      fetchFollowing(currentUserId);
      // Initial fetch for contributions: if dashboard is shown, fetch all.
      // If detailed view is shown, fetch only the selected media type.
      if (showDashboard) {
        fetchUserContributions(currentUserId, undefined);
      } else if (selectedMediaType) {
        // Only fetch if not dashboard and a media type is selected
        fetchUserContributions(currentUserId, selectedMediaType);
      } else {
        setContributions(null); // Clear contributions if in detailed view but no media type selected
      }
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
    fetchFollowers,
    fetchFollowing,
    showDashboard,
    selectedMediaType,
    setContributions,
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
    setContributions,
    fetchUserContributions,
    // New additions for followers/following
    followers,
    following,
    followersCount,
    followingCount,
    fetchFollowers,
    fetchFollowing,
    loadingFollowers,
    loadingFollowing,
  };
};

enum ReleaseRights {
  creator = 'creator',
  others = 'others',
  downloaded = 'downloaded',
}

const releaseRightsMap: Record<ReleaseRights, string> = {
  [ReleaseRights.creator]:
    'This work is created by me and anyone is allowed to use it',
  [ReleaseRights.others]: 'Others',
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

const UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // State for modal is removed
  // const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  // const [selectedRecordForHistory, setSelectedRecordForHistory] = useState<ContributionItem | null>(null);

  const [selectedMediaType, setSelectedMediaType] = useState<
    'text' | 'audio' | 'video' | 'image' | 'document' | null // Allow null for no selection
  >(null); // Initialize as null, no media type selected by default
  const [showDashboard, setShowDashboard] = useState(true); // New state for toggling views

  const {
    profile: currentUser,
    dailyStats,
    contributions,
    loading,
    error,
    refetch,
    exportData,
    requestExport,
    setContributions, // Destructure setContributions from the hook
    fetchUserContributions, // Destructure fetchUserContributions from the hook
    // New destructuring for followers/following
    followers,
    following,
    followersCount,
    followingCount,
    fetchFollowers,
    fetchFollowing,
    loadingFollowers,
    loadingFollowing,
  } = useUserProfile(
    undefined,
    undefined,
    showDashboard ? undefined : selectedMediaType,
    showDashboard,
  ); // Pass selectedMediaType and showDashboard to hook

  const [isEmailRevealed, setIsEmailRevealed] = useState(false);
  const [isPhoneRevealed, setIsPhoneRevealed] = useState(false);

  // State for followers/following modal
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);

  // State for showing personal info
  const [showPersonalInfo, setShowPersonalInfo] = useState(false);

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
    // 1. Authentification Check (Good to have)
    if (!token) {
      toast.error('Authentication Error. Cannot save changes.');
      return;
    }

    try {
      // 2. Make the API call using fetch
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
          creator: updatedItem.creator,
          location: updatedItem.location,
          language: updatedItem.language,
        }),
      });

      // 3. Handle the response
      if (response.ok) {
        // SUCCESS PATH: The update was successful (status 200-299)
        toast.success('Contribution updated successfully!');
        refetch(); // Refresh your data
      } else {
        // ERROR PATH: The server responded with an error (status 4xx, 5xx)
        const errorData = await response.json(); // Get the detailed JSON error body

        // Log the full error to the console for debugging
        console.error('API Error Response:', errorData);

        // Check for the specific 'errors' array from your API
        if (errorData.errors && errorData.errors.length > 0) {
          // Use the message from the first specific error object
          const specificErrorMessage = errorData.errors[0].message;
          toast.error(specificErrorMessage);
        } else {
          // Fallback for other types of errors
          toast.error(
            errorData.message || 'Failed to update. Please try again.',
          );
        }
      }
    } catch (error) {
      // NETWORK ERROR PATH: This catches failures to connect to the server
      console.error('Network or other error:', error);
      toast.error(
        'Could not connect to the server. Please check your connection.',
      );
    }
  };

  // handleShowHistory function is removed as it's now handled inside ContributionsList

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-6 pt-16 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Header Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 mb-6 overflow-hidden">
          {/* Header Actions Bar */}
          <div className="bg-gradient-to-r from-slate-50 to-white px-6 py-3 flex items-center justify-between border-b border-slate-100">
            <button
              onClick={() => (window.location.href = '/')}
              className="p-2 hover:bg-slate-100 rounded-full transition-all duration-200"
              title="Back"
            >
              <ArrowLeft size={20} className="text-slate-600" />
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                className="p-2 hover:bg-emerald-50 rounded-full transition-all duration-200 group"
                title="Refresh"
              >
                <RefreshCw
                  size={20}
                  className="text-slate-600 group-hover:text-emerald-600"
                />
              </button>
              <button
                onClick={handleExport}
                className="p-2 hover:bg-emerald-50 rounded-full transition-all duration-200 group"
                title="Export"
              >
                <Download
                  size={20}
                  className="text-slate-600 group-hover:text-emerald-600"
                />
              </button>
            </div>
          </div>

          {/* Profile Info Section - Instagram Style Horizontal Layout */}
          <div className="p-8">
            <div className="flex gap-8 items-start mb-6">
              {/* Avatar - Left Side */}
              <div className="relative flex-shrink-0">
                <div className="w-32 h-32 bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-xl ring-4 ring-emerald-50">
                  {getInitials(currentUser.name)}
                </div>
                <div className="absolute bottom-2 right-2 w-7 h-7 bg-emerald-500 rounded-full border-4 border-white"></div>
              </div>

              {/* User Info & Stats - Right Side */}
              <div className="flex-1 pt-2">
                {/* Name and Username */}
                <div className="mb-4">
                  <h1 className="text-2xl font-bold text-slate-900 mb-1">
                    {currentUser.name}
                  </h1>
                  <p className="text-slate-500 text-sm">
                    @{currentUser.username || currentUser.id}
                  </p>
                </div>

                {/* Stats Row - Instagram Style */}
                <div className="flex gap-4 mb-4">
                  <div className="px-4 py-2 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-900">
                      {contributions?.totalContributions || 0}
                    </span>
                    <span className="text-slate-600 ml-1">posts</span>
                  </div>
                  <button
                    className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 hover:border-emerald-300 transition-all duration-200 hover:shadow-md"
                    onClick={() => {
                      fetchFollowers(currentUser.id);
                      setShowFollowersModal(true);
                    }}
                  >
                    <span className="font-bold text-emerald-700">
                      {followersCount}
                    </span>
                    <span className="text-emerald-600 ml-1">followers</span>
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 hover:border-blue-300 transition-all duration-200 hover:shadow-md"
                    onClick={() => {
                      fetchFollowing(currentUser.id);
                      setShowFollowingModal(true);
                    }}
                  >
                    <span className="font-bold text-blue-700">
                      {followingCount}
                    </span>
                    <span className="text-blue-600 ml-1">following</span>
                  </button>
                </div>

                {/* Bio/Status */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {getStatusText(currentUser.isActive)}
                    </span>
                  </div>
                  {currentUser.place && (
                    <p className="text-slate-600 text-sm flex items-center gap-1">
                      <MapPin size={14} />
                      {currentUser.place}
                    </p>
                  )}
                </div>

                {/* Personal Info Button */}
                <button
                  onClick={() => setShowPersonalInfo(!showPersonalInfo)}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md"
                >
                  {showPersonalInfo
                    ? 'Hide Personal Info'
                    : 'View Personal Info'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Information Section - Conditional */}
        {showPersonalInfo && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-6 animate-fadeIn">
            <div className="flex items-center gap-2 mb-5">
              <User size={20} className="text-emerald-600" />
              <h2 className="text-xl font-bold text-slate-900">
                Personal Information
              </h2>
            </div>

            <div className="space-y-2">
              {[
                {
                  key: 'email',
                  icon: <Mail size={18} className="text-slate-500" />,
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
                  icon: <Phone size={18} className="text-slate-500" />,
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
                        icon: <User size={18} className="text-slate-500" />,
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
                        icon: <Calendar size={18} className="text-slate-500" />,
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
                        icon: <MapPin size={18} className="text-slate-500" />,
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
          </div>
        )}

        {/* Contributions Section - Always Visible */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Activity size={20} className="text-emerald-600" />
              <h2 className="text-xl font-bold text-slate-900">
                My Contributions
              </h2>
            </div>

            {/* Compact Toggle */}
            <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50 shadow-sm">
              <button
                onClick={() => {
                  setShowDashboard(true);
                  setContributions(null);
                }}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  showDashboard
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => {
                  setShowDashboard(false);
                  setContributions(null);
                }}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  !showDashboard
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Files
              </button>
            </div>
          </div>

          {showDashboard ? (
            <div className="mt-4">
              <ContributionDashboard
                dailyStats={dailyStats}
                contributions={contributions}
                loading={loading.stats || loading.contributions}
              />
            </div>
          ) : (
            <div className="mt-4">
              {/* Media Type Pills */}
              <div className="flex gap-2 mb-6 flex-wrap">
                {(['text', 'document', 'image', 'audio', 'video'] as const).map(
                  (type) => (
                    <ContributionTypeButton
                      key={type}
                      type={type}
                      selectedMediaType={selectedMediaType}
                      setSelectedMediaType={(newType) => {
                        setSelectedMediaType(newType);
                        if (currentUser?.id) {
                          fetchUserContributions(currentUser.id, newType);
                        }
                      }}
                    />
                  ),
                )}
              </div>

              {/* Contributions List */}
              <div className="space-y-3">
                {selectedMediaType && (
                  <ContributionsList
                    contributions={contributions}
                    selectedMediaType={selectedMediaType as any}
                    onUpdate={refetch}
                    handleUpdate={handleUpdate}
                    token={token}
                  />
                )}
                {!selectedMediaType && !loading.contributions && (
                  <div className="text-center text-slate-400 py-8 text-sm font-medium">
                    Please select a media type to view contributions.
                  </div>
                )}
                {loading.contributions && !selectedMediaType && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">
                      Loading contributions...
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        {/* Account Information & Export - Combined */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">
              Account Details
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-xs text-slate-500 font-medium">
                Member Since
              </div>
              <div className="text-sm font-semibold text-slate-900">
                {formatDate(currentUser.createdAt)}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-xs text-slate-500 font-medium">
                Last Updated
              </div>
              <div className="text-sm font-semibold text-slate-900">
                {formatDate(currentUser.updatedAt)}
              </div>
            </div>
            {currentUser.lastLoginAt && (
              <div className="space-y-2">
                <div className="text-xs text-slate-500 font-medium">
                  Last Login
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  {formatDate(currentUser.lastLoginAt)}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <div className="text-xs text-slate-500 font-medium">
                Consent Status
              </div>
              <div
                className={`text-sm font-semibold ${
                  currentUser.hasGivenConsent
                    ? 'text-emerald-600'
                    : 'text-red-600'
                }`}
              >
                {currentUser.hasGivenConsent ? '✓ Given' : '✗ Not Given'}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* The modal is no longer rendered here */}

      {/* Followers and Following Modals */}
      <FollowersModal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        followers={followers}
        loading={loadingFollowers}
      />
      <FollowingModal
        isOpen={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
        following={following}
        loading={loadingFollowing}
      />
    </div>
  );
};

// ... (ContributionTypeButton remains the same) ...
const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

function ContributionTypeButton({
  type,
  selectedMediaType,
  setSelectedMediaType,
}: {
  type: 'text' | 'image' | 'video' | 'audio' | 'document';
  selectedMediaType: 'text' | 'image' | 'video' | 'audio' | 'document' | null;
  setSelectedMediaType: (
    type: 'text' | 'image' | 'video' | 'audio' | 'document',
  ) => void;
}) {
  const icons = {
    text: '📝',
    document: '📄',
    image: '🖼️',
    audio: '🎵',
    video: '🎬',
  };

  return (
    <button
      onClick={() => setSelectedMediaType(type)}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        selectedMediaType === type
          ? 'bg-emerald-600 text-white shadow-sm'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      }`}
    >
      <span>{icons[type]}</span>
      <span>{capitalize(type)}</span>
    </button>
  );
}

interface ContributionsListProps {
  contributions: UserContributions | null;
  selectedMediaType: 'text' | 'audio' | 'video' | 'image' | 'document' | null; // Allow null
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
  // NEW: State to track which item's history is visible
  const [historyVisibleItemId, setHistoryVisibleItemId] = useState<
    string | null
  >(null);

  const toggleHistoryVisibility = (itemId: string) => {
    setHistoryVisibleItemId((prevId) => (prevId === itemId ? null : itemId));
  };

  let items: ContributionItem[] = [];
  if (!contributions || !selectedMediaType) return null; // Don't render if no contributions or no media type selected

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
        // ... (getValidationWarnings and getSnrLabel functions remain the same)
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
            className={`flex flex-col py-4 px-2 rounded-lg transition ${
              hasWarnings ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'
            }`}
          >
            {/* ... (The main display of the contribution item remains the same) ... */}
            <div className="flex gap-2">
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold
                  ${selectedMediaType === 'text' && 'bg-blue-100 text-blue-700'}
                  ${
                    selectedMediaType === 'audio' &&
                    'bg-green-100 text-green-700'
                  }
                  ${
                    selectedMediaType === 'video' &&
                    'bg-purple-100 text-purple-700'
                  }
                  ${
                    selectedMediaType === 'image' &&
                    'bg-orange-100 text-orange-700'
                  }
                  ${
                    selectedMediaType === 'document' &&
                    'bg-orange-100 text-orange-700'
                  }
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
                        ? `${item.location.latitude.toFixed(
                            4,
                          )}, ${item.location.longitude.toFixed(4)}`
                        : '-'
                    }
                  >
                    <span className="font-semibold mr-1 italic">Location:</span>{' '}
                    {item.location &&
                    typeof item.location.latitude === 'number' &&
                    typeof item.location.longitude === 'number'
                      ? `${item.location.latitude.toFixed(
                          4,
                        )}, ${item.location.longitude.toFixed(4)}`
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
                  {item.release_rights === 'others' && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium text-xs border border-gray-300 whitespace-nowrap min-w-[60px] max-w-full overflow-x-auto italic">
                      <span className="font-semibold mr-1 italic">
                        Creator:
                      </span>{' '}
                      {item.creator || 'N/A'}
                    </span>
                  )}
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
                <button
                  onClick={() => toggleHistoryVisibility(item.id)}
                  className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-100 rounded-full transition-colors"
                  title="View Edit History"
                >
                  <History size={18} />
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
            {/* NEW: Conditionally render the inline history component */}
            {historyVisibleItemId === item.id && (
              <InlineEditHistory recordId={item.id} token={token} />
            )}
          </li>
        );
      })}
    </ul>
  );
};

// ... (ProfileDetail, SecureViewButton, EditableContributionItem components remain the same) ...
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
  const [creator, setCreator] = useState(item.creator || '');
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
      creator: creator,
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
      {rightsKey === 'others' && (
        <div>
          <label
            htmlFor="creator"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Creator
          </label>
          <input
            type="text"
            name="creator"
            id="creator"
            className="w-full border px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            value={creator}
            onChange={(e) => setCreator(e.target.value)}
            placeholder="Enter the creator's name"
          />
        </div>
      )}
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

// NEW: Component to show edit history inline
interface InlineEditHistoryProps {
  recordId: string;
  token: string;
}

const InlineEditHistory: React.FC<InlineEditHistoryProps> = ({
  recordId,
  token,
}) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  const formatFieldName = (fieldName: string) => {
    return fieldName
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${BACKEND_URL}/history/record/${recordId}/history`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        if (!response.ok) {
          throw new Error('Failed to fetch edit history');
        }
        const data = await response.json();
        setHistory(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'An unknown error occurred.',
        );
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [recordId, token]);

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <h4 className="text-md font-semibold text-gray-700 mb-2">Edit History</h4>
      {loading && (
        <div className="flex justify-center items-center py-4">
          <Loader2 className="animate-spin text-blue-500" size={24} />
        </div>
      )}
      {error && <p className="text-red-500 text-center py-4">{error}</p>}
      {!loading && !error && history.length === 0 && (
        <p className="text-gray-500 text-center py-4">
          No edit history found for this record.
        </p>
      )}
      {!loading && !error && history.length > 0 && (
        <ul className="space-y-2">
          {history.map((entry) => {
            const isExpanded = expandedEntry === entry.uid;
            return (
              <li
                key={entry.uid}
                className="border rounded-lg overflow-hidden bg-white"
              >
                <button
                  onClick={() =>
                    setExpandedEntry(isExpanded ? null : entry.uid)
                  }
                  className="w-full flex justify-between items-center p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="text-left">
                    <p className="font-semibold text-gray-800">
                      Version {entry.version_number}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(entry.created_at).toLocaleString()} by{' '}
                      <span className="font-medium">
                        {entry.changed_by || 'N/A'}
                      </span>
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </button>
                {isExpanded && (
                  <div className="p-4 bg-white">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
                      <p>
                        <strong className="text-gray-600">Change Type:</strong>{' '}
                        <span className="font-mono bg-gray-100 px-1 rounded">
                          {entry.change_type || 'N/A'}
                        </span>
                      </p>
                      <p>
                        <strong className="text-gray-600">
                          Change Source:
                        </strong>{' '}
                        <span className="font-mono bg-gray-100 px-1 rounded">
                          {entry.change_source || 'N/A'}
                        </span>
                      </p>
                    </div>
                    {entry.field_changes &&
                      Object.keys(entry.field_changes).length > 0 && (
                        <div>
                          <strong className="text-base font-semibold text-gray-700">
                            Field Changes:
                          </strong>
                          <ul className="mt-2 space-y-2">
                            {Object.entries(entry.field_changes).map(
                              ([field, change]: [string, any]) => (
                                <li
                                  key={field}
                                  className="p-2 border rounded-md bg-gray-50"
                                >
                                  <strong className="font-semibold text-gray-800">
                                    {formatFieldName(field)}
                                  </strong>
                                  <div className="flex items-center mt-1">
                                    <span className="text-xs font-medium text-red-500 mr-2">
                                      OLD:
                                    </span>
                                    <span className="font-mono text-sm text-red-700 bg-red-50 p-1 rounded line-through">
                                      {String(change.old_value ?? 'N/A')}
                                    </span>
                                  </div>
                                  <div className="flex items-center mt-1">
                                    <span className="text-xs font-medium text-green-500 mr-2">
                                      NEW:
                                    </span>
                                    <span className="font-mono text-sm text-green-700 bg-green-50 p-1 rounded">
                                      {String(change.new_value ?? 'N/A')}
                                    </span>
                                  </div>
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                      )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

// Modal component for displaying followers
const FollowersModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  followers: any[];
  loading: boolean;
}> = ({ isOpen, onClose, followers, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-96 overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Followers</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto max-h-80">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="animate-spin text-blue-500" size={24} />
            </div>
          ) : followers.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {followers.map((follower) => (
                <li
                  key={follower.id || follower.user_id}
                  className="p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    window.location.href = `/userprofile/${follower.id || follower.user_id}`;
                  }}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-gray-600 font-medium">
                        {follower.name
                          ? follower.name.charAt(0).toUpperCase()
                          : 'U'}
                      </span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">
                        {follower.name || follower.username || 'Unknown User'}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex justify-center items-center h-40">
              <p className="text-gray-500">No followers found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Modal component for displaying following
const FollowingModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  following: any[];
  loading: boolean;
}> = ({ isOpen, onClose, following, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-96 overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Following</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto max-h-80">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="animate-spin text-blue-500" size={24} />
            </div>
          ) : following.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {following.map((followedUser) => (
                <li
                  key={followedUser.id || followedUser.user_id}
                  className="p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    window.location.href = `/userprofile/${followedUser.id || followedUser.user_id}`;
                  }}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-gray-600 font-medium">
                        {followedUser.name
                          ? followedUser.name.charAt(0).toUpperCase()
                          : 'U'}
                      </span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">
                        {followedUser.name ||
                          followedUser.username ||
                          'Unknown User'}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex justify-center items-center h-40">
              <p className="text-gray-500">No users being followed</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
