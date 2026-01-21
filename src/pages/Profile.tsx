import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  X,
  TrendingUp,
  Award,
  Activity,
  BarChart,
  Zap,
  Calendar,
  History,
  ChevronDown,
  ChevronUp,
  Clock,
  Pencil,
  LogOut,
} from 'lucide-react';
import { BACKEND_URL } from '@/lib/constants';
import { formatDuration, formatSizeMB, getISTDate } from '@/lib/utils';
import { getPointsStats, DailyPoint } from '@/lib/points';
import ContributionDashboard from '@/components/ContributionDashboard';
import PointsHeatmap from '@/components/PointsHeatmap';
import CategoryTags from '@/components/CategoryTags';
import { MediaGridItem } from '@/components/MediaGridItem';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

const languages = [
  'assamese',
  'bengali',
  'bodo',
  'dogri',
  'gujarati',
  'hindi',
  'kannada',
  'kashmiri',
  'konkani',
  'maithili',
  'malayalam',
  'marathi',
  'meitei',
  'nepali',
  'odia',
  'punjabi',
  'sanskrit',
  'santali',
  'sindhi',
  'tamil',
  'telugu',
  'urdu',
];

const releaseOptions = [
  { key: 'creator', value: 'This work is created by Author' },
  {
    key: 'downloaded',
    value:
      "Author downloaded this from the internet and/or Author don't know if it is free to share",
  },
  { key: 'others', value: 'Not Done By Author' },
];

interface FollowedUser {
  id?: string;
  user_id?: string;
}

interface UserProfileData {
  id: string;
  name: string;
  username?: string;
  streaks: {
    combined_streak: {
      current: number;
      longest: number;
      total_active_days: number;
    };
  };
  timeline: Record<string, unknown>;
  summary: {
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
}

// Define interfaces for followers/following
interface User {
  id?: string;
  user_id?: string;
  name?: string;
  username?: string;
}

// Define interfaces for contribution items
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
  category_id?: string; // Keep for backward compatibility
  category_ids?: string[]; // New field for multiple categories
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

interface FieldChange {
  old_value: string | number | boolean | null | undefined;
  new_value: string | number | boolean | null | undefined;
}

interface EditHistoryEntry {
  uid: string;
  version_number: number;
  created_at: string;
  changed_by?: string;
  change_type?: string;
  change_source?: string;
  field_changes?: Record<string, FieldChange>;
}

function Profile() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [contributions, setContributions] = useState<UserContributions | null>(
    null,
  );
  const [contributionsLoading, setContributionsLoading] =
    useState<boolean>(false);
  const [pointsData, setPointsData] = useState<DailyPoint[] | null>(null);
  const [pointsError, setPointsError] = useState<string | null>(null);

  // States for dashboard functionality
  const [selectedMediaType, setSelectedMediaType] = useState<
    'text' | 'audio' | 'video' | 'image' | 'document' | null
  >(null);

  const { username } = useParams<{ username?: string }>();

  // State for current user ID
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [targetUserIdentifier, setTargetUserIdentifier] = useState<
    string | null
  >(null); // Store the identifier (username or ID) for API calls

  // State for follow functionality
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [followLoading, setFollowLoading] = useState<boolean>(false);

