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
  Eye,
  History,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { BACKEND_URL } from '@/lib/constants';
import { formatDuration, formatSizeMB, getISTDate } from '@/lib/utils';

// interface FormattedUserProfile{
//     id: string,
//     name: string
//     streaks: Object,
//     timeline: Object,
//     summary: Object,

// }

interface FollowedUser {
  id?: string;
  user_id?: string;
}

function OtherUserProfile() {
  const navigate = useNavigate();
  interface UserProfileData {
    id: string;
    name: string;
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

  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [contributions, setContributions] = useState<UserContributions | null>(
    null,
  );
  const [contributionsLoading, setContributionsLoading] =
    useState<boolean>(false);

  // States for dashboard functionality
  const [selectedMediaType, setSelectedMediaType] = useState<
    'text' | 'audio' | 'video' | 'image' | 'document' | null
  >(null);
  const [showDashboard, setShowDashboard] = useState(true);

  const { userId } = useParams();

  // State for current user ID
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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
      return userData.id;
    } catch (err) {
      console.error('Error getting current user ID:', err);
      return null;
    }
  }, [getAuthToken]);

  // Function to fetch user contributions by media type
  const fetchUserContributions = useCallback(
    async (
      currentUserId: string,
      mediaType: 'text' | 'audio' | 'video' | 'image' | 'document' | undefined,
    ) => {
      setContributionsLoading(true);

      try {
        const token = getAuthToken();
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

  const fetchOtherUserProfile = useCallback(
    async (userId: string) => {
      setLoading(false);
      setError(null);

      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error('No Authentication token available');
        }

        const apiUrl =
          BACKEND_URL +
          `/users/${userId}/profile?include=streaks,timeline,summary&days=30`;
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
        const userData = await response.json();
        const formattedProfile = {
          id: userData.user_id,
          name: userData.user_name || 'Unknown User',
          streaks: userData.streaks,
          timeline: userData.timeline,
          summary: userData.summary,
        };
        console.log(formattedProfile);

        setProfile(formattedProfile);
      } catch (err) {
        console.error('Error fetching other users profile', err);
        setError(err instanceof Error ? err.message : 'Error caught in Catch');
      } finally {
        setLoading(false);
      }
    },
    [getAuthToken],
  ); // Added getAuthToken to dependencies

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
  const checkFollowStatus = useCallback(
    async (profileUserId: string) => {
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
          const isUserBeingFollowed = followingList.some(
            (user: FollowedUser) =>
              user.id === profileUserId || user.user_id === profileUserId,
          );
          setIsFollowing(isUserBeingFollowed);
        }
      } catch (err) {
        console.error('Error checking follow status:', err);
      }
    },
    [getAuthToken], // Removed BACKEND_URL as it's an outer scope value
  );

  // Function to follow a user
  const followUser = async (targetUserId: string) => {
    setFollowLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No Authentication token available');
      }

      const response = await fetch(
        `${BACKEND_URL}/users/${targetUserId}/follow`,
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
        fetchOtherUserProfile(targetUserId);
        // Refetch followers and following data to keep them updated
        fetchFollowers(targetUserId);
        fetchFollowing(targetUserId);
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
  const unfollowUser = async (targetUserId: string) => {
    setFollowLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No Authentication token available');
      }

      const response = await fetch(
        `${BACKEND_URL}/users/${targetUserId}/follow`,
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
        fetchOtherUserProfile(targetUserId);
        // Refetch followers and following data to keep them updated
        fetchFollowers(targetUserId);
        fetchFollowing(targetUserId);
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
    async (targetUserId: string) => {
      setLoadingFollowers(true);
      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error('No Authentication token available');
        }

        const response = await fetch(
          `${BACKEND_URL}/users/${targetUserId}/followers`,
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
    async (targetUserId: string) => {
      setLoadingFollowing(true);
      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error('No Authentication token available');
        }

        const response = await fetch(
          `${BACKEND_URL}/users/${targetUserId}/following`,
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

  // Effect for initial data fetch
  useEffect(() => {
    const loadInitialData = async () => {
      if (userId) {
        // Get current user ID first
        const currentId = await getCurrentUserId();
        setCurrentUserId(currentId);

        // Then load other data
        fetchOtherUserProfile(userId);
        checkFollowStatus(userId);
        fetchFollowers(userId);
        fetchFollowing(userId);

        // Fetch contributions based on view
        if (showDashboard) {
          fetchUserContributions(userId, undefined);
        } else if (selectedMediaType) {
          fetchUserContributions(userId, selectedMediaType);
        }
      }
    };

    loadInitialData();
  }, [
    userId,
    fetchOtherUserProfile,
    checkFollowStatus,
    fetchFollowers,
    fetchFollowing,
    getCurrentUserId,
    showDashboard,
    selectedMediaType,
    fetchUserContributions,
  ]); // Include all functions used in the effect

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                navigate('/');
              }}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              title="Go Back"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
              {getInitials(profile?.name)}
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {profile?.name}
              </h1>
              <p className="text-gray-600 text-sm">@{profile?.id}</p>
            </div>
            <div className="ml-auto">
              <button
                onClick={() => {
                  if (isFollowing) {
                    unfollowUser(userId!);
                  } else {
                    followUser(userId!);
                  }
                }}
                disabled={followLoading}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isFollowing
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } disabled:opacity-50`}
              >
                {followLoading
                  ? 'Processing...'
                  : isFollowing
                    ? 'Unfollow'
                    : 'Follow'}
              </button>
            </div>
          </div>
        </div>

        {/* Followers and Following Section */}
        <section className="mb-6">
          <div className="flex justify-around items-center py-2">
            <div
              className="flex-1 text-center cursor-pointer bg-gray-100 py-3 rounded-lg transition-colors hover:bg-gray-200 mx-2"
              onClick={() => {
                fetchFollowers(userId!);
                setShowFollowersModal(true);
              }}
            >
              <div className="text-xl font-bold text-gray-800">
                {followersCount}
              </div>
              <div className="text-xs text-gray-600 mt-1">Followers</div>
            </div>

            <div
              className="flex-1 text-center cursor-pointer bg-gray-100 py-3 rounded-lg transition-colors hover:bg-gray-200 mx-2"
              onClick={() => {
                fetchFollowing(userId!);
                setShowFollowingModal(true);
              }}
            >
              <div className="text-xl font-bold text-gray-800">
                {followingCount}
              </div>
              <div className="text-xs text-gray-600 mt-1">Following</div>
            </div>
          </div>
        </section>

        {/* Summary */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-center text-gray-800 mb-4 uppercase tracking-wide font-sans border-b pb-2">
            Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Total Contributions</p>
              <p className="text-xl font-bold text-blue-600">
                {profile?.summary?.contributions?.total_contributions ?? 0}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Total Edits</p>
              <p className="text-xl font-bold text-blue-600">
                {profile?.summary?.edits?.total_edits ?? 0}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Total Activities</p>
              <p className="text-xl font-bold text-blue-600">
                {profile?.summary?.overall?.total_activities ?? 0}
              </p>
            </div>
          </div>
        </section>

        {/* Contribution Section with Dashboard and View All Files */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-center text-gray-800 mb-4 uppercase tracking-wide font-sans border-b pb-2">
            Contributions
          </h2>

          <div className="flex justify-center mb-6">
            <button
              onClick={() => {
                setShowDashboard(true);
                setContributions(null); // Clear contributions when switching to dashboard
              }}
              className={`px-6 py-2 rounded-l-lg font-medium transition-colors ${
                showDashboard
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => {
                setShowDashboard(false);
                setContributions(null); // Clear contributions when switching to detailed view
                // The effect will trigger a fetch for the current selectedMediaType
              }}
              className={`px-6 py-2 rounded-r-lg font-medium transition-colors ${
                !showDashboard
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              View All Files
            </button>
          </div>

          {showDashboard ? (
            <div>
              {contributionsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading dashboard...</p>
                </div>
              ) : (
                <div>
                  {/* Daily Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <DashboardCard
                      icon={<TrendingUp size={20} className="text-green-600" />}
                      title="Total Uploads"
                      value={contributions?.totalContributions || 0}
                      unit="files"
                      color="bg-green-50"
                    />
                    <DashboardCard
                      icon={<Award size={20} className="text-purple-600" />}
                      title="Total Hours Contributed"
                      value={formatDuration(
                        (contributions?.audioDuration || 0) +
                          (contributions?.videoDuration || 0),
                      )}
                      color="bg-purple-50"
                    />
                    <DashboardCard
                      icon={<Zap size={20} className="text-yellow-600" />}
                      title="Contribution Streak"
                      value={profile?.streaks?.combined_streak?.current || 0}
                      unit="days"
                      color="bg-yellow-50"
                    />
                    <DashboardCard
                      icon={<Activity size={20} className="text-blue-600" />}
                      title="Uploads Today"
                      value={calculateUploadsToday()}
                      unit="files"
                      color="bg-blue-50"
                    />
                  </div>

                  {/* Contributions by Media Type */}
                  <div className="bg-gray-50 rounded-lg shadow-sm p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Contributions by Media Type
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                      <MediaTypeCard
                        type="Text"
                        count={contributions?.contributionsByType.text || 0}
                        icon={<Activity size={20} className="text-blue-600" />}
                        color="bg-blue-50"
                      />
                      <MediaTypeCard
                        type="Document"
                        count={contributions?.contributionsByType.document || 0}
                        icon={<BarChart size={20} className="text-red-600" />}
                        color="bg-red-50"
                      />
                      <MediaTypeCard
                        type="Image"
                        count={contributions?.contributionsByType.image || 0}
                        icon={<Award size={20} className="text-orange-600" />}
                        color="bg-orange-50"
                      />
                      <MediaTypeCard
                        type="Audio"
                        count={contributions?.contributionsByType.audio || 0}
                        duration={contributions?.audioDuration || 0}
                        icon={
                          <TrendingUp size={20} className="text-green-600" />
                        }
                        color="bg-green-50"
                      />
                      <MediaTypeCard
                        type="Video"
                        count={contributions?.contributionsByType.video || 0}
                        duration={contributions?.videoDuration || 0}
                        icon={
                          <Calendar size={20} className="text-purple-600" />
                        }
                        color="bg-purple-50"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              {/* Media type selector */}
              <div className="flex justify-center gap-4 my-4">
                {(['text', 'document', 'image', 'audio', 'video'] as const).map(
                  (type) => (
                    <ContributionTypeButton
                      key={type}
                      type={type}
                      selectedMediaType={selectedMediaType}
                      setSelectedMediaType={(newType) => {
                        setSelectedMediaType(newType);
                        if (userId) {
                          fetchUserContributions(userId, newType);
                        }
                      }}
                    />
                  ),
                )}
              </div>
              {/* Modernized display of contributions for selected media type */}
              <div className="max-w-2xl mx-auto">
                {selectedMediaType && ( // Only render ContributionsList if a media type is selected
                  <ContributionsList
                    contributions={contributions}
                    selectedMediaType={selectedMediaType}
                    token={getAuthToken()}
                  />
                )}
                {!selectedMediaType && !contributionsLoading && (
                  <div className="text-center text-gray-400 py-8 text-lg font-medium">
                    Please select a media type to view contributions.
                  </div>
                )}
                {contributionsLoading && !selectedMediaType && (
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
        </section>

        {/* Streaks */}
        <section>
          <h2 className="text-lg font-semibold text-center text-gray-800 mb-4 uppercase tracking-wide font-sans border-b pb-2">
            Streaks
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Current Streak</p>
              <p className="text-xl font-bold text-green-600">
                {profile?.streaks?.combined_streak?.current ?? 0}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Longest Streak</p>
              <p className="text-xl font-bold text-green-600">
                {profile?.streaks?.combined_streak?.longest ?? 0}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Total Active Days</p>
              <p className="text-xl font-bold text-green-600">
                {profile?.streaks?.combined_streak?.total_active_days ?? 0}
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Followers and Following Modals */}
      <FollowersModal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        followers={followers}
        loading={loadingFollowers}
        currentUserId={currentUserId}
      />
      <FollowingModal
        isOpen={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
        following={following}
        loading={loadingFollowing}
        currentUserId={currentUserId}
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
}> = ({ isOpen, onClose, followers, loading, currentUserId }) => {
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
              {followers.map((follower) => {
                const userId = follower.id || follower.user_id;
                const isCurrentUser = userId === currentUserId;

                return (
                  <li
                    key={userId}
                    className="p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      if (isCurrentUser) {
                        window.location.href = '/myprofile';
                      } else {
                        window.location.href = `/userprofile/${userId}`;
                      }
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
}> = ({ isOpen, onClose, following, loading, currentUserId }) => {
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
              {following.map((followedUser) => {
                const userId = followedUser.id || followedUser.user_id;
                const isCurrentUser = userId === currentUserId;

                return (
                  <li
                    key={userId}
                    className="p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      if (isCurrentUser) {
                        window.location.href = '/myprofile';
                      } else {
                        window.location.href = `/userprofile/${userId}`;
                      }
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
  selectedMediaType: 'text' | 'audio' | 'video' | 'image' | 'document' | null;
  token: string;
}

const ContributionsList: React.FC<ContributionsListProps> = ({
  contributions,
  selectedMediaType,
  token,
}) => {
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
      {items.map((item, idx) => (
        <li
          key={item.id}
          className="flex flex-col py-4 px-2 rounded-lg transition hover:bg-gray-50"
        >
          <div className="flex gap-2">
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold
                ${selectedMediaType === 'text' && 'bg-blue-100 text-blue-700'}
                ${
                  selectedMediaType === 'audio' && 'bg-green-100 text-green-700'
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
                  'bg-yellow-100 text-yellow-700'
                }
              `}
            >
              {capitalize(selectedMediaType)}
            </span>
            <span className="ml-2 text-base font-semibold text-gray-900">
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
                  <span className="font-semibold mr-1 italic">Timestamp:</span>{' '}
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
                    <span className="font-semibold mr-1 italic">Duration:</span>{' '}
                    {item.duration ? formatDuration(item.duration) : '-'}
                  </span>
                ) : null}
                {/* Display language */}
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium text-xs border border-gray-300 whitespace-nowrap min-w-[60px] max-w-full overflow-x-auto italic">
                  <span className="font-semibold mr-1 italic">Language:</span>{' '}
                  {item.language || 'N/A'}
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
                onClick={() => toggleHistoryVisibility(item.id)}
                className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-100 rounded-full transition-colors"
                title="View Edit History"
              >
                <History size={18} />
              </button>
            </div>
          </div>

          {/* NEW: Conditionally render the inline history component */}
          {historyVisibleItemId === item.id && (
            <InlineEditHistory recordId={item.id} token={token} />
          )}
        </li>
      ))}
    </ul>
  );
};

// Secure view button component
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
      // toast.error(
      //   `Error: ${err instanceof Error ? err.message : 'Could not load file.'}`,
      // );
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

// NEW: Component to show edit history inline
interface InlineEditHistoryProps {
  recordId: string;
  token: string;
}

const InlineEditHistory: React.FC<InlineEditHistoryProps> = ({
  recordId,
  token,
}) => {
  const [history, setHistory] = useState<EditHistoryEntry[]>([]);
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
                    <ChevronDown size={20} />
                  ) : (
                    <ChevronUp size={20} />
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
                              ([field, change]) => (
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

export default OtherUserProfile;
