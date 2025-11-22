import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BACKEND_URL } from '@/lib/constants';

// interface FormattedUserProfile{
//     id: string,
//     name: string
//     streaks: Object,
//     timeline: Object,
//     summary: Object,

// }

function OtherUserProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const { userId } = useParams();

  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  const fetchOtherUserProfile = useCallback(async (userId: string) => {
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
  }, []);

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  useEffect(() => {
    if (userId) fetchOtherUserProfile(userId);
  }, [userId, fetchOtherUserProfile]);

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
      </div>
    </div>
  );
}

export default OtherUserProfile;