  // New states for followers and following
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);
  const [loadingFollowers, setLoadingFollowers] = useState<boolean>(false);
  const [loadingFollowing, setLoadingFollowing] = useState<boolean>(false);

  // State for followers/following modals
  const [showFollowersModal, setShowFollowersModal] = useState<boolean>(false);
  const [showFollowingModal, setShowFollowingModal] = useState<boolean>(false);

  // State for media grid display
  const [showMediaGrid, setShowMediaGrid] = useState<boolean>(false);

  const getAuthToken = useCallback(() => {
    return localStorage.getItem('token');
  }, []);

  // Function to get the current user's ID from the token
  const getCurrentUserId = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      return null;
    }

    try {
      // Get user profile to extract current user ID
      const response = await fetch(`${BACKEND_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Could not get current user profile');
      }

      const userData = await response.json();
      setCurrentUsername(userData.username);
      return userData.id;
    } catch (err) {
      console.error('Error getting current user ID:', err);
      return null;
    }
  }, [getAuthToken]);

  // Function to fetch user contributions by media type
  const fetchUserContributions = useCallback(
    async (
      userId: string, // Changed parameter name from currentUserId to userId for clarity
      mediaType: 'text' | 'audio' | 'video' | 'image' | 'document' | undefined,
    ) => {
      setContributionsLoading(true);

      try {
        const token = getAuthToken();
        const baseUrl = BACKEND_URL;
        const apiUrl = mediaType
          ? `${baseUrl}/users/${userId}/contributions/${mediaType}`
          : `${baseUrl}/users/${userId}/contributions`; // Fallback to all if no mediaType

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
        setContributionsLoading(false);
      }
    },
    [getAuthToken],
  );

  // Function to calculate uploads today from contributions
  const calculateUploadsToday = () => {
    if (!contributions) return 0;

    const allContributions = [
      ...(contributions.audioContributions || []),
      ...(contributions.videoContributions || []),
      ...(contributions.textContributions || []),
      ...(contributions.imageContributions || []),
      ...(contributions.documentContributions || []),
    ].filter((item) => item.timestamp);

    if (allContributions.length === 0) {
      return 0;
    }

    const todayIST = getISTDate(new Date().toISOString()); // Get current date in IST
    todayIST.setHours(0, 0, 0, 0); // Set to start of IST day

    let uploadsTodayCount = 0;
    allContributions.forEach((item) => {
      if (item.timestamp) {
        const itemDateIST = getISTDate(item.timestamp); // Convert UTC timestamp to IST Date object
        itemDateIST.setHours(0, 0, 0, 0); // Set to start of IST day
        if (itemDateIST.getTime() === todayIST.getTime()) {
          uploadsTodayCount++;
        }
      }
    });
    return uploadsTodayCount;
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

  // Function to get current user's profile to check follow status
  const checkFollowStatusWithUsername = useCallback(
    async (profileUsername: string) => {
      try {
        const token = getAuthToken();
        if (!token) {
          return;
        }

        // Get current user's profile to get their id
        const currentProfileResponse = await fetch(`${BACKEND_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!currentProfileResponse.ok) {
          throw new Error('Could not get current user profile');
        }

        const currentProfile = await currentProfileResponse.json();
        const currentUserId = currentProfile.id;

        // Get the current user's following list
        const followingResponse = await fetch(
          `${BACKEND_URL}/users/${currentUserId}/following`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        );

        if (followingResponse.ok) {
          const followingData = await followingResponse.json();
          const followingList = followingData.following || followingData || [];
          // Check if the user is being followed by username or ID
          const isUserBeingFollowed = followingList.some(
            (user: FollowedUser) =>
              user.username === profileUsername ||
              user.id === profileUsername ||
              user.user_id === profileUsername,
          );
          setIsFollowing(isUserBeingFollowed);
        }
      } catch (err) {
        console.error('Error checking follow status:', err);
      }
    },
    [getAuthToken],
  );

  // Function to follow a user
  const followUser = async (targetUsername: string) => {
    setFollowLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No Authentication token available');
      }

      const response = await fetch(
        `${BACKEND_URL}/users/${targetUsername}/follow`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.ok) {
        setIsFollowing(true);
        // Update the followers count by incrementing it (since target user now has one more follower)
        setFollowersCount((prev) => prev + 1);
        // Refetch profile to update counts
        fetchOtherUserProfile(targetUsername);
        // Refetch followers and following data to keep them updated
        fetchFollowers(targetUsername);
        fetchFollowing(targetUsername);
      } else {
        throw new Error(`Failed to follow user: ${response.status}`);
      }
    } catch (err) {
      console.error('Error following user:', err);
      setError(err instanceof Error ? err.message : 'Error following user');
    } finally {
      setFollowLoading(false);
    }
  };

  // Function to unfollow a user
  const unfollowUser = async (targetUsername: string) => {
    setFollowLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No Authentication token available');
      }

      const response = await fetch(
        `${BACKEND_URL}/users/${targetUsername}/follow`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.ok) {
        setIsFollowing(false);
        // Update the followers count by decrementing it (since target user now has one less follower)
        setFollowersCount((prev) => Math.max(0, prev - 1));
        // Refetch profile to update counts
        fetchOtherUserProfile(targetUsername);
        // Refetch followers and following data to keep them updated
        fetchFollowers(targetUsername);
        fetchFollowing(targetUsername);
      } else {
        throw new Error(`Failed to unfollow user: ${response.status}`);
      }
    } catch (err) {
      console.error('Error unfollowing user:', err);
      setError(err instanceof Error ? err.message : 'Error unfollowing user');
    } finally {
      setFollowLoading(false);
    }
  };

  // Function to fetch followers
  const fetchFollowers = useCallback(
    async (targetUsername: string) => {
      setLoadingFollowers(true);
      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error('No Authentication token available');
        }

        const response = await fetch(
          `${BACKEND_URL}/users/${targetUsername}/followers`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        );

        if (!response.ok) {
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

  // Function to fetch following
  const fetchFollowing = useCallback(
    async (targetUsername: string) => {
      setLoadingFollowing(true);
      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error('No Authentication token available');
        }

        const response = await fetch(
          `${BACKEND_URL}/users/${targetUsername}/following`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        );

        if (!response.ok) {
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

  // Unified function to fetch user profile regardless of whether it's own or other's profile
  const fetchUserProfile = useCallback(
    async (userIdentifier: string) => {
      setLoading(true);
      setError(null);

      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error('No Authentication token available');
        }

        // Determine if we're fetching own profile or other profile
        const isOwnProfile =
          userIdentifier === (localStorage.getItem('username') || '');
        let userData;
        let formattedProfile;

        if (isOwnProfile) {
          // Fetch own profile
          const response = await fetch(`${BACKEND_URL}/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch profile: ${response.status}`);
          }

          userData = await response.json();
          formattedProfile = {
            id: userData.id,
            name: userData.name || userData.username || 'Unknown User',
            username: userData.username,
            streaks: {
              combined_streak: {
                current: userData.streak_days || 0,
                longest: userData.streak_days || 0,
                total_active_days: userData.total_active_days || 0,
              },
            },
            timeline: {},
            summary: {
              contributions: {
                total_contributions: userData.total_contributions || 0,
                contributions_by_media_type:
                  userData.contributions_by_media_type || {
                    text: 0,
                    audio: 0,
                    image: 0,
                    video: 0,
                    document: 0,
                  },
              },
              edits: {
                total_edits: userData.total_edits || 0,
              },
              overall: {
                total_activities: userData.total_activities || 0,
              },
            },
          };
        } else {
          // Fetch other user's profile
          const apiUrl =
            BACKEND_URL +
            `/users/${userIdentifier}/profile?include=streaks,timeline,summary&days=30`;
          const response = await fetch(apiUrl, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            if (response.status == 401) {
              throw new Error(
                'Authentication Failed. Please log in Again. Your session might have expired',
              );
            }
            if (response.status == 404) {
              throw new Error('User Not Found');
            }
            throw new Error(
              `Failed to fetch profile: ${response.status} ${response.statusText}`,
            );
          }

          userData = await response.json();
          formattedProfile = {
            id: userData.user_id,
            name: userData.user_name || 'Unknown User',
            username: userData.username,
            streaks: userData.streaks,
            timeline: userData.timeline,
            summary: userData.summary,
          };
          console.log(formattedProfile);
        }

        setProfile(formattedProfile);
        setTargetUserIdentifier(userIdentifier); // Set the target identifier for API calls

        // Fetch points data for the profile after profile is set
        try {
          const pointsStats = await getPointsStats(token, userIdentifier);
          setPointsData(pointsStats.daily);
          setPointsError(null); // Clear any previous error
        } catch (pointsError) {
          console.error('Error fetching points data:', pointsError);
          // Points data might not be available for other users due to privacy settings
          // This is expected behavior in many cases
          if (isOwnProfile) {
            // Only show error for own profile
            setPointsError('Failed to load points data');
          }
          setPointsData([]);
          setPointsError(null); // Don't show error for other profiles
        }
      } catch (err) {
        console.error('Error fetching profile', err);
        setError(err instanceof Error ? err.message : 'Error caught in Catch');
      } finally {
        setLoading(false);
      }
    },
    [getAuthToken],
  );

  // Effect for initial data fetch
  useEffect(() => {
    const loadInitialData = async () => {
      // Get current user ID first
      const currentId = await getCurrentUserId();
      const currentUsername = localStorage.getItem('username') || null; // Also get current username
      setCurrentUserId(currentId);
      setCurrentUsername(currentUsername);

      if (username) {
        // Reset points data before fetching new data
        setPointsData(null);
        setPointsError(null);

        // Use unified function to fetch profile regardless of own or other profile
        fetchUserProfile(username);

        // Fetch all contributions for the user initially
        fetchUserContributions(username, undefined);

        // Fetch followers and following
        fetchFollowers(username);
        fetchFollowing(username);

        // Check follow status if viewing other user's profile
        if (currentUsername !== username) {
          checkFollowStatusWithUsername(username);
        }
      }
    };

    loadInitialData();
  }, [
    username,
    fetchUserProfile,
    checkFollowStatusWithUsername,
    fetchFollowers,
    fetchFollowing,
    getCurrentUserId,
    selectedMediaType,
    fetchUserContributions,
    getAuthToken,
  ]);

  // Determine if viewing own profile
  const isOwnProfile =
    username && currentUsername ? currentUsername === username : false;

  console.log(profile);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-4 sm:py-6 sm:mb-12 pt-4 pb-24">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Enhanced Header Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 mb-6 overflow-hidden">
          {/* Profile Info Section - Mobile Responsive Layout */}
          <div className="p-4 relative">
            <button
              onClick={handleLogout}
              className="flex flex-col absolute right-0 sm:right-5 items-center gap-1 p-2 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4 text-red-500" />
            </button>

            <div className="flex flex-row gap-6 items-center">
              {/* Avatar - Centered on mobile */}
              <div className="relative flex-shrink-0 group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                <div className="relative w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-xl ring-4 ring-blue-5 group-hover:ring-6 sm:group-hover:ring-8 group-hover:ring-blue-100 transition-all duration-300 transform group-hover:scale-105">
                  {getInitials(profile?.name)}
                </div>
                <div className="absolute bottom-2 right-2 w-6 h-6 sm:w-7 sm:h-7 bg-blue-500 rounded-full border-4 border-white animate-pulse"></div>
              </div>

              {/* User Info & Stats - Stacked on mobile */}
              <div className="flex-1 text-left">
                {/* Name and Username */}
                <div className="mb-4">
                  <p className="text-sm sm:text-xl mb-1">{profile?.name}</p>
                  <p className="text-slate-500 text-sm">
                    @{profile?.username || profile?.id}
                  </p>
                </div>

                {/* Stats Row - Side by side with equal width */}
                <div className="flex gap-2">
                  {/* Followers Button */}
                  <button
                    onClick={() => {
                      const id = username || currentUserId;
                      if (id) fetchFollowers(id);
                      setShowFollowersModal(true);
                    }}
                    className="max-w-20 flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-xl transition-all duration-200 active:scale-95 group"
                  >
                    <span className="text-emerald-600 font-bold text-base">
                      {followersCount}
                    </span>
                    <span className="text-slate-500 text-[7px] font-medium uppercase tracking-wider group-hover:text-emerald-700">
                      Followers
                    </span>
                  </button>

                  {/* Following Button */}
                  <button
                    onClick={() => {
                      const id = username || currentUserId;
                      if (id) fetchFollowing(id);
                      setShowFollowingModal(true);
                    }}
                    className="max-w-20 flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl transition-all duration-200 active:scale-95 group"
                  >
                    <span className="text-blue-600 font-bold text-base">
                      {followingCount}
                    </span>
                    <span className="text-slate-500 text-[7px] font-medium uppercase tracking-wider group-hover:text-emerald-700">
                      Following
                    </span>
                  </button>
                </div>

                {/* Follow Button - Full width on mobile */}
                {!isOwnProfile && (
                  <button
                    onClick={() => {
                      if (isFollowing) {
                        unfollowUser(username!);
                      } else {
                        followUser(username!);
                      }
                    }}
                    disabled={followLoading}
                    className={`w-full mt-2 sm:w-auto px-3 py-1.5 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-0.5 ${
                      isFollowing
                        ? 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 hover:from-slate-200 hover:to-slate-300 border-2 border-slate-300 hover:border-slate-400'
                        : 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800 hover:shadow-emerald-500/50'
                    } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                  >
                    {followLoading ? (
                      <span className="flex items-center justify-center sm:justify-start gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </span>
                    ) : isFollowing ? (
                      'Following'
                    ) : (
                      'Follow'
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Points Heatmap Section - Visible for all user profiles */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-6 mb-6">
          {pointsError ? (
            <div className="text-center py-4">
              <p className="text-red-500">{pointsError}</p>
            </div>
          ) : pointsData ? (
            <PointsHeatmap dailyData={pointsData} />
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">Loading points data...</p>
            </div>
          )}
        </div>

        {/* Contributions Section - Mobile Responsive Design */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-4 sm:mb-6 gap-3">
            <div className="flex items-center gap-2">
              <Activity size={20} className="text-blue-600" />
              <p className="text-sm sm:text-md font-bold text-slate-900">
                Contributions
              </p>
            </div>
          </div>

          <div className="mt-2 sm:mt-4">
            <ContributionDashboard
              dailyStats={{
                uploads_today: calculateUploadsToday(),
                total_uploads: contributions?.totalContributions || 0,
                last_upload_date: new Date().toISOString(),
                streak_days: profile?.streaks?.combined_streak?.current || 0,
              }}
              contributions={contributions}
              loading={contributionsLoading}
              edits={profile?.summary?.edits?.total_edits}
              onMediaTypeClick={(mediaType) => {
                setSelectedMediaType(mediaType);
                const targetUserIdentifier = username || currentUserId;
                if (targetUserIdentifier) {
                  fetchUserContributions(targetUserIdentifier, mediaType);
                }
                setShowMediaGrid(true); // Show the grid when a media type is clicked
              }}
            />
          </div>
        </div>
      </div>

      {/* Media Grid Overlay - Appears when clicking on media type cards */}
      {showMediaGrid && selectedMediaType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold capitalize">
                {selectedMediaType} Contributions
              </h3>
              <button
                onClick={() => {
                  setShowMediaGrid(false);
                  // Optionally reset selectedMediaType when closing the grid
                  // setSelectedMediaType(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            {/* Grid Content */}
            <div className="flex-1 overflow-auto p-4">
              <ContributionsList
                contributions={contributions}
                selectedMediaType={selectedMediaType}
                token={getAuthToken()}
                isOwnProfile={isOwnProfile}
              />
            </div>
          </div>
        </div>
      )}

      {/* Followers and Following Modals */}
      <FollowersModal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        followers={followers}
        loading={loadingFollowers}
        currentUserId={currentUserId}
        isOwnProfile={isOwnProfile}
        navigate={navigate}
      />
      <FollowingModal
        isOpen={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
        following={following}
        loading={loadingFollowing}
        currentUserId={currentUserId}
        isOwnProfile={isOwnProfile}
        navigate={navigate}
      />
    </div>
  );
}

// Modal component for displaying followers
const FollowersModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  followers: User[];
  loading: boolean;
  currentUserId: string | null;
  isOwnProfile: boolean;
  navigate: (path: string) => void;
}> = ({
  isOpen,
  onClose,
  followers,
  loading,
  currentUserId,
  isOwnProfile,
  navigate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-96 overflow-hidden">
        <div className="flex justify-between items-center p-3 sm:p-4 border-b">
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
              {followers.map((follower) => {
                const userId = follower.id || follower.user_id;
                const isCurrentUser = userId === currentUserId;

                return (
                  <li
                    key={userId}
                    className="p-3 sm:p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      if (isCurrentUser) {
                        navigate('/profile');
                      } else {
                        navigate(`/profile/${follower.username || userId}`);
                      }
                      // Close the modal after navigation
                      onClose();
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
                      <div className="ml-3 sm:ml-4">
                        <p className="text-sm font-medium text-gray-900">
                          {follower.name || follower.username || 'Unknown User'}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
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
  following: User[];
  loading: boolean;
  currentUserId: string | null;
  isOwnProfile: boolean;
  navigate: (path: string) => void;
}> = ({
  isOpen,
  onClose,
  following,
  loading,
  currentUserId,
  isOwnProfile,
  navigate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-96 overflow-hidden">
        <div className="flex justify-between items-center p-3 sm:p-4 border-b">
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
              {following.map((followedUser) => {
                const userId = followedUser.id || followedUser.user_id;
                const isCurrentUser = userId === currentUserId;

                return (
                  <li
                    key={userId}
                    className="p-3 sm:p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      if (isCurrentUser) {
                        navigate('/profile');
                      } else {
                        navigate(`/profile/${followedUser.username || userId}`);
                      }
                      // Close the modal after navigation
                      onClose();
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
                      <div className="ml-3 sm:ml-4">
                        <p className="text-sm font-medium text-gray-900">
                          {followedUser.name ||
                            followedUser.username ||
                            'Unknown User'}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
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

// Contribution type button component
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
  return (
    <button
      key={type}
      onClick={() => setSelectedMediaType(type)}
      className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full font-semibold border-2 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 text-xs sm:text-sm
        ${
          selectedMediaType === type
            ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30'
            : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-400'
        }`}
    >
      {capitalize(type)}
    </button>
  );
}

interface ContributionsListProps {
  contributions: UserContributions | null;
  selectedMediaType: 'text' | 'audio' | 'video' | 'image' | 'document' | null;
  token: string;
  isOwnProfile: boolean;
}

// Modal for showing media details
interface MediaDetailModalProps {
  item: ContributionItem;
  mediaType: 'text' | 'audio' | 'video' | 'image' | 'document';
  previewUrl: string | null;
  token: string;
  isOpen: boolean;
  onClose: () => void;
  isOwnProfile: boolean;
}

const MediaDetailModal: React.FC<MediaDetailModalProps> = ({
  item,
  mediaType,
  previewUrl,
  token,
  isOpen,
  onClose,
  isOwnProfile,
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editItem, setEditItem] = useState<ContributionItem>({ ...item });
  const [sourceLabel, setSourceLabel] = useState<string>('');

  // Effect to hide bottom navigation when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  // Validation states
  const [titleError, setTitleError] = useState<string | null>(null);
  const [descError, setDescError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Function to count meaningful words
  const countMeaningfulWords = (s: string) =>
    s.split(' ').filter((w) => w.trim().length > 2).length;

  // Function to fetch media URL on demand
  const fetchMediaUrl = async () => {
    if (!isOpen || mediaUrl) return; // Don't fetch if modal is closed or already have URL

    setLoading(true);
    setError(false);
    try {
      const response = await fetch(
        `${BACKEND_URL}/records/${item.id}/record-url?expires_minutes=60`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error('Failed to fetch media URL');
      }

      const data = await response.json();
      if (data.record_url) {
        setMediaUrl(data.record_url);
      }
    } catch (err) {
      console.error('Error fetching media:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // Fetch media URL only when needed for audio, document, and video types
  useEffect(() => {
    if (
      isOpen &&
      !previewUrl &&
      (mediaType === 'audio' ||
        mediaType === 'document' ||
        mediaType === 'video')
    ) {
      fetchMediaUrl();
    }
  }, [isOpen, previewUrl, mediaType, item.id, token]);

  if (!isOpen) return null;

  const getMediaTypeLabel = () => {
    return mediaType.charAt(0).toUpperCase() + mediaType.slice(1);
  };

  const renderMediaPreview = () => {
    switch (mediaType) {
      case 'image':
        return (
          <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 shadow-lg">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={item.title || 'Image'}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
              </div>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 shadow-lg">
            {loading && (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
              </div>
            )}
            {error && (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <div className="text-center p-4">
                  <svg
                    className="w-12 h-12 mx-auto text-gray-400 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-xs text-gray-500">Video unavailable</p>
                </div>
              </div>
            )}
            {!loading && !error && mediaUrl && (
              <video
                src={mediaUrl}
                controls
                className="w-full h-full object-contain bg-black"
                onError={() => setError(true)}
              />
            )}
            {!loading && !error && !mediaUrl && (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200 p-4">
                <div className="mb-4">
                  <svg
                    className="w-16 h-16 text-purple-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <button
                  onClick={fetchMediaUrl}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Load Video
                </button>
              </div>
            )}
          </div>
        );

      case 'audio':
        return (
          <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 shadow-lg flex items-center justify-center p-4">
            {loading && (
              <div className="flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
              </div>
            )}
            {error && (
              <div className="text-center p-4">
                <svg
                  className="w-12 h-12 mx-auto text-gray-400 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                  />
                </svg>
                <p className="text-xs text-gray-500">Audio unavailable</p>
              </div>
            )}
            {!loading && !error && mediaUrl && (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-4">
                <div className="mb-4">
                  <svg
                    className="w-16 h-16 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                    />
                  </svg>
                </div>
                <audio
                  src={mediaUrl}
                  controls
                  className="w-full max-w-xs"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                  onError={() => setError(true)}
                />
              </div>
            )}
            {!loading && !error && !mediaUrl && (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-4">
                <div className="mb-4">
                  <svg
                    className="w-16 h-16 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                    />
                  </svg>
                </div>
                <button
                  onClick={fetchMediaUrl}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Load Audio
                </button>
              </div>
            )}
          </div>
        );

      case 'document':
        return (
          <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 shadow-lg flex items-center justify-center">
            {loading && (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
              </div>
            )}
            {error && (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <div className="text-center p-4">
                  <svg
                    className="w-12 h-12 mx-auto text-gray-400 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-xs text-gray-500">Document unavailable</p>
                </div>
              </div>
            )}
            {!loading && !error && mediaUrl && (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
                {/* Check document type and render appropriate preview */}
                {mediaUrl && (
                  <div className="w-full h-full flex flex-col items-center">
                    {mediaUrl.toLowerCase().endsWith('.pdf') ? (
                      <iframe
                        src={mediaUrl}
                        className="w-full h-full border-0"
                        title="Document Preview"
                      />
                    ) : mediaUrl.toLowerCase().endsWith('.docx') ||
                      mediaUrl.toLowerCase().endsWith('.doc') ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-white border-0 p-4">
                        <div className="mb-2">
                          <svg
                            className="w-16 h-16 text-blue-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <p className="text-lg font-semibold text-gray-700 mb-4">
                          {item.title || 'Word Document'}
                        </p>
                        <p className="text-gray-500 mb-6 text-center max-w-md">
                          {item.description || 'Microsoft Word Document'}
                        </p>
                        <a
                          href={mediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg"
                        >
                          Open in New Tab
                        </a>
                      </div>
                    ) : mediaUrl.toLowerCase().endsWith('.txt') ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-white border-0 p-4">
                        <div className="mb-2">
                          <svg
                            className="w-16 h-16 text-blue-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <p className="text-lg font-semibold text-gray-700 mb-4">
                          {item.title || 'Text File'}
                        </p>
                        <p className="text-gray-500 mb-6 text-center max-w-md">
                          {item.description || 'Plain Text Document'}
                        </p>
                        <a
                          href={mediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg"
                        >
                          View Text
                        </a>
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-white border-0 p-4">
                        <div className="mb-2">
                          <svg
                            className="w-16 h-16 text-blue-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <p className="text-lg font-semibold text-gray-700 mb-4">
                          {item.title || 'Document'}
                        </p>
                        <p className="text-gray-500 mb-6 text-center max-w-md">
                          {item.description || 'Document File'}
                        </p>
                        <a
                          href={mediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg"
                        >
                          Open Document
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {!loading && !error && !mediaUrl && (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="mb-4">
                  <svg
                    className="w-16 h-16 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="text-center text-gray-600 mb-4">
                  {item.title || 'Document'}
                </p>
                <button
                  onClick={fetchMediaUrl}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Load Document
                </button>
              </div>
            )}
          </div>
        );

      case 'text':
        return (
          <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 shadow-lg flex items-center justify-center">
            <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50">
              <div className="mb-4">
                <svg
                  className="w-16 h-16 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p className="text-center text-gray-600 mb-4">
                {item.title || 'Text Content'}
              </p>
              <a
                href={previewUrl || mediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Text
              </a>
            </div>
          </div>
        );

      default:
        return (
          <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 shadow-lg flex items-center justify-center">
            <div className="text-center p-4">
              <p className="text-xs text-gray-500">Unsupported media type</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
            {getMediaTypeLabel()} Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-600 hidden sm:block" />
            <X size={20} className="text-gray-600 sm:hidden" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {/* Media Preview */}
            <div className="space-y-4">
              {renderMediaPreview()}

              {/* Action Buttons - Stacked on mobile */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={async () => {
                        // Clear any previous submit errors
                        setSubmitError(null);

                        // Validate inputs before submitting
                        let hasErrors = false;

                        if (
                          !editItem.title ||
                          editItem.title.trim().length < 8
                        ) {
                          setTitleError(
                            'Title must be at least 8 characters long.',
                          );
                          hasErrors = true;
                        } else if (countMeaningfulWords(editItem.title) < 2) {
                          setTitleError(
                            'Title must contain at least 2 meaningful words.',
                          );
                          hasErrors = true;
                        } else {
                          setTitleError(null);
                        }

                        if (
                          !editItem.description ||
                          editItem.description.trim().length < 32
                        ) {
                          setDescError(
                            'Description must be at least 32 characters long.',
                          );
                          hasErrors = true;
                        } else if (
                          countMeaningfulWords(editItem.description) < 10
                        ) {
                          setDescError(
                            'Description must contain at least 10 meaningful words.',
                          );
                          hasErrors = true;
                        } else {
                          setDescError(null);
                        }

                        // Check if release rights is 'others' and if source label or creator is required
                        if (editItem.release_rights === 'others') {
                          if (
                            isOwnProfile &&
                            (!editItem.creator ||
                              editItem.creator.trim() === '')
                          ) {
                            // Creator is required for own profile when release rights is 'others'
                            // For now we'll just show a general error, but we could add a specific state for this
                            setSubmitError(
                              'Creator is required when release rights is set to "Not Done By Author"',
                            );
                            hasErrors = true;
                          } else if (
                            !isOwnProfile &&
                            (!sourceLabel || sourceLabel.trim() === '')
                          ) {
                            // Source label is required for other profiles when release rights is 'others'
                            setSubmitError(
                              'Source label is required when release rights is set to "Not Done By Author"',
                            );
                            hasErrors = true;
                          }
                        }

                        if (hasErrors) {
                          return; // Don't submit if there are validation errors
                        }

                        // Check if there are actual changes to save
                        if (
                          item.title === editItem.title &&
                          item.description === editItem.description &&
                          item.language === editItem.language &&
                          item.release_rights === editItem.release_rights &&
                          item.creator === editItem.creator &&
                          (!isOwnProfile || sourceLabel === '') // Only check sourceLabel if on other's profile
                        ) {
                          toast.info('No changes to save');
                          return;
                        }

                        try {
                          const response = await fetch(
                            `${BACKEND_URL}/records/${editItem.id}`,
                            {
                              method: 'PATCH',
                              headers: {
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                title: editItem.title,
                                description: editItem.description,
                                language: editItem.language,
                                release_rights: editItem.release_rights,
                                ...(editItem.release_rights === 'others' &&
                                isOwnProfile &&
                                editItem.creator
                                  ? { creator: editItem.creator }
                                  : {}),
                                ...(editItem.release_rights === 'others' &&
                                !isOwnProfile &&
                                sourceLabel
                                  ? { source_label: sourceLabel }
                                  : {}),
                                // Add other fields that can be edited if needed
                              }),
                            },
                          );

                          if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(
                              errorData.detail || 'Failed to update record',
                            );
                          }

                          // Update the original item with edited values
                          item.title = editItem.title;
                          item.description = editItem.description;
                          item.language = editItem.language;
                          item.release_rights = editItem.release_rights;
                          item.creator = editItem.creator;

                          setIsEditing(false);
                        } catch (error) {
                          console.error('Error updating record:', error);
                          setSubmitError(
                            `Error updating record: ${error instanceof Error ? error.message : 'Unknown error'}`,
                          );
                        }
                      }}
                      className="flex-1 px-4 py-2 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 border border-green-200 hover:border-green-600"
                    >
                      <span className="text-sm font-semibold">Save</span>
                    </button>
                    <button
                      onClick={() => {
                        // Cancel editing and revert changes
                        setEditItem({ ...item });
                        setSourceLabel(''); // Reset source label
                        setTitleError(null); // Reset validation errors
                        setDescError(null);
                        setSubmitError(null);
                        setIsEditing(false);
                      }}
                      className="flex-1 px-4 py-2 bg-gray-50 text-gray-600 hover:bg-gray-600 hover:text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 border border-gray-200 hover:border-gray-600"
                    >
                      <span className="text-sm font-semibold">Cancel</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        // Initialize validation states
                        setTitleError(null);
                        setDescError(null);
                        setSubmitError(null);
                        // Initialize source label if release rights is 'others'
                        if (item.release_rights === 'others') {
                          setSourceLabel(''); // Initialize to empty, it will be populated if needed
                        }
                      }}
                      className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 border border-blue-200 hover:border-blue-600"
                    >
                      <Pencil size={18} />
                      <span className="text-sm font-semibold">Edit</span>
                    </button>
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className="flex-1 px-4 py-2 bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 border border-purple-200 hover:border-purple-600"
                    >
                      <History size={18} />
                      <span className="text-sm font-semibold">
                        {showHistory ? 'Hide History' : 'View History'}
                      </span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="space-y-4 sm:space-y-6">
              {/* Title and Description */}
              <div className="space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={editItem.title}
                        onChange={(e) => {
                          const t = e.target.value;
                          setEditItem({ ...editItem, title: t });
                          if (t.trim().length < 8) {
                            setTitleError(
                              'Title must be at least 8 characters long.',
                            );
                          } else if (countMeaningfulWords(t) < 2) {
                            setTitleError(
                              'Title must contain at least 2 meaningful words.',
                            );
                          } else {
                            setTitleError(null);
                          }
                        }}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          titleError
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-gray-300 focus:border-blue-500'
                        }`}
                      />
                      {titleError && (
                        <p className="text-xs text-red-500 mt-1 font-medium">
                          {titleError}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={editItem.description}
                        onChange={(e) => {
                          const d = e.target.value;
                          setEditItem({ ...editItem, description: d });
                          if (d.trim().length < 32) {
                            setDescError(
                              'Description must be at least 32 characters long.',
                            );
                          } else if (countMeaningfulWords(d) < 10) {
                            setDescError(
                              'Description must contain at least 10 meaningful words.',
                            );
                          } else {
                            setDescError(null);
                          }
                        }}
                        rows={4}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none ${
                          descError
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-gray-300 focus:border-blue-500'
                        }`}
                      />
                      {descError && (
                        <p className="text-xs text-red-500 mt-1 font-medium">
                          {descError}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {countMeaningfulWords(editItem.description || '')}{' '}
                        meaningful words
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                      {item.title || 'Untitled'}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {item.description || 'No description available'}
                    </p>
                  </>
                )}
              </div>

              {/* Metadata */}
              <div className="space-y-3 bg-gray-50 rounded-xl p-3 sm:p-4">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Information
                </h4>

                <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-3">
                  <Clock
                    size={18}
                    className="text-gray-400 mt-0.5 flex-shrink-0"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">
                      Timestamp
                    </p>
                    <p className="text-sm text-gray-600">
                      {item.timestamp
                        ? new Date(item.timestamp).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })
                        : 'Not available'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-3">
                  <svg
                    className="w-[18px] h-[18px] text-gray-400 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.414A1 1 0 0112.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">
                      Location
                    </p>
                    <p className="text-sm text-gray-600">
                      {item.location &&
                      typeof item.location.latitude === 'number' &&
                      typeof item.location.longitude === 'number'
                        ? `${item.location.latitude.toFixed(4)}, ${item.location.longitude.toFixed(4)}`
                        : 'Not available'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-3">
                  <svg
                    className="w-[18px] h-[18px] text-gray-400 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">
                      File Size
                    </p>
                    <p className="text-sm text-gray-600">
                      {item.size ? formatSizeMB(item.size) : 'Not available'}
                    </p>
                  </div>
                </div>

                {isEditing ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Language
                    </label>
                    <Select
                      value={editItem.language}
                      onValueChange={(val) =>
                        setEditItem({ ...editItem, language: val })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={editItem.language || 'Select language'}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang} value={lang}>
                            {lang}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-3">
                    <svg
                      className="w-[18px] h-[18px] text-gray-400 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                      />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">
                        Language
                      </p>
                      <p className="text-sm text-gray-600">
                        {item.language || 'Not specified'}
                      </p>
                    </div>
                  </div>
                )}

                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Release Rights
                      </label>
                      <Select
                        value={editItem.release_rights}
                        onValueChange={(val) => {
                          setEditItem((prev) => ({
                            ...prev,
                            release_rights: val,
                            // Clear creator field if not 'others'
                            creator: val !== 'others' ? '' : prev.creator,
                          }));
                          // Clear sourceLabel if not 'others'
                          if (val !== 'others') {
                            setSourceLabel('');
                          }
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={
                              editItem.release_rights || 'Select release rights'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {releaseOptions.map((opt) => (
                            <SelectItem key={opt.key} value={opt.key}>
                              {opt.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {editItem.release_rights === 'others' && (
                      <>
                        {isOwnProfile ? (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Creator
                            </label>
                            <input
                              type="text"
                              value={editItem.creator}
                              onChange={(e) =>
                                setEditItem({
                                  ...editItem,
                                  creator: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Specify creator"
                            />
                          </div>
                        ) : (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Source Label
                            </label>
                            <input
                              type="text"
                              value={sourceLabel}
                              onChange={(e) => setSourceLabel(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Specify source"
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-3">
                      <svg
                        className="w-[18px] h-[18px] text-gray-400 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">
                          Release Rights
                        </p>
                        <p className="text-sm text-gray-600">
                          {item.release_rights || 'Not specified'}
                        </p>
                      </div>
                    </div>

                    {/* Category Tags */}
                    <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-3">
                      <svg
                        className="w-[18px] h-[18px] text-gray-400 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">
                          Categories
                        </p>
                        <div className="mt-1">
                          <CategoryTags
                            categoryIds={
                              item.category_ids ||
                              (item.category_id ? [item.category_id] : [])
                            }
                            token={token}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {item.reviewed && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-semibold">
                      ✓ Reviewed
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Edit History Section */}
          {showHistory && (
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
              <InlineEditHistory recordId={item.id} token={token} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ContributionsList: React.FC<ContributionsListProps> = ({
  contributions,
  selectedMediaType,
  token,
  isOwnProfile,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  let items: ContributionItem[] = [];
  if (!contributions || !selectedMediaType) return null;

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

  // Calculate pagination
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = items.slice(startIndex, endIndex);

  // Show grid layout for all media types using the consolidated MediaGridItem
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
        {currentItems.map((item) => (
          <MediaGridItem
            key={item.id}
            item={item}
            mediaType={selectedMediaType}
            token={token}
            isOwnProfile={isOwnProfile}
          />
        ))}
      </div>
      {/* Pagination controls */}
      {totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};

// Dashboard card component
interface DashboardCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  unit?: string;
  color: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  icon,
  title,
  value,
  unit,
  color,
}) => (
  <div
    className={`p-5 rounded-lg shadow-sm flex items-center space-x-4 ${color}`}
  >
    <div className="flex-shrink-0">{icon}</div>
    <div>
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className="text-2xl font-bold text-gray-900">
        {value}
        {unit && <span className="text-base font-normal ml-1">{unit}</span>}
      </p>
    </div>
  </div>
);

interface MediaTypeCardProps {
  type: string;
  count: number;
  duration?: number;
  icon: React.ReactNode;
  color: string;
}

const MediaTypeCard: React.FC<MediaTypeCardProps> = ({
  type,
  count,
  duration,
  icon,
  color,
}) => (
  <div className={`p-4 rounded-lg shadow-sm text-center ${color}`}>
    <div className="flex justify-center mb-2">{icon}</div>
    <p className="text-xl font-bold text-gray-900">{count}</p>
    <p className="text-sm text-gray-600">{type} Contributions</p>
    {duration !== undefined && duration > 0 && (
      <p className="text-xs text-gray-500 mt-1">
        {formatDuration(duration)} total
      </p>
    )}
  </div>
);

// Pagination Controls Component
interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // If total pages is less than or equal to max visible, show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page, last page, current page, and adjacent pages
      if (currentPage <= 3) {
        // Near the beginning
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Somewhere in the middle
        pages.push(1);
        pages.push('ellipsis');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-wrap items-center justify-center mt-4 sm:mt-6 gap-1 sm:gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border text-sm ${
          currentPage === 1
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
        }`}
      >
        Prev
      </button>

      {pageNumbers.map((page, index) => (
        <React.Fragment key={index}>
          {page === 'ellipsis' ? (
            <span className="px-2 py-1.5 sm:px-3 sm:py-2 text-gray-500 text-sm">
              ...
            </span>
          ) : (
            <button
              onClick={() => onPageChange(page as number)}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border text-sm ${
                currentPage === page
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
              }`}
            >
              {page}
            </button>
          )}
        </React.Fragment>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border text-sm ${
          currentPage === totalPages
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
        }`}
      >
        Next
      </button>
    </div>
  );
};

export default Profile;
