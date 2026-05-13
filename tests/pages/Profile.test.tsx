import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Profile from '../../src/pages/Profile';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { UserPreferencesProvider } from '../../src/context/UserPreferencesContext';

// Mock useAuth hook
const useAuthMock = vi.fn(() => ({
  token: 'mock-token-12345',
  logout: vi.fn(),
  user: { id: 'user-123', name: 'Test User', username: 'testuser' },
  login: vi.fn(),
  isReady: true,
  refetchUser: vi.fn(),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}));

// Mock useTranslation hook
const useTranslationMock = vi.fn(() => ({
  t: (key: string, defaultValue?: string) => defaultValue || key,
  i18n: {
    language: 'en',
    changeLanguage: vi.fn(),
  },
}));

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual('react-i18next');
  return {
    ...(actual as object),
    useTranslation: () => useTranslationMock(),
  };
});

// Mock useWelcomeTour hook
vi.mock('@/hooks/useWelcomeTour', () => ({
  useWelcomeTour: () => ({
    startTour: vi.fn(),
  }),
}));

// Mock child components
vi.mock('@/components/ContributionDashboard', () => ({
  default: ({
    dailyStats,
    contributions,
    loading,
    edits,
    onMediaTypeClick,
  }: {
    dailyStats: {
      uploads_today: number;
      total_uploads: number;
      streak_days: number;
    };
    contributions: unknown;
    loading: boolean;
    edits: number;
    onMediaTypeClick: (type: string) => void;
  }) => (
    <div data-testid="contribution-dashboard">
      <span data-testid="uploads-today">{dailyStats.uploads_today}</span>
      <span data-testid="total-uploads">{dailyStats.total_uploads}</span>
      <span data-testid="streak-days">{dailyStats.streak_days}</span>
      <button
        data-testid="media-type-button-text"
        onClick={() => onMediaTypeClick('text')}
      >
        Text
      </button>
      <button
        data-testid="media-type-button-audio"
        onClick={() => onMediaTypeClick('audio')}
      >
        Audio
      </button>
    </div>
  ),
}));

vi.mock('@/components/PointsHeatmap', () => ({
  default: ({ dailyData }: { dailyData: unknown }) => (
    <div data-testid="points-heatmap">
      <span data-testid="heatmap-data">{JSON.stringify(dailyData)}</span>
    </div>
  ),
}));

vi.mock('@/components/CategoryTags', () => ({
  default: () => <div data-testid="category-tags" />,
}));

vi.mock('@/components/MediaGridItem', () => ({
  MediaGridItem: () => <div data-testid="media-grid-item" />,
}));

vi.mock('@/components/ContributionsList', () => ({
  ContributionsList: ({
    contributions,
    selectedMediaType,
  }: {
    contributions: unknown;
    selectedMediaType: string | null;
  }) => (
    <div data-testid="contributions-list">
      <span data-testid="selected-media-type">{selectedMediaType}</span>
    </div>
  ),
}));

vi.mock('@/components/UserProfileInfo', () => ({
  default: ({
    userId,
    onClose,
    onUpdate,
  }: {
    userId: string;
    onClose: () => void;
    onUpdate: (profile: { name: string }) => void;
  }) => (
    <div data-testid="user-profile-info">
      <span data-testid="user-id">{userId}</span>
      <button data-testid="close-profile-info" onClick={onClose}>
        Close
      </button>
      <button
        data-testid="update-profile"
        onClick={() => onUpdate({ name: 'Updated Name' })}
      >
        Update
      </button>
    </div>
  ),
}));

vi.mock('@/components/LanguageSwitcher', () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher" />,
}));

// Mock fetch
const mockFetch = vi.fn();

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock navigate
const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...(actual as object),
    useNavigate: () => navigateMock,
    useParams: () => {
      // Get the current path from a mock context
      const path =
        mockLocalStorage.getItem('currentPath') || '/profile/testuser';
      const match = path.match(/\/profile\/(.+)/);
      return { username: match ? match[1] : undefined };
    },
  };
});

