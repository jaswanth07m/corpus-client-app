import { BACKEND_URL } from './constants';

export interface DailyPoint {
  date: string;
  points: number;
}
export interface PointsStats {
  total_points: number;
  points_today: number;
  daily: DailyPoint[];
}

export interface StreakStatus {
  streak_multiplier: number;
  streak_expires_at: string | null;
}

export interface LeaderboardEntry {
  user_id: string;
  user_name: string;
  total_points: number;
  rank: number;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  current_user_rank: LeaderboardEntry | null;
}

export const getPointsToday = async (token: string): Promise<number> => {
  const res = await fetch(`${BACKEND_URL}/points/today`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch points today');
  const data = await res.json();
  return data.points_today ?? 0;
};

export const getPointsStats = async (
  token: string,
  userIdentifier: string,
): Promise<PointsStats> => {
  const res = await fetch(`${BACKEND_URL}/points/stats/${userIdentifier}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch points stats');
  return res.json();
};

export const getStreakStatus = async (token: string): Promise<StreakStatus> => {
  const res = await fetch(`${BACKEND_URL}/points/streak`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch streak status');
  return res.json();
};

export const getGlobalLeaderboard = async (
  token: string,
): Promise<LeaderboardResponse> => {
  const res = await fetch(`${BACKEND_URL}/points/leaderboard/global`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch global leaderboard');
  return res.json();
};
