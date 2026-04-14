import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getPointsToday,
  getPointsStats,
  getStreakStatus,
  getGlobalLeaderboard,
  type DailyPoint,
  type PointsStats,
  type StreakStatus,
  type LeaderboardEntry,
  type LeaderboardResponse,
} from '../../../src/lib/points';

/**
 * Tests for src/lib/points.ts
 *
 * Tests the following:
 * - All async functions that interact with the backend API
 * - Interface/type structures
 * - Error handling for failed API calls
 * - Edge cases and boundary conditions
 */

// Mock the constants module
vi.mock('../../../src/lib/constants', () => ({
  BACKEND_URL: 'https://api.example.com',
}));

describe('points', () => {
  const mockToken = 'mock-auth-token';
  const mockUserIdentifier = 'user123';

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getPointsToday', () => {
    const mockPointsToday = 150;

    it('should return points today on successful response', async () => {
      const mockResponse = { points_today: mockPointsToday };
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await getPointsToday(mockToken);

      expect(result).toBe(mockPointsToday);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/points/today',
        {
          headers: { Authorization: `Bearer ${mockToken}` },
        },
      );
    });

    it('should return 0 when points_today is missing from response', async () => {
      const mockResponse = {};
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await getPointsToday(mockToken);

      expect(result).toBe(0);
    });

    it('should return 0 when points_today is null', async () => {
      const mockResponse = { points_today: null };
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await getPointsToday(mockToken);

      expect(result).toBe(0);
    });

    it('should throw error when API response is not ok', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(getPointsToday(mockToken)).rejects.toThrow(
        'Failed to fetch points today',
      );
    });

    it('should throw error on network failure', async () => {
      const mockFetch = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'));
      vi.stubGlobal('fetch', mockFetch);

      await expect(getPointsToday(mockToken)).rejects.toThrow('Network error');
    });

    it('should handle zero points correctly', async () => {
      const mockResponse = { points_today: 0 };
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await getPointsToday(mockToken);

      expect(result).toBe(0);
    });

    it('should handle large point values', async () => {
      const mockResponse = { points_today: 999999 };
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await getPointsToday(mockToken);

      expect(result).toBe(999999);
    });
  });

  describe('getPointsStats', () => {
    const mockStats: PointsStats = {
      total_points: 5000,
      points_today: 150,
      daily: [
        { date: '2024-01-01', points: 100 },
        { date: '2024-01-02', points: 150 },
        { date: '2024-01-03', points: 200 },
      ],
    };

    it('should return points stats on successful response', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats,
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await getPointsStats(mockToken, mockUserIdentifier);

      expect(result).toEqual(mockStats);
      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.example.com/points/stats/${mockUserIdentifier}`,
        {
          headers: { Authorization: `Bearer ${mockToken}` },
        },
      );
    });

    it('should handle empty daily array', async () => {
      const mockResponse: PointsStats = {
        total_points: 0,
        points_today: 0,
        daily: [],
      };
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await getPointsStats(mockToken, mockUserIdentifier);

      expect(result).toEqual(mockResponse);
      expect(result.daily).toEqual([]);
    });

    it('should handle stats with single day entry', async () => {
      const mockResponse: PointsStats = {
        total_points: 100,
        points_today: 100,
        daily: [{ date: '2024-01-01', points: 100 }],
      };
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await getPointsStats(mockToken, mockUserIdentifier);

      expect(result).toEqual(mockResponse);
      expect(result.daily).toHaveLength(1);
    });

    it('should throw error when API response is not ok', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(
        getPointsStats(mockToken, mockUserIdentifier),
      ).rejects.toThrow('Failed to fetch points stats');
    });

    it('should throw error on network failure', async () => {
      const mockFetch = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'));
      vi.stubGlobal('fetch', mockFetch);

      await expect(
        getPointsStats(mockToken, mockUserIdentifier),
      ).rejects.toThrow('Network error');
    });

    it('should handle different user identifiers', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats,
      });
      vi.stubGlobal('fetch', mockFetch);

      const identifiers = ['user123', 'user_456', 'test-user', '12345'];

      for (const identifier of identifiers) {
        vi.clearAllMocks();
        const newMockFetch = vi.fn().mockResolvedValueOnce({
          ok: true,
          json: async () => mockStats,
        });
        vi.stubGlobal('fetch', newMockFetch);

        await getPointsStats(mockToken, identifier);

        expect(newMockFetch).toHaveBeenCalledWith(
          `https://api.example.com/points/stats/${identifier}`,
          {
            headers: { Authorization: `Bearer ${mockToken}` },
          },
        );
      }
    });

    it('should validate DailyPoint interface structure', async () => {
      const mockResponse: PointsStats = {
        total_points: 300,
        points_today: 100,
        daily: [
          { date: '2024-01-01', points: 100 },
          { date: '2024-01-02', points: 100 },
          { date: '2024-01-03', points: 100 },
        ],
      };
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await getPointsStats(mockToken, mockUserIdentifier);

      // Validate each DailyPoint has required fields
      result.daily.forEach((day: DailyPoint) => {
        expect(day).toHaveProperty('date');
        expect(day).toHaveProperty('points');
        expect(typeof day.date).toBe('string');
        expect(typeof day.points).toBe('number');
      });
    });
  });

  describe('getStreakStatus', () => {
    const mockStreak: StreakStatus = {
      streak_multiplier: 1.5,
      streak_expires_at: '2024-12-31T23:59:59Z',
    };

    it('should return streak status on successful response', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockStreak,
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await getStreakStatus(mockToken);

      expect(result).toEqual(mockStreak);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/points/streak',
        {
          headers: { Authorization: `Bearer ${mockToken}` },
        },
      );
    });

    it('should handle null streak_expires_at', async () => {
      const mockResponse: StreakStatus = {
        streak_multiplier: 1.0,
        streak_expires_at: null,
      };
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await getStreakStatus(mockToken);

      expect(result).toEqual(mockResponse);
      expect(result.streak_expires_at).toBeNull();
    });

    it('should handle streak_multiplier of 1.0 (no multiplier)', async () => {
      const mockResponse: StreakStatus = {
        streak_multiplier: 1.0,
        streak_expires_at: '2024-12-31T23:59:59Z',
      };
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await getStreakStatus(mockToken);

      expect(result.streak_multiplier).toBe(1.0);
    });

    it('should handle high streak multiplier', async () => {
      const mockResponse: StreakStatus = {
        streak_multiplier: 3.0,
        streak_expires_at: '2024-12-31T23:59:59Z',
      };
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await getStreakStatus(mockToken);

      expect(result.streak_multiplier).toBe(3.0);
    });

    it('should handle zero streak multiplier', async () => {
      const mockResponse: StreakStatus = {
        streak_multiplier: 0,
        streak_expires_at: null,
      };
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await getStreakStatus(mockToken);

      expect(result.streak_multiplier).toBe(0);
    });

    it('should throw error when API response is not ok', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(getStreakStatus(mockToken)).rejects.toThrow(
        'Failed to fetch streak status',
      );
    });

    it('should throw error on network failure', async () => {
      const mockFetch = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'));
      vi.stubGlobal('fetch', mockFetch);

      await expect(getStreakStatus(mockToken)).rejects.toThrow('Network error');
    });

    it('should validate StreakStatus interface structure', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockStreak,
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await getStreakStatus(mockToken);

      expect(result).toHaveProperty('streak_multiplier');
      expect(result).toHaveProperty('streak_expires_at');
      expect(typeof result.streak_multiplier).toBe('number');
      expect(
        result.streak_expires_at === null ||
          typeof result.streak_expires_at === 'string',
      ).toBe(true);
    });
  });

  describe('getGlobalLeaderboard', () => {
    const mockLeaderboard: LeaderboardResponse = {
      leaderboard: [
        { user_id: 'user1', user_name: 'Alice', total_points: 1000, rank: 1 },
        { user_id: 'user2', user_name: 'Bob', total_points: 900, rank: 2 },
        { user_id: 'user3', user_name: 'Charlie', total_points: 800, rank: 3 },
      ],
      current_user_rank: {
        user_id: 'currentUser',
        user_name: 'CurrentUser',
        total_points: 500,
        rank: 10,
      },
    };

    it('should return global leaderboard on successful response', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockLeaderboard,
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await getGlobalLeaderboard(mockToken);

      expect(result).toEqual(mockLeaderboard);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/points/leaderboard/global',
        {
          headers: { Authorization: `Bearer ${mockToken}` },
        },
      );
    });

    it('should handle null current_user_rank', async () => {
      const mockResponse: LeaderboardResponse = {
        leaderboard: [
          { user_id: 'user1', user_name: 'Alice', total_points: 1000, rank: 1 },
        ],
        current_user_rank: null,
      };
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await getGlobalLeaderboard(mockToken);

      expect(result.current_user_rank).toBeNull();
      expect(result.leaderboard).toHaveLength(1);
    });

    it('should handle empty leaderboard', async () => {
      const mockResponse: LeaderboardResponse = {
        leaderboard: [],
        current_user_rank: null,
      };
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await getGlobalLeaderboard(mockToken);

      expect(result.leaderboard).toEqual([]);
      expect(result.current_user_rank).toBeNull();
    });

    it('should handle leaderboard with single entry', async () => {
      const mockResponse: LeaderboardResponse = {
        leaderboard: [
          { user_id: 'user1', user_name: 'Alice', total_points: 1000, rank: 1 },
        ],
        current_user_rank: {
          user_id: 'user1',
          user_name: 'Alice',
          total_points: 1000,
          rank: 1,
        },
      };
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await getGlobalLeaderboard(mockToken);

      expect(result.leaderboard).toHaveLength(1);
      expect(result.current_user_rank).toEqual(result.leaderboard[0]);
    });

    it('should validate LeaderboardEntry interface structure', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockLeaderboard,
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await getGlobalLeaderboard(mockToken);

      // Validate each leaderboard entry
      result.leaderboard.forEach((entry: LeaderboardEntry) => {
        expect(entry).toHaveProperty('user_id');
        expect(entry).toHaveProperty('user_name');
        expect(entry).toHaveProperty('total_points');
        expect(entry).toHaveProperty('rank');
        expect(typeof entry.user_id).toBe('string');
        expect(typeof entry.user_name).toBe('string');
        expect(typeof entry.total_points).toBe('number');
        expect(typeof entry.rank).toBe('number');
      });

      // Validate current_user_rank if present
      if (result.current_user_rank) {
        expect(result.current_user_rank).toHaveProperty('user_id');
        expect(result.current_user_rank).toHaveProperty('user_name');
        expect(result.current_user_rank).toHaveProperty('total_points');
        expect(result.current_user_rank).toHaveProperty('rank');
      }
    });

    it('should handle leaderboard entries with special characters in names', async () => {
      const mockResponse: LeaderboardResponse = {
        leaderboard: [
          {
            user_id: 'user1',
            user_name: "Alice O'Brien",
            total_points: 1000,
            rank: 1,
          },
          {
            user_id: 'user2',
            user_name: 'Bob 史密斯',
            total_points: 900,
            rank: 2,
          },
        ],
        current_user_rank: null,
      };
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await getGlobalLeaderboard(mockToken);

      expect(result.leaderboard[0].user_name).toBe("Alice O'Brien");
      expect(result.leaderboard[1].user_name).toBe('Bob 史密斯');
    });

    it('should handle large point values in leaderboard', async () => {
      const mockResponse: LeaderboardResponse = {
        leaderboard: [
          {
            user_id: 'user1',
            user_name: 'TopPlayer',
            total_points: 999999999,
            rank: 1,
          },
        ],
        current_user_rank: null,
      };
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await getGlobalLeaderboard(mockToken);

      expect(result.leaderboard[0].total_points).toBe(999999999);
    });

    it('should throw error when API response is not ok', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 403,
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(getGlobalLeaderboard(mockToken)).rejects.toThrow(
        'Failed to fetch global leaderboard',
      );
    });

    it('should throw error on network failure', async () => {
      const mockFetch = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'));
      vi.stubGlobal('fetch', mockFetch);

      await expect(getGlobalLeaderboard(mockToken)).rejects.toThrow(
        'Network error',
      );
    });
  });

  describe('API endpoint URLs', () => {
    it('should use correct endpoint for getPointsToday', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ points_today: 100 }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await getPointsToday(mockToken);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/points/today',
        expect.any(Object),
      );
    });

    it('should use correct endpoint for getPointsStats', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total_points: 0, points_today: 0, daily: [] }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await getPointsStats(mockToken, mockUserIdentifier);

      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.example.com/points/stats/${mockUserIdentifier}`,
        expect.any(Object),
      );
    });

    it('should use correct endpoint for getStreakStatus', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ streak_multiplier: 1.0, streak_expires_at: null }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await getStreakStatus(mockToken);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/points/streak',
        expect.any(Object),
      );
    });

    it('should use correct endpoint for getGlobalLeaderboard', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ leaderboard: [], current_user_rank: null }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await getGlobalLeaderboard(mockToken);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/points/leaderboard/global',
        expect.any(Object),
      );
    });
  });

  describe('Authorization headers', () => {
    it('should include Bearer token in getPointsToday request', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ points_today: 100 }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await getPointsToday(mockToken);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: { Authorization: `Bearer ${mockToken}` },
        }),
      );
    });

    it('should include Bearer token in getPointsStats request', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total_points: 0, points_today: 0, daily: [] }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await getPointsStats(mockToken, mockUserIdentifier);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: { Authorization: `Bearer ${mockToken}` },
        }),
      );
    });

    it('should include Bearer token in getStreakStatus request', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ streak_multiplier: 1.0, streak_expires_at: null }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await getStreakStatus(mockToken);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: { Authorization: `Bearer ${mockToken}` },
        }),
      );
    });

    it('should include Bearer token in getGlobalLeaderboard request', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ leaderboard: [], current_user_rank: null }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await getGlobalLeaderboard(mockToken);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: { Authorization: `Bearer ${mockToken}` },
        }),
      );
    });

    it('should handle different token formats', async () => {
      const tokens = [
        'simple-token',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0',
        'token-with-dashes-and_underscores123',
      ];

      for (const token of tokens) {
        vi.clearAllMocks();
        const mockFetch = vi.fn().mockResolvedValueOnce({
          ok: true,
          json: async () => ({ points_today: 100 }),
        });
        vi.stubGlobal('fetch', mockFetch);

        await getPointsToday(token);

        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: { Authorization: `Bearer ${token}` },
          }),
        );
      }
    });
  });
});
