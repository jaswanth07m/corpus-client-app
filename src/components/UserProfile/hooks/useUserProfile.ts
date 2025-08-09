import { useState, useEffect, useCallback } from 'react';
import { UserProfile, DailyStats, UserContributions } from '../types';
import { BACKEND_URL } from '@/lib/constants';
import { getAuthToken, decodeUserIdFromToken } from '@/lib/auth';

export const useUserProfile = (userId?: string) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [contributions, setContributions] = useState<UserContributions | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }

    const currentUserId = userId || decodeUserIdFromToken(token);
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    const userProfileUrl = `${BACKEND_URL}/users/${currentUserId}`;

    const profileRes = await fetch(userProfileUrl, { headers });

    const [statsRes, contributionsRes] = await Promise.all([
      fetch(`${BACKEND_URL}/auth/me`, { headers }),
      fetch(`${BACKEND_URL}/users/${currentUserId}/contributions`, { headers }),
    ]);

    const profileData = await profileRes.json();
    const statsData = await statsRes.json();
    const contributionsData = await contributionsRes.json();

    setProfile(profileData);
    setDailyStats(statsData.data);
    setContributions(contributionsData);

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  return {
    profile,
    dailyStats,
    contributions,
    loading,
    error,
    refetch: fetchAllData,
  };
};
