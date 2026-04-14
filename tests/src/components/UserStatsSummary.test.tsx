import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import UserStatsSummary from '@/components/UserStatsSummary';
import { useAuth } from '@/hooks/useAuth';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);

describe('UserStatsSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner when isReady is false', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isReady: false,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
      refetchUser: vi.fn(),
    });

    const { container } = render(<UserStatsSummary />);

    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByText(/Streak/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Uploads/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Edits/i)).not.toBeInTheDocument();
  });

  it('shows loading spinner when user is null', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isReady: true,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
      refetchUser: vi.fn(),
    });

    const { container } = render(<UserStatsSummary />);

    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByText(/Streak/i)).not.toBeInTheDocument();
  });

  it('renders streak, uploads, and edits when user data is present', () => {
    mockUseAuth.mockReturnValue({
      user: {
        streaks: {
          combined_streak: {
            current: 5,
            longest: 10,
            total_active_days: 8,
          },
        },
        summary: {
          contributions: {
            total_contributions: 42,
            contributions_by_media_type: {
              text: 10,
              audio: 10,
              image: 10,
              video: 6,
              document: 6,
            },
          },
          edits: { total_edits: 17 },
          overall: { total_activities: 59 },
        },
      },
      isReady: true,
      token: 'token-123',
      login: vi.fn(),
      logout: vi.fn(),
      refetchUser: vi.fn(),
    });

    render(<UserStatsSummary />);

    expect(screen.getByText('5 days')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('17')).toBeInTheDocument();
  });

  it('falls back to 0 when streaks data is missing', () => {
    mockUseAuth.mockReturnValue({
      user: {
        streaks: undefined,
        summary: {
          contributions: {
            total_contributions: 10,
            contributions_by_media_type: {
              text: 5,
              audio: 5,
              image: 0,
              video: 0,
              document: 0,
            },
          },
          edits: { total_edits: 5 },
          overall: { total_activities: 15 },
        },
      },
      isReady: true,
      token: 'token-123',
      login: vi.fn(),
      logout: vi.fn(),
      refetchUser: vi.fn(),
    });

    render(<UserStatsSummary />);

    expect(screen.getByText('0 days')).toBeInTheDocument();
  });

  it('falls back to 0 when summary data is missing', () => {
    mockUseAuth.mockReturnValue({
      user: {
        streaks: {
          combined_streak: {
            current: 3,
            longest: 7,
            total_active_days: 5,
          },
        },
        summary: undefined,
      },
      isReady: true,
      token: 'token-123',
      login: vi.fn(),
      logout: vi.fn(),
      refetchUser: vi.fn(),
    });

    render(<UserStatsSummary />);

    expect(screen.getByText('3 days')).toBeInTheDocument();
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(2);
  });

  it('falls back to 0 when all stats are undefined', () => {
    mockUseAuth.mockReturnValue({
      user: {
        streaks: undefined,
        summary: undefined,
      },
      isReady: true,
      token: 'token-123',
      login: vi.fn(),
      logout: vi.fn(),
      refetchUser: vi.fn(),
    });

    render(<UserStatsSummary />);

    expect(screen.getByText('0 days')).toBeInTheDocument();
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(2);
  });

  it('does not show spinner when data is ready and user exists', () => {
    mockUseAuth.mockReturnValue({
      user: {
        streaks: {
          combined_streak: {
            current: 1,
            longest: 5,
            total_active_days: 3,
          },
        },
        summary: {
          contributions: {
            total_contributions: 1,
            contributions_by_media_type: {
              text: 1,
              audio: 0,
              image: 0,
              video: 0,
              document: 0,
            },
          },
          edits: { total_edits: 0 },
          overall: { total_activities: 1 },
        },
      },
      isReady: true,
      token: 'token-123',
      login: vi.fn(),
      logout: vi.fn(),
      refetchUser: vi.fn(),
    });

    render(<UserStatsSummary />);

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByText('1 days')).toBeInTheDocument();
  });
});
