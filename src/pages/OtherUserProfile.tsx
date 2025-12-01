import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, X } from 'lucide-react';
import { BACKEND_URL } from '@/lib/constants';

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
      };
      edits: {
        total_edits: number;
      };
      overall: {
        total_activities: number;
      };
    };
  }

  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const { userId } = useParams();

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
    if (userId) {
      fetchOtherUserProfile(userId);
      checkFollowStatus(userId);
      fetchFollowers(userId);
      fetchFollowing(userId);
    }
  }, [
    userId,
    fetchOtherUserProfile,
    checkFollowStatus,
    fetchFollowers,
    fetchFollowing,
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

        {/* Summary */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">
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

        {/* Streaks */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">
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

        {/* Followers and Following Section */}
        <section className="mt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">
            Followers & Following
          </h2>
          <div className="flex justify-around items-center py-4">
            <div
              className="text-center cursor-pointer hover:bg-gray-50 p-4 rounded-lg transition-colors"
              onClick={() => {
                fetchFollowers(userId!);
                setShowFollowersModal(true);
              }}
            >
              <div className="text-3xl font-bold text-blue-600">
                {followersCount}
              </div>
              <div className="text-gray-600">Followers</div>
            </div>

            <div
              className="text-center cursor-pointer hover:bg-gray-50 p-4 rounded-lg transition-colors"
              onClick={() => {
                fetchFollowing(userId!);
                setShowFollowingModal(true);
              }}
            >
              <div className="text-3xl font-bold text-blue-600">
                {followingCount}
              </div>
              <div className="text-gray-600">Following</div>
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
      />
      <FollowingModal
        isOpen={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
        following={following}
        loading={loadingFollowing}
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
  following: User[];
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

export default OtherUserProfile;