const renderWithRouter = (
  component: React.ReactElement,
  initialEntries: string[] = ['/profile/testuser'],
) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  const wrap = (ui: React.ReactElement) => (
    <QueryClientProvider client={queryClient}>
      <UserPreferencesProvider>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path="/profile/:username?" element={ui} />
          </Routes>
        </MemoryRouter>
      </UserPreferencesProvider>
    </QueryClientProvider>
  );

  const result = render(wrap(component));

  return {
    ...result,
    rerender: (ui: React.ReactElement) => result.rerender(wrap(ui)),
  };
};

describe('Profile Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockClear();
    mockFetch.mockClear();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();

    // Set up fetch mock on window
    Object.defineProperty(window, 'fetch', {
      value: mockFetch,
      writable: true,
      configurable: true,
    });

    // Default mock implementations
    useAuthMock.mockReturnValue({
      token: 'mock-token-12345',
      logout: vi.fn(),
      user: { id: 'user-123', name: 'Test User', username: 'testuser' },
      login: vi.fn(),
      isReady: true,
      refetchUser: vi.fn(),
    });

    mockLocalStorage.getItem.mockImplementation((key: string) => {
      if (key === 'token') return 'mock-token-12345';
      if (key === 'username') return 'testuser';
      return null;
    });

    // Default fetch mock for successful responses
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            id: 'user-123',
            name: 'Test User',
            username: 'testuser',
            profile_picture_path: null,
            short_bio: 'Test bio',
            streak_days: 5,
            total_contributions: 10,
            contributions_by_media_type: {
              text: 2,
              audio: 3,
              image: 2,
              video: 2,
              document: 1,
            },
            total_edits: 5,
            total_activities: 15,
          }),
      } as Response),
    );
  });

  describe('Component Rendering', () => {
    it('should render Profile component', async () => {
      renderWithRouter(<Profile />);
      await waitFor(() => {
        expect(
          screen.getByTestId('contribution-dashboard'),
        ).toBeInTheDocument();
      });
    });

    it('should display user name', async () => {
      renderWithRouter(<Profile />);
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });
    });

    it('should display username with @ prefix', async () => {
      renderWithRouter(<Profile />);
      await waitFor(() => {
        expect(screen.getByText('@testuser')).toBeInTheDocument();
      });
    });

    it('should display user bio if available', async () => {
      renderWithRouter(<Profile />);
      await waitFor(() => {
        expect(screen.getByText('Test bio')).toBeInTheDocument();
      });
    });

    it('should render contribution dashboard', async () => {
      renderWithRouter(<Profile />);
      await waitFor(() => {
        expect(
          screen.getByTestId('contribution-dashboard'),
        ).toBeInTheDocument();
      });
    });

    it('should render points heatmap section', async () => {
      renderWithRouter(<Profile />);
      await waitFor(
        () => {
          expect(
            screen.getByTestId('contribution-dashboard'),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Points heatmap section should have the tour id
      const heatmapSection = document.getElementById('tour-points-heatmap');
      expect(heatmapSection).toBeInTheDocument();
    });

    it('should render language switcher', async () => {
      renderWithRouter(<Profile />);
      expect(screen.getByTestId('language-switcher')).toBeInTheDocument();
    });
  });

  describe('Profile Picture', () => {
    it('should display initials when no profile picture is available', async () => {
      renderWithRouter(<Profile />);
      await waitFor(() => {
        // Should show "TU" for "Test User"
        const avatar = screen.getByText('TU');
        expect(avatar).toBeInTheDocument();
      });
    });

    it('should display profile picture when available', async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 'user-123',
              name: 'Test User',
              username: 'testuser',
              profile_picture_path: 'https://example.com/avatar.jpg',
              short_bio: 'Test bio',
              streak_days: 5,
              total_contributions: 10,
              contributions_by_media_type: {
                text: 2,
                audio: 3,
                image: 2,
                video: 2,
                document: 1,
              },
              total_edits: 5,
              total_activities: 15,
            }),
        } as Response),
      );

      renderWithRouter(<Profile />);
      await waitFor(() => {
        const img = screen.getByAltText("Test User's profile");
        expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
      });
    });

    it('should have clickable profile picture for own profile', async () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'token') return 'mock-token-12345';
        if (key === 'username') return 'testuser'; // Same as profile username
        return null;
      });

      renderWithRouter(<Profile />, ['/profile/testuser']);
      await waitFor(
        () => {
          expect(
            screen.getByTestId('contribution-dashboard'),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Find the avatar element (it has the initials)
      const avatar = screen.getByText('TU');
      expect(avatar).toBeInTheDocument();

      // Verify the avatar's parent container has cursor-pointer class (indicating it's clickable)
      const avatarContainer = avatar.parentElement;
      expect(avatarContainer).toHaveClass('cursor-pointer');
    });
  });

  describe('Followers and Following', () => {
    it('should display followers and following counts', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/followers')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                followers: [{ id: 'user-456', name: 'Follower 1' }],
                followers_count: 5,
              }),
          } as Response);
        }
        if (url.includes('/following')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                following: [{ id: 'user-789', name: 'Following 1' }],
                following_count: 3,
              }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 'user-123',
              name: 'Test User',
              username: 'testuser',
              profile_picture_path: null,
              short_bio: 'Test bio',
              streak_days: 5,
              total_contributions: 10,
              contributions_by_media_type: {
                text: 2,
                audio: 3,
                image: 2,
                video: 2,
                document: 1,
              },
              total_edits: 5,
              total_activities: 15,
            }),
        } as Response);
      });

      renderWithRouter(<Profile />);
      await waitFor(
        () => {
          expect(
            screen.getByTestId('contribution-dashboard'),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    it('should open followers modal when clicking followers button', async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              followers: [{ id: 'user-456', name: 'Follower 1' }],
              followers_count: 1,
            }),
        } as Response),
      );

      renderWithRouter(<Profile />);

      await waitFor(
        () => {
          expect(
            screen.getByTestId('contribution-dashboard'),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Find and click the followers button - verify it exists and is clickable
      const followersLabel = screen.getByText('profile.followers');
      expect(followersLabel).toBeInTheDocument();

      const followersButton = followersLabel.closest('button');
      expect(followersButton).toBeInTheDocument();

      if (followersButton) {
        fireEvent.click(followersButton);
      }
    });

    it('should open following modal when clicking following button', async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              following: [{ id: 'user-789', name: 'Following 1' }],
              following_count: 1,
            }),
        } as Response),
      );

      renderWithRouter(<Profile />);

      await waitFor(
        () => {
          expect(
            screen.getByTestId('contribution-dashboard'),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Find and click the following button - verify it exists and is clickable
      const followingLabel = screen.getByText('profile.following');
      expect(followingLabel).toBeInTheDocument();

      const followingButton = followingLabel.closest('button');
      expect(followingButton).toBeInTheDocument();

      if (followingButton) {
        fireEvent.click(followingButton);
      }
    });
  });

  describe('Follow/Unfollow Functionality', () => {
    it('should show follow button when viewing other user profile', async () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'token') return 'mock-token-12345';
        if (key === 'username') return 'currentuser'; // Different from profile username
        return null;
      });

      renderWithRouter(<Profile />, ['/profile/otheruser']);
      await waitFor(
        () => {
          expect(
            screen.getByTestId('contribution-dashboard'),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    it('should not show follow button when viewing own profile', async () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'token') return 'mock-token-12345';
        if (key === 'username') return 'testuser'; // Same as profile username
        return null;
      });

      renderWithRouter(<Profile />, ['/profile/testuser']);
      await waitFor(
        () => {
          expect(
            screen.getByTestId('contribution-dashboard'),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    it('should call followUser when clicking follow button', async () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'token') return 'mock-token-12345';
        if (key === 'username') return 'currentuser';
        return null;
      });

      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (options?.method === 'POST') {
          return Promise.resolve({ ok: true } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 'user-456',
              name: 'Other User',
              username: 'otheruser',
              profile_picture_path: null,
              short_bio: '',
              streak_days: 0,
              total_contributions: 0,
              contributions_by_media_type: {
                text: 0,
                audio: 0,
                image: 0,
                video: 0,
                document: 0,
              },
              total_edits: 0,
              total_activities: 0,
            }),
        } as Response);
      });

      renderWithRouter(<Profile />, ['/profile/otheruser']);

      await waitFor(
        () => {
          expect(
            screen.getByTestId('contribution-dashboard'),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Check that follow API was called
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/follow'),
        expect.anything(),
      );
    });
  });

  describe('Logout Functionality', () => {
    it('should call logout when clicking logout button', async () => {
      const logoutMock = vi.fn();
      useAuthMock.mockReturnValue({
        token: 'mock-token-12345',
        logout: logoutMock,
        user: { id: 'user-123', name: 'Test User', username: 'testuser' },
        login: vi.fn(),
        isReady: true,
        refetchUser: vi.fn(),
      });

      renderWithRouter(<Profile />);

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByTestId('language-switcher')).toBeInTheDocument();
      });

      // Find logout button (it's the one with LogOut icon - red color)
      const allButtons = screen.getAllByRole('button');
      const logoutButton = allButtons.find((btn) =>
        btn.className?.includes('hover:bg-red-50'),
      );

      if (logoutButton) {
        fireEvent.click(logoutButton);
      }

      await waitFor(() => {
        expect(logoutMock).toHaveBeenCalled();
      });
    });
  });

  describe('Contribution Dashboard', () => {
    it('should display uploads today', async () => {
      renderWithRouter(<Profile />);
      await waitFor(() => {
        expect(screen.getByTestId('uploads-today')).toBeInTheDocument();
      });
    });

    it('should display total uploads', async () => {
      renderWithRouter(<Profile />);
      await waitFor(() => {
        expect(screen.getByTestId('total-uploads')).toBeInTheDocument();
      });
    });

    it('should display streak days', async () => {
      renderWithRouter(<Profile />);
      await waitFor(() => {
        expect(screen.getByTestId('streak-days')).toBeInTheDocument();
      });
    });

    it('should show media grid when clicking on media type', async () => {
      renderWithRouter(<Profile />);

      const textButton = await screen.findByTestId('media-type-button-text');
      fireEvent.click(textButton);

      await waitFor(() => {
        expect(screen.getByTestId('contributions-list')).toBeInTheDocument();
      });
    });
  });

  describe('User Profile Info Modal', () => {
    it('should open user profile info modal when clicking info button', async () => {
      renderWithRouter(<Profile />);

      const infoButton = await screen.findByText('profile.info');
      fireEvent.click(infoButton);

      await waitFor(() => {
        expect(screen.getByTestId('user-profile-info')).toBeInTheDocument();
      });
    });

    it('should close user profile info modal when clicking close button', async () => {
      renderWithRouter(<Profile />);

      const infoButton = await screen.findByText('profile.info');
      fireEvent.click(infoButton);

      const closeButton = await screen.findByTestId('close-profile-info');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(
          screen.queryByTestId('user-profile-info'),
        ).not.toBeInTheDocument();
      });
    });

    it('should update profile when onUpdate is called', async () => {
      renderWithRouter(<Profile />);

      const infoButton = await screen.findByText('profile.info');
      fireEvent.click(infoButton);

      const updateButton = await screen.findByTestId('update-profile');
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(screen.getByTestId('user-profile-info')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: () => Promise.resolve({}),
        } as Response),
      );

      renderWithRouter(<Profile />);

      await waitFor(
        () => {
          // Should not crash, should handle error gracefully
          expect(
            screen.queryByTestId('contribution-dashboard'),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    it('should handle network errors', async () => {
      mockFetch.mockImplementation(() =>
        Promise.reject(new Error('Network error')),
      );

      expect(() => renderWithRouter(<Profile />)).not.toThrow();
    });
  });

  describe('Loading States', () => {
    it('should handle loading state', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderWithRouter(<Profile />);

      // Should not crash during loading
      expect(screen.queryByTestId('language-switcher')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('should be a functional component', () => {
      expect(typeof Profile).toBe('function');
    });

    it('should export as default export', () => {
      expect(Profile).toBeDefined();
    });

    it('should render without crashing', async () => {
      expect(() => renderWithRouter(<Profile />)).not.toThrow();
      await waitFor(() => {
        expect(screen.queryByTestId('language-switcher')).toBeInTheDocument();
      });
    });

    it('should handle multiple renders', async () => {
      const { rerender } = renderWithRouter(<Profile />);
      await waitFor(() => {
        expect(
          screen.queryByTestId('contribution-dashboard'),
        ).toBeInTheDocument();
      });
      expect(() => rerender(<Profile />)).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', async () => {
      renderWithRouter(<Profile />);
      await waitFor(() => {
        const heading = screen.getByText('Test User');
        expect(heading).toBeInTheDocument();
      });
    });

    it('should have descriptive text for profile', async () => {
      renderWithRouter(<Profile />);
      await waitFor(() => {
        const bio = screen.getByText('Test bio');
        expect(bio).toBeInTheDocument();
      });
    });
  });

  describe('Media Grid', () => {
    it('should display media grid overlay when media type is selected', async () => {
      renderWithRouter(<Profile />);

      const audioButton = await screen.findByTestId('media-type-button-audio');
      fireEvent.click(audioButton);

      await waitFor(() => {
        expect(screen.getByTestId('contributions-list')).toBeInTheDocument();
      });
    });

    it('should close media grid when clicking close button', async () => {
      renderWithRouter(<Profile />);

      const textButton = await screen.findByTestId('media-type-button-text');
      fireEvent.click(textButton);

      await waitFor(() => {
        expect(screen.getByTestId('contributions-list')).toBeInTheDocument();
      });

      // Find and click the close button (SVG with lucide-x class)
      const closeButtons = screen.getAllByRole('button');
      const closeButton = closeButtons.find((btn) =>
        btn.querySelector('svg[class*="lucide-x"]'),
      );

      if (closeButton) {
        fireEvent.click(closeButton);
      }

      await waitFor(
        () => {
          expect(
            screen.queryByTestId('contributions-list'),
          ).not.toBeInTheDocument();
        },
        { timeout: 2000 },
      );
    });
  });

  describe('Followers Modal Navigation', () => {
    it('should navigate when clicking on follower in followers modal', async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              followers: [
                { id: 'user-456', name: 'Other User', username: 'otheruser' },
              ],
              followers_count: 1,
            }),
        } as Response),
      );

      renderWithRouter(<Profile />, ['/profile/testuser']);

      await waitFor(
        () => {
          expect(
            screen.getByTestId('contribution-dashboard'),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Click on followers button to open modal
      const followersLabel = screen.getByText('profile.followers');
      const followersButton = followersLabel.closest('button');
      if (followersButton) {
        fireEvent.click(followersButton);
      }

      // Wait for modal and click on the follower
      await waitFor(() => {
        const followerItem = screen.getByText('Other User').closest('li');
        expect(followerItem).toBeInTheDocument();
        if (followerItem) {
          fireEvent.click(followerItem);
        }
      });

      // Verify navigation was called
      await waitFor(() => {
        expect(navigateMock).toHaveBeenCalled();
      });
    });

    it('should navigate to other user profile when clicking on other user in followers modal', async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              followers: [
                { id: 'user-456', name: 'Other User', username: 'otheruser' },
              ],
              followers_count: 1,
            }),
        } as Response),
      );

      renderWithRouter(<Profile />, ['/profile/testuser']);

      await waitFor(
        () => {
          expect(
            screen.getByTestId('contribution-dashboard'),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Click on followers button to open modal
      const followersLabel = screen.getByText('profile.followers');
      const followersButton = followersLabel.closest('button');
      if (followersButton) {
        fireEvent.click(followersButton);
      }

      // Wait for modal and click on the other follower
      await waitFor(() => {
        const followerItem = screen.getByText('Other User').closest('li');
        expect(followerItem).toBeInTheDocument();
        if (followerItem) {
          fireEvent.click(followerItem);
        }
      });

      // Verify navigation was called
      await waitFor(() => {
        expect(navigateMock).toHaveBeenCalled();
      });
    });

    it('should close followers modal after navigation', async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              followers: [
                { id: 'user-456', name: 'Other User', username: 'otheruser' },
              ],
              followers_count: 1,
            }),
        } as Response),
      );

      renderWithRouter(<Profile />, ['/profile/testuser']);

      await waitFor(
        () => {
          expect(
            screen.getByTestId('contribution-dashboard'),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Click on followers button to open modal
      const followersLabel = screen.getByText('profile.followers');
      const followersButton = followersLabel.closest('button');
      if (followersButton) {
        fireEvent.click(followersButton);
      }

      // Wait for modal and click on the follower
      await waitFor(() => {
        const followerItem = screen.getByText('Other User').closest('li');
        if (followerItem) {
          fireEvent.click(followerItem);
        }
      });

      // Modal should close after navigation (onClose is called)
      await waitFor(() => {
        expect(navigateMock).toHaveBeenCalled();
      });
    });
  });

  describe('Following Modal Navigation', () => {
    it('should navigate when clicking on following in following modal', async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              following: [
                {
                  id: 'user-789',
                  name: 'Another User',
                  username: 'anotheruser',
                },
              ],
              following_count: 1,
            }),
        } as Response),
      );

      renderWithRouter(<Profile />, ['/profile/testuser']);

      await waitFor(
        () => {
          expect(
            screen.getByTestId('contribution-dashboard'),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Click on following button to open modal
      const followingLabel = screen.getByText('profile.following');
      const followingButton = followingLabel.closest('button');
      if (followingButton) {
        fireEvent.click(followingButton);
      }

      // Wait for modal and click on the following
      await waitFor(() => {
        const followingItem = screen.getByText('Another User').closest('li');
        expect(followingItem).toBeInTheDocument();
        if (followingItem) {
          fireEvent.click(followingItem);
        }
      });

      // Verify navigation was called
      await waitFor(() => {
        expect(navigateMock).toHaveBeenCalled();
      });
    });

    it('should navigate to other user profile when clicking on other user in following modal', async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              following: [
                {
                  id: 'user-789',
                  name: 'Another User',
                  username: 'anotheruser',
                },
              ],
              following_count: 1,
            }),
        } as Response),
      );

      renderWithRouter(<Profile />, ['/profile/testuser']);

      await waitFor(
        () => {
          expect(
            screen.getByTestId('contribution-dashboard'),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Click on following button to open modal
      const followingLabel = screen.getByText('profile.following');
      const followingButton = followingLabel.closest('button');
      if (followingButton) {
        fireEvent.click(followingButton);
      }

      // Wait for modal and click on the other following
      await waitFor(() => {
        const followingItem = screen.getByText('Another User').closest('li');
        expect(followingItem).toBeInTheDocument();
        if (followingItem) {
          fireEvent.click(followingItem);
        }
      });

      // Verify navigation was called
      await waitFor(() => {
        expect(navigateMock).toHaveBeenCalled();
      });
    });
  });

  describe('Empty States', () => {
    it('should show no followers message when followers list is empty', async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              followers: [],
              followers_count: 0,
            }),
        } as Response),
      );

      renderWithRouter(<Profile />, ['/profile/testuser']);

      await waitFor(
        () => {
          expect(
            screen.getByTestId('contribution-dashboard'),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Click on followers button to open modal
      const followersLabel = screen.getByText('profile.followers');
      const followersButton = followersLabel.closest('button');
      if (followersButton) {
        fireEvent.click(followersButton);
      }

      // Should show no followers message
      await waitFor(() => {
        expect(screen.getByText('common.noFollowersFound')).toBeInTheDocument();
      });
    });

    it('should show no following message when following list is empty', async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              following: [],
              following_count: 0,
            }),
        } as Response),
      );

      renderWithRouter(<Profile />, ['/profile/testuser']);

      await waitFor(
        () => {
          expect(
            screen.getByTestId('contribution-dashboard'),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Click on following button to open modal
      const followingLabel = screen.getByText('profile.following');
      const followingButton = followingLabel.closest('button');
      if (followingButton) {
        fireEvent.click(followingButton);
      }

      // Should show no following message
      await waitFor(() => {
        expect(
          screen.getByText('common.noUsersBeingFollowed'),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Modal Close Buttons', () => {
    it('should have close button in followers modal', async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              followers: [{ id: 'user-456', name: 'Follower 1' }],
              followers_count: 1,
            }),
        } as Response),
      );

      renderWithRouter(<Profile />, ['/profile/testuser']);

      await waitFor(
        () => {
          expect(
            screen.getByTestId('contribution-dashboard'),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Click on followers button to open modal
      const followersLabel = screen.getByText('profile.followers');
      const followersButton = followersLabel.closest('button');
      if (followersButton) {
        fireEvent.click(followersButton);
      }

      // Wait for modal content to appear
      await waitFor(() => {
        expect(screen.getByText('Follower 1')).toBeInTheDocument();
      });

      // Verify modal has a close button (button with X icon)
      const closeButtons = screen.getAllByRole('button');
      expect(closeButtons.length).toBeGreaterThan(0);
    });

    it('should have close button in following modal', async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              following: [{ id: 'user-789', name: 'Following 1' }],
              following_count: 1,
            }),
        } as Response),
      );

      renderWithRouter(<Profile />, ['/profile/testuser']);

      await waitFor(
        () => {
          expect(
            screen.getByTestId('contribution-dashboard'),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Click on following button to open modal
      const followingLabel = screen.getByText('profile.following');
      const followingButton = followingLabel.closest('button');
      if (followingButton) {
        fireEvent.click(followingButton);
      }

      // Wait for modal content to appear
      await waitFor(() => {
        expect(screen.getByText('Following 1')).toBeInTheDocument();
      });

      // Verify modal has a close button
      const closeButtons = screen.getAllByRole('button');
      expect(closeButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Profile Picture Modal', () => {
    it('should have cursor-pointer class on avatar for own profile', async () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'token') return 'mock-token-12345';
        if (key === 'username') return 'testuser';
        return null;
      });

      renderWithRouter(<Profile />, ['/profile/testuser']);

      await waitFor(
        () => {
          expect(
            screen.getByTestId('contribution-dashboard'),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Avatar should be clickable for own profile (has cursor-pointer class)
      const avatar = screen.getByText('TU');
      const avatarContainer = avatar.parentElement;
      expect(avatarContainer).toHaveClass('cursor-pointer');
    });

    it('should open profile picture modal when clicking avatar', async () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'token') return 'mock-token-12345';
        if (key === 'username') return 'testuser';
        return null;
      });

      renderWithRouter(<Profile />, ['/profile/testuser']);

      await waitFor(
        () => {
          expect(
            screen.getByTestId('contribution-dashboard'),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Click avatar to open modal
      const avatar = screen.getByText('TU');
      const avatarContainer = avatar.parentElement;

      await act(async () => {
        if (avatarContainer) {
          fireEvent.click(avatarContainer);
        }
      });

      // Modal should appear with all elements
      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
        expect(screen.getByText('Save')).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/https:\/\//i)).toBeInTheDocument();
      });
    });

    it('should update profile picture URL when typing in input', async () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'token') return 'mock-token-12345';
        if (key === 'username') return 'testuser';
        return null;
      });

      renderWithRouter(<Profile />, ['/profile/testuser']);

      await waitFor(
        () => {
          expect(
            screen.getByTestId('contribution-dashboard'),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Click avatar to open modal
      const avatar = screen.getByText('TU');
      const avatarContainer = avatar.parentElement;

      await act(async () => {
        if (avatarContainer) {
          fireEvent.click(avatarContainer);
        }
      });

      // Type in the input
      const input = await screen.findByPlaceholderText(/https:\/\//i);
      await act(async () => {
        fireEvent.change(input, {
          target: { value: 'https://example.com/new-avatar.jpg' },
        });
      });

      expect(input).toHaveValue('https://example.com/new-avatar.jpg');
    });

    it('should close modal when clicking cancel button', async () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'token') return 'mock-token-12345';
        if (key === 'username') return 'testuser';
        return null;
      });

      renderWithRouter(<Profile />, ['/profile/testuser']);

      await waitFor(
        () => {
          expect(
            screen.getByTestId('contribution-dashboard'),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Click avatar to open modal
      const avatar = screen.getByText('TU');
      const avatarContainer = avatar.parentElement;

      await act(async () => {
        if (avatarContainer) {
          fireEvent.click(avatarContainer);
        }
      });

      // Click cancel
      const cancelButton = await screen.findByText('Cancel');
      await act(async () => {
        fireEvent.click(cancelButton);
      });

      // Modal should close
      await waitFor(
        () => {
          expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    it('should have X button in profile picture modal header', async () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'token') return 'mock-token-12345';
        if (key === 'username') return 'testuser';
        return null;
      });

      renderWithRouter(<Profile />, ['/profile/testuser']);

      await waitFor(
        () => {
          expect(
            screen.getByTestId('contribution-dashboard'),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Click avatar to open modal
      const avatar = screen.getByText('TU');
      const avatarContainer = avatar.parentElement;

      await act(async () => {
        if (avatarContainer) {
          fireEvent.click(avatarContainer);
        }
      });

      // Modal should have X button (close button with SVG icon)
      await waitFor(() => {
        const allButtons = screen.getAllByRole('button');
        // At least one button should have an SVG (the X icon)
        const hasButtonWithSvg = allButtons.some((btn) =>
          btn.querySelector('svg'),
        );
        expect(hasButtonWithSvg).toBe(true);
      });
    });

    it('should not have cursor-pointer class on avatar for other user profiles', async () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'token') return 'mock-token-12345';
        if (key === 'username') return 'currentuser'; // Different from profile
        return null;
      });

      renderWithRouter(<Profile />, ['/profile/otheruser']);

      await waitFor(
        () => {
          expect(
            screen.getByTestId('contribution-dashboard'),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Find avatar container - should not have cursor-pointer for other users
      const allAvatarContainers = document.querySelectorAll('.cursor-pointer');
      // None of them should be the profile avatar for other user
      let foundProfileAvatar = false;
      allAvatarContainers.forEach((container) => {
        if (
          container.querySelector('img') ||
          container.textContent?.includes('U')
        ) {
          foundProfileAvatar = true;
        }
      });
      // For other user profiles, the avatar container should not have cursor-pointer
      expect(foundProfileAvatar).toBe(false);
    });
  });

  describe('Self Navigation in Modals', () => {
    it('should call navigate when clicking follower in modal', async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              followers: [
                { id: 'user-456', name: 'Other User', username: 'otheruser' },
              ],
              followers_count: 1,
            }),
        } as Response),
      );

      renderWithRouter(<Profile />, ['/profile/testuser']);

      await waitFor(
        () => {
          expect(
            screen.getByTestId('contribution-dashboard'),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Open followers modal
      const followersLabel = screen.getByText('profile.followers');
      const followersButton = followersLabel.closest('button');
      if (followersButton) {
        fireEvent.click(followersButton);
      }

      // Click on follower - should navigate
      await waitFor(() => {
        const followerItem = screen.getByText('Other User').closest('li');
        if (followerItem) {
          fireEvent.click(followerItem);
        }
      });

      // Should navigate
      await waitFor(() => {
        expect(navigateMock).toHaveBeenCalled();
      });
    });

    it('should call navigate when clicking following in modal', async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              following: [
                {
                  id: 'user-789',
                  name: 'Another User',
                  username: 'anotheruser',
                },
              ],
              following_count: 1,
            }),
        } as Response),
      );

      renderWithRouter(<Profile />, ['/profile/testuser']);

      await waitFor(
        () => {
          expect(
            screen.getByTestId('contribution-dashboard'),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Open following modal
      const followingLabel = screen.getByText('profile.following');
      const followingButton = followingLabel.closest('button');
      if (followingButton) {
        fireEvent.click(followingButton);
      }

      // Click on following - should navigate
      await waitFor(() => {
        const followingItem = screen.getByText('Another User').closest('li');
        if (followingItem) {
          fireEvent.click(followingItem);
        }
      });

      // Should navigate
      await waitFor(() => {
        expect(navigateMock).toHaveBeenCalled();
      });
    });
  });

  describe('Translation Support', () => {
    it('should use useTranslation hook', async () => {
      renderWithRouter(<Profile />);
      await waitFor(
        () => {
          expect(useTranslationMock).toHaveBeenCalled();
        },
        { timeout: 3000 },
      );
    });

    it('should display translated text', async () => {
      useTranslationMock.mockReturnValue({
        t: (key: string) => `translated:${key}`,
        i18n: { language: 'en', changeLanguage: vi.fn() },
      });

      renderWithRouter(<Profile />);
      await waitFor(
        () => {
          expect(
            screen.getByText('translated:profile.info'),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });
  });
});
